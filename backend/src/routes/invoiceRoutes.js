const express = require('express');
const {
  createInvoice,
  getInvoices,
  getInvoice,
  updateInvoice,
  deleteInvoice,
  previewTotals,
} = require('../controllers/invoiceController');

const router = express.Router();

router.get('/', getInvoices);
router.get('/:id', getInvoice);
router.post('/preview', previewTotals);
router.post('/', createInvoice);
router.put('/:id', updateInvoice);
router.delete('/:id', deleteInvoice);

module.exports = router;
