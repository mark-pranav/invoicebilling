const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      maxlength: 120,
    },
    billingAddress: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    state: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: 15,
    },
  },
  { timestamps: true }
);

customerSchema.index({ name: 'text', phone: 'text' });
customerSchema.index({ phone: 1 });

module.exports = mongoose.model('Customer', customerSchema);
