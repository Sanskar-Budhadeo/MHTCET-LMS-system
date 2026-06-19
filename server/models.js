import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  },
  chapter: {
    type: String,
    required: true
  },
  difficulty: {
    type: String,
    required: true,
    enum: ['Easy', 'Medium', 'Hard']
  },
  question_text: {
    type: String,
    required: true
  },
  options: {
    A: { type: String, required: true },
    B: { type: String, required: true },
    C: { type: String, required: true },
    D: { type: String, required: true }
  },
  correct_option: {
    type: String,
    required: true,
    enum: ['A', 'B', 'C', 'D']
  },
  explanation: {
    type: String,
    required: true
  },
  generated_by: {
    type: String,
    default: 'ai'
  }
}, { timestamps: true });

const TestAttemptSchema = new mongoose.Schema({
  student_id: {
    type: String,
    required: true
  },
  test_name: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  max_score: {
    type: Number,
    required: true
  },
  time_spent_seconds: {
    type: Number,
    required: true
  },
  accuracy: {
    type: Number,
    required: true
  },
  ai_analysis: {
    weak_topics: {
      type: [String],
      default: []
    },
    time_management_rating: {
      type: String,
      default: ''
    },
    student_feedback: {
      type: String,
      default: ''
    },
    parent_feedback: {
      type: String,
      default: ''
    }
  },
  feedback: {
    instructorName: { type: String, default: '' },
    text: { type: String, default: '' },
    date: { type: String, default: '' },
    aiSuggestions: { type: [String], default: [] }
  }
}, { timestamps: true });

export const Question = mongoose.model('Question', QuestionSchema);
export const TestAttempt = mongoose.model('TestAttempt', TestAttemptSchema);

const NoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true,
    enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology']
  },
  topic: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  lastUpdated: {
    type: String,
    required: true
  }
}, { timestamps: true });

export const Note = mongoose.model('Note', NoteSchema);

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    required: true,
    enum: ['student', 'parent', 'admin']
  },
  streak: {
    type: Number,
    default: 0
  },
  streaks: {
    type: Number,
    default: 0
  },
  hoursStudied: {
    type: Number,
    default: 0
  },
  completedTasks: {
    type: Number,
    default: 0
  },
  dailyGoalProgress: {
    type: Number,
    default: 0
  },
  weakTopics: {
    type: [String],
    default: []
  },
  strongTopics: {
    type: [String],
    default: []
  },
  loginDates: {
    type: [String],
    default: []
  },
  savedNotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Note',
    default: []
  }],
  testProgress: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    default: []
  }],
  tasks: [{
    text: { type: String, required: true },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

export const User = mongoose.model('User', UserSchema);
