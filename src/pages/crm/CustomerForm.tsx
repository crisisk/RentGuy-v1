import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import crmStore from '../../stores/crmStore';

interface Customer {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

const CustomerForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(!!id);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<Customer>({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active'
  });

  const [errors, setErrors] = useState<Partial<Customer>>({});

  useEffect(() => {
    if (id) {
      crmStore.getCustomer(id)
        .then(customer => {
          if (customer) setFormData(customer);
          else setFormError('Customer not found');
          setLoading(false);
        })
        .catch(() => {
          setFormError('Failed to load customer');
          setLoading(false);
        });
    }
  }, [id]);

  const validate = (): boolean => {
    const newErrors: Partial<Customer> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Invalid email';
    if (!formData.phone.match(/^\d{10,15}$/)) newErrors.phone = 'Invalid phone number';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await crmStore.saveCustomer(formData);
      navigate('/customers');
    } catch (error) {
      setFormError('Failed to save customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field: keyof Customer) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  if (loading) return <div className="p-4 text-center">Loading...</div>;
  if (formError) return <div className="p-4 text-red-500">{formError}</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6">{id ? 'Edit' : 'Create'} Customer</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {formError && <div className="text-red-500 text-sm">{formError}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            value={formData.name}
            onChange={handleChange('name')}
            className={`w-full p-2 border rounded ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.name && <span className="text-red-500 text-sm">{errors.name}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            className={`w-full p-2 border rounded ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.email && <span className="text-red-500 text-sm">{errors.email}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input
            value={formData.phone}
            onChange={handleChange('phone')}
            className={`w-full p-2 border rounded ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.phone && <span className="text-red-500 text-sm">{errors.phone}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Address *</label>
          <input
            value={formData.address}
            onChange={handleChange('address')}
            className={`w-full p-2 border rounded ${errors.address ? 'border-red-500' : 'border-gray-300'}`}
          />
          {errors.address && <span className="text-red-500 text-sm">{errors.address}</span>}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={formData.status}
            onChange={handleChange('status')}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerForm;
