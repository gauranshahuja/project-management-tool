const mongoose = require('mongoose');

const employeeProfileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    employeeId: { type: String, default: '' }, // company's own emp code
    department: { type: String, default: '' },
    designation: { type: String, default: '' },
    employmentType: {
      type: String,
      enum: ['Full-time', 'Part-time', 'Contract', 'Intern'],
      default: 'Full-time',
    },
    joiningDate: { type: Date },
    phone: { type: String, default: '' },
    // Monthly salary (gross). Visible only to Owner/Admin/HR.
    monthlySalary: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Active', 'On Leave', 'Resigned', 'Terminated'],
      default: 'Active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('EmployeeProfile', employeeProfileSchema);
