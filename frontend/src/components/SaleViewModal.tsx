import React from 'react';

interface SaleViewModalProps {
  open: boolean;
  onClose: () => void;
  sale: any;
}

const SaleViewModal: React.FC<SaleViewModalProps> = ({ open, onClose, sale }) => {
  if (!open || !sale) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-lg shadow-lg p-6 relative w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Sale Details</h2>
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <span className="text-2xl">×</span>
        </button>
        <div className="space-y-2">
          <div><strong>Sale #:</strong> {sale.saleNumber}</div>
          <div><strong>Customer:</strong> {sale.customer?.name || '-'}</div>
          <div><strong>User:</strong> {sale.user?.name || '-'}</div>
          <div><strong>Total:</strong> ${Number(sale.total).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
          <div><strong>Payment:</strong> {sale.paymentMethod}</div>
          <div><strong>Status:</strong> {sale.status}</div>
          <div><strong>Date:</strong> {new Date(sale.createdAt).toLocaleString()}</div>
        </div>
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="list-disc pl-5">
            {sale.items?.map((item: any, idx: number) => (
              <li key={idx}>
                {item.name} (SKU: {item.sku}) x{item.quantity} @ ${item.price.toFixed(2)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SaleViewModal;
