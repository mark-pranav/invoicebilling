const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/invoice_billing';

  try {
    await mongoose.connect(uri);
    console.log(`MongoDB connected: ${mongoose.connection.host}`);
    return;
  } catch (err) {
    console.warn(`Could not connect to ${uri}: ${err.message}`);

    if (process.env.USE_MEMORY_DB === 'false') {
      throw err;
    }

    console.warn('Starting in-memory MongoDB for local development...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri('invoice_billing');
    await mongoose.connect(memoryUri);
    console.log('MongoDB connected: in-memory (data resets when server stops)');
  }
};

module.exports = connectDB;
