# AgentifyME OCI AI Factory Experience

Static Oracle Redwood-style app for the workbook-driven OCI AI Factory journey.

## Open the App

Open `AgentifyME_OCI_AI_Prototype_v3.html` in a browser.

The page loads:

- `data/oci_ai_factory_workbook_data.js`
- `data/content_manifest.js`
- `src/index.css`
- `src/app.js`

For dynamic blueprint QR codes that open the exact generated PNG, serve the app with the local snapshot server:

```bash
python3 blueprint_server.py --port 5500
```

Then open `http://127.0.0.1:5500/AgentifyME_OCI_AI_Prototype_v3.html`.

When Step 3 generates a blueprint, Download Blueprint saves the current preview as a PNG snapshot and the QR code points to `/blueprints/<snapshot-id>.png`. If the app is opened directly as a file, downloads still work from the browser-local snapshot fallback, but the QR link is only reliable in that same browser session.

## Public Deployment

This branch includes `render.yaml` for a Python web service deployment. Deploy the branch as a Render Blueprint or connect the GitHub repo and use:

```bash
python3 blueprint_server.py --host 0.0.0.0 --port $PORT
```

After deployment, open:

```text
https://<your-service-domain>/AgentifyME_OCI_AI_Prototype_v3.html
```

QR codes generated from that public URL will point to the same public service, so they can be opened from a phone. Snapshot storage is runtime-local by default; for long-lived production links, set `BLUEPRINT_STORE_DIR` to a persistent disk path or replace the server write with object storage.

## Regenerate Workbook Data

Run this after updating the workbook:

```bash
python3 scripts/export_workbook.py --workbook /path/to/oci_ai_factory_final_workbook.xlsx
```

The exporter reads the workbook tabs, writes the browser data bundle, creates sample files under `KnowledgeSources/`, and refreshes the content manifest.

## Runtime Flow

1. Registration
2. Persona Selection
3. Experience Selection and Digital Worker Name
4. Agent Pattern Selection for Engineer mode
5. Blueprint plus Test Blueprint
6. Leaderboard plus PNG, PDF, and JSON downloads

Explore mode auto-selects the persona recommended pattern and locks knowledge sources. Engineer mode allows any pattern and source add/remove behavior.
