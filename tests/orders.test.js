const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
const Order = require('../models/Order');
require('./setup');

describe('Order API Endpoints (/api/orders)', () => {
  let sampleBook;

  beforeEach(async () => {
    sampleBook = await Book.create({
      title: 'Cloud Computing Architecture',
      author: 'John Doe',
      category: 'Cloud',
      price: 50.0,
      stock: 10,
      isbn: '978-0123456789',
      description: 'Comprehensive guide to cloud infrastructure',
    });
  });

  describe('POST /api/orders', () => {
    it('should successfully place an order and deduct the book stock', async () => {
      const orderData = {
        customer: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          address: '123 Cloud Way, Tech City',
        },
        items: [
          {
            book: sampleBook._id,
            quantity: 3,
          },
        ],
      };

      const res = await request(app).post('/api/orders').send(orderData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.customer.name).toBe('Alice Johnson');
      expect(res.body.data.totalAmount).toBe(150.0);
      expect(res.body.data.status).toBe('Pending');

      // Verify stock was decremented from 10 to 7
      const updatedBook = await Book.findById(sampleBook._id);
      expect(updatedBook.stock).toBe(7);
    });

    it('should accept flat customer payload from simple web form', async () => {
      const flatPayload = {
        customerName: 'Bob Smith',
        customerEmail: 'bob@example.com',
        customerAddress: '456 Developer Blvd',
        bookId: sampleBook._id,
        quantity: 2,
      };

      const res = await request(app).post('/api/orders').send(flatPayload);

      expect(res.statusCode).toBe(201);
      expect(res.body.data.totalAmount).toBe(100.0);
      const updatedBook = await Book.findById(sampleBook._id);
      expect(updatedBook.stock).toBe(8);
    });

    it('should fail with 400 when order quantity exceeds available stock', async () => {
      const orderData = {
        customer: {
          name: 'Greedy Buyer',
          email: 'greedy@example.com',
          address: '999 Market St',
        },
        items: [
          {
            book: sampleBook._id,
            quantity: 15, // Book only has 10
          },
        ],
      };

      const res = await request(app).post('/api/orders').send(orderData);

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient stock');

      // Verify stock remains untouched at 10
      const updatedBook = await Book.findById(sampleBook._id);
      expect(updatedBook.stock).toBe(10);
    });

    it('should fail with 400 for invalid email address', async () => {
      const orderData = {
        customer: {
          name: 'Invalid Email User',
          email: 'not-an-email',
          address: '123 Test St',
        },
        items: [
          {
            book: sampleBook._id,
            quantity: 1,
          },
        ],
      };

      const res = await request(app).post('/api/orders').send(orderData);
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toContain('valid customer email');
    });

    it('should fail with 400 for non-positive or non-integer quantities', async () => {
      const orderData = {
        customer: {
          name: 'Zero Qty User',
          email: 'zero@example.com',
          address: '123 Test St',
        },
        items: [
          {
            book: sampleBook._id,
            quantity: 0,
          },
        ],
      };

      const res = await request(app).post('/api/orders').send(orderData);
      expect(res.statusCode).toBe(400);
    });
  });

  describe('GET /api/orders', () => {
    it('should return all placed orders', async () => {
      await request(app).post('/api/orders').send({
        customerName: 'User One',
        customerEmail: 'u1@example.com',
        customerAddress: 'Addr 1',
        bookId: sampleBook._id,
        quantity: 1,
      });

      const res = await request(app).get('/api/orders');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.count).toBe(1);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should return 404 for non-existent order ID', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/orders/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });

    it('should return order details for valid existing order', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'User Two',
        customerEmail: 'u2@example.com',
        customerAddress: 'Addr 2',
        bookId: sampleBook._id,
        quantity: 2,
      });

      const orderId = createRes.body.data._id;
      const res = await request(app).get(`/api/orders/${orderId}`);
      expect(res.statusCode).toBe(200);
      expect(res.body.data._id).toBe(orderId);
      expect(res.body.data.totalAmount).toBe(100.0);
    });
  });

  describe('PATCH /api/orders/:id/status', () => {
    it('should update order status to Processing and Shipped', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'Status User',
        customerEmail: 'status@example.com',
        customerAddress: 'Road 5',
        bookId: sampleBook._id,
        quantity: 1,
      });
      const orderId = createRes.body.data._id;

      const patchRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'Processing' });

      expect(patchRes.statusCode).toBe(200);
      expect(patchRes.body.data.status).toBe('Processing');
    });

    it('should restore inventory stock when updating status to Cancelled', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'Cancel User',
        customerEmail: 'cancel@example.com',
        customerAddress: 'Road 9',
        bookId: sampleBook._id,
        quantity: 4,
      });
      const orderId = createRes.body.data._id;

      // Stock should currently be 6 (10 - 4)
      let bookCheck = await Book.findById(sampleBook._id);
      expect(bookCheck.stock).toBe(6);

      // Cancel order via status PATCH
      const cancelRes = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'Cancelled' });

      expect(cancelRes.statusCode).toBe(200);
      expect(cancelRes.body.data.status).toBe('Cancelled');

      // Stock must be restored back to 10
      bookCheck = await Book.findById(sampleBook._id);
      expect(bookCheck.stock).toBe(10);
    });

    it('should reject status update to Cancelled if order is already Shipped', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'Shipped User',
        customerEmail: 'shipped@example.com',
        customerAddress: 'Road 10',
        bookId: sampleBook._id,
        quantity: 1,
      });
      const orderId = createRes.body.data._id;

      await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'Shipped' });

      const cancelAttempt = await request(app)
        .patch(`/api/orders/${orderId}/status`)
        .send({ status: 'Cancelled' });

      expect(cancelAttempt.statusCode).toBe(400);
      expect(cancelAttempt.body.message).toContain('Cannot cancel an order that has already been shipped');
    });
  });

  describe('DELETE /api/orders/:id (Order Cancellation)', () => {
    it('should cancel pending order and restore inventory stock', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'Delete User',
        customerEmail: 'delete@example.com',
        customerAddress: 'Road 11',
        bookId: sampleBook._id,
        quantity: 5,
      });
      const orderId = createRes.body.data._id;

      let bookCheck = await Book.findById(sampleBook._id);
      expect(bookCheck.stock).toBe(5);

      const deleteRes = await request(app).delete(`/api/orders/${orderId}`);
      expect(deleteRes.statusCode).toBe(200);
      expect(deleteRes.body.data.status).toBe('Cancelled');

      // Stock restored to 10
      bookCheck = await Book.findById(sampleBook._id);
      expect(bookCheck.stock).toBe(10);
    });

    it('should prevent cancelling an already cancelled order', async () => {
      const createRes = await request(app).post('/api/orders').send({
        customerName: 'Double Cancel',
        customerEmail: 'double@example.com',
        customerAddress: 'Road 12',
        bookId: sampleBook._id,
        quantity: 2,
      });
      const orderId = createRes.body.data._id;

      await request(app).delete(`/api/orders/${orderId}`);
      const secondAttempt = await request(app).delete(`/api/orders/${orderId}`);

      expect(secondAttempt.statusCode).toBe(400);
      expect(secondAttempt.body.message).toContain('already cancelled');
    });
  });
});

