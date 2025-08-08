// import { useState } from "react";
// import { useAuthStore } from "../stores/authStore";
// import { apiFetch } from "../lib/api-utils";
// import { useQuery } from '@tanstack/react-query';


// Receipt formatting utilities for different paper sizes
export interface PaperSize {
  name: string;
  width: number; // in mm
  height: number; // in mm
  orientation: 'portrait' | 'landscape';
}

export const PAPER_SIZES: Record<string, PaperSize> = {
  A4: { name: 'A4', width: 210, height: 297, orientation: 'portrait' },
  A5: { name: 'A5', width: 148, height: 210, orientation: 'portrait' },
  B5: { name: 'B5', width: 176, height: 250, orientation: 'portrait' },
  Letter: { name: 'Letter', width: 216, height: 279, orientation: 'portrait' },
  Thermal: { name: 'Thermal 80mm', width: 80, height: 200, orientation: 'portrait' }
};

export interface ReceiptData {
  companyName: string;
  address: string;
  phone: string;
  saleNumber: string;
  date: string;
  customerName?: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    costPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentMethod: string;
  currency: string;
  currencySymbol: string;
}

export function generateReceiptHTML(
  data: ReceiptData, 
  paperSize: string = 'A4',
  centerContent: boolean = true
): string {
  const size = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
  const isSmallFormat = size.width <= 80; // Thermal receipt
  
  const styles = `
    <style>
      @page {
        size: ${size.width}mm ${size.height}mm;
        margin: ${isSmallFormat ? '2mm' : '10mm'};
      }
      
      body {
        font-family: 'Courier New', monospace;
        font-size: ${isSmallFormat ? '10px' : '12px'};
        line-height: 1.4;
        margin: 0;
        padding: ${isSmallFormat ? '5mm' : '15mm'};
        ${centerContent ? 'display: flex; justify-content: center;' : ''}
      }
      
      .receipt-container {
        width: ${isSmallFormat ? '100%' : 'auto'};
        max-width: ${isSmallFormat ? 'none' : '300px'};
        ${centerContent && !isSmallFormat ? 'margin: 0 auto;' : ''}
      }
      
      .header {
        text-align: center;
        border-bottom: 1px dashed #000;
        padding-bottom: 10px;
        margin-bottom: 10px;
      }
      
      .company-name {
        font-size: ${isSmallFormat ? '14px' : '16px'};
        font-weight: bold;
        margin-bottom: 5px;
      }
      
      .company-info {
        font-size: ${isSmallFormat ? '9px' : '10px'};
        margin-bottom: 2px;
      }
      
      .sale-info {
        margin-bottom: 10px;
        border-bottom: 1px dashed #000;
        padding-bottom: 10px;
      }
      
      .sale-info div {
        display: flex;
        justify-content: space-between;
        margin-bottom: 2px;
      }
      
      .items {
        margin-bottom: 10px;
      }
      
      .item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
        font-size: ${isSmallFormat ? '9px' : '11px'};
      }
      
      .item-name {
        flex: 1;
        margin-right: 10px;
      }
      
      .item-qty {
        margin-right: 5px;
        min-width: 30px;
      }
      
      .item-price {
        margin-right: 5px;
        min-width: 40px;
        text-align: right;
      }
      
      .item-total {
        min-width: 50px;
        text-align: right;
      }
      
      .totals {
        border-top: 1px dashed #000;
        padding-top: 10px;
      }
      
      .total-line {
        display: flex;
        justify-content: space-between;
        margin-bottom: 3px;
      }
      
      .final-total {
        border-top: 1px solid #000;
        border-bottom: 1px double #000;
        padding: 5px 0;
        font-weight: bold;
        font-size: ${isSmallFormat ? '12px' : '14px'};
      }
      
      .footer {
        text-align: center;
        margin-top: 15px;
        font-size: ${isSmallFormat ? '8px' : '9px'};
        border-top: 1px dashed #000;
        padding-top: 10px;
      }
      
      @media print {
        body { -webkit-print-color-adjust: exact; }
        .receipt-container { page-break-inside: avoid; }
      }
    </style>
  `;

  // Helper to format numbers in accounting style (negative numbers in parentheses, no currency symbol)
  function formatAccounting(value: number): string {
    const absValue = Math.abs(value).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `(${absValue})` : absValue;
  }

  const receiptHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Receipt - ${data.saleNumber}</title>
      ${styles}
    </head>
    <body>
      <div class="receipt-container">
        <div class="header">
          <div class="company-name">${data.companyName}</div>
          <div class="company-info">${data.address}</div>
          <div class="company-info">${data.phone}</div>
        </div>
        
        <div class="sale-info">
          <div><span>Receipt #:</span><span>${data.saleNumber}</span></div>
          <div><span>Date:</span><span>${data.date}</span></div>
          ${data.customerName ? `<div><span>Customer:</span><span>${data.customerName}</span></div>` : ''}
          <div><span>Payment:</span><span>${data.paymentMethod}</span></div>
        </div>
        
        <div class="items">
          <div class="item">
            <div class="item-name">Item</div>
            <div class="item-qty">Qty</div>
            <div class="item-price">Price ${data.currencySymbol}</div>
            <div class="item-total">Total ${data.currencySymbol}</div>
          </div>
          ${data.items.map(item => `
            <div class="item">
              <div class="item-name">${item.name}</div>
              <div class="item-qty">${item.quantity}x</div>
              <div class="item-price">${formatAccounting(item.costPrice)}</div>
              <div class="item-total">${formatAccounting(item.total)}</div>
            </div>
          `).join('')}
        </div>
        
        <div class="totals">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${data.currencySymbol} ${formatAccounting(data.subtotal)}</span>
          </div>
          ${data.discount > 0 ? `
            <div class="total-line">
              <span>Discount:</span>
              <span>-${data.currencySymbol} ${formatAccounting(data.discount)}</span>
            </div>
          ` : ''}
          ${data.tax > 0 ? `
            <div class="total-line">
              <span>Tax:</span>
              <span>${data.currencySymbol} ${formatAccounting(data.tax)}</span>
            </div>
          ` : ''}
          <div class="total-line final-total">
            <span>TOTAL:</span>
            <span>${data.currencySymbol} ${formatAccounting(data.total)}</span>
          </div>
        </div>
        
        <div class="footer">
          <div>Thank you for your business!</div>
          <div>Powered by Habicore POS</div>
        </div>
      </div>
    </body>
    </html>
  `;

  return receiptHTML;
}

export function downloadReceipt(
  data: ReceiptData, 
  paperSize: string = 'A4',
  centerContent: boolean = true
): void {
  const receiptHTML = generateReceiptHTML(data, paperSize, centerContent);
  
  // Create a new window/tab for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(receiptHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      // Optionally close the window after printing
      printWindow.onafterprint = () => {
        printWindow.close();
      };
    };
  }
}

export function getReceiptBlob(
  data: ReceiptData, 
  paperSize: string = 'A4',
  centerContent: boolean = true
): Blob {
  const receiptHTML = generateReceiptHTML(data, paperSize, centerContent);
  return new Blob([receiptHTML], { type: 'text/html' });
}
