const mongoose = require('mongoose');

const invoiceItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    hsnSac: { type: String, default: '' },
    unit: { type: String, default: 'Piece' },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    gstRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxableAmount: { type: Number, default: 0 },
    gstAmount: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const customerSnapshotSchema = new mongoose.Schema(
  {
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null },
    name: { type: String, required: true, trim: true },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
    billingAddress: { type: String, default: '' },
    state: { type: String, default: '' },
    gstin: { type: String, default: '' },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    invoiceDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    customer: {
      type: customerSnapshotSchema,
      required: true,
    },
    items: {
      type: [invoiceItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'Invoice must have at least one item',
      },
    },
    gstEnabled: { type: Boolean, default: true },
    isIntraState: { type: Boolean, default: true },
    sellerState: { type: String, default: '' },
    subtotal: { type: Number, default: 0 },
    totalDiscount: { type: Number, default: 0 },
    taxableAmount: { type: Number, default: 0 },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
    totalGst: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },
    amountPaid: { type: Number, default: 0 },
    balanceDue: { type: Number, default: 0 },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'],
      default: 'Cash',
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Unpaid', 'Partially Paid'],
      default: 'Unpaid',
    },
    notes: { type: String, default: '', maxlength: 1000 },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ invoiceDate: -1 });
invoiceSchema.index({ 'customer.name': 1 });
invoiceSchema.index({ paymentStatus: 1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
