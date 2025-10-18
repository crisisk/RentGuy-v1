# Third-Party Accounting and CRM Integration Strategy

## Objectives
- Prioritise high-impact integrations for finance reconciliation and sales automation.
- Define API contract requirements and security considerations.
- Stage implementation in phases to minimise operational risk.

## Priority Systems
| Tier | Vendor | Use Case | Notes |
| --- | --- | --- | --- |
| 1 | Exact Online | Synchronise invoices, payments, and ledger entries | Dutch market adoption, REST API with OAuth2 |
| 1 | HubSpot CRM | Sync leads, deals, and email engagements | Existing marketing stack alignment |
| 2 | Twinfield | Enterprise accounting for multi-entity tenants | SOAP/REST hybrid API, requires middleware |
| 2 | Salesforce | Large enterprise CRM | Bulk API for nightly sync, high configuration cost |
| 3 | Microsoft Business Central | ERP integration for advanced inventory flows | Consider after Exact Online rollout |

## Integration Approach
1. **Canonical Data Models:** Map RentGuy entities (projects, invoices, customers) to integration-specific schemas using Pydantic mappers.
2. **Event-Driven Sync:** Publish domain events (`invoice.created`, `project.completed`) to a message bus (e.g., Redis Streams) consumed by integration workers.
3. **Error Handling:** Implement retry with exponential backoff and dead-letter queues for manual reconciliation.
4. **Security:** Store API credentials in the secrets dashboard, rotate quarterly, and enforce IP allowlists where supported.

## Phased Roadmap
| Phase | Duration | Deliverables |
| --- | --- | --- |
| Pilot | 4 weeks | Exact Online invoice export, HubSpot lead sync, monitoring dashboards |
| Expansion | 6 weeks | Bi-directional payment status updates, HubSpot deal stage automation |
| Hardening | 4 weeks | Twinfield adapter prototype, automated credential rotation, SLA reporting |

## Testing Strategy
- **Contract Tests:** Validate payloads against vendor schemas before hitting external APIs.
- **Sandbox Environments:** Use vendor sandboxes (Exact Online demo company, HubSpot developer account) for integration QA.
- **Data Reconciliation:** Schedule weekly audit comparing RentGuy invoices with accounting records.

## Stakeholders
- Finance lead for accounting integrations.
- Sales operations for CRM alignment.
- DevOps for secret rotation and monitoring.
