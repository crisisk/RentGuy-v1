# Backend Dependency Vulnerability Remediation — 18 Mar 2025

## Scan Details

- **Tool**: `pip-audit`
- **Command**: `python -m pip_audit -r backend/requirements.txt --format json --output security/pip-audit-baseline-2025-03-18.json`
- **Scope**: Python packages defined in `backend/requirements.txt`
- **Baseline**: [`security/pip-audit-baseline-2025-03-18.json`](pip-audit-baseline-2025-03-18.json)

## Findings and Recommended Actions

| Package                  | Installed Version | Advisory                             | Risk Summary                                                                                                 | Fixed In | Remediation Plan                                                                                                                            |
| ------------------------ | ----------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `python-multipart`       | 0.0.9             | GHSA-59g5-xgcq-4qw3 / CVE-2024-53981 | Malicious multi-part payloads can trigger excessive logging and CPU usage, leading to denial of service.     | 0.0.18   | Upgrade to `python-multipart>=0.0.18` and regression-test all FastAPI form uploads, especially authentication and file ingestion endpoints. |
| `aiohttp`                | 3.10.11           | GHSA-9548-qrrj-x5pj / CVE-2025-53643 | Pure-Python parser permits crafted trailers that bypass HTTP request validation, enabling request smuggling. | 3.12.14  | Bump to `aiohttp>=3.12.14`, ensure C extensions stay enabled in production builds, and rerun WebSocket/polling integration checks.          |
| `python-socketio`        | 5.11.4            | GHSA-g8c6-8fjj-2r4m / CVE-2025-61765 | Pickle-based queue messages allow remote code execution if the message broker is compromised.                | 5.14.0   | Upgrade to `python-socketio>=5.14.0`; confirm Redis queue compatibility and monitor inter-service messaging logs.                           |
| `starlette` (transitive) | 0.40.0            | GHSA-2c2j-9gv5-cj73 / CVE-2025-54121 | Large multipart form uploads can block the main thread while spooling to disk.                               | 0.47.2   | Adopt `starlette>=0.47.2` via FastAPI upgrade, validate upload throughput, and adjust worker timeouts if necessary.                         |

## Next Steps

1. Prioritise upgrades in a dedicated branch, running the backend unit test suite (`pytest`) and smoke checks after dependency bumps.
2. Coordinate with the Platform Engineering runbook owners to schedule deployment of patched dependencies once validation succeeds.
3. Retain the baseline JSON in `security/` for auditing and to filter out acknowledged advisories until fixes ship.
