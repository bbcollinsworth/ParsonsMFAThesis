var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');

var geolib = require('geolib');

var colors = require('colors');
var log = require('./my_modules/logWithColor.js');

var emitModule = require('./my_modules/emit.js');
var userModule = require('./my_modules/users.js');
var gameState = require('./my_modules/gameState.js');
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
// var players = {

// };
var players = gameState.players;

// var playerCount = function() {
// 		var numberOfPlayers = 0;
// 		for (p in players) {
// 			numberOfPlayers++;
// 		}
// 		return numberOfPlayers;
// 	};

var teams = {
	'g': 'gov',
	'i': 'ins',
	'default': 'ins'
};


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
	var player = {}; //userModule(players, socket);

	log('The user ' + socket.id + ' just connected!', colors.yellow);
	emitTo.socket('connected', {});

	//client message handler:
	socket.on('clientMsg', function(res, err) {

		var getTeam = function(hash) {
			log("teamhash is: " + hash);
			var t;
			if (teams[hash] !== undefined) {
				t = teams[hash];
			} else {
				t = teams['default'];
			}
			log('Team is: ' + t);
			return t;
		};

		var handleClientMsg = {

			// mapLoaded: function() {
			// 	log("Map ready for " + socket.id);
			// },

			clientReady: function() {
				log(socket.id + "ready to play!", colors.magenta.inverse);
				checkPlayerType();
			},

			newPlayer: function() {
				player = userModule(players, socket); //instantiate new player object

				var team = getTeam(res.teamHash); //create player
				player.create(team);
				player.addToTeam(team);

				players[player.userID] = player; //add player to playersObject
				log("Total # of players: " + gameState.playerCount());
				log('Added player to database:');
				log(players[player.userID]);

				//send new ID to player:
				emitTo.socket('newUserID', {
					newID: player.userID
				});
			},

			returningPlayer: function() {
				log('Requesting update of player ' + players[res.userID].userID, colors.italic);
				players[res.userID].update(socket);
				player = players[res.userID];
				player.addToTeam(player.team);
				log("'Player' for socket " + socket.id + " is now:", colors.red.inverse);
				console.log(player);
			}
		};

		handleClientMsg[res.tag]();

	});

});