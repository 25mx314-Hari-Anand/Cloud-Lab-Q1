const request = require('supertest');
const app = require('../app');
const Book = require('../models/Book');
require('./setup');

describe('Book API Endpoints (/api/books)', () => {
  const sampleBookData = {
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    price: 35.5,
    stock: 10,
    isbn: '978-0134494166',
    description: 'A Craftsman Guide to Software Structure and Design',
  };

  describe('GET /api/books', () => {
    it('should return an empty list when no books exist', async () => {
      const res = await request(app).get('/api/books');
      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
      expect(res.body.count).toBe(0);
    });

    it('should return all books and support search filtering', async () => {
      await Book.create(sampleBookData);
      await Book.create({
        title: 'JavaScript: The Good Parts',
        author: 'Douglas Crockford',
        category: 'Web Development',
        price: 25.0,
        stock: 5,
        isbn: '978-0596517748',
      });

      // Fetch all
      const resAll = await request(app).get('/api/books');
      expect(resAll.statusCode).toBe(200);
      expect(resAll.body.count).toBe(2);

      // Search by title
      const resSearch = await request(app).get('/api/books?search=Architecture');
      expect(resSearch.statusCode).toBe(200);
      expect(resSearch.body.count).toBe(1);
      expect(resSearch.body.data[0].title).toBe('Clean Architecture');

      // Search by author
      const resAuthor = await request(app).get('/api/books?search=Crockford');
      expect(resAuthor.statusCode).toBe(200);
      expect(resAuthor.body.count).toBe(1);
      expect(resAuthor.body.data[0].author).toBe('Douglas Crockford');
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book with valid data', async () => {
      const res = await request(app).post('/api/books').send(sampleBookData);

      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(sampleBookData.title);
      expect(res.body.data.isbn).toBe(sampleBookData.isbn);
      expect(res.body.data.stock).toBe(10);
    });

    it('should fail with 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/books')
        .send({ title: 'Missing Fields' });

      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Please provide all required fields');
    });

    it('should fail with 400 when price or stock is negative', async () => {
      const resNegativePrice = await request(app)
        .post('/api/books')
        .send({ ...sampleBookData, price: -5 });
      expect(resNegativePrice.statusCode).toBe(400);

      const resNegativeStock = await request(app)
        .post('/api/books')
        .send({ ...sampleBookData, stock: -2 });
      expect(resNegativeStock.statusCode).toBe(400);
    });

    it('should fail with 409 when attempting to create a book with duplicate ISBN', async () => {
      await Book.create(sampleBookData);
      const res = await request(app).post('/api/books').send(sampleBookData);

      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('GET /api/books/:id', () => {
    it('should return 400 for an invalid ObjectId format', async () => {
      const res = await request(app).get('/api/books/invalid-id-123');
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid ID format');
    });

    it('should return 404 if the book does not exist', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).get(`/api/books/${fakeId}`);
      expect(res.statusCode).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('should return 200 with the book data if found', async () => {
      const created = await Book.create(sampleBookData);
      const res = await request(app).get(`/api/books/${created._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(sampleBookData.title);
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update book details successfully', async () => {
      const created = await Book.create(sampleBookData);
      const res = await request(app)
        .put(`/api/books/${created._id}`)
        .send({ price: 39.99, stock: 25 });

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.price).toBe(39.99);
      expect(res.body.data.stock).toBe(25);
    });

    it('should return 404 when updating a non-existent book', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .put(`/api/books/${fakeId}`)
        .send({ price: 29.99 });

      expect(res.statusCode).toBe(404);
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete an existing book successfully', async () => {
      const created = await Book.create(sampleBookData);
      const res = await request(app).delete(`/api/books/${created._id}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await Book.findById(created._id);
      expect(check).toBeNull();
    });

    it('should return 404 when deleting a non-existent book', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app).delete(`/api/books/${fakeId}`);
      expect(res.statusCode).toBe(404);
    });
  });
});

