const Invoice = require('../models/Invoice');
const BusinessSettings = require('../models/BusinessSettings');

/**
 * Generate a unique sequential invoice number, e.g. INV-2026-0001
 */
const generateInvoiceNumber = async () => {
  const settings = await BusinessSettings.getSettings();
  const year = new Date().getFullYear();
  const prefix = settings.invoicePrefix || 'INV';

  let next = settings.nextInvoiceNumber || 1;
  let invoiceNumber = `${prefix}-${year}-${String(next).padStart(4, '0')}`;

  // Ensure uniqueness even if settings counter drifts
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await Invoice.exists({ invoiceNumber });
    if (!exists) break;
    next += 1;
    invoiceNumber = `${prefix}-${year}-${String(next).padStart(4, '0')}`;
  }

  settings.nextInvoiceNumber = next + 1;
  await settings.save();

  return invoiceNumber;
};

module.exports = { generateInvoiceNumber };
