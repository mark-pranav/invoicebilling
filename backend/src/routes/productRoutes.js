const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');

const router = express.Router();

const productRules = [
  body('name').trim().notEmpty().withMessage('Product name is required'),
  body('pricePerUnit')
    .isFloat({ min: 0 })
    .withMessage('Price must be a non-negative number'),
  body('gstRate')
    .optional()
    .isIn([0, 5, 12, 18, 28])
    .withMessage('Invalid GST rate'),
];

router.get('/', getProducts);
router.get('/:id', getProduct);
router.post('/', productRules, validate, createProduct);
router.put('/:id', productRules, validate, updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
