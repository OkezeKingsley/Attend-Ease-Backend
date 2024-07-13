const studentModel = require('../models/studentModel');
const attendanceModel = require('../models/attendanceModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const teacherModel = require('../models/teacherModel');
const classSessionModel = require('../models/classSessionModel');

const jwt_secret = process.env.JWT_SECRET_KEY;

const signUpFunction = async (req, res) => {

    const { firstName, lastName, email, password, matricNumber } = req.body;
    console.log(" data receive", firstName, lastName, email, password, matricNumber);
   
	try {
        if (!firstName || !lastName || !email || !password || !matricNumber) {
            return res.status(400).json({ error: "All field required!"})
        }

        // Check if email already exist in the database of student and teacher
		const userExistAsTeacher = await teacherModel.findOne({ email });
		const student = await studentModel.findOne({ email });

		if (userExistAsTeacher) {
			return res.status(401).json({ error: 'User already exist as Teacher!' });
		}

		if (student) {
			return res.status(401).json({ error: 'User already exist!' });
		}

		// Hash password using bcrypt
		const salt = bcrypt.genSaltSync(10);
		const hashedPassword = bcrypt.hashSync(password, salt);

		const newStudent = await studentModel.create({ firstName, 
													lastName,
													email, 
													password: hashedPassword, 
													matricNumber, 
												  });

        if (!newStudent) {
            return res.status(401).json({ error: "Error creating account!"})
        }
		
		console.log("account created", newStudent)
        return res.status(201).json({ message: "Account created!"});

	} catch (error) {
		console.log('Sign up error', error);
		return res.status(500).json({ error: 'Internal Server Error' });
	}
}




// Login function
const signInFunction = async (req, res) => {
	const { email, password } = req.body;

	try {
		if (!email || !password) {
			return res.status(400).json({ error: 'Please fill al required field!' });
		}

		const student = await studentModel.findOne({ email });

		if (!student) {
			return res.status(404).json({ error: 'Account does not exist!' });
		}

		const isPasswordValid = bcrypt.compareSync(password, student.password);

		if (!isPasswordValid) {
			return res.status(401).json({ error: 'Invalid password' });
		}


		if (student.role !== "student") {
			return res.status(403).json({ error: "This login is for Student only!"})
		}

		// 	// Create a Token
		const payload = { id: student._id.toString() };
		const token = jwt.sign(payload, jwt_secret, {
			expiresIn: '1d',
			algorithm: 'HS256',
		});

		// Update your server response to include the token in the JSON response instead of setting it as a cookie, since mobile clients can't directly access cookies like web clients can.

		if (!token) {
			return res.status(500).json({ error: 'Unexpected error during login!' });
		} 
		console.log("login data to send to client", student)
		return res.status(200).json({ 
									studentId: student._id, 
									firstName: student.firstName, 
									lastName: student.lastName, 
									matricNumber: student.matricNumber,
									token: token
								});

	} catch (error) {
		console.log("actual eror student login", error)
		return res.status(500).json({ error: 'Internal Server Error' });

	}
};




const markAttendanceFunction = async (req, res) => {

	try {
		const { classSessionId, studentId } = req.body;
		console.log("student to add to list", classSessionId, studentId );

		if (!classSessionId || !studentId) {
			return res.status(400).json({ error: 'Could not identify user or event!' });
		}
		// Check if class session and student exist
		const classSession = await classSessionModel.findOne({ _id: classSessionId });
		const student = await studentModel.findOne({ _id: studentId });
	
		if (!classSession) {
		  return res.status(404).json({ error: 'Qr code not recognised!' });
		}
	
		if (!student) {
		  return res.status(404).json({ error: 'Student not found!' });
		}

		if (classSession.expired === true) {
			return res.status(403).json({ error: 'Event alread expired!' });
		}

	    const currentTime = new Date();
		const startDate = new Date(`${classSession.date}T${classSession.startTime}`);
		const endDate = new Date(`${classSession.date}T${classSession.endTime}`);

		if (currentTime < startDate) {
			return res.status(403).json({ error: 'Event has not started yet!' });
		} 
		
		if (currentTime > endDate) {
			return res.status(403).json({ error: 'Event has ended!' });
		}


		// Check if the student has already been marked as present
		const existingAttendance = await attendanceModel.findOne({ classSessionId, studentId });
	
		if (existingAttendance) {
		  return res.status(409).json({ error: 'Student already marked as present' });
		}
	
		// Create new attendance record
		const attendance = new attendanceModel({ 
			teacherId: classSession.teacherId,
			classSessionId, 
			studentId,
			firstName: student.firstName, 
			lastName: student.lastName, 
			matricNumber: student.matricNumber
		});
		const savedAttendance = await attendance.save();

		if (!savedAttendance) { 
			return res.status(500).json({ error: "Error occured while marking attendance!"})
		}
	
		return res.status(201).json({ message: 'You’ve been added to the attendance list!', attendance });

	  } catch (error) {
		console.error("error marking attendance", error);
		return res.status(500).json({ error: 'Internal Server Error' });
	  }

}



const fetchAttendanceHistory = async (req, res) => {
	const { studentId } = req.body;

	try {
	  if (!studentId) {
		return res.status(400).json({ error: "Can't identify you!" });
	  }
  
	  //Check if student exist in DB
	  const student = await studentModel.findOne({ _id: studentId });
  
	  if (!student) {
		return res.status(404).json({ error: "User doesn't exist" });
	  }
  
	  //Fetch all attendance that that student have taken
	  const attendanceHistory = await attendanceModel.find({ studentId });
  
	  if (!attendanceHistory.length) {
		return res.status(404).json({ error: "No attendance recorded" });
	  }

  	 console.log("atendance history", attendanceHistory);

	  // Fetch class session data for each attendance record using a normal for loop
	  const detailedAttendanceHistory = [];
	  for (let i = 0; i < attendanceHistory.length; i++) {
		const attendance = attendanceHistory[i];
		const classSession = await classSessionModel.findById(attendance.classSessionId);
		if (classSession) {
		  detailedAttendanceHistory.push({
			className: classSession.className,
			status: attendance.status,
			date: attendance.createdAt,
			time: attendance.registrationTime,
		  });
		}
	  }
  
	  // Respond with the detailed attendance history
	  return res.status(200).json(detailedAttendanceHistory);
  
	} catch (error) {
	  return res.status(500).json({ error: "Internal Server Error!" });
	}
  };
  





module.exports = {
    signUpFunction,
    signInFunction,
	markAttendanceFunction,
	fetchAttendanceHistory
}