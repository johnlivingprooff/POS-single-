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
      className="mobile-form-group"
    >
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input name="name" value={form.name} onChange={handleChange} required className="mobile-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Contact Name</label>
        <input name="contactName" value={form.contactName} onChange={handleChange} className="mobile-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input name="email" type="email" value={form.email} onChange={handleChange} className="mobile-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Phone</label>
        <input name="phone" value={form.phone} onChange={handleChange} className="mobile-input" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input name="address" value={form.address} onChange={handleChange} className="mobile-input" />
      </div>
      <div className="flex flex-col space-y-2 sm:flex-row sm:justify-end sm:space-y-0 sm:space-x-2">
        <button type="button" onClick={onCancel} className="mobile-button bg-gray-200 text-gray-700 hover:bg-gray-300">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="mobile-button">
          {loading ? 'Saving...' : 'Save Supplier'}
        </button>
      </div>
    </form>
  );
};

export default SupplierForm;
