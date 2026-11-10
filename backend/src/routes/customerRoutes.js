const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getCustomers,
  getCustomer,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require('../controllers/customerController');

const router = express.Router();

const customerRules = [
  body('name').trim().notEmpty().withMessage('Customer name is required'),
  body('phone').trim().notEmpty().withMessage('Phone number is required'),
  body('email').optional({ checkFalsy: true }).isEmail().withMessage('Invalid email'),
  body('gstin')
    .optional({ checkFalsy: true })
    .isLength({ min: 15, max: 15 })
    .withMessage('GSTIN must be 15 characters'),
];

router.get('/', getCustomers);
router.get('/:id', getCustomer);
router.post('/', customerRules, validate, createCustomer);
router.put('/:id', customerRules, validate, updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
