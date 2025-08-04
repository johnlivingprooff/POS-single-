import jsPDF from 'jspdf';

interface TaxSettings {
  taxEnabled: boolean;
  taxType: 'inclusive' | 'exclusive';
  taxPercentage: number;
  taxName: string;
}

export function generateReceiptPDF({ 
  cart, 
  customerName, 
  total, 
  subtotal, 
  discount = 0, 
  tax = 0, 
  taxSettings, 
  saleId 
}: {
  cart: Array<{ name: string; price: number; quantity: number; sku: string }>;
  customerName: string;
  total: number;
  subtotal?: number;
  discount?: number;
  tax?: number;
  taxSettings?: TaxSettings;
  saleId?: string;
}) {
  const doc = new jsPDF({ format: 'b5' });
  // Company Info - Enhanced header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SALES RECEIPT', 105, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Habicore Ltd.', 105, 30, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('123 Main Street, City, Country', 105, 36, { align: 'center' });
  doc.text('Phone: (555) 123-4567 | Email: info@habicore.com', 105, 41, { align: 'center' });
  doc.text('Website: www.habicore.com', 105, 46, { align: 'center' });

  // Add a separator line
  doc.line(20, 50, 190, 50);

  // Receipt Info - Enhanced layout
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Receipt Details:', 20, 58);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`Sale ID: ${saleId || 'N/A'}`, 20, 66);
  doc.text(`Customer: ${customerName || 'Walk-in Customer'}`, 20, 72);
  doc.text(`Date: ${new Date().toLocaleString()}`, 20, 78);
  doc.text(`Cashier: System User`, 20, 84); // Could be dynamic based on logged-in user


  // Items section - Enhanced table
  let y = 92;
  doc.line(20, y, 190, y); // Top border
  y += 6;
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Item Description', 22, y);
  doc.text('Qty', 120, y, { align: 'center' });
  doc.text('Unit Price', 140, y, { align: 'center' });
  doc.text('Total', 180, y, { align: 'right' });
  
  y += 4;
  doc.line(20, y, 190, y); // Header separator
  y += 6;

  let calculatedSubtotal = 0;
  doc.setFont('helvetica', 'normal');
  cart.forEach((item) => {
    const price = typeof item.price === 'number' ? item.price : Number(item.price);
    const itemTotal = price * item.quantity;
    calculatedSubtotal += itemTotal;
    
    // Item name (truncate if too long)
    const itemName = item.name.length > 35 ? item.name.substring(0, 32) + '...' : item.name;
    doc.text(itemName, 22, y);
    
    // Quantity
    doc.text(`${item.quantity}`, 120, y, { align: 'center' });
    
    // Unit price
    doc.text(`$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 140, y, { align: 'center' });
    
    // Total price
    doc.text(`$${itemTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 180, y, { align: 'right' });
    
    y += 6;
  });
  
  y += 2;
  doc.line(20, y, 190, y); // Bottom border of items
  y += 8;

  // Use provided values or calculate fallbacks
  const receiptSubtotal = subtotal || calculatedSubtotal;
  const receiptDiscount = discount || 0;
  const receiptTax = tax || 0;
  const receiptTotal = total;

  // Summary section with better formatting
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.text('Subtotal:', 130, y);
  doc.text(`$${receiptSubtotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 180, y, { align: 'right' });
  y += 6;

  // Show discount if applied
  if (receiptDiscount > 0) {
    doc.setTextColor(220, 38, 127); // Red color for discount
    doc.text('Discount:', 130, y);
    doc.text(`-$${receiptDiscount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 180, y, { align: 'right' });
    doc.setTextColor(0, 0, 0); // Reset to black
    y += 6;
  }

  // Show tax if enabled with detailed breakdown
  if (taxSettings?.taxEnabled) {
    const taxLabel = `${taxSettings.taxName} (${taxSettings.taxPercentage}%):`;
    doc.text(taxLabel, 130, y);
    
    if (taxSettings.taxType === 'inclusive') {
      doc.text('included', 180, y, { align: 'right' });
      // Show breakdown for inclusive tax
      y += 4;
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      const taxBreakdown = (receiptSubtotal - receiptDiscount) - ((receiptSubtotal - receiptDiscount) / (1 + taxSettings.taxPercentage / 100));
      doc.text(`(Tax amount: $${taxBreakdown.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`, 180, y, { align: 'right' });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(11);
    } else {
      doc.text(`$${receiptTax.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 180, y, { align: 'right' });
    }
    y += 6;
  }

  // Total with emphasis
  y += 2;
  doc.line(130, y, 190, y); // Line above total
  y += 6;
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', 130, y);
  doc.text(`$${receiptTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 180, y, { align: 'right' });
  y += 10;
  // Footer section with enhanced styling
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 100, 200); // Blue color
  doc.text('Thank you for your business!', 105, y, { align: 'center' });
  y += 6;
  
  doc.setTextColor(0, 0, 0); // Reset to black
  doc.setFontSize(9);
  doc.text('Please keep this receipt for your records', 105, y, { align: 'center' });
  y += 4;
  doc.text('Returns accepted within 30 days with receipt', 105, y, { align: 'center' });
  y += 8;

  // Add a separator line
  doc.line(60, y, 150, y);
  y += 8;

  // Footer with actual logo and company info (small square, not stretched)
  const logoUrl = '/logo_icon.png';
  const img = new window.Image();
  img.src = logoUrl;
  img.onload = function () {
    doc.addImage(img, 'PNG', 95, y, 20, 20); // small square, centered
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Powered by Habicore POS System', 105, y + 25, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, y + 30, { align: 'center' });
    doc.save(`receipt_${saleId || Date.now()}.pdf`);
  };
  img.onerror = function () {
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Powered by Habicore POS System', 105, y + 5, { align: 'center' });
    doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 105, y + 10, { align: 'center' });
    doc.save(`receipt_${saleId || Date.now()}.pdf`);
  };
  return;
}
