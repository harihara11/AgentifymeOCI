# AgentifyME OCI AI Factory Experience

Static Oracle Redwood-style app for the workbook-driven OCI AI Factory journey.

## Open the App

Open `AgentifyME_OCI_AI_Prototype_v3.html` in a browser.

The page loads:

- `data/oci_ai_factory_workbook_data.js`
- `data/content_manifest.js`
- `src/index.css`
- `src/app.js`

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
