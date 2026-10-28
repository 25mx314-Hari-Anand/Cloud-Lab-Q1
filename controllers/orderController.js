const mongoose = require('mongoose');
const Order = require('../models/Order');
const Book = require('../models/Book');

/**
 * @desc    Get all customer orders
 * @route   GET /api/orders
 */
exports.getAllOrders = async (req, res, next) => {
  try {
    const orders = await Order.find()
      .populate('items.book', 'title author price isbn')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single order by ID
 * @route   GET /api/orders/:id
 */
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      'items.book',
      'title author price isbn'
    );

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with ID: ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Place a customer order
 * @route   POST /api/orders
 */
exports.createOrder = async (req, res, next) => {
  try {
    let { customer, items, customerName, customerEmail, customerAddress, bookId, quantity } = req.body;

    // Support flat payload from simple checkout forms
    if (!customer) {
      customer = {
        name: customerName,
        email: customerEmail,
        address: customerAddress,
      };
    }

    // Support single item payload
    if (!items && bookId) {
      items = [{ book: bookId, quantity: quantity || 1 }];
    }

    // Validate customer details
    if (!customer || !customer.name || !customer.email || !customer.address) {
      return res.status(400).json({
        success: false,
        message: 'Customer name, email, and shipping address are all required',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customer.email.trim())) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid customer email address',
      });
    }

    // Validate items array
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Order must contain at least one book item',
      });
    }

    // Fetch and validate all books and stock levels
    const processedItems = [];
    let totalAmount = 0;

    for (const item of items) {
      const bId = item.book || item.bookId;
      const qty = Number(item.quantity);

      if (!bId || !mongoose.Types.ObjectId.isValid(bId)) {
        return res.status(400).json({
          success: false,
          message: `Invalid book ID specified: '${bId}'`,
        });
      }

      if (!qty || isNaN(qty) || qty <= 0 || !Number.isInteger(qty)) {
        return res.status(400).json({
          success: false,
          message: 'Quantity must be a positive integer greater than 0',
        });
      }

      const book = await Book.findById(bId);
      if (!book) {
        return res.status(404).json({
          success: false,
          message: `Book with ID '${bId}' not found`,
        });
      }

      // Check available stock
      if (book.stock < qty) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${book.title}". Available: ${book.stock}, Requested: ${qty}`,
        });
      }

      const itemTotal = Number((book.price * qty).toFixed(2));
      totalAmount += itemTotal;

      processedItems.push({
        book: book._id,
        title: book.title,
        quantity: qty,
        unitPrice: book.price,
      });
    }

    totalAmount = Number(totalAmount.toFixed(2));

    // Deduct stock for all items
    for (const item of processedItems) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: -item.quantity },
      });
    }

    // Create the order
    const order = await Order.create({
      customer: {
        name: customer.name.trim(),
        email: customer.email.trim().toLowerCase(),
        address: customer.address.trim(),
      },
      items: processedItems,
      totalAmount,
      status: 'Pending',
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update order status
 * @route   PATCH /api/orders/:id/status
 */
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status '${status}'. Allowed statuses: ${allowedStatuses.join(', ')}`,
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with ID: ${req.params.id}`,
      });
    }

    const oldStatus = order.status;

    if (oldStatus === status) {
      return res.status(200).json({
        success: true,
        message: `Order status is already '${status}'`,
        data: order,
      });
    }

    // Business rule: Cannot cancel shipped or delivered orders
    if (status === 'Cancelled' && (oldStatus === 'Shipped' || oldStatus === 'Delivered')) {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that has already been ${oldStatus.toLowerCase()}`,
      });
    }

    // If cancelling, restore inventory stock
    if (status === 'Cancelled' && oldStatus !== 'Cancelled') {
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, {
          $inc: { stock: item.quantity },
        });
      }
    }

    // If reactivating a cancelled order, check and deduct stock
    if (oldStatus === 'Cancelled' && status !== 'Cancelled') {
      for (const item of order.items) {
        const book = await Book.findById(item.book);
        if (!book || book.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot reactivate order: insufficient stock for "${item.title}"`,
          });
        }
      }
      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.book, {
          $inc: { stock: -item.quantity },
        });
      }
    }

    order.status = status;
    const updatedOrder = await order.save();

    res.status(200).json({
      success: true,
      message: `Order status updated to '${status}' successfully`,
      data: updatedOrder,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Cancel an order (Business rule: Only Pending or Processing can be cancelled; restores stock)
 * @route   DELETE /api/orders/:id
 */
exports.cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order not found with ID: ${req.params.id}`,
      });
    }

    // Business rule checks
    if (order.status === 'Cancelled') {
      return res.status(400).json({
        success: false,
        message: 'Order is already cancelled',
      });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered') {
      return res.status(400).json({
        success: false,
        message: `Cannot cancel an order that has already been ${order.status.toLowerCase()}`,
      });
    }

    // Restore stock
    for (const item of order.items) {
      await Book.findByIdAndUpdate(item.book, {
        $inc: { stock: item.quantity },
      });
    }

    // Update order status to Cancelled to preserve order record history
    order.status = 'Cancelled';
    const cancelledOrder = await order.save();

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully and inventory stock restored',
      data: cancelledOrder,
    });
  } catch (err) {
    next(err);
  }
};

