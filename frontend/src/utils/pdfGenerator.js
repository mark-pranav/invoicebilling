import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatDate, formatINR, round2 } from './money';

const money = (v) => formatINR(v).replace('₹', 'Rs. ');

export const generateInvoicePdf = (invoice, settings, { download = true } = {}) => {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 14;

  // Logo
  if (settings?.logo) {
    try {
      doc.addImage(settings.logo, 'JPEG', 14, y, 22, 22);
    } catch {
      try {
        doc.addImage(settings.logo, 'PNG', 14, y, 22, 22);
      } catch {
        // ignore invalid logo
      }
    }
  }

  const leftX = settings?.logo ? 40 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.text(settings?.businessName || 'Business', leftX, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const businessLines = [
    settings?.ownerName ? `Owner: ${settings.ownerName}` : '',
    settings?.address || '',
    [settings?.phone, settings?.email].filter(Boolean).join(' | '),
    settings?.gstin ? `GSTIN: ${settings.gstin}` : '',
    settings?.state ? `State: ${settings.state}` : '',
  ].filter(Boolean);

  let by = y + 11;
  businessLines.forEach((line) => {
    doc.text(line, leftX, by);
    by += 4.2;
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('INVOICE', pageWidth - 14, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`No: ${invoice.invoiceNumber}`, pageWidth - 14, y + 13, { align: 'right' });
  doc.text(`Date: ${formatDate(invoice.invoiceDate)}`, pageWidth - 14, y + 18, { align: 'right' });
  if (invoice.dueDate) {
    doc.text(`Due: ${formatDate(invoice.dueDate)}`, pageWidth - 14, y + 23, { align: 'right' });
  }

  y = Math.max(by, y + 28) + 4;
  doc.setDrawColor(200);
  doc.line(14, y, pageWidth - 14, y);
  y += 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Bill To', 14, y);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  y += 5;
  const customer = invoice.customer || {};
  [
    customer.name,
    customer.phone ? `Phone: ${customer.phone}` : '',
    customer.billingAddress || '',
    customer.state ? `State: ${customer.state}` : '',
    customer.gstin ? `GSTIN: ${customer.gstin}` : '',
  ]
    .filter(Boolean)
    .forEach((line) => {
      doc.text(String(line), 14, y);
      y += 4.5;
    });

  y += 3;

  const tableBody = (invoice.items || []).map((item, idx) => [
    idx + 1,
    item.name + (item.hsnSac ? `\nHSN: ${item.hsnSac}` : ''),
    String(item.quantity),
    item.unit || '',
    money(item.unitPrice),
    invoice.gstEnabled ? `${item.gstRate}%` : '-',
    money(item.discount || 0),
    money(item.totalAmount),
  ]);

  autoTable(doc, {
    startY: y,
    head: [['#', 'Item', 'Qty', 'Unit', 'Price', 'GST', 'Disc.', 'Amount']],
    body: tableBody,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 95], textColor: 255 },
    columnStyles: {
      0: { cellWidth: 8 },
      2: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { halign: 'right' },
    },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 8;
  const summaryX = pageWidth - 80;
  const valueX = pageWidth - 14;

  const rows = [
    ['Subtotal', money(invoice.subtotal)],
    ['Discount', money(invoice.totalDiscount)],
    ['Taxable Amount', money(invoice.taxableAmount)],
  ];

  if (invoice.gstEnabled) {
    if (invoice.isIntraState) {
      rows.push(['CGST', money(invoice.cgstAmount)]);
      rows.push(['SGST', money(invoice.sgstAmount)]);
    } else {
      rows.push(['IGST', money(invoice.igstAmount)]);
    }
  }

  rows.push(['Grand Total', money(invoice.grandTotal)]);
  rows.push(['Amount Paid', money(invoice.amountPaid)]);
  rows.push(['Balance Due', money(invoice.balanceDue)]);

  doc.setFontSize(10);
  rows.forEach(([label, value], index) => {
    const isBold = label === 'Grand Total' || label === 'Balance Due';
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(label, summaryX, y + index * 5.5);
    doc.text(value, valueX, y + index * 5.5, { align: 'right' });
  });

  let infoY = y;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Payment Mode: ${invoice.paymentMode || '-'}`, 14, infoY);
  infoY += 5;
  doc.text(`Payment Status: ${invoice.paymentStatus || '-'}`, 14, infoY);
  infoY += 5;
  doc.text(
    invoice.gstEnabled
      ? `GST Type: ${invoice.isIntraState ? 'Intra-state (CGST + SGST)' : 'Inter-state (IGST)'}`
      : 'GST: Disabled (Non-GST bill)',
    14,
    infoY
  );

  const termsY = Math.max(y + rows.length * 5.5, infoY) + 12;
  if (settings?.termsAndConditions) {
    doc.setFont('helvetica', 'bold');
    doc.text('Terms & Conditions', 14, termsY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    const terms = doc.splitTextToSize(settings.termsAndConditions, pageWidth - 28);
    doc.text(terms, 14, termsY + 5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Authorized Signature', pageWidth - 14, 280, { align: 'right' });
  doc.line(pageWidth - 60, 275, pageWidth - 14, 275);

  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    `Generated on ${new Date().toLocaleString('en-IN')} | Amounts in INR`,
    14,
    290
  );
  doc.setTextColor(0);

  const filename = `${invoice.invoiceNumber || 'invoice'}.pdf`;
  if (download) {
    doc.save(filename);
  }
  return doc;
};

export const printInvoicePdf = (invoice, settings) => {
  const doc = generateInvoicePdf(invoice, settings, { download: false });
  doc.autoPrint();
  window.open(doc.output('bloburl'), '_blank');
};

export { round2 };
