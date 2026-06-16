#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def column_index(cell_ref: str) -> int:
    letters = re.match(r"[A-Z]+", cell_ref).group(0)
    total = 0
    for char in letters:
        total = total * 26 + ord(char) - 64
    return total - 1


def relationship_target(target: str) -> str:
    if target.startswith("/"):
        return target.lstrip("/")
    return posixpath.normpath(f"xl/{target}")


def shared_strings(archive: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    values = []
    for item in root.findall("a:si", NS):
        values.append("".join(node.text or "" for node in item.findall(".//a:t", NS)))
    return values


def cell_value(cell: ET.Element, strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")
    if cell_type == "inlineStr":
        return "".join(node.text or "" for node in cell.findall(".//a:t", NS)).strip()
    value = cell.find("a:v", NS)
    if value is None:
        return ""
    raw = value.text or ""
    if cell_type == "s" and raw.isdigit():
        return strings[int(raw)].strip()
    return raw.strip()


def worksheet_rows(archive: zipfile.ZipFile, sheet_path: str, strings: list[str]) -> list[list[str]]:
    root = ET.fromstring(archive.read(sheet_path))
    rows: list[list[str]] = []
    for row in root.findall(".//a:sheetData/a:row", NS):
        cells: dict[int, str] = {}
        for cell in row.findall("a:c", NS):
            cells[column_index(cell.attrib["r"])] = cell_value(cell, strings)
        if cells:
            max_col = max(cells)
            rows.append([cells.get(index, "") for index in range(max_col + 1)])
    return rows


def rows_to_objects(rows: list[list[str]]) -> list[dict[str, str]]:
    if not rows:
        return []
    headers = [header.strip() for header in rows[0]]
    objects = []
    for row in rows[1:]:
        record = {}
        for index, header in enumerate(headers):
            if not header:
                continue
            record[header] = row[index].strip() if index < len(row) else ""
        if any(value for value in record.values()):
            objects.append(record)
    return objects


def parse_workbook(path: Path) -> dict[str, list[dict[str, str]]]:
    with zipfile.ZipFile(path) as archive:
        strings = shared_strings(archive)
        workbook = ET.fromstring(archive.read("xl/workbook.xml"))
        rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rel_map = {
            rel.attrib["Id"]: relationship_target(rel.attrib["Target"])
            for rel in rels.findall("rel:Relationship", NS)
        }
        sheets = {}
        for sheet in workbook.find("a:sheets", NS):
            name = sheet.attrib["name"]
            rel_id = sheet.attrib["{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"]
            rows = worksheet_rows(archive, rel_map[rel_id], strings)
            sheets[name] = rows_to_objects(rows)
        return sheets


def slug(value: str) -> str:
    text = re.sub(r"[^A-Za-z0-9]+", "", value or "")
    return text or "Default"


def blueprint_templates() -> dict[str, list[dict[str, str]]]:
    return {
        "RAG": [
            {"id": "user", "label": "User", "detail": "Persona question and task intent"},
            {"id": "source", "label": "Knowledge Source", "detail": "Selected workbook mapped content"},
            {"id": "retriever", "label": "Retriever", "detail": "Semantic search and source ranking"},
            {"id": "vector", "label": "Knowledge Processing", "detail": "Chunking, embeddings, and vector retrieval"},
            {"id": "genai", "label": "Oracle GenAI", "detail": "Grounded generation and policy controls"},
            {"id": "response", "label": "Response", "detail": "Answer with trace and source evidence"},
        ],
        "NL2SQL": [
            {"id": "user", "label": "User", "detail": "Natural language business question"},
            {"id": "intent", "label": "Intent", "detail": "Intent, metrics and dimensions"},
            {"id": "metadata", "label": "Metadata", "detail": "Vectorized schema and business context retrieval"},
            {"id": "sql", "label": "SQL", "detail": "Validated SQL generation"},
            {"id": "results", "label": "Results", "detail": "Checked and formatted results"},
            {"id": "response", "label": "Response", "detail": "Business answer and supporting metrics"},
        ],
        "Document AI": [
            {"id": "user", "label": "User", "detail": "Document request or uploaded file"},
            {"id": "classification", "label": "Classification", "detail": "Document type identification"},
            {"id": "extraction", "label": "Extraction", "detail": "Schema, fields and clauses"},
            {"id": "validation", "label": "Validation", "detail": "Business rules and compliance checks"},
            {"id": "inference", "label": "Inference", "detail": "Insights, reasoning and recommendations"},
            {"id": "response", "label": "Response", "detail": "Summary, fields and next action"},
        ],
        "Cognitive": [
            {"id": "user", "label": "User", "detail": "Audio, video or case question"},
            {"id": "media", "label": "Audio / Video", "detail": "Workbook mapped media metadata"},
            {"id": "analysis", "label": "AI Analysis", "detail": "Speech, vision and sentiment features"},
            {"id": "classification", "label": "Classification", "detail": "Risk, intent and priority labels"},
            {"id": "insights", "label": "Insights", "detail": "Operational findings and recommended action"},
            {"id": "response", "label": "Response", "detail": "Explainable answer and trace"},
        ],
    }


def runtime_templates() -> dict[str, list[str]]:
    return {
        "RAG": [
            "Resolve persona and mapped workbook knowledge sources.",
            "Retrieve the highest scoring policy, email, Slack, and document evidence.",
            "Ground the answer with Oracle GenAI and source constraints.",
            "Return a response with cited source categories and execution trace.",
        ],
        "NL2SQL": [
            "Resolve requested metrics, filters, and time window.",
            "Generate validated SQL against the workbook mapped dataset.",
            "Execute the query and inspect result shape.",
            "Return the answer with metric details and query rationale.",
        ],
        "Document AI": [
            "Locate the workbook mapped document collection.",
            "Extract text, layout, entities, tables, and document clauses.",
            "Reason over extracted evidence with Oracle GenAI.",
            "Return structured findings and confidence notes.",
        ],
        "Cognitive": [
            "Locate media metadata and transcript sources.",
            "Analyze audio, video, sentiment, category, and event signals.",
            "Classify priority, risk, and next-best action.",
            "Return operational insights with runtime trace.",
        ],
    }


def make_pdf(path: Path, title: str, lines: list[str]) -> None:
    escaped = [line.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)") for line in [title, *lines]]
    text_ops = ["BT", "/F1 14 Tf", "72 760 Td", f"({escaped[0]}) Tj", "/F1 10 Tf"]
    for line in escaped[1:]:
        text_ops.append("0 -18 Td")
        text_ops.append(f"({line[:100]}) Tj")
    text_ops.append("ET")
    stream = "\n".join(text_ops).encode("latin-1", errors="replace")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    output = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for index, obj in enumerate(objects, start=1):
        offsets.append(len(output))
        output.extend(f"{index} 0 obj\n".encode())
        output.extend(obj)
        output.extend(b"\nendobj\n")
    xref = len(output)
    output.extend(f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]:
        output.extend(f"{offset:010d} 00000 n \n".encode())
    output.extend(f"trailer << /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode())
    path.write_bytes(output)


def make_docx(path: Path, title: str, lines: list[str]) -> None:
    body = "".join(
        f"<w:p><w:r><w:t>{escape_xml(line)}</w:t></w:r></w:p>"
        for line in [title, *lines]
    )
    with zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as docx:
        docx.writestr(
            "[Content_Types].xml",
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>'
            "</Types>",
        )
        docx.writestr(
            "_rels/.rels",
            '<?xml version="1.0" encoding="UTF-8"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>'
            "</Relationships>",
        )
        docx.writestr(
            "word/document.xml",
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">'
            f"<w:body>{body}<w:sectPr/></w:body></w:document>",
        )


def escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_repository_samples(root: Path, sheets: dict[str, list[dict[str, str]]]) -> None:
    patterns = {row["PatternName"]: slug(row["PatternName"]) for row in sheets.get("03_Agent_Patterns", [])}
    groups = sorted({slug(row.get("PersonaGroup", "")) for row in sheets.get("11_Content_Repository_Map", []) if row.get("PersonaGroup")})
    for pattern_name, pattern_folder in patterns.items():
        for group in groups:
            base = root / pattern_folder / group
            base.mkdir(parents=True, exist_ok=True)
            lines = [
                f"Pattern: {pattern_name}",
                f"Persona group: {group}",
                "Generated from OCI AI Factory workbook content repository map.",
            ]
            write_text(base / "README.md", "\n".join(["# Knowledge Source Folder", "", *lines, ""]))
            make_pdf(base / "sample_policy.pdf", f"{group} {pattern_name} policy sample", lines)
            make_docx(base / "sample_handbook.docx", f"{group} {pattern_name} handbook sample", lines)
            write_text(
                base / "sample_email_thread.eml",
                "From: operations@example.com\n"
                f"To: {group.lower()}-team@example.com\n"
                f"Subject: {pattern_name} workbook sample\n\n"
                + "\n".join(lines)
                + "\n",
            )
            write_text(
                base / "sample_slack_conversation.json",
                json.dumps(
                    {
                        "channel": f"{group.lower()}-{pattern_folder.lower()}",
                        "messages": [
                            {"user": "analyst", "text": f"Need guidance for {pattern_name} scenario."},
                            {"user": "specialist", "text": f"Use the mapped {group} source package."},
                        ],
                    },
                    indent=2,
                ),
            )
            write_text(
                base / "sample_dataset.csv",
                "record_id,persona_group,pattern,status,priority\n"
                f"1,{group},{pattern_name},Open,High\n"
                f"2,{group},{pattern_name},In Review,Medium\n",
            )
            write_text(
                base / "sample_records.json",
                json.dumps(
                    [
                        {"recordId": "REC-001", "personaGroup": group, "pattern": pattern_name, "status": "Open"},
                        {"recordId": "REC-002", "personaGroup": group, "pattern": pattern_name, "status": "Closed"},
                    ],
                    indent=2,
                ),
            )
            make_pdf(base / "sample_invoice.pdf", f"{group} invoice sample", [*lines, "Invoice total: 1250.00"])
            make_docx(base / "sample_contract.docx", f"{group} contract sample", [*lines, "Contract clause sample for review."])

    for row in sheets.get("11_Content_Repository_Map", []):
        pattern = slug(row.get("Pattern", ""))
        group = slug(row.get("PersonaGroup", ""))
        folder = row.get("Folder", "")
        if not pattern or not group or not folder:
            continue
        folder_path = root / pattern / group / slug(folder)
        instruction = row.get("SampleInstruction", "")
        content_type = row.get("ContentType", "")
        write_text(
            folder_path / "README.md",
            f"# {folder}\n\nContent type: {content_type}\n\nWorkbook instruction: {instruction}\n",
        )

    write_text(
        root / "Cognitive" / "CallCenter" / "CallCenterAudio" / "README.md",
        "# Call Center Audio\n\nUpload call center recordings here. The app can ingest selected local files through the content upload control.\n",
    )
    write_text(
        root / "Cognitive" / "CallCenter" / "DroneVideos" / "README.md",
        "# Drone Videos\n\nUpload drone inspection videos here. The app can ingest selected local files through the content upload control.\n",
    )


def manifest_for(root: Path) -> list[dict[str, str | int]]:
    entries = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.name == "manifest.json":
            continue
        rel = path.relative_to(root.parent).as_posix()
        if "/Call Center/" in rel:
            continue
        entries.append(
            {
                "path": rel,
                "name": path.name,
                "extension": path.suffix.lower().lstrip(".") or "folder",
                "size": path.stat().st_size,
                "modified": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
            }
        )
    return entries


def write_js(path: Path, global_name: str, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        f"window.{global_name} = {json.dumps(data, indent=2, ensure_ascii=False)};\n",
        encoding="utf-8",
    )


def main() -> None:
    parser = argparse.ArgumentParser(description="Export OCI AI Factory workbook data for the static app.")
    parser.add_argument("--workbook", default="/Users/havijaya/Downloads/oci_ai_factory_final_workbook.xlsx")
    parser.add_argument("--out", default="data/oci_ai_factory_workbook_data.js")
    parser.add_argument("--content-out", default="data/content_manifest.js")
    parser.add_argument("--knowledge-root", default="KnowledgeSources")
    args = parser.parse_args()

    workbook_path = Path(args.workbook).expanduser().resolve()
    sheets = parse_workbook(workbook_path)
    data = {
        "generatedFrom": workbook_path.name,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "requiredTabs": list(sheets.keys()),
        "sheets": sheets,
        "blueprintNodeTemplates": blueprint_templates(),
        "runtimeTemplates": runtime_templates(),
    }

    write_js(Path(args.out), "OCI_AI_FACTORY_WORKBOOK", data)
    knowledge_root = Path(args.knowledge_root)
    write_repository_samples(knowledge_root, sheets)
    manifest = manifest_for(knowledge_root)
    write_text(knowledge_root / "manifest.json", json.dumps(manifest, indent=2))
    write_js(Path(args.content_out), "OCI_AI_FACTORY_CONTENT_MANIFEST", manifest)

    print(f"Exported {len(sheets)} workbook sheets to {args.out}")
    print(f"Generated {len(manifest)} knowledge source files under {args.knowledge_root}")


if __name__ == "__main__":
    main()
