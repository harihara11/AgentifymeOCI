#!/usr/bin/env python3
"""Serve the AgentifyME prototype and persist generated blueprint snapshots."""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import re
import tempfile
from http import HTTPStatus
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse


ROOT = Path(__file__).resolve().parent
STORE_DIR = Path(os.environ.get("BLUEPRINT_STORE_DIR", Path(tempfile.gettempdir()) / "agentifyme_blueprints"))
REF_RE = re.compile(r"[^a-zA-Z0-9_.-]+")


def safe_name(value: str, fallback: str = "blueprint") -> str:
    cleaned = REF_RE.sub("-", value or "").strip(".-")
    return cleaned[:120] or fallback


class BlueprintHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self) -> None:
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self) -> None:
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/blueprints":
            self.send_error(HTTPStatus.NOT_FOUND, "Unknown endpoint")
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)
            payload = json.loads(body.decode("utf-8"))
            response = self.save_blueprint(payload)
        except Exception as exc:  # noqa: BLE001 - return useful error to the prototype.
            self.send_json({"error": str(exc)}, HTTPStatus.BAD_REQUEST)
            return
        self.send_json(response, HTTPStatus.CREATED)

    def do_GET(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/blueprints/"):
            self.serve_blueprint(parsed.path.removeprefix("/blueprints/"))
            return
        super().do_GET()

    def do_HEAD(self) -> None:
        parsed = urlparse(self.path)
        if parsed.path.startswith("/blueprints/"):
            self.serve_blueprint(parsed.path.removeprefix("/blueprints/"), head_only=True)
            return
        super().do_HEAD()

    def save_blueprint(self, payload: dict) -> dict:
        blueprint_ref = safe_name(str(payload.get("blueprintRefId") or ""))
        file_name = safe_name(str(payload.get("fileName") or f"{blueprint_ref}.png"))
        if not file_name.lower().endswith(".png"):
            file_name = f"{Path(file_name).stem}.png"
        file_name = f"{blueprint_ref}.png"

        image_data_url = str(payload.get("imageDataUrl") or "")
        prefix = "data:image/png;base64,"
        if not image_data_url.startswith(prefix):
            raise ValueError("imageDataUrl must be a PNG data URL")

        STORE_DIR.mkdir(parents=True, exist_ok=True)
        image_bytes = base64.b64decode(image_data_url[len(prefix) :], validate=True)
        image_path = STORE_DIR / file_name
        json_path = STORE_DIR / f"{blueprint_ref}.json"
        image_path.write_bytes(image_bytes)
        json_path.write_text(json.dumps(payload.get("payload") or {}, indent=2), encoding="utf-8")

        public_path = f"/blueprints/{file_name}"
        host = self.headers.get("Host", f"127.0.0.1:{self.server.server_port}")
        scheme = "https" if self.headers.get("X-Forwarded-Proto") == "https" else "http"
        return {
            "blueprintRefId": blueprint_ref,
            "url": public_path,
            "absoluteUrl": f"{scheme}://{host}{public_path}",
        }

    def serve_blueprint(self, raw_name: str, head_only: bool = False) -> None:
        file_name = safe_name(unquote(raw_name))
        path = STORE_DIR / file_name
        if not path.is_file():
            self.send_error(HTTPStatus.NOT_FOUND, "Blueprint snapshot not found")
            return
        content_type = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(path.stat().st_size))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        if head_only:
            return
        with path.open("rb") as handle:
            self.copyfile(handle, self.wfile)

    def send_json(self, payload: dict, status: HTTPStatus) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the AgentifyME OCI prototype with blueprint snapshot storage.")
    parser.add_argument("--host", default="127.0.0.1", help="Bind host")
    parser.add_argument("--port", type=int, default=5500, help="Bind port")
    args = parser.parse_args()

    server = ThreadingHTTPServer((args.host, args.port), BlueprintHandler)
    print(f"Serving {ROOT} at http://{args.host}:{args.port}/")
    print(f"Blueprint snapshots are stored in {STORE_DIR}")
    server.serve_forever()


if __name__ == "__main__":
    main()
