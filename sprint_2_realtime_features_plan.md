# Sprint 2: Real-time Features Planning and Initial Setup

This document outlines the plan for implementing the real-time features required for the RentGuy Enterprise Platform, focusing on Crew Tracking, Equipment Status, and Real-time Communication.

## 1. Real-time Crew Location Tracking (GPS)

**Goal:** Implement a system for managers to view the current location of crew members assigned to a project in real-time.

| Component | Technology/Action | Rationale |
| :--- | :--- | :--- |
| **Backend Service** | **FastAPI + WebSockets (Socket.IO)** | FastAPI is already in use. WebSockets provide a persistent, low-latency connection for real-time data. |
| **Data Storage** | **PostgreSQL (PostGIS Extension)** | PostGIS is the standard extension for handling geospatial data in PostgreSQL, allowing for efficient storage and querying of location data. |
| **Frontend Integration** | **React + Leaflet/Mapbox GL** | Use a dedicated mapping library (e.g., Leaflet) to display crew locations on a map interface. |
| **Initial Setup** | 1. Install `python-socketio` and `psycopg2-binary` (for PostGIS). 2. Configure a new WebSocket endpoint in FastAPI (`/ws/location`). 3. Create a `Location` model with `user_id`, `latitude`, `longitude`, and `timestamp`. 4. Add PostGIS extension to the database. | Prepare the environment for real-time data handling. |

## 2. Real-time Equipment Status Updates

**Goal:** Allow crew members to update equipment status (e.g., checked out, returned, damaged) via a mobile interface, with instant reflection in the system.

| Component | Technology/Action | Rationale |
| :--- | :--- | :--- |
| **Backend Service** | **FastAPI REST API** | Status updates are transactional and can be handled efficiently via standard REST endpoints (`/equipment/{id}/status`). |
| **Mobile Interface** | **Frontend PWA (Scanner.jsx)** | The existing PWA structure is ideal for barcode/RFID scanning to identify equipment quickly. |
| **Real-time Push** | **WebSockets** | After a status update via REST, the backend will broadcast the change via the WebSocket connection to all relevant manager dashboards. |
| **Initial Setup** | 1. Define a clear `EquipmentStatus` schema (e.g., `available`, `in_use`, `maintenance`). 2. Implement the `PATCH /equipment/{id}/status` endpoint. 3. Integrate the status update logic into the existing `equipmentAPI` module. | Ensure the core logic for status changes is robust. |

## 3. Real-time Chat/Communication

**Goal:** Implement a simple, project-based chat feature for crew and managers.

| Component | Technology/Action | Rationale | |
| :--- | :--- | :--- | :--- |
| **Backend Service** | **FastAPI + WebSockets (Socket.IO)** | Use the same WebSocket server as the location tracking for a unified real-time layer. |
| **Data Storage** | **PostgreSQL** | Store chat messages for history and persistence. |
| **Frontend Integration** | **React Component** | Create a dedicated `ProjectChat` component that connects to the WebSocket and displays messages. |
| **Initial Setup** | 1. Create a `Message` model with `project_id`, `user_id`, `content`, and `timestamp`. 2. Configure a new WebSocket endpoint for chat (`/ws/chat/{project_id}`). 3. Implement message broadcasting logic within the backend. | Establish the foundation for persistent, real-time communication. |

## Initial Implementation Steps (Backend)

To start Sprint 2, the following initial steps will be taken in the backend:

1.  **Update `requirements.txt`**: Add `python-socketio` and `psycopg2-binary`.
2.  **Database Migration**: Create a new Alembic migration to enable the PostGIS extension and add the `Location` table.
3.  **WebSocket Setup**: Initialize the Socket.IO server in the main FastAPI application.

This plan will be executed once the current deployment issues are resolved and the application is confirmed to be accessible.

