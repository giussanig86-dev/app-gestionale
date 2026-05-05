const mongoose = require('mongoose');
const { MONGO_URI } = require('./env');

async function connectDB() {
  await mongoose.connect(MONGO_URI);
  console.log(`MongoDB connesso: ${mongoose.connection.host}`);
}

module.exports = connectDB;
