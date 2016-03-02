var debugMode = false;
Error.stackTraceLimit = 2;

//var util = require('util');

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');

//********* LOAD MODULES *************
var include = require('./my_modules/moduleLoader.js');

var geolib = include('geolib');
var colors = include('colors');
var log = include('log');
var emitModule = include('emit');
var userModule = include('users');
var gameState = include('gameState');


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

//*******SET UP SHORTCUTS FOR KEY VARIABLES/GAME CLASSES:

var players = gameState.players;
var teams = gameState.teams;
var hubs = gameState.hubs; //this should alter data in gamestate when altered
log("Starting hubs are: ", colors.yellow.inverse);
log(hubs);


/*––––––––––– SOCKET.IO starts here –––––––––––––––*/
io.on('connection', function(socket) {

	//create new instance of emit module for each socket
	var emitTo = emitModule(io, socket);
	var player = {};

	var tracking;
	var trackUpdate; //will hold tracking timeout interval

	log('The user ' + socket.id + ' just connected!', colors.yellow);
	emitTo.socket('connected', {});

	//=================================
	//SESSION/PLAYER-SCOPED FUNCTIONS:
	//=================================

	var checkPlayerType = function() {
		var existingUserIDs = [];
		for (p in players) {
			log("Existing player: " + players[p].userID);
			existingUserIDs.push(players[p].userID);

		}

		log("ExistingIDs List length: " + existingUserIDs.length);
		emitTo.socket('playerTypeCheck', {
			userIDs: existingUserIDs
		});
		log("Checking if new player...");
	};

	var getTeam = function(hash) {

		log("teamhash is: " + hash);
		var t;
		if (teams[hash] !== undefined) {
			t = teams[hash];
		} else {
			t = teams[gameState.teamPickMethod](); //teams['default'];
		}
		log('Team is: ' + t);
		return t;
	};

	var startTracking = function() {
		player.clearDark();
		//player.trackActive = true;
		log('Started tracking ' + player.userID, colors.green);
		player['lastLocReqTime'] = Date.now();
		player['lastReqResRcvd'] = false;

		emitTo.socket('getLocation', {
			firstPing: true,
			trackingInterval: gameState.trackingInterval,
			timestamp: player.lastLocReqTime
		});

		tracking = setInterval(function() {

			player['lastLocRequest'] = gameState.newLocRequest();
			player['lastReqResRcvd'] = false;
			emitTo.socket('getLocation', player.lastLocRequest);

			//timeout = setTimeout(function() {
			// if (!player.lastLocRequest.resReceived) {
			setTimeout(function() {
				if (!player.lastReqResRcvd && !player.goneDark) {
					// log("No response from client", colors.red);
					// log("Player " + player.userID + " has gone dark.", colors.err);
					player.setDark();
					//player.trackActive = false;
					clearInterval(tracking);
				}
			}, 6000);//gameState.trackingInterval);

		}, gameState.trackingInterval);
	};

	var getHubsByDistance = function() {

		log("Finding hubs by distance to " + player.userID, colors.standout);

		var hubsObj = {};

		for (i in hubs) {
			//is key same as index? Testing killing hub 3 seemed to work
			if (hubs[i].live) {
				hubsObj[i] = {
					"latitude": hubs[i].lat,
					"longitude": hubs[i].lng //,
					//"name": hubs[i].name
				};
			}

		}

		var sortedHubs = geolib.orderByDistance({
			"latitude": player.locationData[0].lat,
			"longitude": player.locationData[0].lng
		}, hubsObj);

		for (i in sortedHubs) {
			var matchingHub = hubs[sortedHubs[i].key];
			for (prop in matchingHub) {
				sortedHubs[i][prop] = matchingHub[prop];
			}
		}

		log("Sorted hubs by distance: ");
		log(sortedHubs);

		return sortedHubs;

	};

	var updateAttackingPlayers = function(aHub, removePlayer) {
		log("Checking for " + player.userID + " in attacking players for " + aHub.id);
		var playerFound = false;
		for (i in aHub.attackingPlayers) {
			if (player.userID == aHub.attackingPlayers[i]) {
				playerFound = true;

				if (removePlayer) {
					aHub.attackingPlayers.splice(i, 1);
					log("Removed " + player.userID + "from attacking players; new length is: ", colors.standout);
					log(aHub.attackingPlayers.length, colors.standout);

				}
				break;
			}
		}
		if (!removePlayer && !playerFound) {
			aHub.attackingPlayers.push(player.userID);
			log("Adding " + player.userID + "to Attacking Players for " + aHub.id, colors.magenta);
		}

	};

	// log('The user ' + socket.id + ' just connected!', colors.yellow);
	// emitTo.socket('connected', {});

	//=================================
	//CLIENT MESSAGE HANDLER:
	//=================================
	socket.on('clientMsg', function(res, err) {

		var handleClientMsg = {

			clientInitialized: function() {
				log(socket.id + " is initialized!", colors.yellow);
				checkPlayerType();
			},

			newPlayer: function() {
				player = userModule(players, socket); //instantiate new player object

				var team = getTeam(res.teamHash); //create player
				player.create(team);
				player.addToTeam(team);

				players[player.userID] = player; //add player to playersObject
				//log("Total # of players: " + gameState.playerCount());
				log("Total # of players: " + gameState.playerCount);
				log('Added player to database:');
				log(players[player.userID]);

				//send new ID to player:
				emitTo.socket('newUserID', {
					newID: player.userID,
					team: player.team
				});

			},

			returningPlayer: function() {
				log('Requesting update of player ' + players[res.userID].userID, colors.italic);
				players[res.userID].update(socket);
				player = players[res.userID];
				player.addToTeam(player.team);
				log("'Player' for socket " + socket.id + " is now:", colors.yellow.inverse);
				log(player);

				player.connected = true;

				emitTo.socket('returningReadyCheck', {
					team: player.team
				});
			},

			readyToPlay: function() {
				player.connected = true;
				startTracking();

				switch (player.team) {
					case 'gov':
						emitTo.socket('govStartData', {
							playStarted: player.playStarted,
							hubs: hubs,
							introContent: gameState.settings.introContent
						});

						break;
					case 'ins':
					default:
						emitTo.socket('insStartData', {
							playStarted: player.playStarted,
							hubs: hubs,
							introContent: gameState.settings.introContent
						});
						break;
				}
			},

			introCompleted: function() {
				player.playStarted = true;
			},

			locationUpdate: function() {
				// var elapsed = (Date.now() - res.reqTimestamp) / 1000;
				// log("Response received " + elapsed + "sec after req sent");
				player.lastReqResRcvd = true;

				var elapsed = (Date.now() - res.reqTimestamp) / 1000;
				log("Response received " + elapsed + "sec after req sent");

				var storeLocation = function() {
					//clearInterval(timeout);
					player.locationData.unshift(res.locData);
					//log('Latest location data for ' + player.userID + ":");
					//log(player.locationData[0]);
				};

				storeLocation();

				if (!player.trackActive || player.goneDark) {
					player.clearDark();
					startTracking();
				}
				// if (res.timestamp - player.lastLocReqTime < gameState.trackingInterval) {
				// 	storeLocation();
				// } else if (res.reqTimestamp === player.lastLocRequest.timestamp) {
				// 	player.lastLocRequest.resReceived = true;
				// 	storeLocation();
				// 	if (!player.trackActive || player.goneDark) {
				// 		player.goneDark = false;
				// 		startTracking();
				// 	}

				// }

			},

			findSuspects: function() {
				newLocData = {}; //getInsLocData();

				for (p in players) {
					var dataAgeLimit = Date.now() - gameState.suspectTrailDuration;

					var locArray = [];
					if (players[p].team == 'ins' && !players[p].lockedOut) {
						locArray = players[p].getLocationData(dataAgeLimit);
					} else {
						locArray = [players[p].getLastLocation()];
					}

					if (locArray.length > 0) {

						newLocData[players[p].userID] = {
							team: players[p].team,
							type: players[p].type,
							lockedOut: players[p].lockedOut,
							goneDark: players[p].goneDark,
							locData: locArray,
							oldestTime: dataAgeLimit
						};
					}
					//}
				}

				//log('First bit of data to be sent to ' + socket.id + ":");
				//log(newLocData);
				emitTo.socket('suspectData', {
					locData: newLocData
				});
			},

			agentGettingClose: function() {
				var otherPlayer = players[res.otherPlayerID];
				if (!otherPlayer.warned[res.distance]) {
					log("Warning " + otherPlayer.userID + "of Gov proximity", colors.orange);

					otherPlayer.warned[res.distance] = true;
					emitTo.user(otherPlayer, "agentCloseWarning", {
						distance: res.distance
					});
					var warningResetTime = 180000;
					log("Will reset warning for " + res.distance + "to false in " + warningResetTime / 60000 + " minutes.");

					setTimeout(function() {
						otherPlayer.warned[res.distance] = false;
					}, warningResetTime);
				}
			},

			capturedPlayer: function() {
				var lockedPlayer = players[res.userID];
				log("Lockout request received for " + lockedPlayer.userID);
				//	this might be better in separate fn with emits as callbacks
				lockedPlayer.lockout();
				emitTo.user(lockedPlayer, 'lockoutAlert', {
					capturingPlayer: player.userID
				});

				emitTo.all('playerLockoutsUpdate', {
					'lockedPlayer': lockedPlayer,
					'capturingPlayer': player.userID
				});
			},

			detectHubs: function() {
				emitTo.socket('hubsByDistance', {
					hubsByDistance: getHubsByDistance()
				});
			},

			hubHackProgress: function() {

				var attackedHub = hubs[res.hubIndex];

				var decr = attackedHub.hackTime / attackedHub.hackProgressInterval;
				log("Decrements are: " + decr);
				//...then divide 100 by that to get health decrement:
				attackedHub.health -= (100 / decr);
				log("Hub " + attackedHub.id + " health decreased to " + attackedHub.health);


				if (attackedHub.health <= 0) {
					attackedHub.health = 0;
					attackedHub.live = false;
					var hubsLeft = gameState.liveHubCount();
					log("Live hubs remaining: " + hubsLeft + " / " + hubs.length, colors.yellow.inverse);
					log("Downed Hub is now:",colors.err);
					log(attackedHub);
					log("All hubs are:");
					log(hubs);
					
					emitTo.socket('hackComplete', {
						hubName: attackedHub.name
					});
					setTimeout(function() {
						emitTo.all('hubDown', {
							hubName: attackedHub.name,
							hubID: attackedHub.id,
							hubIndex: res.hubIndex,
							liveHubsLeft: hubsLeft
						});
					}, 1000);

				} else {

					updateAttackingPlayers(attackedHub, false);
					// var decr = attackedHub.hackTime / attackedHub.hackProgressInterval;
					// console.log("Decrements are: " + decr);
					// //...then divide 100 by that to get health decrement:
					// attackedHub.health -= (100 / decr);
					// console.log("Hub " + attackedHub.id + " health decreased to " + attackedHub.health);
					var prevAlertState = attackedHub.alertState;

					attackedHub.setAlertState();
					emitTo.socket('hubHealthUpdate', {
						hubName: attackedHub.name,
						healthLeft: attackedHub.health
					});

					if (attackedHub.alertState !== prevAlertState) {
						emitTo.team('gov', 'hubAttackUpdate', {
							hubName: attackedHub.name,
							healthLeft: attackedHub.health,
							hubID: attackedHub.id,
							hubIndex: res.hubIndex,
							hubAlertState: attackedHub.alertState,
							latestHubInfo: attackedHub
							//hubIndex: hubs.indexOf(attackedHub)
						});
					}
				}
			},

			playerLeftHubRange: function() {
				var attackedHub = hubs[res.hubIndex];
				updateAttackingPlayers(attackedHub, true);

				if (attackedHub.attackingPlayers.length < 1) {
					attackedHub.alertState = 0;
					emitTo.team('gov', 'hubAttackStopped', {
						hubName: attackedHub.name,
						hubID: attackedHub.id,
						hubIndex: res.hubIndex,
						hubAlertState: attackedHub.alertState,
						latestHubInfo: attackedHub
					});
				}
			}

		};

		if (debugMode) {
			handleClientMsg[res.tag]();
		} else {
			//When not debugging, use this to prevent server crashes
			try {
				handleClientMsg[res.tag]();
			} catch (err) {
				//err.stackTraceLimit = 2;
				log('Error: "' + res.tag + '" is not a valid socket.on message because:', colors.err);
				log(err.stack, colors.err);
			}
		}

	});

	// when a client disconnects
	socket.on('disconnect', function() {
		log('User ' + socket.id + ' just disconnected.', colors.yellow);

		// if (player.trackActive) {
		// 	clearInterval(tracking);
		// }

		try {
			//player.removeFromTeam(player.team);
			clearInterval(tracking);
			player.disconnect();
		} catch (err) {
			//err.stackTraceLimit = 2;
			log(err.stack, colors.err);
		}

		log('current players: ' + gameState.playerCount);
		log('current connected users: ' + io.sockets.sockets.length);

	});

});