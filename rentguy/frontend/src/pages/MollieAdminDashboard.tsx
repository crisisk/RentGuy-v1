import React, { useState, useEffect } from 'react';
import { paymentsAPI } from '../api/payments';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClock, faCheckCircle, faTimesCircle, faReceipt, faCreditCard, faHistory } from '@fortawesome/free-solid-svg-icons';

interface Transaction {
  id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  date: string;
  description: string;
}

interface WebhookLog {
  id: string;
  event: string;
  timestamp: string;
  status: 'success' | 'failed';
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  status: 'active' | 'inactive';
}

export const MollieAdminDashboard: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [refundAmount, setRefundAmount] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [txns, logs, methods] = await Promise.all([
        paymentsAPI.getTransactions(),
        paymentsAPI.getWebhookLogs(),
        paymentsAPI.getPaymentMethods()
      ]);
      setTransactions(txns);
      setWebhookLogs(logs);
      setPaymentMethods(methods);
    } catch (err) {
      setError('Fout bij laden van gegevens');
    } finally {
      setLoading(false);
    }
  };

  const handleRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction || !refundAmount) return;
    
    try {
      await paymentsAPI.processRefund(selectedTransaction, parseFloat(refundAmount));
      await loadData();
      setRefundAmount('');
    } catch (err) {
      setError('Refund verwerken mislukt');
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-rentguy-success';
      case 'failed': return 'bg-rentguy-destructive';
      default: return 'bg-rentguy-warning';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="mr-dj-spinner"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <h1 className="heading-rentguy text-3xl mb-8">Mollie Beheer Dashboard</h1>

        {error && (
          <div className="bg-rentguy-destructive text-white p-4 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          <div className="card-rentguy p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faHistory} />
              Transactiegeschiedenis
            </h2>
            <div className="space-y-4">
              {transactions.map((txn) => (
                <div key={txn.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{txn.description}</p>
                    <p className="text-sm text-foreground/80">{txn.date}</p>
                  </div>
                  <span className={`${statusColor(txn.status)} text-white px-3 py-1 rounded-full text-sm`}>
                    {txn.status === 'paid' ? 'Betaald' : txn.status === 'pending' ? 'In behandeling' : 'Mislukt'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <div className="card-rentguy p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faReceipt} />
                Refunds Verwerken
              </h2>
              <form onSubmit={handleRefund} className="space-y-4">
                <select 
                  className="input-mr-dj w-full"
                  value={selectedTransaction}
                  onChange={(e) => setSelectedTransaction(e.target.value)}
                >
                  <option value="">Selecteer transactie</option>
                  {transactions.filter(t => t.status === 'paid').map(txn => (
                    <option key={txn.id} value={txn.id}>{txn.description}</option>
                  ))}
                </select>
                <input
                  type="number"
                  className="input-mr-dj w-full"
                  placeholder="Refundbedrag"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
                <button type="submit" className="btn-rentguy bg-rentguy-destructive hover:bg-red-600">
                  Refund Verwerken
                </button>
              </form>
            </div>

            <div className="card-rentguy p-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={faCreditCard} />
                Betaalmethoden
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <FontAwesomeIcon icon={method.icon as any} className="text-2xl" />
                    <span className="font-medium">{method.name}</span>
                    <span className={`ml-auto text-sm ${method.status === 'active' ? 'text-rentguy-success' : 'text-rentguy-destructive'}`}>
                      {method.status === 'active' ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="card-rentguy p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faCheckCircle} />
            Webhook Logs
          </h2>
          <div className="space-y-3">
            {webhookLogs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium">{log.event}</p>
                  <p className="text-sm text-foreground/80">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
                <FontAwesomeIcon 
                  icon={log.status === 'success' ? faCheckCircle : faTimesCircle} 
                  className={log.status === 'success' ? 'text-rentguy-success' : 'text-rentguy-destructive'} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};