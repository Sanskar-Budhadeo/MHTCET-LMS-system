import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';
import { Question, TestAttempt, User, Note, MockTest, AIUsageLog, SystemAlert, CalendarEvent } from './models.js';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import analyticsRouter from './routes/analytics.js';

// Resolve directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environmental variables using absolute path
dotenv.config({ path: path.resolve(__dirname, '.env') });

// Validation Logs
console.log(`[CONFIG] MONGODB_URI: ${process.env.MONGODB_URI ? 'detected' : 'missing'}`);
console.log(`[CONFIG] GEMINI_API_KEY: ${process.env.GEMINI_API_KEY ? 'detected' : 'missing'}`);

// Connect to MongoDB & Seed Users
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('MongoDB connected successfully');
    // Seed initial mock users if none exist or if specific users are missing
    try {
      const rahul = await User.findOne({ email: 'rahul@cet.com' });
      const parent = await User.findOne({ email: 'parent.rahul@cet.com' });
      if (!rahul || !parent || !parent.linkedStudents || parent.linkedStudents.length === 0) {
        console.log('[DATABASE] Seeding initial mock users including student/parent link...');
        // Clear old minimal seed users to avoid email conflicts
        await User.deleteMany({ email: { $in: ['admin@demo.com', 'student@demo.com', 'rahul@cet.com', 'parent.rahul@cet.com', 'sharma.sir@cet.com'] } });

        const hashedPassword = await bcrypt.hash('password123', 10);
        
        // 1. Create student
        const student = await User.create({
          name: 'Rahul Sharma',
          email: 'rahul@cet.com',
          password: hashedPassword,
          role: 'student',
          targetCourse: 'PCMB',
          targetExam: 'MHT-CET',
          plan: 'Pro',
          invoiceId: 'INV-SEED-RAHUL',
          invoiceUrl: '/public/invoices/mock.pdf',
          paymentStatus: 'Paid',
          streak: 12,
          streaks: 12,
          hoursStudied: 15,
          completedTasks: 8,
          dailyGoalProgress: 60,
          weakTopics: ['Rotational Dynamics', 'Chemical Kinetics', 'Vectors', 'Photosynthesis'],
          strongTopics: ['Oscillations', 'Solid State', 'Trigonometric Functions', 'Respiration and Energy Transfer'],
          loginDates: [
            '2026-06-18', '2026-06-17', '2026-06-16', '2026-06-15', '2026-06-14',
            '2026-06-13', '2026-06-12', '2026-06-11', '2026-06-10', '2026-06-09',
            '2026-06-08', '2026-06-07', '2026-06-05', '2026-06-04', '2026-06-03',
            '2026-06-01', '2026-05-30', '2026-05-29', '2026-05-28'
          ],
          tasks: [
            { text: 'Revise solid state notes', completed: true },
            { text: 'Solve 10 Integration MCQs', completed: true },
            { text: 'Read Biology Inheritance chapter', completed: false }
          ]
        });

        // 2. Create parent and link to student
        const parent = await User.create({
          name: 'Mr. Arvind Sharma',
          email: 'parent.rahul@cet.com',
          password: hashedPassword,
          role: 'parent',
          linkedStudents: [student._id]
        });

        // Update student with parent ID
        student.parentId = parent._id;
        await student.save();

        // 3. Create admin
        await User.create({
          name: 'Prof. Sharma (Admin)',
          email: 'sharma.sir@cet.com',
          password: hashedPassword,
          role: 'admin'
        });

        // 4. Create standard demo user
        await User.create({
          name: 'Student User',
          email: 'student@demo.com',
          password: hashedPassword,
          role: 'student',
          streak: 0,
          weakTopics: [],
          strongTopics: [],
          loginDates: []
        });

        // 5. Create questions if not existing
        let qCount = await Question.countDocuments();
        if (qCount === 0) {
          console.log('[DATABASE] Seeding initial mock questions...');
          await Question.create([
            {
              subject: 'Physics',
              chapter: 'Rotational Dynamics',
              difficulty: 'Medium',
              question_text: 'A thin uniform circular ring of mass M and radius R is rotating about its geometric axis with a constant angular velocity omega...',
              options: { A: 'M * omega / (M + 2m)', B: '(M + 2m) * omega / M', C: 'M * omega / (M + m)', D: '(M - 2m) * omega / (M + 2m)' },
              correct_option: 'A',
              explanation: 'By the law of conservation of angular momentum: I1 * omega1 = I2 * omega2.',
              generated_by: 'ai'
            },
            {
              subject: 'Physics',
              chapter: 'Rotational Dynamics',
              difficulty: 'Hard',
              question_text: 'A solid sphere rolls down an inclined plane of inclination theta without slipping...',
              options: { A: 'g * sin(theta)', B: '(5/7) * g * sin(theta)', C: '(2/3) * g * sin(theta)', D: '(2/7) * g * sin(theta)' },
              correct_option: 'B',
              explanation: 'Acceleration a = g * sin(theta) / (1 + k^2/R^2).',
              generated_by: 'ai'
            },
            {
              subject: 'Mathematics',
              chapter: 'Vectors',
              difficulty: 'Medium',
              question_text: 'Find the area of the parallelogram whose diagonals are represented by the vectors d1 = 3i + j - 2k and d2 = i - 3j + 4k.',
              options: { A: '5 * sqrt(3) sq. units', B: 'sqrt(300) sq. units', C: '5 * sqrt(2) sq. units', D: '5 * sqrt(3) / 2 sq. units' },
              correct_option: 'A',
              explanation: 'The area of a parallelogram given its diagonals is (1/2) * |d1 x d2|.',
              generated_by: 'ai'
            }
          ]);
        }

        const questionDocs = await Question.find();
        const responses = [];
        if (questionDocs.length > 0) {
          responses.push({
            questionId: questionDocs[0]._id,
            selectedOption: 'A',
            isCorrect: true,
            timeSpent: 250,
            chapter: questionDocs[0].chapter,
            subject: questionDocs[0].subject
          });
        }
        if (questionDocs.length > 1) {
          responses.push({
            questionId: questionDocs[1]._id,
            selectedOption: 'A',
            isCorrect: false,
            timeSpent: 350,
            chapter: questionDocs[1].chapter,
            subject: questionDocs[1].subject
          });
        }
        if (questionDocs.length > 2) {
          responses.push({
            questionId: questionDocs[2]._id,
            selectedOption: 'A',
            isCorrect: true,
            timeSpent: 400,
            chapter: questionDocs[2].chapter,
            subject: questionDocs[2].subject
          });
        }

        const attempt1 = await TestAttempt.create({
          student_id: student._id.toString(),
          test_name: 'MHT-CET PCMB Full Syllabus Test 1',
          examType: 'MHT-CET',
          score: 11,
          max_score: 17,
          time_spent_seconds: 3600,
          accuracy: 64,
          percentile: 82.5,
          nationalRank: 1245,
          responses: responses,
          ai_analysis: {
            weak_topics: ['Rotational Dynamics Friction', 'Vectors Cross Product'],
            time_management_rating: 'Average (approx 210 seconds per math question)',
            student_feedback: 'Rahul, you demonstrated good calculus precision. Focus on practicing cross products and sphere inertia acceleration formulas.',
            parent_feedback: 'Rahul\'s math accuracy is high, but rotational dynamics remains a weakness. Daily study plans are targeting this.'
          },
          feedback: {
            instructorName: 'Prof. Sharma',
            text: 'Good performance overall, Rahul. Your math calculus questions are sharp, but vectors and rotational dynamics formulas need direct practice.',
            date: '2026-06-13',
            aiSuggestions: [
              'Time spent on vectors was high but ended in an error.',
              'Rotational dynamics: Re-verify formulas.'
            ]
          }
        });

        student.testProgress.push(attempt1._id);
        await student.save();

        // 6. Seed mock tests
        let testCount = await MockTest.countDocuments();
        if (testCount === 0) {
          console.log('[DATABASE] Seeding initial mock tests...');
          const seededQuestions = await Question.find();
          const qIds = seededQuestions.map(q => q._id);
          
          await MockTest.create({
            name: 'MHT-CET PCMB Full Syllabus Test 1',
            duration: 180,
            subjects: ['Physics', 'Mathematics'],
            questions: qIds
          });
          
          await MockTest.create({
            name: 'Physics Special Rotational Dynamics Mock',
            duration: 90,
            subjects: ['Physics'],
            questions: qIds.filter((_, idx) => idx < 2)
          });
          console.log('[DATABASE] Mock tests seeded successfully.');
        }

        console.log('[DATABASE] Seeding complete.');
      }
    } catch (err) {
      console.error('[DATABASE] Seeding error:', err);
    }
  })
  .catch((err) => {
    console.error('MongoDB connection error stack:', err.stack || err);
  });

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(analyticsRouter);
app.use('/public', express.static(path.join(__dirname, 'public')));

// PDF Invoice Helper
const generateInvoicePDF = (user, invoiceId, amount, plan) => {
  return new Promise((resolve, reject) => {
    try {
      const invoiceDir = path.join(__dirname, 'public', 'invoices');
      if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, { recursive: true });
      }
      
      const fileName = `invoice_${invoiceId}.pdf`;
      const filePath = path.join(invoiceDir, fileName);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(filePath);
      
      doc.pipe(stream);
      
      // Invoice Header
      doc.fillColor('#0284c7').fontSize(24).text('MHT-CET ACE LMS', { align: 'left' });
      doc.fillColor('#475569').fontSize(10).text('Premium Prep Platform for JEE, NEET, and MHT-CET', { align: 'left' });
      doc.moveDown(1);
      
      // Horizontal Line
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);
      
      // Billing Details
      doc.fillColor('#1e293b').fontSize(14).text('INVOICE / RECEIPT', { underline: true });
      doc.fontSize(10).fillColor('#334155');
      doc.text(`Invoice ID: ${invoiceId}`);
      doc.text(`Date: ${new Date().toLocaleDateString()}`);
      doc.text(`Payment Status: PAID (via Simulated Sandbox Gateway)`);
      doc.moveDown(1);
      
      doc.fillColor('#1e293b').fontSize(12).text('Billed To:');
      doc.fontSize(10).fillColor('#475569');
      doc.text(`Student Name: ${user.name}`);
      doc.text(`Email Address: ${user.email}`);
      doc.moveDown(1.5);
      
      // Invoice Items Table
      doc.fillColor('#1e293b').fontSize(12).text('Subscription Summary:');
      doc.moveDown(0.5);
      
      // Table Header Background
      const tableTop = doc.y;
      doc.rect(50, tableTop, 500, 20).fill('#f1f5f9');
      doc.fillColor('#1e293b').fontSize(10);
      doc.text('Description', 60, tableTop + 5);
      doc.text('Target', 280, tableTop + 5);
      doc.text('Plan', 380, tableTop + 5);
      doc.text('Amount', 480, tableTop + 5);
      doc.moveDown(1);
      
      // Table Content
      const contentTop = doc.y + 10;
      doc.text('LMS Premium Series Access', 60, contentTop);
      doc.text(`${user.targetExam || 'MHT-CET'} (${user.targetCourse || 'PCMB'})`, 280, contentTop);
      doc.text(plan, 380, contentTop);
      doc.text(`INR ${amount}`, 480, contentTop);
      doc.moveDown(2);
      
      doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(1.5);
      
      // Total
      doc.fillColor('#1e293b').fontSize(12).text(`Total Paid: INR ${amount}`, { align: 'right' });
      doc.moveDown(2);
      
      doc.fillColor('#64748b').fontSize(9).text('For support questions regarding this billing statement, please reach out to billing@cetace.com.', { align: 'center' });
      
      doc.end();
      
      stream.on('finish', () => {
        resolve(`/public/invoices/${fileName}`);
      });
      stream.on('error', (err) => {
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
};

// General Auth Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mht_cet_lms_secret_2026_key');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to authenticate Admin role
const adminMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mht_cet_lms_secret_2026_key');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Admin role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to authenticate Teacher role
const teacherMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token is missing.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'mht_cet_lms_secret_2026_key');
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ error: 'Access forbidden: Teacher role required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
};

// Middleware to automatically log AI actions
const logAiUsage = (actionType) => {
  return async (req, res, next) => {
    try {
      if (req.user && req.user.id) {
        await AIUsageLog.create({
          userId: req.user.id,
          actionType
        });
      }
    } catch (err) {
      console.error('[AI USAGE AUTO-LOG ERROR]', err);
    }
    next();
  };
};

// Health Check API Endpoint
app.get('/api/health-check', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  const isAiConfigured = !isDemoMode;
  res.json({
    success: isDbConnected && isAiConfigured,
    database: isDbConnected ? 'connected' : 'disconnected',
    ai: isAiConfigured ? 'configured' : 'missing'
  });
});

// Get Admin Dashboard Stats
app.get('/api/admin/stats', adminMiddleware, async (req, res, next) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    
    // Count daily active students (who logged in today)
    const todayStr = new Date().toISOString().split('T')[0];
    const dailyActiveStudents = await User.countDocuments({
      role: 'student',
      loginDates: todayStr
    });
    
    const dailyActivePercentage = totalStudents > 0 
      ? `${Math.round((dailyActiveStudents / totalStudents) * 100)}%` 
      : '0%';

    const totalQuestions = await Question.countDocuments();
    
    const pendingReviews = await TestAttempt.countDocuments({
      $or: [
        { 'feedback.instructorName': 'AI Engine' },
        { 'feedback.instructorName': '' },
        { feedback: { $exists: false } }
      ]
    });

    res.json({
      totalStudents,
      dailyActivePercentage,
      totalQuestions,
      pendingReviews
    });
  } catch (err) {
    next(err);
  }
});

// Get Pending attempts for review
app.get('/api/admin/pending-attempts', adminMiddleware, async (req, res, next) => {
  try {
    const list = await TestAttempt.find({
      $or: [
        { 'feedback.instructorName': 'AI Engine' },
        { 'feedback.instructorName': '' },
        { feedback: { $exists: false } }
      ]
    }).sort({ createdAt: -1 });

    const formatted = list.map(att => ({
      id: att._id,
      studentName: 'Student User', // fallback student name
      testName: att.test_name,
      date: att.createdAt.toISOString().split('T')[0],
      score: att.score,
      maxScore: att.max_score,
      accuracy: att.accuracy
    }));

    res.json(formatted);
  } catch (err) {
    next(err);
  }
});

// Get Student Dashboard Stats
app.get('/api/user/dashboard-stats', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        // Handle virtual/mock user logins
        user = await User.findOne({ email: req.user.email });
      }
    }
    
    if (!user) {
      return res.json({
        streaks: 0,
        hoursStudied: 0,
        completedTasks: 0,
        dailyGoalProgress: 0,
        avgAccuracy: 0,
        totalTests: 0,
        weakTopicsCount: 0,
        tasks: [],
        savedNotesCount: 0
      });
    }

    // Query attempts to calculate avg accuracy and total tests
    let attempts = [];
    if (mongoose.connection.readyState === 1) {
      attempts = await TestAttempt.find({ student_id: user._id.toString() });
    }

    const totalTests = attempts.length;
    const avgAccuracy = totalTests > 0 
      ? Math.round(attempts.reduce((sum, att) => sum + att.accuracy, 0) / totalTests) 
      : 0;

    res.json({
      streaks: user.streaks || 0,
      hoursStudied: user.hoursStudied || 0,
      completedTasks: user.completedTasks || 0,
      dailyGoalProgress: user.dailyGoalProgress || 0,
      avgAccuracy,
      totalTests,
      weakTopicsCount: user.weakTopics ? user.weakTopics.length : 0,
      tasks: user.tasks || [],
      savedNotesCount: user.savedNotes ? user.savedNotes.length : 0
    });
  } catch (err) {
    next(err);
  }
});

// Add a task to checklist
app.post('/api/user/tasks', authMiddleware, async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: 'Task text is required.' });

    const userId = req.user.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.tasks.push({ text, completed: false });

    // Recalculate progress
    const total = user.tasks.length;
    const completed = user.tasks.filter(t => t.completed).length;
    user.completedTasks = completed;
    user.dailyGoalProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await user.save();
    res.status(201).json(user.tasks);
  } catch (err) {
    next(err);
  }
});

// Toggle task completed status
app.put('/api/user/tasks/:taskId', authMiddleware, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    const task = user.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found.' });

    task.completed = !task.completed;

    // Recalculate progress
    const total = user.tasks.length;
    const completed = user.tasks.filter(t => t.completed).length;
    user.completedTasks = completed;
    user.dailyGoalProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await user.save();
    res.json(user.tasks);
  } catch (err) {
    next(err);
  }
});

// Delete individual task
app.delete('/api/user/tasks/:taskId', authMiddleware, async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.tasks = user.tasks.filter(t => t._id.toString() !== taskId);

    const total = user.tasks.length;
    const completed = user.tasks.filter(t => t.completed).length;
    user.completedTasks = completed;
    user.dailyGoalProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    await user.save();
    res.json(user.tasks);
  } catch (err) {
    next(err);
  }
});

// Clear all tasks
app.delete('/api/user/tasks', authMiddleware, async (req, res, next) => {
  try {
    const userId = req.user.id;
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: req.user.email });
      }
    }

    if (!user) return res.status(404).json({ error: 'User not found.' });

    user.tasks = [];
    user.completedTasks = 0;
    user.dailyGoalProgress = 0;

    await user.save();
    res.json(user.tasks);
  } catch (err) {
    next(err);
  }
});

// Authentication: Register
app.post('/api/auth/register', async (req, res, next) => {
  const { name, email, password, role, targetCourse, targetExam, plan } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide name, email, password, and role.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let newUser = null;
    let prn = undefined;
    let status = 'active';

    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists with this email.' });
        }

        if (role === 'student') {
          let isUnique = false;
          while (!isUnique) {
            prn = 'MHT2026' + Math.floor(10000 + Math.random() * 90000);
            const existingPrnUser = await User.findOne({ prn });
            if (!existingPrnUser) {
              isUnique = true;
            }
          }
        }

        if (role === 'teacher') {
          status = 'pending';
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        let invoiceId = undefined;
        let invoiceUrl = undefined;
        let paymentStatus = undefined;
        
        if (role === 'student') {
          if (plan === 'Pro' || plan === 'Premium') {
            invoiceId = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
            paymentStatus = 'Paid';
            const amount = plan === 'Pro' ? 1499 : 2999;
            const tempUser = { name, email: normalizedEmail, targetCourse, targetExam };
            invoiceUrl = await generateInvoicePDF(tempUser, invoiceId, amount, plan);
          } else {
            paymentStatus = 'Pending';
          }
        }

        newUser = await User.create({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role,
          targetCourse: role === 'student' ? targetCourse : undefined,
          targetExam: role === 'student' ? targetExam : undefined,
          plan: role === 'student' ? (plan || 'Free') : undefined,
          invoiceId,
          invoiceUrl,
          paymentStatus,
          prn,
          status
        });
      } catch (dbErr) {
        console.warn('[DATABASE WARNING] Auth registration query failed. Falling back to virtual user.', dbErr.message);
      }
    }

    // Fallback to virtual registration if database is offline/errored
    if (!newUser) {
      console.log(`[AUTH] Registering virtual user: ${normalizedEmail} (${role})`);
      const isPaid = plan === 'Pro' || plan === 'Premium';
      const fallbackPrn = role === 'student' ? ('MHT2026' + Math.floor(10000 + Math.random() * 90000)) : undefined;
      newUser = {
        _id: 'u_' + Math.random().toString(36).substring(2, 9),
        name,
        email: normalizedEmail,
        role,
        targetCourse: role === 'student' ? targetCourse : undefined,
        targetExam: role === 'student' ? targetExam : undefined,
        plan: role === 'student' ? (plan || 'Free') : undefined,
        invoiceId: isPaid ? `INV-VIRTUAL-${Date.now()}` : undefined,
        invoiceUrl: isPaid ? `/public/invoices/virtual_mock.pdf` : undefined,
        paymentStatus: isPaid ? 'Paid' : 'Pending',
        prn: fallbackPrn,
        status: role === 'teacher' ? 'pending' : 'active'
      };
    }

    const token = jwt.sign(
      { id: newUser._id, email: newUser.email, role: newUser.role },
      process.env.JWT_SECRET || 'mht_cet_lms_secret_2026_key',
      { expiresIn: '7d' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        targetCourse: newUser.targetCourse,
        targetExam: newUser.targetExam,
        plan: newUser.plan,
        invoiceUrl: newUser.invoiceUrl,
        invoiceId: newUser.invoiceId,
        prn: newUser.prn,
        status: newUser.status
      }
    });
  } catch (err) {
    next(err);
  }
});

// Authentication: Login
app.post('/api/auth/login', async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Please provide email and password.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Define static fallback users for demo/testing when DB is offline
  const mockUsersData = [
    { id: 'u_student', name: 'Rahul Sharma', email: 'rahul@cet.com', role: 'student', targetCourse: 'PCMB', targetExam: 'MHT-CET', plan: 'Pro', invoiceId: 'INV-DEMO-RAHUL', invoiceUrl: '/public/invoices/mock.pdf' },
    { id: 'u_parent', name: 'Mr. Arvind Sharma', email: 'parent.rahul@cet.com', role: 'parent', linkedStudentId: 'u_student' },
    { id: 'u_teacher', name: 'Prof. Patil', email: 'teacher@demo.com', role: 'teacher', status: 'active' },
    { id: 'u_executive', name: 'CEO Mehta', email: 'executive@demo.com', role: 'executive', status: 'active' },
    { id: 'u_admin', name: 'Prof. Sharma (Admin)', email: 'sharma.sir@cet.com', role: 'admin' }
  ];

  try {
    let user = null;
    let isMatch = false;

    // Only query DB if MongoDB is active
    if (mongoose.connection.readyState === 1) {
      try {
        user = await User.findOne({ email: normalizedEmail });
        if (user) {
          isMatch = await bcrypt.compare(password, user.password);
        }
      } catch (dbErr) {
        console.warn('[DATABASE WARNING] Auth DB query failed. Falling back to demo mock users.', dbErr.message);
      }
    } else {
      console.warn('[DATABASE NOTICE] MongoDB is not connected. Using local static fallback users.');
    }

    // Fallback to static mock users
    if (!user) {
      const mockUser = mockUsersData.find(u => u.email === normalizedEmail);
      if (mockUser && password === 'password123') {
        user = mockUser;
        isMatch = true;
      }
    }

    if (!user || !isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.status === 'pending') {
      return res.status(403).json({ error: 'Teacher account is pending admin approval.' });
    }

    const token = jwt.sign(
      { id: user.id || user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'mht_cet_lms_secret_2026_key',
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id || user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        targetCourse: user.targetCourse,
        targetExam: user.targetExam,
        plan: user.plan,
        invoiceUrl: user.invoiceUrl,
        invoiceId: user.invoiceId
      }
    });
  } catch (err) {
    next(err);
  }
});

// Initialize GoogleGenAI client (handle fallback if key is missing)
const apiKey = process.env.GEMINI_API_KEY;
const isDemoMode = !apiKey || apiKey === 'YOUR_FREE_AI_STUDIO_KEY';

let aiClient = null;
if (!isDemoMode) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('[GEMINI] GoogleGenAI SDK initialized successfully.');
  } catch (err) {
    console.error(`[GEMINI] Initialization error: ${err.message}. Entering demo-mode.`);
  }
} else {
  console.warn('[GEMINI] Running in DEMO mode. Pre-seeded answers will be returned for AI features.');
}

// ----------------------------------------------------
// Route A: Question Generation (POST /api/admin/generate-questions)
// ----------------------------------------------------
app.post('/api/admin/generate-questions', adminMiddleware, logAiUsage('generate_test'), async (req, res, next) => {
  const { subject, chapter, difficulty, count } = req.body;
  const countVal = parseInt(count) || 2;

  if (!subject || !chapter || !difficulty) {
    return res.status(400).json({ error: 'Missing required parameters: subject, chapter, difficulty.' });
  }

  if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'YOUR_FREE_AI_STUDIO_KEY') {
    return res.status(500).json({ error: 'Gemini API key is not configured. Question generation is unavailable.' });
  }

  try {
    if (!aiClient) {
      aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    }

    console.log(`[LIVE GENERATOR] Prompting gemini-2.5-flash for ${countVal} questions...`);
    const prompt = `You are an expert MHT-CET examiner and professor. Generate exactly ${countVal} multiple-choice questions for the subject "${subject}", chapter "${chapter}", with a difficulty level of "${difficulty}". 
    
    Strict LaTeX Rule: All mathematical and chemistry formulas, equations, symbols, and variables must be wrapped inside standard LaTeX notation ($...$ for inline LaTeX, $$...$$ for display block LaTeX).
    
    Structure the response according to the JSON schema.`;
    
    const response = await aiClient.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            questions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  question_text: { type: 'STRING' },
                  options: {
                    type: 'OBJECT',
                    properties: {
                      A: { type: 'STRING' },
                      B: { type: 'STRING' },
                      C: { type: 'STRING' },
                      D: { type: 'STRING' }
                    },
                    required: ['A', 'B', 'C', 'D']
                  },
                  correct_option: { type: 'STRING' },
                  explanation: { type: 'STRING' }
                },
                required: ['question_text', 'options', 'correct_option', 'explanation']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const parsed = JSON.parse(response.text);
    const generatedList = parsed.questions || [];

    // Map questions to database fields and tag
    const questionsToInsert = generatedList.map(q => ({
      subject,
      chapter,
      difficulty,
      question_text: q.question_text,
      options: q.options,
      correct_option: q.correct_option,
      explanation: q.explanation,
      generated_by: 'ai'
    }));

    // Bulk insert into MongoDB
    const savedDocs = await Question.insertMany(questionsToInsert);
    res.status(201).json(savedDocs);
  } catch (error) {
    console.error('[AI GENERATOR ERROR]', error);
    next(error);
  }
});

// ----------------------------------------------------
// Route B: Diagnostic Test Analysis (POST /api/student/analyze-test)
// ----------------------------------------------------
app.post('/api/student/analyze-test', authMiddleware, async (req, res, next) => {
  const { testAttemptId, subject, examType, test_name, scoreData } = req.body;
  const userId = req.user.id;

  if (!testAttemptId || !scoreData) {
    return res.status(400).json({ error: 'Missing required parameters: testAttemptId, scoreData.' });
  }

  try {
    let analysisResult = null;

    if (isDemoMode || !aiClient) {
      console.log(`[DEMO ANALYZER] Simulating score reports for attempt ${testAttemptId}`);
      analysisResult = {
        weak_topics: ['Rotational Dynamics Friction', 'Vectors Cross Product'],
        time_management_rating: 'Average (approx 210 seconds per math question)',
        student_feedback: 'Rahul, you demonstrated good calculus precision. Focus on practicing cross products and sphere inertia acceleration formulas.',
        parent_feedback: 'Rahul\'s math accuracy is high, but rotational dynamics remains a weakness. Daily study plans are targeting this.'
      };
    } else {
      console.log(`[LIVE ANALYZER] Prompting gemini-2.5-flash for test analytics...`);
      const prompt = `Analyze this raw MHT-CET/NEET test log data: ${JSON.stringify(scoreData)}. Identify conceptual gaps, grade time management efficiency, and generate two tailored notes: an encouraging action plan for the student, and a clear, jargon-free summary for their parent tracking improvement trends.`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              weak_topics: {
                type: 'ARRAY',
                items: { type: 'STRING' }
              },
              time_management_rating: { type: 'STRING' },
              student_feedback: { type: 'STRING' },
              parent_feedback: { type: 'STRING' }
            },
            required: ['weak_topics', 'time_management_rating', 'student_feedback', 'parent_feedback']
          }
        }
      });

      analysisResult = JSON.parse(response.text);
    }

    const attemptData = {
      student_id: userId,
      test_name: test_name || 'Practice Quiz',
      examType: scoreData.examType || examType || subject || 'General',
      score: scoreData.score,
      max_score: scoreData.maxScore,
      time_spent_seconds: scoreData.timeSpent,
      accuracy: scoreData.accuracy,
      responses: scoreData.responses || req.body.responses || [],
      percentile: scoreData.percentile || req.body.percentile || null,
      nationalRank: scoreData.nationalRank || req.body.nationalRank || null,
      ai_analysis: analysisResult
    };

    let updatedAttempt;
    if (mongoose.connection.readyState === 1) {
      const dbId = mongoose.isValidObjectId(testAttemptId) ? testAttemptId : new mongoose.Types.ObjectId();
      updatedAttempt = await TestAttempt.findOneAndUpdate(
        { _id: dbId },
        { $set: attemptData },
        { new: true, upsert: true }
      );

      // Increment hours studied (converted to hours from seconds) and add test progress
      const studyHours = Math.round((scoreData.timeSpent / 3600) * 10) / 10 || 0.1;
      await User.findByIdAndUpdate(userId, {
        $push: { testProgress: updatedAttempt._id },
        $inc: { hoursStudied: studyHours }
      });
    } else {
      updatedAttempt = { _id: testAttemptId, ...attemptData };
    }

    res.status(200).json(updatedAttempt);
  } catch (error) {
    next(error);
  }
});

// GET list of questions (for test generator review fallback)
app.get('/api/questions', async (req, res, next) => {
  try {
    const list = await Question.find().sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Calculate Chapter-wise and Subject-wise accuracy for a TestAttempt
app.get('/api/student/test-attempts/:attemptId/analytics', authMiddleware, async (req, res, next) => {
  const { attemptId } = req.params;
  try {
    const attempt = await TestAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found.' });
    }

    const responses = attempt.responses || [];
    const chapterStats = {};
    const subjectStats = {};

    responses.forEach(resp => {
      const { chapter, subject, isCorrect } = resp;
      if (chapter) {
        if (!chapterStats[chapter]) {
          chapterStats[chapter] = { correct: 0, total: 0 };
        }
        chapterStats[chapter].total += 1;
        if (isCorrect) {
          chapterStats[chapter].correct += 1;
        }
      }

      if (subject) {
        if (!subjectStats[subject]) {
          subjectStats[subject] = { correct: 0, total: 0 };
        }
        subjectStats[subject].total += 1;
        if (isCorrect) {
          subjectStats[subject].correct += 1;
        }
      }
    });

    // Compute accuracy percentages
    const chapterAccuracy = {};
    Object.keys(chapterStats).forEach(ch => {
      const stats = chapterStats[ch];
      chapterAccuracy[ch] = {
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      };
    });

    const subjectAccuracy = {};
    Object.keys(subjectStats).forEach(sub => {
      const stats = subjectStats[sub];
      subjectAccuracy[sub] = {
        correct: stats.correct,
        total: stats.total,
        accuracy: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
      };
    });

    res.json({
      attemptId: attempt._id,
      test_name: attempt.test_name,
      examType: attempt.examType,
      score: attempt.score,
      max_score: attempt.max_score,
      accuracy: attempt.accuracy,
      percentile: attempt.percentile,
      nationalRank: attempt.nationalRank,
      chapterAccuracy,
      subjectAccuracy
    });
  } catch (err) {
    next(err);
  }
});

// Fetch Parent Dashboard view for linked students
app.get('/api/parent/dashboard', authMiddleware, async (req, res, next) => {
  const parentId = req.user.id;
  try {
    // Check user role
    if (req.user.role !== 'parent') {
      const u = await User.findById(parentId);
      if (!u || u.role !== 'parent') {
        return res.status(403).json({ error: 'Access denied. Parent role required.' });
      }
    }

    const parent = await User.findById(parentId).populate('linkedStudents');
    if (!parent) {
      return res.status(404).json({ error: 'Parent profile not found.' });
    }

    const studentsData = [];
    const linkedStudents = parent.linkedStudents || [];

    for (const student of linkedStudents) {
      const studentIdStr = student._id.toString();
      const attempts = await TestAttempt.find({ student_id: studentIdStr }).sort({ createdAt: -1 });

      studentsData.push({
        id: student._id,
        name: student.name,
        email: student.email,
        streak: student.streak || student.streaks || 0,
        hoursStudied: student.hoursStudied || 0,
        completedTasks: student.completedTasks || 0,
        dailyGoalProgress: student.dailyGoalProgress || 0,
        weakTopics: student.weakTopics || [],
        strongTopics: student.strongTopics || [],
        loginDates: student.loginDates || [],
        attempts: attempts.map(att => ({
          id: att._id,
          testName: att.test_name,
          examType: att.examType,
          score: att.score,
          maxScore: att.max_score,
          timeSpent: att.time_spent_seconds,
          accuracy: att.accuracy,
          percentile: att.percentile,
          nationalRank: att.nationalRank,
          responsesCount: att.responses ? att.responses.length : 0,
          feedback: att.feedback,
          ai_analysis: att.ai_analysis,
          date: att.createdAt ? att.createdAt.toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
        }))
      });
    }

    res.json({
      parentId: parent._id,
      parentName: parent.name,
      students: studentsData
    });
  } catch (err) {
    next(err);
  }
});

// Fetch all Mock Tests
app.get('/api/tests', authMiddleware, async (req, res, next) => {
  try {
    const list = await MockTest.find().populate('questions');
    res.json(list);
  } catch (err) {
    next(err);
  }
});

// Evaluate and submit Mock Test responses
app.post('/api/tests/submit', authMiddleware, async (req, res, next) => {
  const { testId, answers, timeSpent } = req.body;
  const studentId = req.user.id;

  if (!testId || !answers) {
    return res.status(400).json({ error: 'Missing testId or answers.' });
  }

  try {
    const test = await MockTest.findById(testId).populate('questions');
    if (!test) {
      return res.status(404).json({ error: 'Mock test not found.' });
    }

    let score = 0;
    let maxScore = 0;
    let correctCount = 0;
    const responses = [];

    // Map correct_option to option index: A=0, B=1, C=2, D=3
    const optionMap = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
    const revOptionMap = { 0: 'A', 1: 'B', 2: 'C', 3: 'D' };

    test.questions.forEach(q => {
      const questionIdStr = q._id.toString();
      const selectedIndex = answers[questionIdStr]; // e.g. 0, 1, 2, 3 or undefined/null
      const correctIndex = optionMap[q.correct_option];
      
      const isCorrect = selectedIndex !== undefined && selectedIndex !== null && selectedIndex === correctIndex;
      const qMarks = q.subject === 'Mathematics' ? 2 : 1;
      maxScore += qMarks;

      if (isCorrect) {
        score += qMarks;
        correctCount++;
      }

      responses.push({
        questionId: q._id,
        selectedOption: selectedIndex !== undefined && selectedIndex !== null ? revOptionMap[selectedIndex] : '',
        isCorrect: isCorrect,
        timeSpent: req.body.questionTimes ? (req.body.questionTimes[questionIdStr] || 0) : 30, // fallback
        chapter: q.chapter,
        subject: q.subject
      });
    });

    const accuracy = test.questions.length > 0 ? Math.round((correctCount / test.questions.length) * 100) : 0;

    // Generate simulated percentile and national rank
    const percentile = Math.min(99.9, Math.round((70 + Math.random() * 29.9) * 10) / 10);
    const nationalRank = Math.floor(100 + Math.random() * 5000);

    const attempt = await TestAttempt.create({
      student_id: studentId,
      test_name: test.name,
      examType: test.subjects.includes('Biology') ? 'NEET' : 'MHT-CET',
      score: score,
      max_score: maxScore,
      time_spent_seconds: timeSpent || 0,
      accuracy: accuracy,
      responses: responses,
      percentile: percentile,
      nationalRank: nationalRank,
      ai_analysis: {
        weak_topics: responses.filter(r => !r.isCorrect).map(r => r.chapter).filter((v, i, a) => v && a.indexOf(v) === i),
        time_management_rating: 'Good',
        student_feedback: `You completed the test in ${Math.round((timeSpent || 0) / 60)} minutes. Review weak topics.`,
        parent_feedback: `Student scored ${score}/${maxScore} with accuracy ${accuracy}%.`
      }
    });

    // Also push the attempt reference to user profile
    await User.findByIdAndUpdate(studentId, {
      $push: { testProgress: attempt._id },
      $inc: { hoursStudied: Math.round(((timeSpent || 0) / 3600) * 10) / 10 || 0.1 }
    });

    res.status(201).json({
      attemptId: attempt._id,
      score: score,
      maxScore: maxScore,
      accuracy: accuracy,
      correctCount: correctCount,
      totalQuestions: test.questions.length,
      percentile: percentile,
      nationalRank: nationalRank
    });
  } catch (err) {
    next(err);
  }
});

// Upgrade user plan directly with mock invoice receipt
app.post('/api/user/upgrade', authMiddleware, async (req, res, next) => {
  const { plan, targetCourse, targetExam } = req.body;
  const userId = req.user.id;
  if (!plan || !['Pro', 'Premium'].includes(plan)) {
    return res.status(400).json({ error: 'Invalid plan selected for upgrade.' });
  }
  
  try {
    let user = null;
    if (mongoose.connection.readyState === 1) {
      if (mongoose.isValidObjectId(userId)) {
        user = await User.findById(userId);
      } else {
        user = await User.findOne({ email: req.user.email });
      }
    }
    
    const invoiceId = `INV-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const amount = plan === 'Pro' ? 1499 : 2999;
    
    let invoiceUrl = `/public/invoices/invoice_${invoiceId}.pdf`;
    const tempUser = user ? { name: user.name, email: user.email, targetCourse, targetExam } : { name: req.user.name || 'Student', email: req.user.email, targetCourse, targetExam };
    
    if (mongoose.connection.readyState === 1 && user) {
      invoiceUrl = await generateInvoicePDF(user, invoiceId, amount, plan);
      user.plan = plan;
      if (targetCourse) user.targetCourse = targetCourse;
      if (targetExam) user.targetExam = targetExam;
      user.invoiceId = invoiceId;
      user.invoiceUrl = invoiceUrl;
      user.paymentStatus = 'Paid';
      await user.save();
    } else {
      invoiceUrl = await generateInvoicePDF(tempUser, invoiceId, amount, plan);
    }
    
    res.json({
      success: true,
      user: {
        id: userId,
        name: user ? user.name : (req.user.name || 'Student'),
        email: user ? user.email : req.user.email,
        role: 'student',
        plan,
        targetCourse: targetCourse || (user ? user.targetCourse : undefined),
        targetExam: targetExam || (user ? user.targetExam : undefined),
        invoiceId,
        invoiceUrl
      }
    });
  } catch (err) {
    next(err);
  }
});

// AI Tutor Doubt Solving Chat Responder (Gemini/Mock LaTeX support)
app.post('/api/student/ai-tutor', authMiddleware, logAiUsage('doubt_solve'), async (req, res, next) => {
  const { message } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message content is required.' });
  }
  
  try {
    let replyText = '';
    if (!isDemoMode && aiClient) {
      console.log(`[AI TUTOR] Querying gemini-2.5-flash for: ${message.substring(0, 60)}...`);
      const prompt = `You are a helpful, expert MHT-CET and JEE/NEET prep tutor. Provide a conceptual, encouraging, and detailed response to the student's doubt. Support all mathematical formulas, equations, symbols, and chemical equations with strict LaTeX formatting wrapped inside single $ for inline LaTeX or double $$ for block LaTeX. Doubt: "${message}"`;
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      replyText = response.text;
    } else {
      // Intelligent localized responder with LaTeX support
      const lower = message.toLowerCase();
      if (lower.includes('rotational') || lower.includes('inertia') || lower.includes('moment')) {
        replyText = `Hello! Let's clear up your doubts regarding **Rotational Dynamics**.\n\nThe **Moment of Inertia (I)** measures an object's resistance to rotational acceleration, similar to mass in linear motion. The general formula is:\n$$I = \\sum m_i r_i^2$$\n\nFor standard symmetric bodies of mass $M$ and radius $R$:\n1. **Circular Ring** (about geometric axis): $$I = MR^2$$\n2. **Circular Disc** (about geometric axis): $$I = \\frac{1}{2}MR^2$$\n3. **Solid Sphere** (about any diameter): $$I = \\frac{2}{5}MR^2$$\n4. **Hollow Sphere** (about any diameter): $$I = \\frac{2}{3}MR^2$$\n\nWhen a body rolls down an inclined plane without slipping, it possesses both translational and rotational kinetic energy. The acceleration of the center of mass is given by:\n$$a = \\frac{g \\sin\\theta}{1 + \\frac{k^2}{R^2}}$$\nwhere $k$ is the radius of gyration. For a solid sphere, $\\frac{k^2}{R^2} = \\frac{2}{5}$, which yields:\n$$a = \\frac{g \\sin\\theta}{1 + 2/5} = \\frac{5}{7} g \\sin\\theta$$\n\nDoes this clear up your formula doubt? Try applying this in the Mock Test!`;
      } else if (lower.includes('kinetics') || lower.includes('order') || lower.includes('rate constant')) {
        replyText = `Sure! Let's look at **Chemical Kinetics**.\n\nFor a **First-Order Reaction** $A \\rightarrow \\text{Products}$, the rate of reaction depends on the concentration of reactant $A$ raised to the first power:\n$$\\text{Rate} = -\\frac{d[A]}{dt} = k[A]$$\n\nThe integrated rate law is:\n$$k = \\frac{2.303}{t} \\log_{10}\\left(\\frac{[A]_0}{[A]_t}\\right)$$\nwhere $[A]_0$ is the initial concentration and $[A]_t$ is the concentration at time $t$.\n\nThe **Half-life ($t_{1/2}$)** is the time taken for reactant concentration to reduce to half of its initial value. Putting $[A]_t = [A]_0 / 2$ in the rate law equation:\n$$t_{1/2} = \\frac{\\ln(2)}{k} \\approx \\frac{0.693}{k}$$\nNotice that the half-life of a first-order reaction is completely independent of the initial concentration $[A]_0$!\n\nFor 75% completion, two half-lives are required, meaning:\n$$t_{75\\%} = 2 \\times t_{1/2} = \\frac{1.386}{k}$$\n\nLet me know if you want me to explain activation energy and the Arrhenius equation ($k = A e^{-E_a / RT}$)!`;
      } else {
        replyText = `Hello! I am your AI Tutor. Let's analyze your question:\n\n"${message}"\n\nTo master this concept for your entrance exams, keep in mind:\n- Ensure you recall the fundamental definitions and units.\n- Highlight the core mathematical formulation. For instance, in calculus, the fundamental integration by substitution uses:\n  $$\\int f(g(x))g'(x)dx = \\int f(u)du$$\n- Practice at least 10 basic MCQs to lock in the mechanism.\n\nCould you specify if this is from Physics, Chemistry, Mathematics, or Biology? I can provide a step-by-step MCQ walkthrough!`;
      }
    }
    res.json({ reply: replyText });
  } catch (err) {
    next(err);
  }
});

// Log AI usage manually
app.post('/api/ai/log-usage', authMiddleware, async (req, res, next) => {
  try {
    const { actionType } = req.body;
    if (!actionType || !['generate_test', 'doubt_solve'].includes(actionType)) {
      return res.status(400).json({ error: 'Valid actionType (generate_test or doubt_solve) is required.' });
    }
    const log = await AIUsageLog.create({
      userId: req.user.id,
      actionType
    });
    res.status(201).json({ success: true, log });
  } catch (err) {
    next(err);
  }
});

// Register parent account (Student only)
app.post('/api/student/register-parent', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ error: 'Access forbidden: Only students can register parent accounts.' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please provide parent name, email, and password.' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    if (mongoose.connection.readyState === 1) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(400).json({ error: 'User already exists with this email.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const studentId = req.user.id;
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      const parentUser = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: 'parent',
        status: 'active',
        linkedStudentId: student._id,
        linkedStudents: [student._id]
      });

      student.parentId = parentUser._id;
      await student.save();

      return res.status(201).json({
        message: 'Parent account registered successfully.',
        parent: {
          id: parentUser._id,
          name: parentUser.name,
          email: parentUser.email,
          role: parentUser.role,
          linkedStudentId: parentUser.linkedStudentId
        }
      });
    } else {
      // Offline fallback
      return res.status(201).json({
        message: 'Parent account registered successfully (offline mode).',
        parent: {
          id: 'u_' + Math.random().toString(36).substring(2, 9),
          name,
          email: normalizedEmail,
          role: 'parent',
          linkedStudentId: req.user.id
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Approve a teacher (Admin only)
app.put('/api/admin/approve-teacher/:id', adminMiddleware, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (mongoose.connection.readyState === 1) {
      const teacher = await User.findById(id);
      if (!teacher) {
        return res.status(404).json({ error: 'Teacher not found.' });
      }
      if (teacher.role !== 'teacher') {
        return res.status(400).json({ error: 'User is not a teacher.' });
      }

      teacher.status = 'active';
      await teacher.save();

      await SystemAlert.create({
        recipientId: teacher._id,
        message: 'Your teacher account has been approved by the Administrator.',
        type: 'info'
      });

      return res.json({
        message: 'Teacher approved successfully.',
        teacher: {
          id: teacher._id,
          name: teacher.name,
          email: teacher.email,
          status: teacher.status
        }
      });
    } else {
      // Offline fallback
      return res.json({
        message: 'Teacher approved successfully (offline mode).',
        teacher: {
          id,
          status: 'active'
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Search students by name or PRN (Teacher only)
app.get('/api/teacher/students/search', teacherMiddleware, async (req, res, next) => {
  try {
    const { query } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required.' });
    }

    if (mongoose.connection.readyState === 1) {
      const searchRegex = new RegExp(query, 'i');
      const students = await User.find({
        role: 'student',
        $or: [
          { name: searchRegex },
          { prn: searchRegex }
        ]
      }).select('id name email targetCourse targetExam plan prn status');

      return res.json(students);
    } else {
      // Offline fallback
      return res.json([
        { id: 'u_student_offline', name: 'Rahul Sharma', email: 'rahul@cet.com', role: 'student', prn: 'MHT202612345', status: 'active' }
      ]);
    }
  } catch (err) {
    next(err);
  }
});

// Get all Calendar Events
app.get('/api/events', async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const dbEvents = await CalendarEvent.find({}).sort({ createdAt: -1 });
      if (dbEvents.length > 0) {
        return res.json(dbEvents);
      }
    }
    // Fallback to initial seed mock events if DB has none or is offline
    res.json([
      { id: 'ev1', title: 'MHT-CET PCMB Full Syllabus Test 1 (Scheduled)', date: '2026-07-02 09:00 AM', type: 'Test', subject: 'General' },
      { id: 'ev2', title: 'Physics & Chemistry Chapterwise Mock 1 (Scheduled)', date: '2026-06-28 02:00 PM', type: 'Test', subject: 'Physics' },
      { id: 'ev3', title: 'Mathematics Special Vectors & Calculus Mock (Scheduled)', date: '2026-07-05 10:00 AM', type: 'Test', subject: 'Mathematics' },
      { id: 'ev4', title: 'Organic Chemistry Revision Live Seminar', date: '2026-06-26 04:00 PM', type: 'Lecture', subject: 'Chemistry' }
    ]);
  } catch (err) {
    next(err);
  }
});

// Schedule custom Mock Test (Teacher / Admin only)
app.post('/api/teacher/schedule-test', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Teacher or Admin role required.' });
    }

    const { title, date, subject } = req.body;
    if (!title || !date || !subject) {
      return res.status(400).json({ error: 'Please provide test title, date, and subject.' });
    }

    if (mongoose.connection.readyState === 1) {
      const newEvent = await CalendarEvent.create({
        title,
        date,
        type: 'Test',
        subject
      });

      // Create System Alerts for all students
      const students = await User.find({ role: 'student' });
      for (const student of students) {
        await SystemAlert.create({
          recipientId: student._id,
          message: `A new custom Mock Test "${title}" has been scheduled for ${date}.`,
          type: 'info'
        });
      }

      res.status(201).json({ success: true, event: newEvent });
    } else {
      res.status(201).json({
        success: true,
        event: {
          id: 'ev_' + Math.random().toString(36).substring(2, 9),
          title,
          date,
          type: 'Test',
          subject
        }
      });
    }
  } catch (err) {
    next(err);
  }
});

// Generate Student AI Performance Report (Teacher / Admin only)
app.post('/api/teacher/generate-report', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'teacher' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Teacher or Admin role required.' });
    }

    const { studentId } = req.body;
    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required.' });
    }

    if (mongoose.connection.readyState === 1) {
      const student = await User.findById(studentId);
      if (!student) {
        return res.status(404).json({ error: 'Student not found.' });
      }

      const attempts = await TestAttempt.find({ student_id: studentId });

      let reportText = '';
      if (!isDemoMode && aiClient) {
        console.log(`[TEACHER REPORT] Prompting Gemini for student ${student.name}...`);
        const prompt = `You are an expert MHT-CET prep tutor. Generate a formal, encouraging student performance evaluation card for ${student.name} who has taken ${attempts.length} mock tests. Accuracy: ${student.dailyGoalProgress || 76}%. Weak chapters: ${student.weakTopics.join(', ') || 'Rotational Dynamics'}. Strong chapters: ${student.strongTopics.join(', ') || 'Solid State'}. Suggest three specific action items for their daily goals list.`;
        const response = await aiClient.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        });
        reportText = response.text;
      } else {
        reportText = `### Student Performance Evaluation Report: ${student.name}

**Prep Assessment**:
* Cumulative Mock Accuracy: **${student.dailyGoalProgress || 76}%**
* Streaks: **${student.streak || 0} consecutive days**
* Diagnostic Assessment: Active and progressing.

**Prep Strengths**:
* ${student.strongTopics.join(', ') || 'Oscillations, Solid State'} (demonstrating limits mastery and units precision).

**Prep Weak Spots**:
* ${student.weakTopics.join(', ') || 'Rotational Dynamics, Chemical Kinetics'} (needs rolling acceleration review).

**Action Items**:
1. Allocate 2 hours daily to solve Rotational Dynamics torque calculations.
2. Complete 5 adaptive quizzes on Chemistry kinetics half-lives formulas.
3. Review formula cheat sheets for Vectors cross products.`;
      }

      res.json({ report: reportText });
    } else {
      res.json({
        report: `### Student Performance Evaluation Report (Offline Mode)

* Cumulative Mock Accuracy: **76%**
* Status: Active

**Action Items**:
1. Review physics rolling inertia equations.
2. Complete chemistry kinetics first-order reaction practice.`
      });
    }
  } catch (err) {
    next(err);
  }
});

// Get Executive Dashboard BI Analytics (Executive / Admin only)
app.get('/api/executive/bi-data', authMiddleware, async (req, res, next) => {
  try {
    if (req.user.role !== 'executive' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Executive or Admin role required.' });
    }

    if (mongoose.connection.readyState === 1) {
      // Total active users
      const users = await User.find({});
      const activeUsersCount = users.filter(u => u.status === 'active').length;

      // Revenue Calculation
      let totalRevenue = 0;
      users.forEach(u => {
        if (u.plan === 'Pro') totalRevenue += 1499;
        else if (u.plan === 'Premium') totalRevenue += 2999;
      });

      // Retention Rate
      const retentionRate = 92.4; // %

      // Difficult Chapters Statewide
      const attempts = await TestAttempt.find({});
      const chapterScores = {};
      attempts.forEach(att => {
        const responses = att.responses || [];
        responses.forEach(resp => {
          const ch = resp.chapter || 'General';
          if (!chapterScores[ch]) {
            chapterScores[ch] = { total: 0, correct: 0 };
          }
          chapterScores[ch].total += 1;
          if (resp.isCorrect) {
            chapterScores[ch].correct += 1;
          }
        });
      });

      let difficultChapters = Object.entries(chapterScores)
        .map(([chapter, stats]) => {
          const avgAccuracy = Math.round((stats.correct / stats.total) * 100);
          return { chapter, avgAccuracy };
        })
        .sort((a, b) => a.avgAccuracy - b.avgAccuracy)
        .slice(0, 5);

      if (difficultChapters.length === 0) {
        difficultChapters = [
          { chapter: 'Rotational Dynamics', avgAccuracy: 48 },
          { chapter: 'Chemical Kinetics', avgAccuracy: 52 },
          { chapter: 'Vectors', avgAccuracy: 55 },
          { chapter: 'Photosynthesis', avgAccuracy: 61 },
          { chapter: 'Electrostatics', avgAccuracy: 63 }
        ];
      }

      // AI Usage Metrics Over Time
      const aiLogs = await AIUsageLog.find({}).sort({ createdAt: 1 });
      const dailyUsage = {};
      aiLogs.forEach(log => {
        const dateStr = log.createdAt.toISOString().split('T')[0];
        if (!dailyUsage[dateStr]) {
          dailyUsage[dateStr] = { date: dateStr, generate_test: 0, doubt_solve: 0 };
        }
        if (log.actionType === 'generate_test') {
          dailyUsage[dateStr].generate_test += 1;
        } else if (log.actionType === 'doubt_solve') {
          dailyUsage[dateStr].doubt_solve += 1;
        }
      });

      let aiUsageChart = Object.values(dailyUsage);
      if (aiUsageChart.length === 0) {
        aiUsageChart = [
          { date: '2026-06-20', generate_test: 12, doubt_solve: 28 },
          { date: '2026-06-21', generate_test: 15, doubt_solve: 34 },
          { date: '2026-06-22', generate_test: 22, doubt_solve: 45 },
          { date: '2026-06-23', generate_test: 18, doubt_solve: 50 },
          { date: '2026-06-24', generate_test: 30, doubt_solve: 65 }
        ];
      }

      res.json({
        totalRevenue,
        activeUsers: activeUsersCount,
        retentionRate,
        difficultChapters,
        aiUsageChart
      });
    } else {
      // Offline fallback
      res.json({
        totalRevenue: 4497,
        activeUsers: 3,
        retentionRate: 92.4,
        difficultChapters: [
          { chapter: 'Rotational Dynamics', avgAccuracy: 48 },
          { chapter: 'Chemical Kinetics', avgAccuracy: 52 },
          { chapter: 'Vectors', avgAccuracy: 55 },
          { chapter: 'Photosynthesis', avgAccuracy: 61 },
          { chapter: 'Electrostatics', avgAccuracy: 63 }
        ],
        aiUsageChart: [
          { date: '2026-06-20', generate_test: 12, doubt_solve: 28 },
          { date: '2026-06-21', generate_test: 15, doubt_solve: 34 },
          { date: '2026-06-22', generate_test: 22, doubt_solve: 45 },
          { date: '2026-06-23', generate_test: 18, doubt_solve: 50 },
          { date: '2026-06-24', generate_test: 30, doubt_solve: 65 }
        ]
      });
    }
  } catch (err) {
    next(err);
  }
});

// Get System Alerts for logged-in user
app.get('/api/alerts', authMiddleware, async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const alerts = await SystemAlert.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
      res.json(alerts);
    } else {
      res.json([
        { _id: 'a_mock1', message: 'Welcome to MHT-CET Ace System!', type: 'info', read: false }
      ]);
    }
  } catch (err) {
    next(err);
  }
});

// Mark alert as read
app.put('/api/alerts/:alertId/read', authMiddleware, async (req, res, next) => {
  try {
    const { alertId } = req.params;
    if (mongoose.connection.readyState === 1) {
      await SystemAlert.updateOne({ _id: alertId, recipientId: req.user.id }, { $set: { read: true } });
    }
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
});

// Standard Error Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.stack || err.message || err);
  res.status(500).json({ error: 'Server Encountered an Internal Error.', details: err.message });
});

// Listen
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`[SERVER] LMS Backend listening at http://localhost:${PORT}`);
});
