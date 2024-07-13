// models/Attendance.js
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  teacherId: {
    type: String,
    required: true,
  },
  classSessionId: {
    type: String,
    required: true,
  },
  studentId: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  matricNumber: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    required: true
  },
  registrationTime: {
    type: Date,
    default: Date.now,
    required: true
  },
  status: {
    type: String,
    default: "Present" //indicate they are present
  }
 
} , { timestamps: true });

const attendanceModel = mongoose.model('attendances', attendanceSchema);

module.exports = attendanceModel;
