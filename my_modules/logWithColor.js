module.exports = function(text, styling) {

	// var include = require('./moduleLoader.js');
	// var util = include('util');

	var t = "";
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
	} catch (err) {
		console.log(t);

		if (styling !== undefined) {
			console.log(colors.bgRed("(" + err + ")"));
		}
	}

};