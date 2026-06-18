import mongoose from 'mongoose';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mht_cet_lms';
    const conn = await mongoose.connect(mongoUri);
    console.log(`[DATABASE] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[DATABASE] MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};
