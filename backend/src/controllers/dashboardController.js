const Invoice = require('../models/Invoice');
const { round2 } = require('../utils/money');

const getSummary = async (req, res, next) => {
  try {
    const [stats] = await Invoice.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalSales: { $sum: '$grandTotal' },
          totalPaid: { $sum: '$amountPaid' },
          totalPending: { $sum: '$balanceDue' },
        },
      },
    ]);

    const recentInvoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .limit(8)
      .select('invoiceNumber invoiceDate customer.name grandTotal paymentStatus balanceDue');

    res.json({
      success: true,
      data: {
        totalInvoices: stats?.totalInvoices || 0,
        totalSales: round2(stats?.totalSales || 0),
        totalPaid: round2(stats?.totalPaid || 0),
        totalPending: round2(stats?.totalPending || 0),
        recentInvoices,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSummary };
