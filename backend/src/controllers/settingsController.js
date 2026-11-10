const BusinessSettings = require('../models/BusinessSettings');

const getSettings = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();
    res.json({ success: true, data: settings });
  } catch (err) {
    next(err);
  }
};

const updateSettings = async (req, res, next) => {
  try {
    const settings = await BusinessSettings.getSettings();
    const allowed = [
      'businessName',
      'ownerName',
      'address',
      'phone',
      'email',
      'gstin',
      'state',
      'logo',
      'termsAndConditions',
      'invoicePrefix',
    ];

    allowed.forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        settings[key] = req.body[key];
      }
    });

    await settings.save();
    res.json({ success: true, data: settings, message: 'Settings updated' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings };
