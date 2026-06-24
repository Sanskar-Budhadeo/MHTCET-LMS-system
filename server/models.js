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
  examType: {
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
  responses: [{
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question' },
    selectedOption: { type: String },
    isCorrect: { type: Boolean },
    timeSpent: { type: Number },
    chapter: { type: String },
    subject: { type: String }
  }],
  percentile: {
    type: Number
  },
  nationalRank: {
    type: Number
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
    enum: ['student', 'parent', 'teacher', 'admin', 'executive']
  },
  prn: {
    type: String,
    unique: true,
    sparse: true
  },
  status: {
    type: String,
    default: 'active'
  },
  linkedStudentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  targetCourse: {
    type: String,
    enum: ['PCB', 'PCM', 'PCMB']
  },
  targetExam: {
    type: String,
    enum: ['JEE', 'NEET', 'MHT-CET']
  },
  plan: {
    type: String,
    enum: ['Free', 'Pro', 'Premium'],
    default: 'Free'
  },
  invoiceUrl: {
    type: String
  },
  invoiceId: {
    type: String
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed']
  },
  linkedStudents: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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

const MockTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true // in minutes
  },
  subjects: {
    type: [String],
    default: []
  },
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question'
  }]
}, { timestamps: true });

export const MockTest = mongoose.model('MockTest', MockTestSchema);

const AIUsageLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  actionType: {
    type: String,
    required: true,
    enum: ['generate_test', 'doubt_solve']
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

export const AIUsageLog = mongoose.model('AIUsageLog', AIUsageLogSchema);

const SystemAlertSchema = new mongoose.Schema({
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export const SystemAlert = mongoose.model('SystemAlert', SystemAlertSchema);

const CalendarEventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  date: { type: String, required: true },
  type: { type: String, required: true, enum: ['Test', 'Lecture', 'Target'] },
  subject: { type: String, enum: ['Physics', 'Chemistry', 'Mathematics', 'Biology', 'General'] }
}, { timestamps: true });

export const CalendarEvent = mongoose.model('CalendarEvent', CalendarEventSchema);
