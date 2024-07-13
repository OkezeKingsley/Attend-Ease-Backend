const express = require("express");
const { signUpFunction, 
        signInFunction, 
        createClassSession, 
        fetchCreactedClassSessionsFunction,
        fetchAttendeesFunction,
        deleteClassSessionFunction,
        addStudentFunction,
        deleteAttendeeFromAttendanceListFunction
    } = require("../controllers/teacherControllers");
const teacherAuth = require("../middleware/teacherAuth");

const router = express.Router();

router.post("/sign-up", signUpFunction);
router.post("/sign-in", signInFunction);
router.post("/create-class-session", teacherAuth, createClassSession);
router.post("/delete-class-session", teacherAuth, deleteClassSessionFunction);
router.post("/fetch-created-class-sessions", teacherAuth, fetchCreactedClassSessionsFunction);
router.post("/fetch-attendees", teacherAuth, fetchAttendeesFunction);
router.post("/add-student", teacherAuth, addStudentFunction);
router.post("/delete-attendee", teacherAuth, deleteAttendeeFromAttendanceListFunction);

module.exports = router;