const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('[DB] MONGODB_URI is not set');
    process.exit(1);
  }

  const options = {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    maxPoolSize: 10,
  };

  let retries = 5;
  while (retries) {
    try {
      const conn = await mongoose.connect(uri, options);
      console.log(`[DB] MongoDB connected: ${conn.connection.host}`);
      return;
    } catch (error) {
      retries -= 1;
      console.error(`[DB] Connection failed (${retries} retries left): ${error.message}`);
      if (!retries) process.exit(1);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
};

module.exports = connectDB;
