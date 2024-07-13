const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true
    },
    
    password: {

    },

    role: {
        type: String,
        required: true
    }
});

const teacherModel = mongoose.model("teachers", teacherSchema);

module.exports = teacherModel;