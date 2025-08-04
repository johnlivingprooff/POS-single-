import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, width }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className={`bg-white rounded-lg shadow-lg relative w-full max-w-lg ${width || ''} px-6 py-6`} style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        {title && <h2 className="mb-4 text-xl font-bold">{title}</h2>}
        <button
          onClick={onClose}
          className="absolute text-gray-400 top-3 right-3 hover:text-gray-600"
          aria-label="Close"
        >
          <span className="text-2xl">×</span>
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
