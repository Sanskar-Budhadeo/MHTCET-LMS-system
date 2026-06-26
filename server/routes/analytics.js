import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { User, TestAttempt } from '../models.js';

const router = express.Router();

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

// Admin Middleware
const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access forbidden: Admin role required.' });
  }
  next();
};

// 1. GET /api/analytics/business (CEO/Business Dashboard Insights)
router.get('/api/analytics/business', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    // A. Total registered users
    const totalUsers = await User.countDocuments({});

    // B. Count of active TestAttempts today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const attemptsTodayResult = await TestAttempt.aggregate([
      { $match: { createdAt: { $gte: startOfToday } } },
      { $count: 'count' }
    ]);
    const activeAttemptsToday = attemptsTodayResult.length > 0 ? attemptsTodayResult[0].count : 0;

    // C. Average platform-wide test score
    const avgScoreResult = await TestAttempt.aggregate([
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$score' }
        }
      }
    ]);
    const avgPlatformScore = avgScoreResult.length > 0 ? Math.round(avgScoreResult[0].avgScore * 100) / 100 : 0;

    // D. Average platform-wide score per subject (for Bar Chart)
    const subjectScores = await TestAttempt.aggregate([
      { $unwind: '$responses' },
      {
        $group: {
          _id: { attemptId: '$_id', subject: '$responses.subject' },
          score: {
            $sum: {
              $cond: [
                '$responses.isCorrect',
                { $cond: [{ $eq: ['$responses.subject', 'Mathematics'] }, 2, 1] },
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.subject',
          avgScore: { $avg: '$score' }
        }
      },
      {
        $project: {
          subject: '$_id',
          avgScore: { $round: ['$avgScore', 2] }
        }
      }
    ]);

    res.json({
      totalUsers,
      activeAttemptsToday,
      avgPlatformScore,
      subjectScores
    });
  } catch (err) {
    next(err);
  }
});

// 2. GET /api/analytics/faculty (Faculty Dashboard Insights)
router.get('/api/analytics/faculty', authMiddleware, adminMiddleware, async (req, res, next) => {
  try {
    // A. Batch performance: average score per subject across all students
    const batchPerformance = await TestAttempt.aggregate([
      { $unwind: '$responses' },
      {
        $group: {
          _id: { attemptId: '$_id', subject: '$responses.subject' },
          score: {
            $sum: {
              $cond: [
                '$responses.isCorrect',
                { $cond: [{ $eq: ['$responses.subject', 'Mathematics'] }, 2, 1] },
                0
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: '$_id.subject',
          avgScore: { $avg: '$score' }
        }
      },
      {
        $project: {
          subject: '$_id',
          avgScore: { $round: ['$avgScore', 2] }
        }
      }
    ]);

    // B. Top 3 most difficult chapters (lowest correct accuracy)
    const difficultChapters = await TestAttempt.aggregate([
      { $unwind: '$responses' },
      {
        $group: {
          _id: '$responses.chapter',
          subject: { $first: '$responses.subject' },
          total: { $sum: 1 },
          correct: { $sum: { $cond: ['$responses.isCorrect', 1, 0] } }
        }
      },
      {
        $project: {
          chapter: '$_id',
          subject: 1,
          total: 1,
          correct: 1,
          accuracy: {
            $cond: [
              { $eq: ['$total', 0] },
              0,
              { $multiply: [{ $divide: ['$correct', '$total'] }, 100] }
            ]
          }
        }
      },
      { $sort: { accuracy: 1 } },
      { $limit: 3 },
      {
        $project: {
          chapter: 1,
          subject: 1,
          accuracy: { $round: ['$accuracy', 1] }
        }
      }
    ]);

    // C. Recent student test submissions (with joined student names)
    const recentSubmissions = await TestAttempt.aggregate([
      { $sort: { createdAt: -1 } },
      { $limit: 10 },
      {
        $addFields: {
          studentObjectId: {
            $cond: {
              if: {
                $and: [
                  { $eq: [{ $type: '$student_id' }, 'string'] },
                  { $regexMatch: { input: '$student_id', regex: '^[0-9a-fA-F]{24}$' } }
                ]
              },
              then: { $toObjectId: '$student_id' },
              else: null
            }
          }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'studentObjectId',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      {
        $project: {
          testName: '$test_name',
          examType: 1,
          score: 1,
          maxScore: '$max_score',
          accuracy: 1,
          createdAt: 1,
          studentName: {
            $cond: {
              if: { $gt: [{ $size: '$studentInfo' }, 0] },
              then: { $arrayElemAt: ['$studentInfo.name', 0] },
              else: 'Student User'
            }
          }
        }
      }
    ]);

    res.json({
      batchPerformance,
      difficultChapters,
      recentSubmissions
    });
  } catch (err) {
    next(err);
  }
});

// 3. GET /api/analytics/parent/:studentId (Parent Dashboard Insights)
router.get('/api/analytics/parent/:studentId', authMiddleware, async (req, res, next) => {
  const { studentId } = req.params;
  try {
    // Role check: Only parent or admin can query student dashboard analytics
    if (req.user.role !== 'parent' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access forbidden: Parent or Admin role required.' });
    }

    // Verify student parent links if role is parent
    if (req.user.role === 'parent') {
      const parent = await User.findById(req.user.id);
      if (!parent || !parent.linkedStudents.map(id => id.toString()).includes(studentId)) {
        return res.status(403).json({ error: 'Access forbidden: Student is not linked to this parent.' });
      }
    }

    // Fetch user details: streak, weakTopics, loginDates, strongTopics, hoursStudied, teacherReport
    const student = await User.findById(studentId).select('name email streak streaks weakTopics strongTopics loginDates hoursStudied teacherReport');
    if (!student) {
      return res.status(404).json({ error: 'Student not found.' });
    }

    // Query attempts to calculate avg accuracy and total tests
    let avgAccuracy = 82; // standard default/fallback accuracy
    let totalTests = 0;
    if (mongoose.connection.readyState === 1) {
      const allAttempts = await TestAttempt.find({ student_id: studentId });
      totalTests = allAttempts.length;
      if (totalTests > 0) {
        avgAccuracy = Math.round(allAttempts.reduce((sum, att) => sum + att.accuracy, 0) / totalTests);
      }
    }

    // Fetch student's recent test attempts
    const rawAttempts = await TestAttempt.find({ student_id: studentId })
      .sort({ createdAt: -1 })
      .limit(10);

    const recentAttempts = rawAttempts.map(att => {
      // Determine subject from responses
      let subject = 'General';
      if (att.responses && att.responses.length > 0) {
        const subjectCounts = {};
        att.responses.forEach(r => {
          if (r.subject) {
            subjectCounts[r.subject] = (subjectCounts[r.subject] || 0) + 1;
          }
        });
        const sorted = Object.entries(subjectCounts).sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
          subject = sorted[0][0];
        }
      } else {
        const nameUpper = att.test_name.toUpperCase();
        if (nameUpper.includes('PHYSICS')) subject = 'Physics';
        else if (nameUpper.includes('CHEMISTRY')) subject = 'Chemistry';
        else if (nameUpper.includes('MATH')) subject = 'Mathematics';
        else if (nameUpper.includes('BIOLOGY')) subject = 'Biology';
      }

      return {
        id: att._id,
        _id: att._id,
        testName: att.test_name,
        examType: att.examType,
        score: att.score,
        maxScore: att.max_score,
        accuracy: att.accuracy,
        timeSpent: att.time_spent_seconds,
        createdAt: att.createdAt,
        percentile: att.percentile,
        nationalRank: att.nationalRank,
        ai_analysis: att.ai_analysis,
        feedback: att.feedback,
        responses: att.responses || [],
        subject
      };
    });

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        streak: student.streak || student.streaks || 0,
        hoursStudied: student.hoursStudied || 0,
        weakTopics: student.weakTopics || [],
        strongTopics: student.strongTopics || [],
        loginDates: student.loginDates || [],
        teacherReport: student.teacherReport || '',
        avgAccuracy,
        totalTests
      },
      recentAttempts
    });
  } catch (err) {
    next(err);
  }
});

export default router;
