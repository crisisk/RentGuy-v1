import React, { useState, useEffect } from 'react';
import { equipmentAPI } from '../api/equipment';

interface EquipmentItem {
  id: number;
  name: string;
  category: string;
  status: 'available' | 'in_use' | 'maintenance' | 'unavailable';
  location: string;
  barcode?: string;
  lastMaintenance?: string;
}

export const EquipmentInventory: React.FC = () => {
  const [equipment, setEquipment] = useState<EquipmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadEquipment();
  }, []);

  const loadEquipment = async () => {
    try {
      setLoading(true);
      const data = await equipmentAPI.getAll();
      setEquipment(data);
    } catch (error) {
      console.error('Failed to load equipment:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'in_use':
        return 'bg-blue-100 text-blue-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'unavailable':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'available':
        return 'Beschikbaar';
      case 'in_use':
        return 'In Gebruik';
      case 'maintenance':
        return 'Onderhoud';
      case 'unavailable':
        return 'Niet Beschikbaar';
      default:
        return status;
    }
  };

  const filteredEquipment = equipment.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.barcode?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Equipment Inventaris
          </h1>
          <p className="text-muted-foreground">
            Beheer en track al je equipment met real-time status updates
          </p>
        </div>

        {/* Filters */}
        <div className="card-rentguy p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Zoeken
              </label>
              <input
                type="text"
                placeholder="Zoek op naam, categorie of barcode..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input-mr-dj w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Status Filter
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-mr-dj w-full"
              >
                <option value="all">Alle Statussen</option>
                <option value="available">Beschikbaar</option>
                <option value="in_use">In Gebruik</option>
                <option value="maintenance">Onderhoud</option>
                <option value="unavailable">Niet Beschikbaar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Equipment Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEquipment.map((item) => (
            <div key={item.id} className="card-rentguy p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{item.category}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                    item.status
                  )}`}
                >
                  {getStatusLabel(item.status)}
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center text-muted-foreground">
                  <i className="fas fa-map-marker-alt w-5"></i>
                  <span>{item.location}</span>
                </div>
                {item.barcode && (
                  <div className="flex items-center text-muted-foreground">
                    <i className="fas fa-barcode w-5"></i>
                    <span>{item.barcode}</span>
                  </div>
                )}
                {item.lastMaintenance && (
                  <div className="flex items-center text-muted-foreground">
                    <i className="fas fa-wrench w-5"></i>
                    <span>Laatste onderhoud: {item.lastMaintenance}</span>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border flex gap-2">
                <button className="btn-rentguy flex-1 text-sm py-2">
                  <i className="fas fa-edit mr-2"></i>
                  Bewerken
                </button>
                <button className="btn-rentguy flex-1 text-sm py-2">
                  <i className="fas fa-qrcode mr-2"></i>
                  Scan
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredEquipment.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-box-open text-6xl text-muted-foreground mb-4"></i>
            <p className="text-xl text-muted-foreground">
              Geen equipment gevonden
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

