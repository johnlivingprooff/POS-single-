import jsPDF from 'jspdf';

interface StocktakingProduct {
  id: string;
  name: string;
  sku: string;
  stockType: string;
  category: string;
  supplier: string;
  measurementType: string | null;
  measurementValue: number | null;
  availableQuantities: number;
  costPrice: number;
  totalValue: number;
}

interface StocktakingReport {
  generatedAt: Date;
  totalProducts?: number;
  totalValue?: number;
  products: StocktakingProduct[];
}

// Generate empty stocktaking sheet PDF
export const generateEmptyStocktakingSheet = (data: StocktakingReport, companyName: string = 'Habicore POS') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(`${companyName}`, 14, 22);
  doc.setFontSize(16);
  doc.text('STOCKTAKING SHEET', 14, 32);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(data.generatedAt).toLocaleDateString()}`, 14, 42);
  doc.text(`Time: ${new Date(data.generatedAt).toLocaleTimeString()}`, 14, 50);
  doc.text(`Total Products: ${data.products.length}`, 14, 58);
  
  // Instructions
  doc.setFontSize(8);
  doc.text('Instructions: Count each item carefully and record the actual quantities in the "Actual Stock" column.', 14, 70);
  doc.text('Use the "Notes" column for any discrepancies or observations.', 14, 76);
  
  // Create a simple table manually
  let currentY = 85;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 14, currentY);
  doc.text('Product Name', 24, currentY);
  doc.text('SKU', 80, currentY);
  doc.text('Type', 110, currentY);
  doc.text('Category', 135, currentY);
  doc.text('Actual Stock', 165, currentY);
  doc.text('Notes', 185, currentY);
  
  // Draw header line
  doc.line(14, currentY + 2, 200, currentY + 2);
  currentY += 8;
  
  // Table data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  data.products.forEach((product, index) => {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = 20;
      
      // Repeat headers on new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', 14, currentY);
      doc.text('Product Name', 24, currentY);
      doc.text('SKU', 80, currentY);
      doc.text('Type', 110, currentY);
      doc.text('Category', 135, currentY);
      doc.text('Actual Stock', 165, currentY);
      doc.text('Notes', 185, currentY);
      doc.line(14, currentY + 2, 200, currentY + 2);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }
    
    doc.text((index + 1).toString(), 14, currentY);
    doc.text(product.name.substring(0, 25), 24, currentY);
    doc.text(product.sku, 80, currentY);
    doc.text(product.stockType, 110, currentY);
    doc.text(product.category, 135, currentY);
    doc.text('_______', 165, currentY); // Space for manual entry
    doc.text('_____________', 185, currentY); // Space for notes
    
    currentY += 6;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
  }
  
  return doc;
};

// Generate final stocktaking report PDF
export const generateFinalStocktakingReport = (data: StocktakingReport, currencySymbol: string = '$', companyName: string = 'Habicore POS') => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text(`${companyName}`, 14, 22);
  doc.setFontSize(16);
  doc.text('STOCKTAKING REPORT', 14, 32);
  doc.setFontSize(10);
  doc.text(`Date: ${new Date(data.generatedAt).toLocaleDateString()}`, 14, 42);
  doc.text(`Time: ${new Date(data.generatedAt).toLocaleTimeString()}`, 14, 50);
  doc.text(`Total Products: ${data.totalProducts || data.products.length}`, 14, 58);
  
  if (data.totalValue !== undefined) {
    doc.text(`Total Inventory Value: ${data.totalValue.toLocaleString(undefined, {style: 'currency', currency: currencySymbol})}`, 14, 66);
  }
  
  // Summary by stock type
  const stockTypes = ['raw_material', 'finished_good', 'asset_equipment', 'consumable'];
  let summaryY = 76;
  
  doc.setFontSize(12);
  doc.text('Summary by Stock Type:', 14, summaryY);
  summaryY += 8;
  
  doc.setFontSize(9);
  stockTypes.forEach(type => {
    const typeProducts = data.products.filter(p => p.stockType === type);
    if (typeProducts.length > 0) {
      const typeValue = typeProducts.reduce((sum, p) => sum + p.totalValue, 0);
      doc.text(`${type.replace('_', ' ').toUpperCase()}: ${typeProducts.length} items, Value: ${currencySymbol}${typeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 20, summaryY);
      summaryY += 6;
    }
  });
  
  // Create detailed table
  let currentY = summaryY + 10;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  
  // Table headers
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('#', 14, currentY);
  doc.text('Product Name', 24, currentY);
  doc.text('SKU', 70, currentY);
  doc.text('Type', 95, currentY);
  doc.text('Category', 115, currentY);
  doc.text('Stock', 145, currentY);
  doc.text('Unit Cost', 165, currentY);
  doc.text('Total Value', 185, currentY);
  
  // Draw header line
  doc.line(14, currentY + 2, 200, currentY + 2);
  currentY += 8;
  
  // Table data
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  
  data.products.forEach((product, index) => {
    if (currentY > pageHeight - margin) {
      doc.addPage();
      currentY = 20;
      
      // Repeat headers on new page
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('#', 14, currentY);
      doc.text('Product Name', 24, currentY);
      doc.text('SKU', 70, currentY);
      doc.text('Type', 95, currentY);
      doc.text('Category', 115, currentY);
      doc.text('Stock', 145, currentY);
      doc.text('Unit Cost', 165, currentY);
      doc.text('Total Value', 185, currentY);
      doc.line(14, currentY + 2, 200, currentY + 2);
      currentY += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
    }
    
    doc.text((index + 1).toString(), 14, currentY);
    doc.text(product.name.substring(0, 20), 24, currentY);
    doc.text(product.sku, 70, currentY);
    doc.text(product.stockType, 95, currentY);
    doc.text(product.category, 115, currentY);
    doc.text((product.availableQuantities || 0).toString(), 145, currentY);
    doc.text(`${currencySymbol}${product.costPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 165, currentY);
    doc.text(`${currencySymbol}${product.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 185, currentY);
    
    currentY += 6;
  });
  
  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, doc.internal.pageSize.height - 10);
    doc.text('This report shows current system inventory levels', 14, doc.internal.pageSize.height - 5);
  }
  
  return doc;
};

// Download PDF helper
export const downloadStocktakingPDF = (doc: jsPDF, filename: string) => {
  doc.save(filename);
};
