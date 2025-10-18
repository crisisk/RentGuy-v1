import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Minus, Package } from 'lucide-react';

const ImprovedEquipmentCatalogStep = ({ onNext, onBack, initialData = {} }) => {
  const [selectedEquipment, setSelectedEquipment] = useState(initialData.equipment || []);
  const [searchTerm, setSearchTerm] = useState('');

  const equipmentCategories = [
    {
      name: 'Audio Apparatuur',
      items: [
        { id: 'speakers-jbl', name: 'JBL Speakers (Paar)', dailyRate: 75, description: 'Professionele PA speakers', category: 'audio' },
        { id: 'mixer-pioneer', name: 'Pioneer DJ Mixer', dailyRate: 125, description: 'DJ mixer met effecten', category: 'audio' },
        { id: 'microphones', name: 'Draadloze Microfoons (Set)', dailyRate: 45, description: 'Handheld en headset microfoons', category: 'audio' },
        { id: 'subwoofer', name: 'Subwoofer', dailyRate: 85, description: 'Krachtige bas versterking', category: 'audio' },
        { id: 'headphones', name: 'DJ Koptelefoon', dailyRate: 25, description: 'Professionele DJ koptelefoon', category: 'audio' },
        { id: 'audio-interface', name: 'Audio Interface', dailyRate: 35, description: 'USB audio interface voor opnames', category: 'audio' }
      ]
    },
    {
      name: 'Verlichting',
      items: [
        { id: 'led-par', name: 'LED PAR Spots (Set van 8)', dailyRate: 95, description: 'RGB LED verlichting', category: 'lighting' },
        { id: 'moving-heads', name: 'Moving Head Spots (4x)', dailyRate: 150, description: 'Bewegende spots met gobos', category: 'lighting' },
        { id: 'laser', name: 'Laser Projector', dailyRate: 65, description: 'Multi-color laser effecten', category: 'lighting' },
        { id: 'smoke-machine', name: 'Rookmachine', dailyRate: 35, description: 'Professionele rookeffecten', category: 'lighting' },
        { id: 'strobe', name: 'Stroboscoop', dailyRate: 40, description: 'Krachtige stroboscoop effecten', category: 'lighting' },
        { id: 'uv-light', name: 'UV Blacklight', dailyRate: 30, description: 'UV verlichting voor speciale effecten', category: 'lighting' }
      ]
    },
    {
      name: 'Accessoires',
      items: [
        { id: 'dj-booth', name: 'DJ Booth/Tafel', dailyRate: 55, description: 'Professionele DJ opstelling', category: 'accessories' },
        { id: 'cables', name: 'Kabel Set', dailyRate: 25, description: 'Alle benodigde kabels', category: 'accessories' },
        { id: 'power', name: 'Stroomverdeling', dailyRate: 30, description: 'Veilige stroomvoorziening', category: 'accessories' },
        { id: 'flight-case', name: 'Flight Case', dailyRate: 20, description: 'Beschermende transport case', category: 'accessories' },
        { id: 'stands', name: 'Speaker Stands (Paar)', dailyRate: 15, description: 'Verstelbare speaker standaards', category: 'accessories' }
      ]
    }
  ];

  // Flatten all items for search
  const allItems = equipmentCategories.flatMap(category => category.items);

  // Filter items based on search term
  const filteredCategories = equipmentCategories.map(category => ({
    ...category,
    items: category.items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  const toggleEquipment = (item) => {
    setSelectedEquipment(prev => {
      const exists = prev.find(eq => eq.id === item.id);
      if (exists) {
        return prev.filter(eq => eq.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      setSelectedEquipment(prev => prev.filter(eq => eq.id !== itemId));
      return;
    }

    setSelectedEquipment(prev =>
      prev.map(eq =>
        eq.id === itemId ? { ...eq, quantity: newQuantity } : eq
      )
    );
  };

  const getTotalValue = () => {
    return selectedEquipment.reduce((sum, item) => sum + (item.dailyRate * item.quantity), 0);
  };

  const handleSubmit = () => {
    onNext({ equipment: selectedEquipment });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Selecteer uw DJ apparatuur</h3>
        <p className="text-gray-600">Kies de apparatuur die u wilt verhuren via RentGuy Enterprise</p>
      </div>

      {/* Search Bar */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          type="text"
          placeholder="Zoek apparatuur..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 input-mr-dj"
        />
      </div>

      {/* Selected Equipment Summary */}
      {selectedEquipment.length > 0 && (
        <Card className="bg-purple-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Package className="w-5 h-5 mr-2 text-purple-600" />
              Geselecteerde apparatuur ({selectedEquipment.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              {selectedEquipment.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-white p-3 rounded-lg border">
                  <div className="flex-1">
                    <h5 className="font-medium text-sm">{item.name}</h5>
                    <p className="text-xs text-gray-600">€{item.dailyRate}/dag</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center font-medium">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <div className="bg-green-100 border border-green-200 rounded-lg p-3">
              <p className="text-green-800 font-medium">
                Totale dagwaarde: €{getTotalValue()}
              </p>
              <p className="text-green-700 text-sm">
                Totaal items: {selectedEquipment.reduce((sum, item) => sum + item.quantity, 0)}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Categories */}
      {filteredCategories.length > 0 ? (
        filteredCategories.map((category) => (
          <div key={category.name} className="space-y-4">
            <h4 className="text-lg font-medium text-purple-700 flex items-center">
              <span className="mr-2">{category.name}</span>
              <Badge variant="secondary" className="ml-auto">
                {category.items.length} items
              </Badge>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map((item) => {
                const selectedItem = selectedEquipment.find(eq => eq.id === item.id);
                const isSelected = !!selectedItem;
                
                return (
                  <Card 
                    key={item.id} 
                    className={`cursor-pointer transition-all card-mr-dj ${
                      isSelected ? 'ring-2 ring-purple-500 bg-purple-50' : 'hover:shadow-md'
                    }`}
                    onClick={() => toggleEquipment(item)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h5 className="font-medium text-sm mb-1">{item.name}</h5>
                          <p className="text-xs text-gray-600 mb-2">{item.description}</p>
                          <Badge variant="secondary" className="text-xs">
                            €{item.dailyRate}/dag
                          </Badge>
                        </div>
                        <Checkbox checked={isSelected} className="ml-2" />
                      </div>
                      
                      {isSelected && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200">
                          <span className="text-sm font-medium text-purple-700">Aantal:</span>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, selectedItem.quantity - 1);
                              }}
                              className="w-6 h-6 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="w-6 text-center text-sm font-medium">
                              {selectedItem.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                updateQuantity(item.id, selectedItem.quantity + 1);
                              }}
                              className="w-6 h-6 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-8">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-600 mb-2">Geen apparatuur gevonden</h4>
          <p className="text-gray-500">Probeer een andere zoekterm</p>
        </div>
      )}

      <div className="flex justify-end space-x-4 pt-6">
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            Terug
          </Button>
        )}
        <Button 
          onClick={handleSubmit} 
          className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600"
          disabled={selectedEquipment.length === 0}
        >
          Volgende ({selectedEquipment.length} items geselecteerd)
        </Button>
      </div>
    </div>
  );
};

export default ImprovedEquipmentCatalogStep;
