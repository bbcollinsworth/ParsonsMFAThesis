var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');

var geolib = require('geolib');

var colors = require('colors');
//custom console logging function
function log(text, styling) {
	var t = text.toString();
	if (styling !== undefined) {
		console.log(styling(t));
	} else {
		console.log(t);
	}
}

var emitModule = require('./my_modules/emit.js');
//var emitTo = require('./my_modules/emit.js')(io);
//emitTo.start(io); //pass io to emitTo module

app.use(bodyParser.json());
app.use(function(req, res, next) {
	// Setup a Cross Origin Resource sharing
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
	console.log(('incoming request from ---> ' + ip).gray);
	// Show the target URL that the user just hit
	var url = req.originalUrl;
	console.log(('### requesting ---> ' + url).gray);
	next();
});

app.use('/', express.static(__dirname + '/public'));

server.listen(process.env.PORT || port, function() {
	var serverUpString = 'Server running at port:' + port + ' ';
	log(serverUpString,colors.cyan.inverse);
});


/*––––––––––– SOCKET.IO starts here –––––––––––––––*/
io.on('connection', function(socket) {

	//can I create a new for each socket? should prob be (io,socket)
	var emitTo = new emitModule(io);

	//emit TO THIS SOCKET function
	var emit = function(tag, emitObj) {
		emitObj['tag'] = tag;
		socket.emit('serverMsg', emitObj);
		log('Sending ' + tag + ' to ' + socket.id,colors.blue);
	};

	//WHAT HAPPENS ON NEW SOCKET CONNECTION:
	log('The user ' + socket.id + ' just connected!',colors.yellow);

	emit('handshake', {});

	socket.on('clientMsg', function(res, err) {

		switch (res.tag) {
			case 'mapLoaded':
				log("Map ready for " + socket.id);
				//console.log("Map ready for " + socket.id);
				break;
		}

	});

});

