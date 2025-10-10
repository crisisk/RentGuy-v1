# Inventory Import Wizard Plan

## Goals
- Provide guided CSV import for planners and warehouse personas during onboarding.
- Validate schema before upload to avoid silent failures and double-booking later in the flow.
- Surface inline guidance, retry actions, and telemetry hooks for continuous improvement.

## Target Personas & Outcomes
| Persona | Outcome | KPI Alignment |
| --- | --- | --- |
| Planner / Operations | Upload base inventory and verify availability windows during first job setup. | ↓ Scheduling conflicts 20% |
| Warehouse Tech | Confirm kit completeness and barcode coverage before first picklist. | ↑ Pick accuracy 12% |
| Sales / BD | Ensure pricing columns and upsell bundles are present for quote builder. | ↑ Upsell attach rate 8% |

## CSV Schema (Minimum Required Columns)
| Column | Type | Required | Validation | Notes |
| --- | --- | --- | --- | --- |
| `item_name` | string | ✅ | 2-120 chars, printable, trimmed | Display label in kit picker |
| `sku` | string | ✅ | Unique per row, alphanumeric + `-_/` | Used for conflicts & barcode mapping |
| `category` | string | ✅ | Matches predefined taxonomy (lighting, audio, staging, misc) | Drives persona filters |
| `quantity_total` | integer | ✅ | >= 0, max 5000 | Base stock count |
| `quantity_available` | integer | ✅ | 0 ≤ value ≤ `quantity_total` | Live availability toggle |
| `rental_rate_daily` | decimal(10,2) | ✅ | Currency = `EUR`, >= 0 | Pricing guardrail |
| `replacement_cost` | decimal(10,2) | ➖ | >= rental rate, optional but recommended | Finance persona alerts |
| `barcode` | string | ➖ | If provided: max 32 chars, uppercase | Enables scanner hand-off |
| `availability_start` | ISO date | ➖ | Valid date, optional | For seasonal stock |
| `availability_end` | ISO date | ➖ | Valid date ≥ start | Deactivates expired items |
| `tags` | CSV string | ➖ | Max 5 tags, each ≤ 24 chars | Quick filters |

## Client-Side Validation Flow
1. Parse CSV using streaming parser (Papa Parse) with header normalization.
2. Validate headers present; show blocking error if required columns missing.
3. Run per-row validation; stop after 20 critical errors, summarise counts.
4. Display inline error table with `row`, `field`, `issue`, and suggested fix.
5. Prevent upload until errors resolved; allow download of rejected rows.

## UX States
- **Empty state:** illustration + copy referencing sample CSV, button to download template (`tests/fixtures/inventory_minimal.csv`).
- **Drag & drop zone:** keyboard accessible, `aria-describedby` with schema hint link.
- **Validation progress:** determinate bar (rows processed / total), `aria-live="polite"` updates.
- **Success state:** summary chips (# items created, items skipped, kits impacted) + CTA to open job wizard.
- **Error state:** sticky banner with retry button, support link, telemetry ID.

## Telemetry & Logging
- Emit `rentguy:onboarding` events: `inventory_upload_started`, `inventory_row_error`, `inventory_upload_success` with counts.
- Capture API trace ID from backend response for audit logging.
- Store last successful import timestamp in local storage to suggest refresh cadence.

## Rate Limiting & Guardrails
- Limit uploads to 5 per hour per tenant; show cooldown timer when exceeded.
- Reject files > 10 MB client-side to reduce backend load.
- Require explicit confirmation before overwriting existing inventory when duplicates detected.

## Acceptance Criteria
- Sample CSV passes end-to-end and triggers success summary.
- Missing required column displays blocking error with remediation link.
- User can tab through dropzone, progress, and error table without trap.
- Telemetry events visible in browser devtools `rentguy:onboarding` listener.
- Backend receives validated payload with schema-consistent fields.
