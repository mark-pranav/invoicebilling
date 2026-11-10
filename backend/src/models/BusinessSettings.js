const mongoose = require('mongoose');

const businessSettingsSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      trim: true,
      default: 'My Shop',
      maxlength: 150,
    },
    ownerName: {
      type: String,
      trim: true,
      default: '',
      maxlength: 120,
    },
    address: {
      type: String,
      trim: true,
      default: '',
      maxlength: 500,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
      maxlength: 20,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
      maxlength: 120,
    },
    gstin: {
      type: String,
      trim: true,
      uppercase: true,
      default: '',
      maxlength: 15,
    },
    state: {
      type: String,
      trim: true,
      default: '',
      maxlength: 80,
    },
    logo: {
      type: String,
      default: '', // base64 data URL or empty
    },
    termsAndConditions: {
      type: String,
      trim: true,
      default: 'Thank you for your business.',
      maxlength: 1000,
    },
    invoicePrefix: {
      type: String,
      trim: true,
      default: 'INV',
      maxlength: 10,
    },
    nextInvoiceNumber: {
      type: Number,
      default: 1,
      min: 1,
    },
  },
  { timestamps: true }
);

businessSettingsSchema.statics.getSettings = async function getSettings() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('BusinessSettings', businessSettingsSchema);
