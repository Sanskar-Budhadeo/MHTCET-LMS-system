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
  subject: {
    type: String,
    required: true
  },
  total_questions: {
    type: Number,
    required: true
  },
  score: {
    type: Number,
    required: true
  },
  time_spent_seconds: {
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
  }
}, { timestamps: true });

export const Question = mongoose.model('Question', QuestionSchema);
export const TestAttempt = mongoose.model('TestAttempt', TestAttemptSchema);
