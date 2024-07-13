// models/Event.js
const mongoose = require('mongoose');

const classSessionSchema = new mongoose.Schema({

  teacherId: {
    type: String,
    required: true,
  },
  
  school: {
    type: String,
    required: true,
  },

  className: {
    type: String,
    required: true,
  },

  level: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },

  startTime: {
    type: String,
    required: true,
  },

  endTime: {
    type: String,
    required: true,
  },

  expired: {
    type: Boolean,
    default: false
  },

  status: {
    type: String
  }

  
}, { timestamps: true });

const classSessionModel = mongoose.model('class-sessions', classSessionSchema);

module.exports = classSessionModel;