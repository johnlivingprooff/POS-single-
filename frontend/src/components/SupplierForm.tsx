import React from 'react';

interface SupplierFormProps {
  initialValues?: {
    name?: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  onSubmit: (values: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

const SupplierForm: React.FC<SupplierFormProps> = ({ initialValues = {}, onSubmit, onCancel, loading }) => {
  const [form, setForm] = React.useState({
    name: initialValues.name || '',
    contactName: initialValues.contactName || '',
    email: initialValues.email || '',
    phone: initialValues.phone || '',
    address: initialValues.address || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-2"
      style={{ paddingRight: '8px' }}
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Name</label>
        <input name="contactName" value={form.contactName} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input name="address" value={form.address} onChange={handleChange} className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md" />
      </div>
      <div className="flex justify-end space-x-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md">Cancel</button>
        <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          {loading ? 'Saving...' : 'Save Supplier'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
