import React, { useState, useEffect } from 'react';
import { useRealtime } from '../hooks/useRealtime';

type EquipmentStatus = 'available' | 'in_use' | 'maintenance' | 'damaged';

interface Equipment {
  id: number;
  name: string;
  status: EquipmentStatus;
}

interface StatusUpdate {
  item_id: number;
  status: EquipmentStatus;
  timestamp: string;
}

interface EquipmentStatusPanelProps {
  token: string;
}

const statusConfig: Record<EquipmentStatus, { label: string; color: string; icon: string }> = {
  available: { label: 'Available', color: 'bg-green-600 hover:bg-green-700', icon: '✓' },
  in_use: { label: 'In Use', color: 'bg-blue-600 hover:bg-blue-700', icon: '⚙' },
  maintenance: { label: 'Maintenance', color: 'bg-yellow-600 hover:bg-yellow-700', icon: '🔧' },
  damaged: { label: 'Damaged', color: 'bg-red-600 hover:bg-red-700', icon: '⚠' },
};

export const EquipmentStatusPanel: React.FC<EquipmentStatusPanelProps> = ({ token }) => {
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [selectedItem, setSelectedItem] = useState<Equipment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const { isConnected, socket } = useRealtime(token);

  useEffect(() => {
    // Fetch equipment list from API
    fetch('/api/v1/inventory/items', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then((res) => res.json())
      .then((data) => setEquipment(data))
      .catch((err) => console.error('Failed to fetch equipment:', err));
  }, [token]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen for real-time status updates
    socket.on('equipment_status_update', (update: StatusUpdate) => {
      setEquipment((prev) =>
        prev.map((item) =>
          item.id === update.item_id ? { ...item, status: update.status } : item
        )
      );
    });

    return () => {
      socket.off('equipment_status_update');
    };
  }, [socket, isConnected]);

  const handleStatusUpdate = async (itemId: number, newStatus: EquipmentStatus) => {
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/v1/inventory/items/${itemId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update status');
      }

      // Update local state
      setEquipment((prev) =>
        prev.map((item) => (item.id === itemId ? { ...item, status: newStatus } : item))
      );
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update equipment status');
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredEquipment = equipment.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.id.toString().includes(searchQuery)
  );

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold">Equipment Status Management</h2>
        <p className="text-sm text-gray-400">
          {isConnected ? (
            <span className="text-green-400">● Real-time updates enabled</span>
          ) : (
            <span className="text-red-400">● Offline mode</span>
          )}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or ID..."
          className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Equipment List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((item) => (
            <div
              key={item.id}
              className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-xs text-gray-400">ID: {item.id}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    statusConfig[item.status].color.split(' ')[0]
                  }`}
                >
                  {statusConfig[item.status].icon} {statusConfig[item.status].label}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(statusConfig) as EquipmentStatus[]).map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(item.id, status)}
                    disabled={isUpdating || item.status === status}
                    className={`${
                      statusConfig[status].color
                    } disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm font-semibold transition-colors`}
                  >
                    {statusConfig[status].icon} {statusConfig[status].label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center text-gray-400 mt-8">
            <p>No equipment found matching your search</p>
          </div>
        )}
      </div>
    </div>
  );
};

