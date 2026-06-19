import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Question, TestAttempt, User, Note } from './models.js';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
    // Seed initial mock users if none exist
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        console.log('[DATABASE] Seeding initial mock users...');
        const hashedPassword = await bcrypt.hash('password123', 10);
        await User.insertMany([
          {
            name: 'Admin User',
            email: 'admin@demo.com',
            password: hashedPassword,
            role: 'admin'
          },
          {
            name: 'Student User',
            email: 'student@demo.com',
            password: hashedPassword,
            role: 'student',
            streak: 0,
            weakTopics: [],
            strongTopics: [],
            loginDates: []
          }
        ]);
        console.log('[DATABASE] Initial mock users seeded successfully.');
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

// Authentication: Register
app.post('/api/auth/register', async (req, res, next) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'Please provide name, email, password, and role.' });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    let newUser = null;

    if (mongoose.connection.readyState === 1) {
      try {
        const existingUser = await User.findOne({ email: normalizedEmail });
        if (existingUser) {
          return res.status(400).json({ error: 'User already exists with this email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        newUser = await User.create({
          name,
          email: normalizedEmail,
          password: hashedPassword,
          role
        });
      } catch (dbErr) {
        console.warn('[DATABASE WARNING] Auth registration query failed. Falling back to virtual user.', dbErr.message);
      }
    }

    // Fallback to virtual registration if database is offline/errored
    if (!newUser) {
      console.log(`[AUTH] Registering virtual user: ${normalizedEmail} (${role})`);
      newUser = {
        _id: 'u_' + Math.random().toString(36).substring(2, 9),
        name,
        email: normalizedEmail,
        role
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
        role: newUser.role
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
    { id: 'u_student', name: 'Rahul Sharma', email: 'rahul@cet.com', role: 'student' },
    { id: 'u_parent', name: 'Mr. Arvind Sharma', email: 'parent.rahul@cet.com', role: 'parent' },
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
        role: user.role
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
app.post('/api/admin/generate-questions', adminMiddleware, async (req, res, next) => {
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
  const { testAttemptId, subject, test_name, scoreData } = req.body;
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
      const prompt = `Analyze this raw MHT-CET test log data: ${JSON.stringify(scoreData)}. Identify conceptual gaps, grade time management efficiency, and generate two tailored notes: an encouraging action plan for the student, and a clear, jargon-free summary for their parent tracking improvement trends.`;

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
      subject: subject || 'General',
      score: scoreData.score,
      max_score: scoreData.maxScore,
      time_spent_seconds: scoreData.timeSpent,
      accuracy: scoreData.accuracy,
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
