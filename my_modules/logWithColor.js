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

	try {
		console.log(styling(t));
	} catch (err) {
		console.log(t);

		if (styling !== undefined) {
			console.log(colors.bgRed("(" + err + ")"));
		}
	}

	// if (styling !== undefined) {
	// 	console.log(styling(t));
	// } else {
	// 	console.log(t);
	// }

};