const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const validateObjectId = require('../middleware/validateObjectId');

router.route('/')
  .get(bookController.getAllBooks)
  .post(bookController.createBook);

router.route('/:id')
  .get(validateObjectId('id'), bookController.getBookById)
  .put(validateObjectId('id'), bookController.updateBook)
  .delete(validateObjectId('id'), bookController.deleteBook);

module.exports = router;

