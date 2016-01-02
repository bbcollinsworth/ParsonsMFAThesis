module.exports = function(text, styling) {

	var t = text.toString();

	// var theme = {
	// 	sendingMsg: colors.magenta,
	// 	error: colors.red
	// };

	// colors.setTheme({
	// error: colors.red,

	// });

	// try {
	// 	styling = theme[styling];
	// } catch (err) {
	// 	styling = styling;
	// }

	if (styling !== undefined) {
		console.log(styling(t));
	} else {
		console.log(t);
	}

};