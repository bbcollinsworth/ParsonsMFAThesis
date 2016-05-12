module.exports = function(text, styling) {

	var t = "";

	var addToLog = function(info) {

		// var safeStringify = function(obj) {
		// 	var isJSONstring = false;
		// 	var contentToReturn = "";
		// 	if (typeof obj === 'string' || obj === undefined) {
		// 		//console.log('this is a string or undefined!');
		// 		contentToReturn = obj;
		// 	} else if (typeof obj === 'object') {
		// 		//console.log('this is an object!');
		// 		isJSONstring = true;
		// 		try {
		// 			contentToReturn = JSON.stringify(obj); //,
		// 			// 	JSONstring: isJSONstring
		// 			// };
		// 		} catch (error) {
		// 			//isJSONstring = true;
		// 			console.log("Stringify error:");
		// 			console.log(error);
		// 			var simpleObject = {};
		// 			for (var prop in obj) {
		// 				if (!obj.hasOwnProperty(prop)) {
		// 					continue;
		// 				}
		// 				if (typeof(obj[prop]) == 'object') {
		// 					continue;
		// 				}
		// 				if (typeof(obj[prop]) == 'function') {
		// 					continue;
		// 				}
		// 				simpleObject[prop] = obj[prop]; //.toString();

		// 			}
		// 			contentToReturn = JSON.stringify(simpleObject);
		// 			// return {
		// 			// 	content JSON.stringify(simpleObject),
		// 			// 	JSONstring: isJSONstring
		// 			// };
		// 		}
		// 		//return JSON.stringify(simpleObject); // returns cleaned up JSON
		// 	} else if (obj !== undefined) {
		// 		//console.log('this is not an object!');
		// 		contentToReturn = obj.toString();
		// 	}

		// 	return contentToReturn;//,
		// 		//JSONstring: isJSONstring
		// 	//};
		// };

		var convertTimestamp = function(t, withSeconds) {
			// FROM http://stackoverflow.com/questions/847185/convert-a-unix-timestamp-to-time-in-javascript
			var date = new Date(t); //*1000);

			var hours = date.getHours(); // hours part from the timestamp
			hours = (hours % 12 === 0) ? 12 : hours % 12;
			var minutes = "0" + date.getMinutes(); // minutes part from the timestamp
			var seconds = "0" + date.getSeconds(); // seconds part from the timestamp

			var formattedTime = hours + ':' + minutes.substr(-2); // + ':' + seconds.substr(-2);
			if (withSeconds) {
				formattedTime += ":" + seconds.substr(-2);
			}
			return formattedTime;
		};

		var now = Date.now();
		var logTime = convertTimestamp(now,true)+"-"+now;

		logFile[logTime] = info;
		// console.log("Added to server log at "+logTime+": ");
		// console.log(logFile[logTime]);
	};

	if (typeof text === 'object') {

		var options = {
			colors: true
		};
		if (styling !== undefined) {
			options.colors = false;
		}
		t = util.inspect(text, options);

	} else {
		t = text.toString();
	}

	try {
		console.log(styling(t));
		addToLog(JSON.stringify(t));

	} catch (err) {
		console.log(t);
		addToLog(t);

		if (styling !== undefined) {
			console.log(colors.bgRed("(" + err + ")"));
		}
	}

};