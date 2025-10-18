import { useState, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

// Define the structure for a location update
export interface LocationUpdate {
  user_id: number;
  latitude: number;
  longitude: number;
  timestamp: string;
  project_id: number | null;
}

// Define the structure for the hook's return value
export interface RealtimeState {
  isConnected: boolean;
  socket: Socket | null;
  latestLocationUpdate: LocationUpdate | null;
  error: string | null;
  joinProject: (projectId: number) => void;
  leaveProject: (projectId: number) => void;
  sendLocationUpdate: (data: { latitude: number; longitude: number; accuracy?: number; project_id?: number }) => void;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_URL = API_BASE_URL.replace(/^http/, 'ws');

export const useRealtime = (token: string | null): RealtimeState => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [latestLocationUpdate, setLatestLocationUpdate] = useState<LocationUpdate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to the WebSocket server
    const newSocket = io(WS_URL, {
      path: '/ws/socket.io', // Standard path for Socket.IO with ASGI
      auth: {
        token: token, // Pass JWT token for authentication
      },
      transports: ['websocket'],
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Realtime connected');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Realtime disconnected');
    });

    newSocket.on('connect_error', (err) => {
      console.error('Realtime connection error:', err.message);
      setError(err.message);
    });

    newSocket.on('location_update', (data: LocationUpdate) => {
      setLatestLocationUpdate(data);
    });

    newSocket.on('error', (data: { message: string }) => {
      console.error('Realtime server error:', data.message);
      setError(data.message);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [token]);

  const joinProject = useCallback((projectId: number) => {
    if (socket && isConnected) {
      socket.emit('join_project', { project_id: projectId });
    }
  }, [socket, isConnected]);

  const leaveProject = useCallback((projectId: number) => {
    if (socket && isConnected) {
      socket.emit('leave_project', { project_id: projectId });
    }
  }, [socket, isConnected]);

  const sendLocationUpdate = useCallback((data: { latitude: number; longitude: number; accuracy?: number; project_id?: number }) => {
    if (socket && isConnected) {
      socket.emit('update_location', data);
    }
  }, [socket, isConnected]);

  return {
    isConnected,
    socket,
    latestLocationUpdate,
    error,
    joinProject,
    leaveProject,
    sendLocationUpdate,
  };
};

