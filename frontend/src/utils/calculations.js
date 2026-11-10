import { round2 } from './money';

const normalizeState = (state = '') =>
  String(state)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

export const calculateInvoiceTotals = ({
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
    const quantity = Number(raw.quantity) || 0;
    const unitPrice = round2(raw.unitPrice);
    const discount = round2(raw.discount || 0);
    let gstRate = Number(raw.gstRate) || 0;
    if (!gstEnabled) gstRate = 0;

    const lineGross = round2(quantity * unitPrice);
    const lineDiscount = round2(Math.min(Math.max(discount, 0), lineGross));
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
      ...raw,
      quantity,
      unitPrice,
      discount: lineDiscount,
      gstRate,
      taxableAmount: lineTaxable,
      gstAmount: lineGst,
      totalAmount: lineTotal,
    };
  });

  const totalGst = round2(cgstAmount + sgstAmount + igstAmount);
  const grandTotal = round2(taxableAmount + totalGst);
  const paid = round2(Math.max(0, Number(amountPaid) || 0));
  const cappedPaid = Math.min(paid, grandTotal);
  const balanceDue = round2(Math.max(0, grandTotal - cappedPaid));

  let paymentStatus = 'Unpaid';
  if (cappedPaid <= 0) paymentStatus = 'Unpaid';
  else if (cappedPaid >= grandTotal) paymentStatus = 'Paid';
  else paymentStatus = 'Partially Paid';

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
    amountPaid: cappedPaid,
    balanceDue,
    paymentStatus,
    isIntraState: gstEnabled ? isIntraState : false,
  };
};
