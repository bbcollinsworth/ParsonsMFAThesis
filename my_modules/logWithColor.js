module.exports = function(text, styling) {

	var t = text.toString();
	if (styling !== undefined) {
		console.log(styling(t));
	} else {
		console.log(t);
	}

};