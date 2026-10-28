const { mockDb, MockBookModel, MockOrderModel } = require('./mockDb');

jest.mock('../models/Book', () => MockBookModel);
jest.mock('../models/Order', () => MockOrderModel);

beforeEach(() => {
  mockDb.reset();
});

afterEach(() => {
  mockDb.reset();
});
