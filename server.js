require('dotenv').config();
const mongoose = require('mongoose');
const app = require('./app');

const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: MONGODB_URI environment variable is not defined.');
  console.error('Please configure it in your .env file.');
  process.exit(1);
}

// Connect to MongoDB Atlas
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas database');
    app.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` BookStore Server running on port ${PORT}`);
      console.log(` Web App:   http://localhost:${PORT}`);
      console.log(` Health:    http://localhost:${PORT}/api/health`);
      console.log(` Books API: http://localhost:${PORT}/api/books`);
      console.log(` Order API: http://localhost:${PORT}/api/orders`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`===============================================`);
    });
  })
  .catch((err) => {
    console.error('MongoDB Atlas Connection Error:', err.message);
    process.exit(1);
  });

// Handle graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\nReceived ${signal}. Gracefully closing MongoDB connection...`);
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed. Server shutting down.');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

