const mongoose = require('mongoose');
const config = require('./env');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Drop stale indexes from previous schema versions
    try {
      const usersCollection = conn.connection.collection('users');
      const indexes = await usersCollection.indexes();
      // Drop old email index if it exists
      const emailIndex = indexes.find((idx) => idx.key && idx.key.email === 1);
      if (emailIndex) {
        await usersCollection.dropIndex(emailIndex.name);
        console.log('Dropped stale email index');
      }
      // Drop old nickname index if it exists
      const nicknameIndex = indexes.find((idx) => idx.key && idx.key.nickname === 1);
      if (nicknameIndex) {
        await usersCollection.dropIndex(nicknameIndex.name);
        console.log('Dropped stale nickname index');
      }
    } catch (idxErr) {
      // Ignore if indexes don't exist
    }
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
