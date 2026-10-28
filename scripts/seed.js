require('dotenv').config();
const mongoose = require('mongoose');
const Book = require('../models/Book');

const sampleBooks = [
  {
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    price: 34.99,
    stock: 15,
    isbn: '978-0132350884',
    description:
      'Even bad code can function. But if code is not clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code.',
  },
  {
    title: 'The Pragmatic Programmer: Your Journey To Mastery',
    author: 'David Thomas, Andrew Hunt',
    category: 'Software Engineering',
    price: 42.5,
    stock: 12,
    isbn: '978-0135957059',
    description:
      'The Pragmatic Programmer illustrates the best approaches and major pitfalls of many different aspects of software development. Whether you are a new coder or an experienced programmer, you will learn something new.',
  },
  {
    title: 'Designing Data-Intensive Applications',
    author: 'Martin Kleppmann',
    category: 'Database & Cloud',
    price: 49.99,
    stock: 8,
    isbn: '978-1449373320',
    description:
      'The definitive guide to the architecture, storage, and processing of distributed systems. Explores the fundamental principles behind reliable, scalable, and maintainable data systems.',
  },
  {
    title: 'JavaScript: The Definitive Guide',
    author: 'David Flanagan',
    category: 'Web Development',
    price: 39.99,
    stock: 20,
    isbn: '978-1491952023',
    description:
      'Master the world most widely used programming language across both modern browser engines and server-side Node.js environments with in-depth coverage of ECMAScript standards.',
  },
  {
    title: 'Cloud Native Patterns: Designing Scalable Software',
    author: 'Cornelia Davis',
    category: 'Database & Cloud',
    price: 44.95,
    stock: 10,
    isbn: '978-1617294297',
    description:
      'A comprehensive guide to building resilient cloud applications that can survive hardware failures, dynamic auto-scaling, and microservice communication bottlenecks.',
  },
  {
    title: 'Node.js Design Patterns',
    author: 'Mario Casciaro, Luciano Mammino',
    category: 'Web Development',
    price: 38.5,
    stock: 14,
    isbn: '978-1839214110',
    description:
      'Design and implement production-grade, highly scalable asynchronous applications and REST APIs using cutting-edge Node.js and Express patterns.',
  },
  {
    title: 'Artificial Intelligence: A Modern Approach',
    author: 'Stuart Russell, Peter Norvig',
    category: 'Artificial Intelligence',
    price: 59.99,
    stock: 6,
    isbn: '978-0134610993',
    description:
      'The leading textbook in artificial intelligence, covering search algorithms, probabilistic reasoning, machine learning, deep neural networks, and computer vision.',
  },
  {
    title: 'Site Reliability Engineering: How Google Runs Production Systems',
    author: 'Betsy Beyer, Chris Jones, Jennifer Petoff',
    category: 'DevOps & Cloud',
    price: 36.0,
    stock: 16,
    isbn: '978-1491929124',
    description:
      'Key insights and practical guidance from Google engineers on managing complexity, incident response, monitoring, and keeping large software systems running with high availability.',
  },
];

async function seedDatabase() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('ERROR: MONGODB_URI is not set in your .env file.');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas database...');
    await mongoose.connect(uri);
    console.log('Connected successfully. Seeding sample books...\n');

    let insertedCount = 0;
    let updatedCount = 0;

    for (const bookData of sampleBooks) {
      const existing = await Book.findOne({ isbn: bookData.isbn });
      if (existing) {
        await Book.updateOne({ isbn: bookData.isbn }, { $set: bookData });
        updatedCount++;
        console.log(`[UPDATED] "${bookData.title}" (ISBN: ${bookData.isbn})`);
      } else {
        await Book.create(bookData);
        insertedCount++;
        console.log(`[INSERTED] "${bookData.title}" (ISBN: ${bookData.isbn})`);
      }
    }

    console.log('\n===============================================');
    console.log(`Database Seed Summary:`);
    console.log(`  - Newly inserted: ${insertedCount}`);
    console.log(`  - Updated/refreshed: ${updatedCount}`);
    console.log(`  - Total books in catalogue: ${await Book.countDocuments()}`);
    console.log('===============================================\n');

    await mongoose.connection.close();
    console.log('MongoDB connection closed cleanly.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding database:', err.message);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    process.exit(1);
  }
}

seedDatabase();

