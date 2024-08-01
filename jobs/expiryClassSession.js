const classSessionModel = require('../models/classSessionModel');

//Let run a background job every minute that automatically expires 
//the classSession once the end time for the classSession have reached.
const expireClassSession = async () => {

	try {
		const classSessions = await classSessionModel.find({ expired: false });

		for (let i = 0; i < classSessions.length; i++) {
		  const classSession = classSessions[i];
		  const classSessionDate = new Date(classSession.date);
		  const classSessionStartTime = new Date(`${classSessionDate.toISOString().split('T')[0]}T${classSession.startTime}`);
		  const classSessionEndTime = new Date(`${classSessionDate.toISOString().split('T')[0]}T${classSession.endTime}`);
		  const currentdate = new Date();
	
		  if (currentdate >= classSessionEndTime) {
			classSession.status = "Passed";
			classSession.expired = true;
		  } else if (currentdate >= classSessionStartTime && currentdate <= classSessionEndTime) {
			classSession.status = "Ongoing";
		  } else if (currentdate < classSessionStartTime) {
			classSession.status = "Soon";
		  }

		  await classSession.save({ new: true });
		}

	  } catch (error) {
		console.error("Error updating class sessions:", error);
	  }

}



module.exports = expireClassSession;