# AgentifyME OCI AI Factory Experience

Static Oracle Redwood-style app for the workbook-driven OCI AI Factory journey.

## Open the App

Open `AgentifyME_OCI_AI_Prototype_v3.html` in a browser.

The page loads:

- `data/oci_ai_factory_workbook_data.js`
- `data/content_manifest.js`
- `src/index.css`
- `src/app.js`

## OCI Blueprint QR Downloads

The blueprint QR modal can upload the generated PNG to OCI Object Storage through a local API, then use the returned pre-authenticated request link in the QR code.

Start the local API before using **Download Blueprint**:

```bash
npm run oci-upload-api
```

The API listens on `http://127.0.0.1:3001` and uses your local OCI SDK config, normally `~/.oci/config` with the `DEFAULT` profile. You can override the profile or config file:

```bash
OCI_CONFIG_PROFILE=YOUR_PROFILE npm run oci-upload-api
OCI_CONFIG_FILE=/path/to/config OCI_CONFIG_PROFILE=YOUR_PROFILE npm run oci-upload-api
```

Default Object Storage target:

- Region: `ap-hyderabad-1`
- Namespace: `ax4qsxvnsmtm`
- Bucket: `Arjeet`
- Prefix: `agentifyme/`
- PAR expiry: `7` days

The API uploads:

- `agentifyme/blueprints/<run-id>.png`
- `agentifyme/metadata/<run-id>.json`

The OCI identity in the selected config profile must be allowed to create/overwrite/read objects and manage pre-authenticated requests in the bucket compartment.

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
