import React, { useState } from 'react';

interface SaleEditModalProps {
  open: boolean;
  onClose: () => void;
  sale: any;
  onSave: (updatedSale: any) => void;
  loading?: boolean;
}

const SaleEditModal: React.FC<SaleEditModalProps> = ({ open, onClose, sale, onSave, loading }) => {
  const [form, setForm] = useState(sale || {});
  React.useEffect(() => { setForm(sale || {}); }, [sale]);
  if (!open || !sale) return null;
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 relative w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Edit Sale</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <span className="text-2xl">×</span>
        </button>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer</label>
            <input name="customer" value={form.customer?.name || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <input name="status" value={form.status || ''} onChange={handleChange} className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div className="flex justify-end space-x-2">
            <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-gray-200 text-gray-700">Cancel</button>
            <button type="submit" disabled={loading} className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SaleEditModal;
