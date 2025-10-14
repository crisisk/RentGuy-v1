import React, { useState, useEffect } from 'react';
import { customersAPI } from '../api/customers';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faBox, faFile, faUsers, faClock, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Order {
  id: string;
  datum: string;
  product: string;
  status: string;
  totaal: number;
}

interface Document {
  id: string;
  naam: string;
  type: string;
  uploadDatum: string;
}

interface Contact {
  id: string;
  naam: string;
  email: string;
  telefoon: string;
  functie: string;
}

interface Note {
  id: string;
  datum: string;
  inhoud: string;
  auteur: string;
}

interface CustomerData {
  id: string;
  naam: string;
  adres: string;
  postcode: string;
  plaats: string;
  kvkNummer: string;
  telefoon: string;
  email: string;
  orders: Order[];
  documenten: Document[];
  contactpersonen: Contact[];
  notities: Note[];
}

export const CustomerDetails: React.FC = () => {
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const result = await customersAPI.getCustomerDetails();
      setCustomerData(result);
    } catch (error) {
      console.error('Fout bij laden gegevens:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  if (!customerData) return <div>Geen klantgegevens gevonden</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <h1 className="heading-rentguy text-3xl mb-8">
          <FontAwesomeIcon icon={faUser} className="mr-2" />
          {customerData.naam}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Linker kolom */}
          <div className="space-y-6">
            <div className="card-rentguy p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Basisinformatie</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Adres:</span> {customerData.adres}</p>
                <p><span className="font-medium">Postcode:</span> {customerData.postcode}</p>
                <p><span className="font-medium">Plaats:</span> {customerData.plaats}</p>
                <p><span className="font-medium">KVK:</span> {customerData.kvkNummer}</p>
              </div>
            </div>

            <div className="card-rentguy p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Contactpersonen</h2>
                <button className="btn-rentguy bg-rentguy-secondary px-4 py-2">
                  <FontAwesomeIcon icon={faPlus} className="mr-2" />
                  Nieuw contact
                </button>
              </div>
              {customerData.contactpersonen.map((contact) => (
                <div key={contact.id} className="py-3 border-b last:border-0">
                  <p className="font-medium">{contact.naam}</p>
                  <p className="text-sm">{contact.functie}</p>
                  <p className="text-sm">{contact.telefoon}</p>
                  <p className="text-sm text-blue-600">{contact.email}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Rechter kolom */}
          <div className="space-y-6">
            <div className="card-rentguy p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Recent Orders</h2>
                <button className="btn-rentguy bg-rentguy-primary px-4 py-2">
                  <FontAwesomeIcon icon={faBox} className="mr-2" />
                  Nieuwe order
                </button>
              </div>
              {customerData.orders.map((order) => (
                <div key={order.id} className="py-3 border-b last:border-0">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{order.product}</p>
                      <p className="text-sm">{order.datum}</p>
                    </div>
                    <div className="text-right">
                      <p className={order.status === 'Actief' ? 'text-green-600' : 'text-foreground'}>
                        {order.status}
                      </p>
                      <p>€{order.totaal.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-rentguy p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-foreground">Documenten</h2>
                <button className="btn-rentguy bg-rentguy-success px-4 py-2">
                  <FontAwesomeIcon icon={faFile} className="mr-2" />
                  Document uploaden
                </button>
              </div>
              {customerData.documenten.map((doc) => (
                <div key={doc.id} className="py-3 border-b last:border-0 flex items-center">
                  <FontAwesomeIcon icon={faFile} className="text-gray-500 mr-3" />
                  <div>
                    <p className="font-medium">{doc.naam}</p>
                    <p className="text-sm">{doc.type} • {doc.uploadDatum}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="card-rentguy p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">Activiteitenlog</h2>
              {customerData.notities.map((note) => (
                <div key={note.id} className="py-3 border-b last:border-0">
                  <div className="flex items-start">
                    <FontAwesomeIcon icon={faClock} className="text-gray-500 mt-1 mr-3" />
                    <div>
                      <p className="text-sm text-gray-500">{note.datum} • {note.auteur}</p>
                      <p>{note.inhoud}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};