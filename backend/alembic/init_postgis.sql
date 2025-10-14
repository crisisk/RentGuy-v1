-- Initialize PostGIS extension for RentGuy Enterprise Platform
-- This script is automatically executed on database initialization

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

-- Verify installation
SELECT PostGIS_Version();

