import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environmental variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/mht_cet_lms';

async function runCleanup() {
  console.log('=== STARTING DATABASE CLEANUP ===');
  console.log('Connecting to:', mongoUri);
  
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected Successfully.');

    const db = mongoose.connection.db;

    // 1. Delete all Student Users
    const userCol = db.collection('users');
    const studentCount = await userCol.countDocuments({ role: { $regex: /^student$/i } });
    console.log(`Found ${studentCount} STUDENT users to delete.`);
    if (studentCount > 0) {
      const res = await userCol.deleteMany({ role: { $regex: /^student$/i } });
      console.log(`Deleted ${res.deletedCount} student users.`);
    }

    // 2. Delete Student Profiles
    const profileCol = db.collection('studentprofiles');
    const profileCount = await profileCol.countDocuments({});
    console.log(`Found ${profileCount} student profiles to delete.`);
    if (profileCount > 0) {
      const res = await profileCol.deleteMany({});
      console.log(`Deleted ${res.deletedCount} student profiles.`);
    }

    // 3. Delete Test Attempts
    const attemptCol = db.collection('testattempts');
    const attemptCount = await attemptCol.countDocuments({});
    console.log(`Found ${attemptCount} test attempts to delete.`);
    if (attemptCount > 0) {
      const res = await attemptCol.deleteMany({});
      console.log(`Deleted ${res.deletedCount} test attempts.`);
    }

    // 4. Delete Student Answers
    const answersCol = db.collection('studentanswers');
    try {
      const answersCount = await answersCol.countDocuments({});
      console.log(`Found ${answersCount} student answers to delete.`);
      if (answersCount > 0) {
        const res = await answersCol.deleteMany({});
        console.log(`Deleted ${res.deletedCount} student answers.`);
      }
    } catch (e) {
      console.log('studentanswers collection does not exist or empty.');
    }

    // 5. Delete Attempt Analytics
    const analyticsCol = db.collection('attemptanalytics');
    try {
      const analyticsCount = await analyticsCol.countDocuments({});
      console.log(`Found ${analyticsCount} attempt analytics to delete.`);
      if (analyticsCount > 0) {
        const res = await analyticsCol.deleteMany({});
        console.log(`Deleted ${res.deletedCount} attempt analytics.`);
      }
    } catch (e) {
      console.log('attemptanalytics collection does not exist or empty.');
    }

    console.log('\n--- Safeguard Checks ---');
    const remainingUsers = await userCol.countDocuments({});
    const facultyCount = await userCol.countDocuments({ role: { $regex: /^(teacher|faculty)$/i } });
    const adminCount = await userCol.countDocuments({ role: { $regex: /^admin$/i } });
    console.log(`Total remaining users: ${remainingUsers}`);
    console.log(`Active Faculty/Teachers remaining: ${facultyCount}`);
    console.log(`Active Admins remaining: ${adminCount}`);

    const testCol = db.collection('tests');
    const testCount = await testCol.countDocuments({});
    console.log(`Tests collection count (safeguarded): ${testCount}`);

    const questionCol = db.collection('questions');
    const questionCount = await questionCol.countDocuments({});
    console.log(`Questions collection count (safeguarded): ${questionCount}`);

    console.log('\n=== DATABASE CLEANUP COMPLETED ===');
  } catch (error) {
    console.error('Cleanup script encountered an error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed.');
  }
}

runCleanup();
