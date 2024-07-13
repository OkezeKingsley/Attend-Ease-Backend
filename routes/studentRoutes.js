const express = require("express");
const { 
    signUpFunction,
    signInFunction,
    markAttendanceFunction,
    fetchAttendanceHistory
    } = require("../controllers/studentControllers");
const studentAuth = require("../middleware/studentAuth");

const router = express.Router();

router.post("/sign-up", signUpFunction);
router.post("/sign-in", signInFunction)
router.post('/mark-attendance', studentAuth, markAttendanceFunction);
router.post('/attendance-history', studentAuth, fetchAttendanceHistory);


module.exports = router;