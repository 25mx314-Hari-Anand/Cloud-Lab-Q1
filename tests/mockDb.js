const mongoose = require('mongoose');

class MockDatabase {
  constructor() {
    this.books = [];
    this.orders = [];
  }

  reset() {
    this.books = [];
    this.orders = [];
  }

  createBookDoc(data) {
    const doc = {
      _id: data._id || new mongoose.Types.ObjectId(),
      title: data.title,
      author: data.author,
      description: data.description || '',
      category: data.category,
      price: Number(data.price),
      stock: Number(data.stock),
      isbn: data.isbn,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      async save() {
        this.updatedAt = new Date();
        return this;
      },
      toJSON() {
        return { ...this };
      },
    };
    return doc;
  }

  createOrderDoc(data) {
    const doc = {
      _id: data._id || new mongoose.Types.ObjectId(),
      customer: { ...data.customer },
      items: (data.items || []).map((item) => ({ ...item })),
      totalAmount: Number(data.totalAmount),
      status: data.status || 'Pending',
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      async save() {
        this.updatedAt = new Date();
        return this;
      },
      toJSON() {
        return { ...this };
      },
    };
    return doc;
  }
}

const mockDb = new MockDatabase();

function makeQuery(result) {
  const promise = Promise.resolve(result);
  promise.populate = () => makeQuery(result);
  promise.sort = () => makeQuery(result);
  return promise;
}

const MockBookModel = {
  find(filter = {}) {
    let result = [...mockDb.books];
    if (filter.$or) {
      result = result.filter((book) => {
        return filter.$or.some((clause) => {
          if (clause.title && clause.title.test(book.title)) return true;
          if (clause.author && clause.author.test(book.author)) return true;
          return false;
        });
      });
    }
    if (filter.category) {
      result = result.filter(
        (book) => book.category.toLowerCase() === filter.category.toLowerCase()
      );
    }
    return makeQuery(result);
  },

  findById(id) {
    const idStr = id ? id.toString() : '';
    const book = mockDb.books.find((b) => b._id.toString() === idStr) || null;
    return makeQuery(book);
  },

  findOne(filter = {}) {
    let book = null;
    if (filter.isbn) {
      book = mockDb.books.find((b) => {
        const matchesIsbn = b.isbn === filter.isbn;
        if (!matchesIsbn) return false;
        if (filter._id && filter._id.$ne) {
          return b._id.toString() !== filter._id.$ne.toString();
        }
        return true;
      });
    }
    return makeQuery(book || null);
  },

  async create(data) {
    const doc = mockDb.createBookDoc(data);
    mockDb.books.unshift(doc);
    return doc;
  },

  async findByIdAndUpdate(id, update) {
    const idStr = id ? id.toString() : '';
    const book = mockDb.books.find((b) => b._id.toString() === idStr);
    if (!book) return null;

    if (update.$inc) {
      for (const [key, val] of Object.entries(update.$inc)) {
        book[key] = (book[key] || 0) + val;
      }
    }
    if (update.$set) {
      Object.assign(book, update.$set);
    }
    book.updatedAt = new Date();
    return book;
  },

  async findByIdAndDelete(id) {
    const idStr = id ? id.toString() : '';
    const index = mockDb.books.findIndex((b) => b._id.toString() === idStr);
    if (index === -1) return null;
    const [deleted] = mockDb.books.splice(index, 1);
    return deleted;
  },

  async deleteMany() {
    mockDb.books = [];
    return { acknowledged: true, deletedCount: 0 };
  },

  async countDocuments() {
    return mockDb.books.length;
  },
};

const MockOrderModel = {
  find() {
    return makeQuery([...mockDb.orders]);
  },

  findById(id) {
    const idStr = id ? id.toString() : '';
    const order = mockDb.orders.find((o) => o._id.toString() === idStr) || null;
    return makeQuery(order);
  },

  async create(data) {
    const doc = mockDb.createOrderDoc(data);
    mockDb.orders.unshift(doc);
    return doc;
  },

  async deleteMany() {
    mockDb.orders = [];
    return { acknowledged: true, deletedCount: 0 };
  },
};

module.exports = {
  mockDb,
  MockBookModel,
  MockOrderModel,
};

