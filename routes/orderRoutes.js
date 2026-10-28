const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const validateObjectId = require('../middleware/validateObjectId');

router.route('/')
  .get(orderController.getAllOrders)
  .post(orderController.createOrder);

router.route('/:id')
  .get(validateObjectId('id'), orderController.getOrderById)
  .delete(validateObjectId('id'), orderController.cancelOrder);

router.route('/:id/status')
  .patch(validateObjectId('id'), orderController.updateOrderStatus);

module.exports = router;

