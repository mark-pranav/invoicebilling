const { round2, toNumber } = require('./money');

const GST_RATES = [0, 5, 12, 18, 28];

const normalizeState = (state = '') =>
  String(state)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

/**
 * Recalculate invoice totals on the server.
 * Intra-state (same seller & buyer state) => CGST + SGST
 * Inter-state => IGST
 */
const calculateInvoiceTotals = ({
  items = [],
  gstEnabled = true,
  sellerState = '',
  customerState = '',
  amountPaid = 0,
}) => {
  const seller = normalizeState(sellerState);
  const customer = normalizeState(customerState);
  const isIntraState = Boolean(seller && customer && seller === customer);

  let subtotal = 0;
  let totalDiscount = 0;
  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const calculatedItems = items.map((raw) => {
    const quantity = toNumber(raw.quantity);
    const unitPrice = round2(raw.unitPrice);
    const discount = round2(raw.discount || 0);
    let gstRate = toNumber(raw.gstRate, 0);

    if (!GST_RATES.includes(gstRate)) {
      gstRate = 0;
    }
    if (!gstEnabled) {
      gstRate = 0;
    }

    if (quantity < 0 || unitPrice < 0 || discount < 0) {
      throw new Error('Quantity, unit price and discount cannot be negative');
    }

    const lineGross = round2(quantity * unitPrice);
    const lineDiscount = round2(Math.min(discount, lineGross));
    const lineTaxable = round2(lineGross - lineDiscount);
    const lineGst = gstEnabled ? round2((lineTaxable * gstRate) / 100) : 0;
    const lineTotal = round2(lineTaxable + lineGst);

    subtotal = round2(subtotal + lineGross);
    totalDiscount = round2(totalDiscount + lineDiscount);
    taxableAmount = round2(taxableAmount + lineTaxable);

    if (gstEnabled && gstRate > 0) {
      if (isIntraState) {
        const half = round2(lineGst / 2);
        cgstAmount = round2(cgstAmount + half);
        sgstAmount = round2(sgstAmount + (lineGst - half));
      } else {
        igstAmount = round2(igstAmount + lineGst);
      }
    }

    return {
      productId: raw.productId || null,
      name: String(raw.name || '').trim(),
      description: raw.description || '',
      hsnSac: raw.hsnSac || '',
      unit: raw.unit || 'Piece',
      quantity,
      unitPrice,
      gstRate,
      discount: lineDiscount,
      taxableAmount: lineTaxable,
      gstAmount: lineGst,
      totalAmount: lineTotal,
    };
  });

  const totalGst = round2(cgstAmount + sgstAmount + igstAmount);
  const grandTotal = round2(taxableAmount + totalGst);
  const paid = round2(Math.max(0, toNumber(amountPaid, 0)));
  const balanceDue = round2(Math.max(0, grandTotal - paid));

  let paymentStatus = 'Unpaid';
  if (paid <= 0) {
    paymentStatus = 'Unpaid';
  } else if (paid >= grandTotal) {
    paymentStatus = 'Paid';
  } else {
    paymentStatus = 'Partially Paid';
  }

  return {
    items: calculatedItems,
    subtotal,
    totalDiscount,
    taxableAmount,
    cgstAmount: gstEnabled && isIntraState ? cgstAmount : 0,
    sgstAmount: gstEnabled && isIntraState ? sgstAmount : 0,
    igstAmount: gstEnabled && !isIntraState ? igstAmount : 0,
    totalGst: gstEnabled ? totalGst : 0,
    grandTotal,
    amountPaid: Math.min(paid, grandTotal),
    balanceDue: paid >= grandTotal ? 0 : balanceDue,
    paymentStatus,
    isIntraState: gstEnabled ? isIntraState : false,
    gstEnabled: Boolean(gstEnabled),
  };
};

module.exports = { calculateInvoiceTotals, GST_RATES };
