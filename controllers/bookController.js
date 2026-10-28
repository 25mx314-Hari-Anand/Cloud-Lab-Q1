const Book = require('../models/Book');

/**
 * @desc    Get all books with optional search & category filter
 * @route   GET /api/books
 */
exports.getAllBooks = async (req, res, next) => {
  try {
    const { search, category } = req.query;
    const filter = {};

    if (search && search.trim() !== '') {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { author: searchRegex }];
    }

    if (category && category.trim() !== '' && category.toLowerCase() !== 'all') {
      filter.category = category.trim();
    }

    const books = await Book.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single book by ID
 * @route   GET /api/books/:id
 */
exports.getBookById = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book not found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: book,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Add a new book
 * @route   POST /api/books
 */
exports.createBook = async (req, res, next) => {
  try {
    const { title, author, description, category, price, stock, isbn } = req.body;

    // Field presence validation
    if (!title || !author || !category || price === undefined || stock === undefined || !isbn) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: title, author, category, price, stock, and isbn',
      });
    }

    // Number validation
    const numPrice = Number(price);
    const numStock = Number(stock);

    if (isNaN(numPrice) || numPrice < 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a non-negative number',
      });
    }

    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return res.status(400).json({
        success: false,
        message: 'Stock must be a non-negative integer',
      });
    }

    // Check duplicate ISBN
    const existingBook = await Book.findOne({ isbn: isbn.trim() });
    if (existingBook) {
      return res.status(409).json({
        success: false,
        message: `A book with ISBN '${isbn.trim()}' already exists`,
      });
    }

    const newBook = await Book.create({
      title: title.trim(),
      author: author.trim(),
      description: description ? description.trim() : '',
      category: category.trim(),
      price: numPrice,
      stock: numStock,
      isbn: isbn.trim(),
    });

    res.status(201).json({
      success: true,
      message: 'Book added successfully',
      data: newBook,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update an existing book
 * @route   PUT /api/books/:id
 */
exports.updateBook = async (req, res, next) => {
  try {
    const { title, author, description, category, price, stock, isbn } = req.body;

    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book not found with ID: ${req.params.id}`,
      });
    }

    // Validation if numbers are provided
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a non-negative number',
        });
      }
      book.price = numPrice;
    }

    if (stock !== undefined) {
      const numStock = Number(stock);
      if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
        return res.status(400).json({
          success: false,
          message: 'Stock must be a non-negative integer',
        });
      }
      book.stock = numStock;
    }

    // If ISBN is changed, check for conflict with other books
    if (isbn && isbn.trim() !== book.isbn) {
      const duplicate = await Book.findOne({ isbn: isbn.trim(), _id: { $ne: book._id } });
      if (duplicate) {
        return res.status(409).json({
          success: false,
          message: `Another book with ISBN '${isbn.trim()}' already exists`,
        });
      }
      book.isbn = isbn.trim();
    }

    if (title !== undefined) book.title = title.trim();
    if (author !== undefined) book.author = author.trim();
    if (description !== undefined) book.description = description.trim();
    if (category !== undefined) book.category = category.trim();

    const updatedBook = await book.save();

    res.status(200).json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete a book
 * @route   DELETE /api/books/:id
 */
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);

    if (!book) {
      return res.status(404).json({
        success: false,
        message: `Book not found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Book deleted successfully',
      data: book,
    });
  } catch (err) {
    next(err);
  }
};

