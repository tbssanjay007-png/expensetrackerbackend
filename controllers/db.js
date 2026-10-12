const mongoose = require("mongoose");

const connectDB = async () => {
  const tryConnect = async (retries = 5, delay = 3000) => {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
      });
      console.log("MongoDB Connected");
    } catch (error) {
      console.error("MongoDB Connection Failed:", error.message);
      if (retries > 0) {
        console.log(
          `Retrying MongoDB connection in ${delay / 1000}s... (${retries} attempts left)`
        );
        setTimeout(() => tryConnect(retries - 1, delay * 1.5), delay);
      } else {
        console.error("MongoDB: Exhausted retry attempts. Server running without DB connection.");
      }
    }
  };

  await tryConnect();
};

module.exports = connectDB;
