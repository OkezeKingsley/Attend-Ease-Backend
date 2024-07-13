// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');
const expireClassSession = require('./jobs/expiryClassSession');
const cron = require('node-cron');
require("dotenv").config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;

// Set cors options to be used
const options = {
	methods: ['GET', 'POST', 'DELETE', 'PUT', 'PATCH'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
};

app.use(cors(options));

//Run background job for expiring class session.
cron.schedule('*/1 * * * *', expireClassSession); 

console.log('MONGO_URI:', process.env.MONGODB_URL);
// Database connection
mongoose.connect(process.env.MONGODB_URL).then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('DATABASE CONNECTED!')
  });
}).catch((error) => {
    console.log('ERROR CONNECTING TO DB', error)
});

// ----- ROUTES ----//
app.use("/teacher", teacherRoutes);
app.use("/student", studentRoutes)
 