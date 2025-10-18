import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Euro, Settings, Package, Wrench, AlertCircle } from 'lucide-react';

const ImprovedPricingSetupStep = ({ onNext, onBack, initialData = {}, allData = {} }) => {
  const [isManualMode, setIsManualMode] = useState(initialData.isManualMode || false);
  const [packagePrices, setPackagePrices] = useState(initialData.packagePrices || {
    silver: 950,
    gold: 1350,
    platinum: 1750
  });
  const [equipmentPrices, setEquipmentPrices] = useState(initialData.equipmentPrices || {});
  const [discountSettings, setDiscountSettings] = useState(initialData.discountSettings || {
    multiDayDiscount: 50, // 50% korting vanaf dag 2
    bulkDiscount: 10, // 10% korting bij meer dan 5 items
    seasonalMarkup: 0 // Geen seasonal pricing zoals gevraagd
  });

  // Get equipment from previous steps
  const selectedEquipment = allData[3]?.equipment || [];

  // Initialize equipment prices if not set
  React.useEffect(() => {
    if (selectedEquipment.length > 0 && Object.keys(equipmentPrices).length === 0) {
      const initialPrices = {};
      selectedEquipment.forEach(item => {
        initialPrices[item.id] = item.dailyRate;
      });
      setEquipmentPrices(initialPrices);
    }
  }, [selectedEquipment, equipmentPrices]);

  const updatePackagePrice = (packageType, newPrice) => {
    setPackagePrices(prev => ({
      ...prev,
      [packageType]: parseFloat(newPrice) || 0
    }));
  };

  const updateEquipmentPrice = (itemId, newPrice) => {
    setEquipmentPrices(prev => ({
      ...prev,
      [itemId]: parseFloat(newPrice) || 0
    }));
  };

  const updateDiscountSetting = (setting, value) => {
    setDiscountSettings(prev => ({
      ...prev,
      [setting]: parseFloat(value) || 0
    }));
  };

  const resetToDefaults = () => {
    setPackagePrices({
      silver: 950,
      gold: 1350,
      platinum: 1750
    });
    
    const defaultPrices = {};
    selectedEquipment.forEach(item => {
      defaultPrices[item.id] = item.dailyRate;
    });
    setEquipmentPrices(defaultPrices);
    
    setDiscountSettings({
      multiDayDiscount: 50,
      bulkDiscount: 10,
      seasonalMarkup: 0
    });
  };

  const handleSubmit = () => {
    const data = {
      isManualMode,
      packagePrices,
      equipmentPrices,
      discountSettings
    };
    onNext(data);
  };

  const packages = [
    {
      id: 'silver',
      name: 'Silver Package',
      description: 'Basis DJ setup voor kleinere evenementen',
      included: ['DJ Mixer', 'Speakers (Paar)', 'Microfoon', 'Basis verlichting'],
      color: 'bg-gray-100 border-gray-300'
    },
    {
      id: 'gold',
      name: 'Gold Package',
      description: 'Uitgebreide setup voor middelgrote evenementen',
      included: ['DJ Mixer', 'Speakers + Subwoofer', 'Draadloze microfoons', 'LED verlichting', 'Rookmachine'],
      color: 'bg-yellow-50 border-yellow-300'
    },
    {
      id: 'platinum',
      name: 'Platinum Package',
      description: 'Complete premium setup voor grote evenementen',
      included: ['Premium DJ setup', 'Volledige PA systeem', 'Moving heads', 'Laser effecten', 'DJ Booth', 'Crew ondersteuning'],
      color: 'bg-purple-50 border-purple-300'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Prijsstelling configuratie</h3>
        <p className="text-gray-600">Configureer uw tarieven en kortingsstructuur</p>
      </div>

      {/* Manual Mode Toggle */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-blue-600" />
              <div>
                <Label htmlFor="manual-mode" className="text-base font-medium">
                  Handmatige prijsaanpassing
                </Label>
                <p className="text-sm text-gray-600">
                  Schakel in om prijzen handmatig aan te passen
                </p>
              </div>
            </div>
            <Switch
              id="manual-mode"
              checked={isManualMode}
              onCheckedChange={setIsManualMode}
            />
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="packages" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="packages" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Pakketten</span>
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center space-x-2">
            <Wrench className="w-4 h-4" />
            <span>Apparatuur</span>
          </TabsTrigger>
          <TabsTrigger value="discounts" className="flex items-center space-x-2">
            <Euro className="w-4 h-4" />
            <span>Kortingen</span>
          </TabsTrigger>
        </TabsList>

        {/* Package Pricing */}
        <TabsContent value="packages" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.map((pkg) => (
              <Card key={pkg.id} className={`${pkg.color} transition-all duration-200`}>
                <CardHeader className="text-center pb-4">
                  <CardTitle className="text-lg">{pkg.name}</CardTitle>
                  <CardDescription className="text-sm">{pkg.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center">
                    {isManualMode ? (
                      <div className="space-y-2">
                        <Label htmlFor={`price-${pkg.id}`} className="text-sm font-medium">
                          Prijs per dag
                        </Label>
                        <div className="relative">
                          <Euro className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                          <Input
                            id={`price-${pkg.id}`}
                            type="number"
                            value={packagePrices[pkg.id]}
                            onChange={(e) => updatePackagePrice(pkg.id, e.target.value)}
                            className="pl-10 text-center font-bold text-lg"
                            min="0"
                            step="50"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-3xl font-bold text-purple-600">
                        €{packagePrices[pkg.id]}
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Inbegrepen:</h4>
                    <ul className="space-y-1">
                      {pkg.included.map((item, i) => (
                        <li key={i} className="text-xs flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Equipment Pricing */}
        <TabsContent value="equipment" className="space-y-4">
          {selectedEquipment.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedEquipment.map((item) => (
                <Card key={item.id} className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h5 className="font-medium text-sm">{item.name}</h5>
                        <p className="text-xs text-gray-600">{item.description}</p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          Aantal: {item.quantity}
                        </Badge>
                      </div>
                      <div className="ml-4">
                        {isManualMode ? (
                          <div className="space-y-1">
                            <Label className="text-xs">€/dag</Label>
                            <Input
                              type="number"
                              value={equipmentPrices[item.id] || item.dailyRate}
                              onChange={(e) => updateEquipmentPrice(item.id, e.target.value)}
                              className="w-20 text-center text-sm"
                              min="0"
                              step="5"
                            />
                          </div>
                        ) : (
                          <div className="text-right">
                            <div className="font-bold text-purple-600">
                              €{equipmentPrices[item.id] || item.dailyRate}
                            </div>
                            <div className="text-xs text-gray-500">per dag</div>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Geen apparatuur geselecteerd in de vorige stap</p>
            </div>
          )}
        </TabsContent>

        {/* Discount Settings */}
        <TabsContent value="discounts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Euro className="w-5 h-5 mr-2 text-green-600" />
                  Meerdaagse korting
                </CardTitle>
                <CardDescription>
                  Korting vanaf de tweede dag
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="multi-day" className="flex-1">Korting percentage:</Label>
                    {isManualMode ? (
                      <Input
                        id="multi-day"
                        type="number"
                        value={discountSettings.multiDayDiscount}
                        onChange={(e) => updateDiscountSetting('multiDayDiscount', e.target.value)}
                        className="w-20 text-center"
                        min="0"
                        max="100"
                        step="5"
                      />
                    ) : (
                      <span className="font-bold text-green-600">
                        {discountSettings.multiDayDiscount}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Dag 1: Volledige prijs, Dag 2+: {discountSettings.multiDayDiscount}% korting
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Package className="w-5 h-5 mr-2 text-blue-600" />
                  Bulk korting
                </CardTitle>
                <CardDescription>
                  Korting bij grote bestellingen
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="bulk" className="flex-1">Korting percentage:</Label>
                    {isManualMode ? (
                      <Input
                        id="bulk"
                        type="number"
                        value={discountSettings.bulkDiscount}
                        onChange={(e) => updateDiscountSetting('bulkDiscount', e.target.value)}
                        className="w-20 text-center"
                        min="0"
                        max="100"
                        step="5"
                      />
                    ) : (
                      <span className="font-bold text-blue-600">
                        {discountSettings.bulkDiscount}%
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    Bij meer dan 5 items totaal
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-orange-900">Seizoensgebonden prijzen</h4>
                  <p className="text-sm text-orange-800 mt-1">
                    Zoals gevraagd zijn seizoensgebonden prijsaanpassingen uitgeschakeld. 
                    Alle prijzen blijven het hele jaar door consistent.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Reset and Actions */}
      <div className="flex items-center justify-between pt-6 border-t">
        <div className="flex space-x-4">
          {isManualMode && (
            <Button
              variant="outline"
              onClick={resetToDefaults}
              className="text-gray-600 hover:text-gray-800"
            >
              Reset naar standaard
            </Button>
          )}
        </div>
        
        <div className="flex space-x-4">
          {onBack && (
            <Button variant="outline" onClick={onBack}>
              Terug
            </Button>
          )}
          <Button 
            onClick={handleSubmit}
            className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600"
          >
            Volgende
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ImprovedPricingSetupStep;
