# RentGuy Enterprise Platform

## Overview
Welcome to the RentGuy Enterprise Platform, a comprehensive solution designed for modern rental management. This platform is built to provide a robust, scalable, and feature-rich environment for property owners, managers, tenants, and various stakeholders. It encompasses advanced functionalities from payment processing and CRM to microservices architecture, analytics, and enterprise-grade security.

## Key Features
- **Payment Adapters**: Integrated Stripe and Mollie for secure and efficient payment processing with webhook support.
- **Unified Authentication**: Single Sign-On (SSO) integration with AzureAD and Google Workspace, coupled with a robust Crew ↔ Auth system for single user identity and role-based access control.
- **Warehouse & Transport Management**: RFID/NFC integration for inventory tracking, and Google Maps API-driven route optimization for efficient logistics.
- **Analytics & Business Intelligence**: Dashboards for margin, revenue, and cost analysis, alongside OTLP tracing and Grafana dashboards for comprehensive observability.
- **Microservices Architecture**: Migration from monolithic to microservices architecture with NATS/Redpanda event broker for inter-service communication, enabling high scalability and resilience.
- **CRM & Integrations**: Native RentGuy CRM with Invoice Ninja integration, replacing external CRM systems. Includes Twinfield integration for advanced accounting.
- **Multi-Tenant Support**: Enterprise-grade multi-tenancy with data isolation, tier management, and resource allocation.
- **Contract Management**: Comprehensive Document Management System (DMS) integration for handling lease agreements and other contracts, including version control and template management.
- **Security & Compliance**: Robust security hardening measures, data anonymization for GDPR compliance, and full audit logging capabilities.
- **Optimized Infrastructure**: Performance-tuned database, application-level caching, web server optimization, and comprehensive monitoring and logging setup.

## Technology Stack
- **Backend**: Python (FastAPI), PostgreSQL, Redis
- **Frontend**: React.js
- **Containerization**: Docker, Docker Compose
- **Orchestration**: Kubernetes (future-ready, implied by microservices)
- **Event Broker**: NATS/Redpanda
- **Monitoring**: Prometheus, Grafana, OpenTelemetry
- **Payment Gateways**: Stripe, Mollie
- **SSO**: AzureAD, Google Workspace
- **Accounting**: Twinfield
- **Invoicing**: Invoice Ninja (OSS)

## Deployment
The platform is designed for deployment on a Virtual Private Server (VPS) using Docker and Docker Compose for containerization and orchestration. Traefik is utilized as an edge router and load balancer for secure access and service discovery.

## Getting Started
Detailed deployment instructions, environment variable configurations, and setup guides are available in the `docs/` directory (or will be provided in a separate deployment guide).

## Roadmap
Refer to `updated_36_month_roadmap.md` for the future development plans and strategic initiatives for the RentGuy Enterprise Platform.

## UAT Reports
User Acceptance Testing (UAT) reports for various personas can be found in the `testing/` directory.

## Contributing
Contributions are welcome! Please refer to the `CONTRIBUTING.md` for guidelines.

## License
This project is licensed under the [MIT License](LICENSE.md).

