module.exports = function(text, styling) {

	var colors = require('colors');

	//var customLogging = {
		var t = text.toString();
		if (styling !== undefined) {
			console.log(styling(t));
		} else {
			console.log(t);
		}
	//};
	//return customLogging;
};