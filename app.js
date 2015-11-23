var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');
var geolib = require('geolib');
var colors = require('colors');

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

server.listen(process.env.PORT || 9000, function() {
	var serverUpString = 'Server running at port:' + port + ' ';
	console.log(serverUpString.cyan.inverse);
});



/*––––––––––– SOCKET.IO starts here –––––––––––––––*/
io.on('connection', function(socket) {

	//WHAT HAPPENS ON NEW SOCKET CONNECTION:
	console.log(('The user ' + socket.id + ' just connected!').yellow);

	io.to(socket.id).emit('handshake', {});
	console.log('Sending handshake...');
});