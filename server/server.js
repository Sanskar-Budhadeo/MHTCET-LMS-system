import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './db.js';
import { Question, TestAttempt } from './models.js';
import { GoogleGenAI } from '@google/genai';
import mongoose from 'mongoose';

// Load environmental variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/admin/generate-questions', async (req, res, next) => {
  const { subject, chapter, difficulty, count } = req.body;
  const countVal = parseInt(count) || 2;

  if (!subject || !chapter || !difficulty) {
    return res.status(400).json({ error: 'Missing required parameters: subject, chapter, difficulty.' });
  }

  try {
    let generatedList = [];

    if (isDemoMode || !aiClient) {
      console.log(`[DEMO GENERATOR] Generating ${countVal} mock questions for ${subject} -> ${chapter}`);
      // Simulate Gemini JSON output
      generatedList = Array.from({ length: countVal }).map((_, i) => ({
        question_text: `[AI DEMO Q${i + 1}] A sample MHT-CET question on $${chapter}$ for subject $${subject}$. If acceleration is given by $a = \\omega^2 x$, find frequency.`,
        options: {
          A: `Option A value matching $2\\pi \\omega$`,
          B: `Option B value matching $\\omega / 2\\pi$`,
          C: `Option C value matching $\\omega$`,
          D: `Option D value matching $1 / \\omega$`
        },
        correct_option: 'B',
        explanation: `Using the formula for frequency of SHM: $f = \\frac{\\omega}{2\\pi}$.`
      }));
    } else {
      console.log(`[LIVE GENERATOR] Prompting gemini-2.5-flash for ${countVal} questions...`);
      const prompt = `You are an expert MHT-CET examiner. Generate ${countVal} multiple-choice questions for the subject ${subject} and chapter ${chapter}. The difficulty level must be ${difficulty}. Wrap mathematical formulas and scientific text inside standard LaTeX formatting ($...$ or $$...$$).`;
      
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
      generatedList = parsed.questions || [];
    }

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
    next(error);
  }
});

// ----------------------------------------------------
// Route B: Diagnostic Test Analysis (POST /api/student/analyze-test)
// ----------------------------------------------------
app.post('/api/student/analyze-test', async (req, res, next) => {
  const { testAttemptId, scoreData } = req.body;

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

    // Update TestAttempt log details in MongoDB
    // If the attempt doesn't exist (e.g. dynamic runtime attempts), let's upsert/create one
    const updatedAttempt = await TestAttempt.findOneAndUpdate(
      { _id: mongoose.isValidObjectId(testAttemptId) ? testAttemptId : new mongoose.Types.ObjectId() },
      { $set: { ai_analysis: analysisResult } },
      { new: true, upsert: true }
    );

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
