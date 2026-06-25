const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    title: {
      type: String,
      required: true,
    },
    description: String,
    status: {
      type: String,
      enum: ['Not Started', 'In Progress', 'Completed'],
      default: 'Not Started',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium',
    },
    labels: {
      type: [String],
      default: [],
    },
    // Checklist / subtasks inside a task
    subtasks: [
      {
        title: { type: String, required: true },
        done: { type: Boolean, default: false },
      },
    ],
    // Recurrence: when a recurring task is completed, the next one auto-creates.
    recurrence: {
      type: String,
      enum: ['none', 'daily', 'weekly', 'monthly'],
      default: 'none',
    },
    // Time tracking: completed sessions + the currently-running timer (per user).
    timeLogs: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        start: { type: Date, required: true },
        end: { type: Date, default: null },
        seconds: { type: Number, default: 0 },
      },
    ],
    dueDate: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
