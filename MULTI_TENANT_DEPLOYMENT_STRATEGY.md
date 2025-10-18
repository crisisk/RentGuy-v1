# Multi-Tenant Deployment Strategy for RentGuy Enterprise Platform

**Author:** Manus AI
**Date:** October 14, 2025
**Target VPS:** 147.93.57.40

## 1. Executive Summary

The RentGuy Enterprise Platform, now production-ready, will be deployed to the target VPS at `147.93.57.40`. The existing VPS environment is a complex, multi-service setup utilizing Docker and Traefik, with an existing service configured on the target port `8721`.

The strategy is an **Isolated Deployment and Seamless Cutover** to ensure zero disruption to existing services. The new RentGuy stack will be deployed in an isolated environment, verified, and then quickly cut over to the final configuration, leveraging the existing Traefik and OpenBao infrastructure.

## 2. VPS Inspection Findings (Phase 1 Summary)

| Component | Status | Finding | Conflict Assessment |
| :--- | :--- | :--- | :--- |
| **Port 8721** | **In Use** | Configured as a Traefik entry point (`rentguy-8721`). | **High Conflict:** Requires removal/update before final deployment. |
| **Traefik** | **Running** | Active reverse proxy for multiple services (PSRA, WordPress, etc.). | **Integration Point:** Will be leveraged for the new multi-tenant routing. |
| **OpenBao** | **Running** | Container named `openbao` is active. | **Integration Point:** New RentGuy will be configured to use this existing instance for secrets. |
| **Keycloak** | **Not Found** | No running Keycloak container detected. | **No Conflict:** New Keycloak instance will be deployed as part of the stack. |

## 3. Deployment Strategy: Isolated Deployment and Seamless Cutover

The deployment will be executed in a series of controlled phases to minimize risk.

### 3.1. Phase 3: Preparation and Keycloak Deployment

1.  **Create Working Directory:** Create `/root/rentguy-new` on the VPS and clone the `crisisk/RentGuy-Enterprise-Platform` repository.
2.  **Keycloak Deployment:** Deploy the Keycloak container using the `docker-compose.production.yml` file. This will establish the identity provider for the new multi-tenant system.
3.  **Keycloak Configuration:** Execute the `scripts/configure_keycloak.sh` script to set up the necessary realm, clients, and users for the RentGuy application.

### 3.2. Phase 4: OpenBao Integration and Secrets Management

1.  **OpenBao Integration:** Configure the new RentGuy stack to communicate with the existing `openbao` container. This involves setting the correct network and environment variables.
2.  **Secrets Retrieval:** Execute the `scripts/retrieve_secrets_from_openbao.sh` script to pull necessary secrets (e.g., database credentials, API keys) from the existing OpenBao instance and inject them into the new RentGuy environment file (`.env.production`).

### 3.3. Phase 5: Isolated RentGuy Deployment (Temporary Port)

1.  **Modify Docker Compose:** Temporarily modify `docker-compose.production.yml` to expose the frontend on an unused port (e.g., `8722`) for initial verification, bypassing the existing `rentguy-8721` conflict.
2.  **Deploy Stack:** Build and deploy the full RentGuy stack (frontend, backend, database) using the modified `docker-compose.production.yml`.
3.  **Initial Verification:** Access the application via the temporary port (`http://147.93.57.40:8722`) to confirm all services are running, the database is initialized, and Keycloak authentication is functional.

### 3.4. Phase 6: Traefik Cutover and Final Configuration

1.  **Remove Old Traefik Entry Point:** Edit the static Traefik configuration (`/etc/traefik/traefik.yml`) to remove the conflicting `rentguy-8721` entry point.
2.  **Final Docker Compose Update:**
    *   Remove the temporary port exposure (`8722`) from the frontend service.
    *   Add the final Traefik labels to the frontend service to route traffic via the standard `websecure` entry point on a dedicated subdomain (e.g., `rentguy.147.93.57.40.nip.io`).
3.  **Final Deployment:** Re-deploy the RentGuy stack with the updated `docker-compose.production.yml` to apply the final Traefik routing.
4.  **Final Verification:** Access the application via the final URL (e.g., `https://rentguy.147.93.57.40.nip.io`) to confirm secure access and multi-tenant routing.

## 4. Rollback Plan

In the event of a critical failure during Phase 5 or 6, the following rollback procedure will be executed:

1.  **Stop New Stack:** Immediately stop and remove the new RentGuy containers: `docker-compose -f docker-compose.production.yml down`.
2.  **Restore Traefik Config:** If the static Traefik configuration was modified (Phase 6), restore the backup of `/etc/traefik/traefik.yml` to re-enable the old `rentguy-8721` entry point.
3.  **Status Report:** Report the failure and rollback to the user for further instruction.

## 5. Execution Plan (Phases 3-8)

The remaining phases of the task will follow the steps outlined in this strategy.

| Phase ID | Title | Key Actions |
| :--- | :--- | :--- |
| 3 | Prepare VPS for deployment and configure Keycloak | Clone repo, deploy Keycloak, run `configure_keycloak.sh`. |
| 4 | Integrate with existing OpenBao and prepare secrets | Configure OpenBao connection, run `retrieve_secrets_from_openbao.sh`. |
| 5 | Deploy RentGuy application and infrastructure components (Docker, Traefik) on temporary port | Modify `docker-compose.production.yml`, deploy stack, verify on `8722`. |
| 6 | Configure Traefik routing and perform cutover to final configuration | Remove old Traefik entry point, update Docker Compose labels, re-deploy, verify on final URL. |
| 7 | Run post-deployment verification and final configuration checks | Thoroughly test all application features and personas. |
| 8 | Deliver deployment summary and final status report to the user | Final report and documentation. |
