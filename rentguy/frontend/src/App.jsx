import React from 'react';
import { useRealtime } from './hooks/useRealtime';

function App() {
  // Placeholder token - replace with actual auth token logic
  const token = "placeholder_jwt_token"; 
  const { isConnected, latestLocationUpdate, joinProject, sendLocationUpdate } = useRealtime(token);

  const handleSendLocation = () => {
    // Example location data
    sendLocationUpdate({
      latitude: 52.370216,
      longitude: 4.895168,
      accuracy: 10,
      project_id: 1
    });
  };

  return (
    <div className="App">
      <h1>RentGuy Realtime Demo</h1>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      <button onClick={() => joinProject(1)} disabled={!isConnected}>Join Project 1</button>
      <button onClick={handleSendLocation} disabled={!isConnected}>Send Location Update</button>
      
      {latestLocationUpdate && (
        <div>
          <h2>Latest Location Update:</h2>
          <p>User ID: {latestLocationUpdate.user_id}</p>
          <p>Lat/Lon: {latestLocationUpdate.latitude}, {latestLocationUpdate.longitude}</p>
          <p>Timestamp: {latestLocationUpdate.timestamp}</p>
        </div>
      )}
    </div>
  );
}

export default App;

