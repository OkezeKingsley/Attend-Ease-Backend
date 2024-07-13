const classSessionModel = require('../models/classSessionModel');

//Let run a background job every minute that automatically expires 
//the classSession once the end time for the classSession have reached.
const expireClassSession = async () => {

	try {
		const classSessions = await classSessionModel.find({ expired: false });
		classSessions.forEach(async (classSession) => {
		const classSessionStartTime = new Date(classSession.startTime);
		const classSessionEndTime = new Date(classSession.endTime);
		const currentdate = new Date();

		if (currentdate >= classSessionEndTime) {
			classSession.status = "passed";
			classSession.expired = true;
			await classSession.save();
		} else if (currentdate >= classSessionStartTime && currentdate <= classSessionEndTime) {
			classSession.status = "ongoing";
			await classSession.save();
		} else if (currentdate < classSessionStartTime) {
			classSession.status = "future";
			await classSession.save();
		}
			});
		} catch (error) {
			console.error("Error updating class sessions:", error);
		}
	

}



module.exports = expireClassSession;