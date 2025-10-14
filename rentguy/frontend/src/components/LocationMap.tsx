import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon, LatLngExpression } from 'leaflet';
import { useRealtime, LocationUpdate } from '../hooks/useRealtime';
import 'leaflet/dist/leaflet.css';

interface CrewLocation {
  user_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  project_id: number | null;
}

interface LocationMapProps {
  projectId?: number;
  token: string;
}

// Custom marker icon
const crewIcon = new Icon({
  iconUrl: 'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Component to update map view when locations change
const MapUpdater: React.FC<{ locations: CrewLocation[] }> = ({ locations }) => {
  const map = useMap();

  useEffect(() => {
    if (locations.length > 0) {
      const bounds = locations.map((loc) => [loc.latitude, loc.longitude] as LatLngExpression);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [locations, map]);

  return null;
};

export const LocationMap: React.FC<LocationMapProps> = ({ projectId, token }) => {
  const [crewLocations, setCrewLocations] = useState<CrewLocation[]>([]);
  const { isConnected, socket, latestLocationUpdate } = useRealtime(token);

  useEffect(() => {
    if (!socket || !isConnected) return;

    if (projectId) {
      socket.emit('join_project', { project_id: projectId });
    }

    // Listen for location updates
    socket.on('location_update', (update: LocationUpdate) => {
      setCrewLocations((prev) => {
        const existingIndex = prev.findIndex((loc) => loc.user_id === update.user_id);
        if (existingIndex >= 0) {
          // Update existing location
          const updated = [...prev];
          updated[existingIndex] = {
            user_id: update.user_id,
            latitude: update.latitude,
            longitude: update.longitude,
            timestamp: update.timestamp,
            project_id: update.project_id,
          };
          return updated;
        } else {
          // Add new location
          return [
            ...prev,
            {
              user_id: update.user_id,
              latitude: update.latitude,
              longitude: update.longitude,
              timestamp: update.timestamp,
              project_id: update.project_id,
            },
          ];
        }
      });
    });

    return () => {
      socket.off('location_update');
      if (projectId) {
        socket.emit('leave_project', { project_id: projectId });
      }
    };
  }, [socket, isConnected, projectId]);

  // Default center (Amsterdam)
  const defaultCenter: LatLngExpression = [52.370216, 4.895168];

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 text-white">
        <h2 className="text-xl font-semibold">Crew Location Tracking</h2>
        <p className="text-sm text-gray-400">
          {isConnected ? (
            <span className="text-green-400">● Connected</span>
          ) : (
            <span className="text-red-400">● Disconnected</span>
          )}
          <span className="ml-4">Tracking {crewLocations.length} crew members</span>
        </p>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer
          center={defaultCenter}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {crewLocations.map((location) => (
            <Marker
              key={location.user_id}
              position={[location.latitude, location.longitude]}
              icon={crewIcon}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">User {location.user_id}</p>
                  <p className="text-xs text-gray-600">
                    Last update: {new Date(location.timestamp).toLocaleTimeString()}
                  </p>
                  {location.project_id && (
                    <p className="text-xs text-gray-600">Project: {location.project_id}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          <MapUpdater locations={crewLocations} />
        </MapContainer>
      </div>

      {/* Crew List Sidebar */}
      <div className="bg-gray-800 p-4 border-t border-gray-700 text-white max-h-48 overflow-y-auto">
        <h3 className="text-sm font-semibold mb-2">Active Crew</h3>
        <div className="space-y-2">
          {crewLocations.map((location) => (
            <div
              key={location.user_id}
              className="flex justify-between items-center text-xs bg-gray-700 p-2 rounded"
            >
              <span className="font-semibold">User {location.user_id}</span>
              <span className="text-gray-400">
                {new Date(location.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {crewLocations.length === 0 && (
            <p className="text-gray-400 text-xs">No crew members tracked yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

