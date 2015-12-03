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
var userModule = require('./my_modules/users.js');
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
	log(serverUpString, colors.cyan.inverse);
});

//var players = [];
var players = {};


/*––––––––––– SOCKET.IO starts here –––––––––––––––*/
io.on('connection', function(socket) {

	var checkPlayerType = function() {
        var existingUserIDs = [];
        for (p in players) {
            console.log("Existing player: " + players[p].userID);
            existingUserIDs.push(players[p].userID);
        }

        console.log("ExistingIDs List length: " + existingUserIDs.length);
        emitTo.socket('playerTypeCheck', {
            userIDs: existingUserIDs
        });
        console.log("Checking if new player...");
    };

	//create new instance of emit module for each socket
	var emitTo = emitModule(io, socket);
	var player = userModule(players, socket);

	log('The user ' + socket.id + ' just connected!', colors.yellow);
	emitTo.socket('connected', {});


	player.create('ins');
	players[player.userID] = player;
	console.log('Added player to database:');
	console.log(players[player.userID]);
	// players.push(player);
	// log('Added player ' + player.userID + " to players array");

	socket.on('clientMsg', function(res, err) {

		var handleClientMsg = {
			mapLoaded: function(){
				log("Map ready for " + socket.id);
			},
			clientReady: function(){
				log(socket.id + "ready to play!", colors.magenta.inverse);
				checkPlayerType();
			},
			playerType: function(){

			}
		};

		handleClientMsg[res.tag]();

		// switch (res.tag) {
		// 	case 'mapLoaded':
		// 		log("Map ready for " + socket.id);
		// 		//console.log("Map ready for " + socket.id);
		// 		break;
		// 	case 'clientReady':
		// 		log(socket.id + "ready to play!", colors.magenta.inverse);
		// 		//console.log("Map ready for " + socket.id);
		// 		checkPlayerType();
		// 		break;
		// 	case 'playerType':
		// 		break;
		// }

	});

});

