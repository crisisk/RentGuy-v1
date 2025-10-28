# Environment Variable Inventory

This directory hosts artefacts that help DevOps teams synchronise the backend configuration with OpenBao/Vault.

- `settings.schema.json` – machine-readable export generated from `backend/app/core/config.py`.
- `settings.schema.md` – Markdown table for quick reviews and runbooks.

Regenerate the files after making changes to `Settings` fields:

```bash
python ops/scripts/export_env_schema.py --output ops/env/settings.schema.json
python ops/scripts/export_env_schema.py --format markdown --output ops/env/settings.schema.md
```

The export relies on the `json_schema_extra["secret"]` flag and `SecretStr` annotations to mark sensitive values. When adding new credentials ensure you set one of these so the vault integration stays accurate.
