const Invoice = require('../models/Invoice');
const BusinessSettings = require('../models/BusinessSettings');
const { calculateInvoiceTotals } = require('../utils/invoiceCalculations');
const { generateInvoiceNumber } = require('../utils/invoiceNumber');
const { round2 } = require('../utils/money');

const buildCustomerSnapshot = (body) => ({
  customerId: body.customerId || null,
  name: String(body.customerName || '').trim(),
  phone: String(body.customerPhone || '').trim(),
  email: String(body.customerEmail || '').trim(),
  billingAddress: String(body.customerAddress || '').trim(),
  state: String(body.customerState || '').trim(),
  gstin: String(body.customerGstin || '').trim().toUpperCase(),
});

const createInvoice = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();
    const customer = buildCustomerSnapshot(req.body);

    if (!customer.name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }
    if (!Array.isArray(req.body.items) || req.body.items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    for (const item of req.body.items) {
      if (!item.name || !String(item.name).trim()) {
        return res.status(400).json({ success: false, message: 'Each item must have a name' });
      }
      if (Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Item quantity must be greater than 0' });
      }
    }

    const totals = calculateInvoiceTotals({
      items: req.body.items,
      gstEnabled: req.body.gstEnabled !== false,
      sellerState: settings.state,
      customerState: customer.state,
      amountPaid: req.body.amountPaid || 0,
    });

    const invoiceNumber = await generateInvoiceNumber();

    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceDate: req.body.invoiceDate || new Date(),
      dueDate: req.body.dueDate || null,
      customer,
      items: totals.items,
      gstEnabled: totals.gstEnabled,
      isIntraState: totals.isIntraState,
      sellerState: settings.state || '',
      subtotal: totals.subtotal,
      totalDiscount: totals.totalDiscount,
      taxableAmount: totals.taxableAmount,
      cgstAmount: totals.cgstAmount,
      sgstAmount: totals.sgstAmount,
      igstAmount: totals.igstAmount,
      totalGst: totals.totalGst,
      grandTotal: totals.grandTotal,
      amountPaid: totals.amountPaid,
      balanceDue: totals.balanceDue,
      paymentMode: req.body.paymentMode || 'Cash',
      paymentStatus: totals.paymentStatus,
      notes: req.body.notes || '',
    });

    res.status(201).json({ success: true, data: invoice, message: 'Invoice created' });
  } catch (err) {
    next(err);
  }
};

const getInvoices = async (req, res, next) => {
  try {
    const { search, paymentStatus, fromDate, toDate } = req.query;
    const filter = {};

    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { invoiceNumber: { $regex: q, $options: 'i' } },
        { 'customer.name': { $regex: q, $options: 'i' } },
        { 'customer.phone': { $regex: q, $options: 'i' } },
      ];
    }

    if (paymentStatus && ['Paid', 'Unpaid', 'Partially Paid'].includes(paymentStatus)) {
      filter.paymentStatus = paymentStatus;
    }

    if (fromDate || toDate) {
      filter.invoiceDate = {};
      if (fromDate) filter.invoiceDate.$gte = new Date(fromDate);
      if (toDate) {
        const end = new Date(toDate);
        end.setHours(23, 59, 59, 999);
        filter.invoiceDate.$lte = end;
      }
    }

    const invoices = await Invoice.find(filter).sort({ invoiceDate: -1, createdAt: -1 });
    res.json({ success: true, data: invoices });
  } catch (err) {
    next(err);
  }
};

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, data: invoice });
  } catch (err) {
    next(err);
  }
};

const updateInvoice = async (req, res, next) => {
  try {
    const existing = await Invoice.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    const settings = await BusinessSettings.getSettings();
    const customer = buildCustomerSnapshot({
      customerId: req.body.customerId ?? existing.customer.customerId,
      customerName: req.body.customerName ?? existing.customer.name,
      customerPhone: req.body.customerPhone ?? existing.customer.phone,
      customerEmail: req.body.customerEmail ?? existing.customer.email,
      customerAddress: req.body.customerAddress ?? existing.customer.billingAddress,
      customerState: req.body.customerState ?? existing.customer.state,
      customerGstin: req.body.customerGstin ?? existing.customer.gstin,
    });

    if (!customer.name) {
      return res.status(400).json({ success: false, message: 'Customer name is required' });
    }

    const items = req.body.items || existing.items;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    for (const item of items) {
      if (!item.name || !String(item.name).trim()) {
        return res.status(400).json({ success: false, message: 'Each item must have a name' });
      }
      if (Number(item.quantity) <= 0) {
        return res.status(400).json({ success: false, message: 'Item quantity must be greater than 0' });
      }
    }

    const gstEnabled =
      typeof req.body.gstEnabled === 'boolean' ? req.body.gstEnabled : existing.gstEnabled;

    const totals = calculateInvoiceTotals({
      items,
      gstEnabled,
      sellerState: settings.state || existing.sellerState,
      customerState: customer.state,
      amountPaid:
        req.body.amountPaid !== undefined ? req.body.amountPaid : existing.amountPaid,
    });

    existing.invoiceDate = req.body.invoiceDate || existing.invoiceDate;
    existing.dueDate =
      req.body.dueDate !== undefined ? req.body.dueDate || null : existing.dueDate;
    existing.customer = customer;
    existing.items = totals.items;
    existing.gstEnabled = totals.gstEnabled;
    existing.isIntraState = totals.isIntraState;
    existing.sellerState = settings.state || existing.sellerState;
    existing.subtotal = totals.subtotal;
    existing.totalDiscount = totals.totalDiscount;
    existing.taxableAmount = totals.taxableAmount;
    existing.cgstAmount = totals.cgstAmount;
    existing.sgstAmount = totals.sgstAmount;
    existing.igstAmount = totals.igstAmount;
    existing.totalGst = totals.totalGst;
    existing.grandTotal = totals.grandTotal;
    existing.amountPaid = totals.amountPaid;
    existing.balanceDue = totals.balanceDue;
    existing.paymentMode = req.body.paymentMode || existing.paymentMode;
    existing.paymentStatus = totals.paymentStatus;
    if (req.body.notes !== undefined) existing.notes = req.body.notes;

    await existing.save();
    res.json({ success: true, data: existing, message: 'Invoice updated' });
  } catch (err) {
    next(err);
  }
};

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }
    res.json({ success: true, message: 'Invoice deleted' });
  } catch (err) {
    next(err);
  }
};

const previewTotals = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();
    const totals = calculateInvoiceTotals({
      items: req.body.items || [],
      gstEnabled: req.body.gstEnabled !== false,
      sellerState: settings.state,
      customerState: req.body.customerState || '',
      amountPaid: req.body.amountPaid || 0,
    });
    res.json({
      success: true,
      data: {
        ...totals,
        amountPaid: round2(totals.amountPaid),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  previewTotals,
};
