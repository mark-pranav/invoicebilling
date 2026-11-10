const mongoose = require('mongoose');
const { GST_RATES } = require('../utils/invoiceCalculations');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: 150,
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    hsnSac: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    pricePerUnit: {
      type: Number,
      required: [true, 'Price per unit is required'],
      min: [0, 'Price cannot be negative'],
    },
    gstRate: {
      type: Number,
      enum: GST_RATES,
      default: 18,
    },
    unit: {
      type: String,
      trim: true,
      default: 'Piece',
      maxlength: 30,
    },
  },
  { timestamps: true }
);

productSchema.index({ name: 'text' });

module.exports = mongoose.model('Product', productSchema);
