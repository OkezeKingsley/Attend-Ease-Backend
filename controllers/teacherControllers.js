const teacherModel = require('../models/teacherModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const classSessionModel = require('../models/classSessionModel');
const cron = require('node-cron');
const attendanceModel = require('../models/attendanceModel');
const studentModel = require('../models/studentModel');
require("dotenv").config();

const jwt_secret = process.env.JWT_SECRET_KEY;

const signUpFunction = async (req, res) => {

    const { firstName, lastName, email, password } = req.body;
    console.log(" data receive", firstName, lastName, email, password);

    try {
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: "All field required!"})
        }

		// Validate email address. this code checks whether the provided email 
		//address is in a valid format by matching it against a regex pattern. 
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		if (!emailRegex.test(email)) {
		  return res.status(400).json({ error: "Invalid email address!" });
		}

        // Check if email already exist in the database
		const userExistAsStudent = await studentModel.findOne({ email });
		const teacher = await teacherModel.findOne({ email });

		if (userExistAsStudent) {
			return res.status(401).json({ error: 'User already exist as Student!' });
		}

		if (teacher) {
			return res.status(401).json({ error: 'User already exist.' });
		}

		// Hash password using bcrypt
		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(password, salt);

		const newTeacher = await teacherModel.create({ 
												firstName, 
												lastName, 
												email, 
												password: hashedPassword, 
												role: "teacher" 
											});

        if (!newTeacher) {
            return res.status(401).json({ error: "Error creating account!"})
        }

		console.log("account created");
        return res.status(201).json({ message: "Account created!"});

	} catch (error) {
		console.log('Sign up error', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}

};




// Login function
const signInFunction = async (req, res) => {
	const { email, password } = req.body;

	console.log("login details", email, password);

	try {
		if (!email || !password) {
			return res.status(400).json({ error: 'Please fill all required field!' });
		}

		const teacher = await teacherModel.findOne({ email });

		if (!teacher) {
			return res.status(404).json({ error: 'Account does not exist!' });
		}

		const isPasswordValid = bcrypt.compareSync(password, teacher.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid password' });
		}


		if (teacher.role !== "teacher") {
			return res.status(403).json({ error: "This login is for Teachers only!"})
		}
		// 	// Create a Token
		const payload = { id: teacher._id.toString() };
		const token = jwt.sign(payload, jwt_secret, {
			expiresIn: '1d',
			algorithm: 'HS256',
		});

		if (!token) {
			return res.status(500).json({ message: 'Error creating token!' });
		}

		console.log("cookie token is", token)
		return res.status(200).json({ id: teacher._id, token });	

	} catch (error) {
		console.error("error sign in teacher", error);
		return res.status(500).json({ error: 'Internal Server Error!' });
	}

};



const createClassSession = async (req, res) => {
	const { teacherId, school, level, className, date, startTime, endTime } = req.body;
  	console.log( 'all info to create', school,className,date,startTime,endTime,teacherId)

	try {
	  // Check for empty fields
	  if (!teacherId || !school || !className || !level || !date || !startTime || !endTime) {
		return res.status(400).json({ error: 'All fields are required!' });
	  }
  
	  // Check if the Class session date is in the past
	  const classSessionDate = new Date(date);
	  const currentdate = new Date();
	  if (classSessionDate < currentdate) {
		return res.status(400).json({ error: 'Class session date cannot be in the past' });
	  }
  
	  // Check if the Class session end time is in the past
	  const classSessionEndTime = new Date(endTime);
	  if (classSessionEndTime < currentdate) {
		return res.status(400).json({ error: "Can't end a Class session on old time!" });
	  }
  
	  // Create a new Class session
	  const classSession = new classSessionModel({
		teacherId,
		school,
		className,
		level,
		date,
		startTime,
		endTime,
		status: "soon"
	  });
  
	  // Save the Class session to the database
	  const savedClassSession = await classSession.save();

	  if (!savedClassSession) {
		return res.status(500).json({ error: "Error occured while adding Class session!"})
	  }
	
	  console.log("Class session saved", savedClassSession)
	  return res.status(201).json({ id: savedClassSession._id });

	} catch (error) {
		console.log("error saving Class session", error)
		return res.status(500).json({ error: 'Internal Server Error' });
	}

  };


const fetchCreactedClassSessionsFunction = async (req, res) => {
	const { teacherId } = req.body;

	try {
		if (!teacherId) {
			return res.status(400).json({ error: "Couldn't identify user"});
		}

		const teacher = await teacherModel.findOne({ _id: teacherId });

		if (!teacher) {
			return res.status(404).json({ error: "User doesnt exist!"});
		}

		const fetchCreactedClassSessions = await classSessionModel.find({ teacherId });

		if (!fetchCreactedClassSessions) {
			return res.status(404).json({ error: "Error fetching all classSession!"});
		}
		console.log("All created event", fetchCreactedClassSessions)
		return res.status(200).json(fetchCreactedClassSessions)

	} catch (error) {
		return res.status(500).json({ error: "Internal Server Error!"})
	}

};


const deleteClassSessionFunction = async (req, res) => {
	const { classSessionId } = req.body;
  
	console.log("class session to be deleted:", classSessionId);
  
	if (!classSessionId) {
	  return res.status(400).json({ error: 'class session ID is required' });
	}
  
	try {
	  const classSession = await classSessionModel.findById(classSessionId);
  
	  if (!classSession) {
		return res.status(404).json({ error: 'class session not found' });
	  }
  
	  const deleteAttendanceWithClassSessionId = await attendanceModel.deleteMany({ classSessionId });
  
	  if (!deleteAttendanceWithClassSessionId) {
		return res.status(500).json({ error: "There was a problem midway while deleting class attendance!" });
	  }
  
	  const deleteClassSession = await classSessionModel.findByIdAndDelete(classSessionId);
  
	  if (!deleteClassSession) {
		return res.status(500).json({ error: "There was a problem completing deletion of the class!" });
	  }
  
	  return res.status(200).json({ message: 'Class session deleted successfully' });
  
	} catch (error) {
	  console.error("Error deleting class session:", error);
	  return res.status(500).json({ error: 'Server error, please try again later' });
	}

};
  


const fetchAttendeesFunction = async (req, res) => {
	const { teacherId, classSessionId } = req.body;
	
	try {
		if (!teacherId) {
			return res.status(400).json({ error: "Couldn't identify Teacher"});
		}
		if (!classSessionId) {
			return res.status(400).json({ error: "Couldn't identify class session"});
		}

		const teacher = await teacherModel.findOne({ _id: teacherId });
		const classSession = await classSessionModel.findOne({ _id: classSessionId });

		if (!teacher) {
			return res.status(404).json({ error: "User doesnt exist!"});
		}

		if (!classSession) {
			console.log("All Fetched Attendees", classSession);
			return res.status(404).json({ error: "Class session doesnt exist!"});
		}

		const fetchedAttendees = await attendanceModel.find({ teacherId, classSessionId });

		if (!fetchedAttendees.length) {
            return res.status(200).json({ message: "No attendees found for this class session" });
        }

        console.log("All Fetched Attendees", fetchedAttendees);
        return res.status(200).json(fetchedAttendees);

	} catch (error) {
		console.error("Internal Server Error:", error);
		return res.status(500).json({ error: "Internal Server Error!"})
	}

};




const addStudentFunction = async (req, res) => {
	const { teacherId, firstName, lastName, matricNumber, classSessionId } = req.body;
	console.log("things to add",  teacherId, firstName, lastName, matricNumber, classSessionId);

	try {
		if (!teacherId) {
			return res.status(400).json({ error: "Couldn't identify you, logout and login again!"});
		}
		if (!firstName || !lastName || !matricNumber) {
			return res.status(400).json({ error: "Please ensure all values are filled!"});
		}
	
		const user = await studentModel.findOne({
			firstName: { $regex: new RegExp(firstName, 'i') },
			lastName: { $regex: new RegExp(lastName, 'i') },
			matricNumber: { $regex: new RegExp(matricNumber, 'i') }
		  });

		const classSession = await classSessionModel.findOne({ _id: classSessionId });

		if (!user) {
			return res.status(404).json({ error: "Student doesnt exist, please enter valid student input!"});
		}

		if (!classSession) {
			return res.status(404).json({ error: "Class session doesnt exist!"});
		}

		const student = await attendanceModel.findOne({ teacherId, classSessionId, matricNumber });

		if (student) {
			return res.status(409).json({ error: "Student already added!"});
		}

		const newStudent = new attendanceModel({
			teacherId, firstName, lastName, matricNumber, classSessionId, studentId: user._id
		});

		const addedToAttendanceList = await newStudent.save();

		if (!addedToAttendanceList) {
            return res.status(500).json({ error: "Error occured trying to add user!" });
        }

        console.log("Added student to Attendees", addedToAttendanceList);
        return res.status(200).json({ message: "Student added successfully!" });

	} catch (error) {
		console.error("Internal Server Error:", error);
		return res.status(500).json({ error: "Internal Server Error!"})
	}

};


const deleteAttendeeFromAttendanceListFunction = async (req, res) => {
	const { teacherId, classSessionId, studentId } = req.body;
  console.log('delete attendeee', teacherId, classSessionId, studentId)
	if (!teacherId) {
	  return res.status(400).json({ error: "Couldn't identify you, logout and login again!" });
	}
	if (!classSessionId) {
	  return res.status(400).json({ error: "Can't identify Class Session!" });
	}

	if (!studentId) {
		return res.status(400).json({ error: "Can't identify Student!" });
	}
  
	try {
	  const deletedStudent = await attendanceModel.findOneAndDelete({
		classSessionId,
		studentId
	  });
  
	  if (!deletedStudent) {
		return res.status(404).json({ error: "Student not found in the Attendance List!" });
	  }
  
	  return res.status(200).json({ message: "Student removed from the attendance list successfully!" });
	} catch (error) {
	  console.error("Internal Server Error:", error);
	  return res.status(500).json({ error: "Internal Server Error!" });
	}

};



module.exports = {
    signUpFunction,
	signInFunction,
	createClassSession,
	fetchCreactedClassSessionsFunction,
	fetchAttendeesFunction,
	deleteClassSessionFunction,
	addStudentFunction,
	deleteAttendeeFromAttendanceListFunction
}