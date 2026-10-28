const { mockDb } = require('./mockDb');

beforeEach(() => {
  mockDb.reset();
});

afterEach(() => {
  mockDb.reset();
});
