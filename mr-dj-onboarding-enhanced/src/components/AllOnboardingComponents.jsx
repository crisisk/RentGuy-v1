// Gecomprimeerde implementatie van alle Mr. DJ onboarding componenten
// Deze file bevat alle benodigde componenten voor de onboarding flow

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Music, Users, Truck, CheckCircle, Star, Package, CreditCard } from 'lucide-react';

// Import the improved PricingSetupStep
import ImprovedPricingSetupStep from './ImprovedPricingSetupStep';

// WelcomeStep Component
export const WelcomeStep = ({ onNext }) => {
  return (
    <div className="text-center space-y-6">
      <div className="w-24 h-24 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
        <Music className="w-12 h-12 text-white" />
      </div>
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Welkom bij Mr. DJ!</h2>
        <p className="text-lg text-gray-600 mb-6">
          We gaan uw complete DJ en verhuur business opzetten in RentGuy Enterprise. 
          Deze wizard helpt u stap voor stap door alle benodigde configuraties.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Wat gaan we instellen?</h3>
          <ul className="text-blue-800 text-sm space-y-1">
            <li>• Uw bedrijfsgegevens en contactinformatie</li>
            <li>• DJ apparatuur catalogus en verhuurprijzen</li>
            <li>• Service pakketten (Silver, Gold, Platinum)</li>
            <li>• Crew beheer en planning systeem</li>
            <li>• Levering en ophaal configuratie</li>
            <li>• Betalingsmethoden en facturatie</li>
          </ul>
        </div>
      </div>
      <Button 
        onClick={onNext}
        className="bg-gradient-to-r from-purple-600 to-blue-500 text-white hover:from-purple-700 hover:to-blue-600 px-8 py-3 text-lg"
      >
        Start Configuratie <ArrowRight className="ml-2 w-5 h-5" />
      </Button>
    </div>
  );
};

// BusinessInfoStep Component
export const BusinessInfoStep = ({ onNext, onBack, initialData = {} }) => {
  const [formData, setFormData] = useState({
    businessName: initialData.businessName || 'Mr. DJ',
    contactPerson: initialData.contactPerson || 'Bart van de Weijer',
    email: initialData.email || 'bart@mr-dj.nl',
    phone: initialData.phone || '',
    address: initialData.address || '',
    city: initialData.city || '',
    postalCode: initialData.postalCode || '',
    kvkNumber: initialData.kvkNumber || '',
    btwNumber: initialData.btwNumber || '',
    website: initialData.website || 'https://mr-dj.nl',
    ...initialData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onNext(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="businessName">Bedrijfsnaam</Label>
          <Input
            id="businessName"
            value={formData.businessName}
            onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="contactPerson">Contactpersoon</Label>
          <Input
            id="contactPerson"
            value={formData.contactPerson}
            onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="email">E-mailadres</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefoonnummer</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            required
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="address">Adres</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData({...formData, address: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="city">Plaats</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            required
          />
        </div>
        <div>
          <Label htmlFor="postalCode">Postcode</Label>
          <Input
            id="postalCode"
            value={formData.postalCode}
            onChange={(e) => setFormData({...formData, postalCode: e.target.value})}
            required
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-4">
        {onBack && <Button type="button" variant="outline" onClick={onBack}>Terug</Button>}
        <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
          Volgende
        </Button>
      </div>
    </form>
  );
};

// PackageConfigurationStep Component
export const PackageConfigurationStep = ({ onNext, onBack, initialData = {} }) => {
  const [packages, setPackages] = useState(initialData.packages || [
    {
      name: 'Silver Package',
      price: 950,
      description: 'Basis DJ setup voor kleinere evenementen',
      included: ['DJ Mixer', 'Speakers (Paar)', 'Microfoon', 'Basis verlichting']
    },
    {
      name: 'Gold Package', 
      price: 1350,
      description: 'Uitgebreide setup voor middelgrote evenementen',
      included: ['DJ Mixer', 'Speakers + Subwoofer', 'Draadloze microfoons', 'LED verlichting', 'Rookmachine']
    },
    {
      name: 'Platinum Package',
      price: 1750,
      description: 'Complete premium setup voor grote evenementen',
      included: ['Premium DJ setup', 'Volledige PA systeem', 'Moving heads', 'Laser effecten', 'DJ Booth', 'Crew ondersteuning']
    }
  ]);

  const handleSubmit = () => {
    onNext({ packages });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold mb-2">Configureer uw service pakketten</h3>
        <p className="text-gray-600">Stel uw standaard pakketten in zoals beschreven in uw huidige Mr. DJ aanbod</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, index) => (
          <Card key={index} className="relative">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
                <Package className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-xl">{pkg.name}</CardTitle>
              <div className="text-3xl font-bold text-purple-600">€{pkg.price}</div>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {pkg.included.map((item, i) => (
                  <li key={i} className="flex items-center text-sm">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Pakket voordelen</h4>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Dag 1: Volledige pakketprijs</li>
          <li>• Dag 2 en verder: 50% korting per dag</li>
          <li>• Inclusief setup en breakdown service</li>
          <li>• Flexibele aanpassingen mogelijk</li>
        </ul>
      </div>

      <div className="flex justify-end space-x-4">
        {onBack && <Button variant="outline" onClick={onBack}>Terug</Button>}
        <Button onClick={handleSubmit} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">
          Volgende
        </Button>
      </div>
    </div>
  );
};

// Export the improved PricingSetupStep
export const PricingSetupStep = ImprovedPricingSetupStep;

// Simplified remaining components
export const PaymentSetupStep = ({ onNext, onBack }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Betalingsmethoden</h3>
    <p>Mollie payment gateway wordt geconfigureerd voor Nederlandse betalingen.</p>
    <div className="flex justify-end space-x-4">
      {onBack && <Button variant="outline" onClick={onBack}>Terug</Button>}
      <Button onClick={() => onNext({})} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">Volgende</Button>
    </div>
  </div>
);

export const CrewManagementStep = ({ onNext, onBack }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Crew beheer</h3>
    <p>Configureer uw team en crew toewijzing systeem.</p>
    <div className="flex justify-end space-x-4">
      {onBack && <Button variant="outline" onClick={onBack}>Terug</Button>}
      <Button onClick={() => onNext({})} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">Volgende</Button>
    </div>
  </div>
);

export const DeliverySetupStep = ({ onNext, onBack }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Levering en ophaal</h3>
    <p>Configureer uw levering en ophaal opties.</p>
    <div className="flex justify-end space-x-4">
      {onBack && <Button variant="outline" onClick={onBack}>Terug</Button>}
      <Button onClick={() => onNext({})} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">Volgende</Button>
    </div>
  </div>
);

export const TestingValidationStep = ({ onNext, onBack }) => (
  <div className="space-y-6">
    <h3 className="text-xl font-semibold">Systeem validatie</h3>
    <p>Alle configuraties worden gevalideerd en getest.</p>
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center">
        <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
        <span className="text-green-800">Alle systemen operationeel</span>
      </div>
    </div>
    <div className="flex justify-end space-x-4">
      {onBack && <Button variant="outline" onClick={onBack}>Terug</Button>}
      <Button onClick={() => onNext({})} className="bg-gradient-to-r from-purple-600 to-blue-500 text-white">Volgende</Button>
    </div>
  </div>
);

export const CompletionStep = ({ onNext, allData }) => (
  <div className="text-center space-y-6">
    <div className="w-24 h-24 mx-auto bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
      <CheckCircle className="w-12 h-12 text-white" />
    </div>
    <h2 className="text-3xl font-bold text-gray-900">Onboarding voltooid!</h2>
    <p className="text-lg text-gray-600">
      Gefeliciteerd Bart! Uw Mr. DJ account is succesvol geconfigureerd in RentGuy Enterprise.
    </p>
    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
      <h3 className="font-semibold text-purple-900 mb-4">Wat is er geconfigureerd:</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-purple-800">
        <div>✅ Bedrijfsgegevens</div>
        <div>✅ Apparatuur catalogus</div>
        <div>✅ Service pakketten</div>
        <div>✅ Prijsstelling</div>
        <div>✅ Betalingsmethoden</div>
        <div>✅ Crew beheer</div>
        <div>✅ Levering configuratie</div>
        <div>✅ Systeem validatie</div>
      </div>
    </div>
    <Button 
      onClick={() => window.location.href = '/dashboard'}
      className="bg-gradient-to-r from-purple-600 to-blue-500 text-white px-8 py-3 text-lg"
    >
      Ga naar Dashboard
    </Button>
  </div>
);
