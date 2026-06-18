const http = require("http");
const { spawn } = require("child_process");
const crypto = require("crypto");
const path = require("path");

const PORT = Number(process.env.PORT || 3001);
const CONFIG = {
  region: process.env.OCI_REGION || "ap-hyderabad-1",
  namespace: process.env.OCI_NAMESPACE || "ax4qsxvnsmtm",
  bucket: process.env.OCI_BUCKET || "Arjeet",
  compartmentId:
    process.env.OCI_COMPARTMENT_ID ||
    "ocid1.compartment.oc1..aaaaaaaadg4huvdmy2wyjt2lkg5pl4wmi2gxabxwtckbzyoz7pjggidoau2a",
  prefix: process.env.OCI_OBJECT_PREFIX || "agentifyme",
  parDays: Number(process.env.OCI_PAR_DAYS || 7),
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(payload));
}

function readBody(req, maxBytes = 20 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on("data", (chunk) => {
      total += chunk.length;
      if (total > maxBytes) {
        req.destroy();
        reject(new Error("Upload is too large. Maximum blueprint image size is 20 MB."));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

function splitBuffer(buffer, separator) {
  const parts = [];
  let start = 0;
  let index = buffer.indexOf(separator, start);
  while (index !== -1) {
    parts.push(buffer.subarray(start, index));
    start = index + separator.length;
    index = buffer.indexOf(separator, start);
  }
  parts.push(buffer.subarray(start));
  return parts;
}

function parseMultipart(buffer, contentType) {
  const boundaryMatch = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(contentType || "");
  if (!boundaryMatch) throw new Error("Missing multipart boundary.");

  const boundary = Buffer.from(`--${boundaryMatch[1] || boundaryMatch[2]}`);
  const headerSeparator = Buffer.from("\r\n\r\n");
  const fields = {};
  const files = {};

  splitBuffer(buffer, boundary).forEach((rawPart) => {
    let part = rawPart;
    if (part.length < 8) return;
    if (part.subarray(0, 2).toString() === "\r\n") part = part.subarray(2);
    if (part.subarray(0, 2).toString() === "--") return;
    if (part.subarray(part.length - 2).toString() === "\r\n") part = part.subarray(0, part.length - 2);

    const headerEnd = part.indexOf(headerSeparator);
    if (headerEnd === -1) return;

    const headersText = part.subarray(0, headerEnd).toString("utf8");
    const body = part.subarray(headerEnd + headerSeparator.length);
    const disposition = /content-disposition:\s*form-data;([^\r\n]+)/i.exec(headersText)?.[1] || "";
    const name = /name="([^"]+)"/i.exec(disposition)?.[1];
    const filename = /filename="([^"]*)"/i.exec(disposition)?.[1];
    const contentTypeValue = /content-type:\s*([^\r\n]+)/i.exec(headersText)?.[1]?.trim();

    if (!name) return;
    if (filename !== undefined) {
      files[name] = { filename, contentType: contentTypeValue || "application/octet-stream", data: body };
      return;
    }
    fields[name] = body.toString("utf8");
  });

  return { fields, files };
}

function safeSlug(value) {
  return String(value || "blueprint")
    .replace(/[^A-Za-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90) || "blueprint";
}

function uploadWithOci(payload) {
  return new Promise((resolve, reject) => {
    const helperPath = path.join(__dirname, "oci_upload.py");
    const child = spawn("python3", [helperPath], {
      stdio: ["pipe", "pipe", "pipe"],
      env: process.env,
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(stderr.trim() || stdout.trim() || `OCI upload helper exited with code ${code}.`));
        return;
      }
      try {
        resolve(JSON.parse(stdout));
      } catch (error) {
        reject(new Error(`OCI upload helper returned invalid JSON: ${error.message}`));
      }
    });

    child.stdin.end(JSON.stringify(payload));
  });
}

async function handleUpload(req, res) {
  try {
    const body = await readBody(req);
    const contentType = req.headers["content-type"] || "";
    const bodyText = body.toString("utf8");
    let fileName = "";
    let imageData = null;
    let metadata = {};
    let fileContentType = "image/png";

    if (/application\/json|text\/plain/i.test(contentType) && bodyText.trim().startsWith("{")) {
      const payload = JSON.parse(bodyText || "{}");
      const imageBase64 = String(payload.pngBase64 || payload.imageBase64 || "").replace(/^data:image\/png;base64,/, "");
      fileName = payload.fileName || payload.filename || payload.metadata?.digitalWorkerName || "blueprint.png";
      imageData = imageBase64 ? Buffer.from(imageBase64, "base64") : null;
      metadata = payload.metadata || {};
    } else {
      const { fields, files } = parseMultipart(body, contentType);
      const file = files.file;
      fileName = fields.fileName || file?.filename || "blueprint.png";
      imageData = file?.data || null;
      fileContentType = file?.contentType || "application/octet-stream";
      metadata = fields.metadata ? JSON.parse(fields.metadata) : {};
    }

    if (!imageData?.length) {
      sendJson(res, 400, { error: "Missing blueprint PNG file." });
      return;
    }
    if (fileContentType && fileContentType !== "image/png") {
      sendJson(res, 400, { error: "Blueprint file must be a PNG image." });
      return;
    }

    const baseName = safeSlug(fileName || metadata.digitalWorkerName || "blueprint");
    const runId = `${new Date().toISOString().replace(/[:.]/g, "-")}-${crypto.randomBytes(4).toString("hex")}-${baseName}`;
    const prefix = CONFIG.prefix.replace(/^\/+|\/+$/g, "");
    const imageObjectName = `${prefix}/blueprints/${runId}.png`;
    const metadataObjectName = `${prefix}/metadata/${runId}.json`;

    const result = await uploadWithOci({
      ...CONFIG,
      imageObjectName,
      metadataObjectName,
      parName: `agentifyme-blueprint-${runId}`,
      imageBase64: imageData.toString("base64"),
      metadata,
    });

    sendJson(res, 200, result);
  } catch (error) {
    sendJson(res, 500, { error: error.message || "Could not upload blueprint to OCI." });
  }
}

const server = http.createServer((req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      ok: true,
      region: CONFIG.region,
      namespace: CONFIG.namespace,
      bucket: CONFIG.bucket,
      prefix: CONFIG.prefix,
    });
    return;
  }
  if (req.method === "POST" && req.url === "/api/blueprints/upload") {
    handleUpload(req, res);
    return;
  }
  sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`AgentifyME OCI upload API running at http://127.0.0.1:${PORT}`);
  console.log(`Uploading to ${CONFIG.namespace}/${CONFIG.bucket}/${CONFIG.prefix}/ in ${CONFIG.region}`);
});
