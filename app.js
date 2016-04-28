var debugMode = false;
Error.stackTraceLimit = 2;

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');

//********* LOAD MODULES *************
var include = require('./my_modules/moduleLoader.js');

include('globalModules');
var gameState = include('gameState');

gameState.createGameSession(Date.now());


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
gameState.setupHubs();
log("Starting hubs are: ", colors.yellow.inverse);
log(hubs);
gameState.startingHubs = gameState.liveHubCount;
log("Starting Hub count is: " + gameState.startingHubs, colors.alert);

/*––––––––––– ADMIN SOCKET.IO starts here –––––––––––––––*/

admin.on('connection', function(socket) {
	console.log('ADMIN CONNECTED!');
	socket.emit('greeting', {
		msg: "You're connected as admin!",
		logs: gameState.playerLogs
	});

});


/*––––––––––– SOCKET.IO starts here –––––––––––––––*/
io.on('connection', function(socket) {

	//create new instance of emit module for each socket
	var emitTo = emitModule(io, socket);
	var player = {};

	var tracking;
	var trackUpdate; //will hold tracking timeout interval

	log('The user ' + socket.id + ' just connected!', colors.yellow);
	//emitTo.socket('connected', {});
	socket.emit('connected', {
		gameStartTime: gameState.startTime
	});

	//=================================
	//SESSION/PLAYER-SCOPED FUNCTIONS:
	//=================================

	var checkPlayerType = function() {
		var existingUserIDs = [];
		for (var p in players) {
			log("Existing player: " + players[p].userID);
			existingUserIDs.push(players[p].userID);

		}

		log("ExistingIDs List length: " + existingUserIDs.length);
		emitTo.socket('playerTypeCheck', {
			userIDs: existingUserIDs,
			gameStartTime: gameState.startTime
		});
		log("Checking if new player...");
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
					clearInterval(tracking);
				}
			}, 6000); //gameState.trackingInterval);

		}, gameState.trackingInterval);
	};

	var insWinCheck = function() {
		var hubsDown = gameState.startingHubs - gameState.liveHubCount;
		log("There are " + hubsDown + " Hubs down.", colors.alert);

		if (hubsDown >= gameState.settings.hubDownTarget) {
			log("Ins win condition met!");
			emitTo.all('insWon', {});
		}
	};

	var govWinCheck = function() {
		if (gameState.liveInsCount < 1) {
			log("No Ins left - Gov win condition met!");
			emitTo.all('govWon', {});
		} //else 

		// if (gameState.lockoutCount == 1) {
		// 	emitTo.team('gov', 'playMessage', {
		// 		toPlay: 'file1'
		// 	});
		// }
	};

	//=================================
	//CLIENT MESSAGE HANDLER:
	//=================================
	socket.on('clientMsg', function(res, err) {

		var handleClientMsg = {

			clientLogMsg: function() {
				if (!(res.userID in gameState.playerLogs)) {
					gameState.playerLogs[res.userID] = {};
				}
				//var logItem = res.time + ": " + res.content;
				var t = res.time;
				var c = res.content;
				//log("Content: ");
				//log(c,colors.alert);
				var ln = res.trace;

				//gameState.playerLogs[res.userID][t] = c + res.trace;
				gameState.playerLogs[res.userID][t] = {
					message: c,
					trace: ln
				};

			},

			clientListening: function() {
				//player.connected = true;
				emitTo.socket('mapInitCheck', {});
			},

			clientInitialized: function() {
				log(socket.id + " server and map are initialized!", colors.yellow);
				checkPlayerType();
			},

			connectedCheck: function() {
				log('The user ' + player.userID + " / " + socket.id + ' pinged to see if still connected.', colors.yellow);
				emitTo.socket('stillConnected', {});
			},

			geoTestStart: function() {
				log(player.userID + " clicked GeoTest");
				player.geoTestWait = setTimeout(function() {
					log("10 seconds passed since geotest clicked");
				}, 10000);

			},

			geoTestResult: function() {
				clearTimeout(player.geoTestWait);

				log('GeoTest result for ' + player.userID + " is:", colors.hilite);
				log(res);

				var resultEval;
				var refreshOnNextTest = false;

				if (!res.errorMsg) {
					log("No error msg from client on GeoTestResult");
					if (typeof res.playerPos.lat === 'number') {
						resultEval = 'success';
						player.locationData.unshift(res.playerPos);
						log("With GeoTest success, player Location updated to: ", colors.bgGreen);
						log(player.locationData);
					} else {
						resultEval = 'failUnknown';
					}
				} else {
					switch (res.errorCode) {
						case 1:
							resultEval = 'blocked';
							refreshOnNextTest = 'true';
							break;
						default:
							resultEval = 'failUnknown';
							break;
					}
				}

				//var resultEval = 'failure';
				log("Sending GeoTest finding " + resultEval + " to " + player.userID);

				emitTo.socket('geoTestServerEval', {
					finding: resultEval,
					shouldRefresh: refreshOnNextTest
				});
			},

			newPlayer: function() {
				player = userModule(players, emitTo); //socket); //instantiate new player object
				var team = gameState.getTeam(res.teamHash); //create player
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

				//var check = gameState.liveInsCount;

			},

			returningPlayer: function() {
				log('Requesting update of player ' + players[res.userID].userID, colors.italic);
				players[res.userID].update(emitTo); //socket);
				player = players[res.userID];
				player.addToTeam(player.team);
				log("'Player' for socket " + socket.id + " is now:", colors.yellow.inverse);
				log(player);

				emitTo.socket('returningReadyCheck', {
					team: player.team,
					introComplete: player.playStarted,
					svcCheckComplete: player.svcCheckComplete
				});
			},

			readyToPlay: function() {
				//player.connected = true;
				player.svcCheckComplete = true;

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
							playerLockedOut: player.lockedOut,
							hubs: hubs,
							introContent: gameState.settings.introContent
						});
						break;
				}

				startTracking();
			},

			introCompleted: function() {
				player.playStarted = true;
			},

			locationError: function() {
				player.lastReqResRcvd = true;

				var elapsed = (Date.now() - res.reqTimestamp) / 1000;
				log("Response received BUT no location stored for player yet; " + elapsed + "sec after req sent", colors.err);

				if (!player.trackActive || player.goneDark) {
					player.clearDark();
					startTracking();
				}
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

				if (res.locData.lat !== undefined) {
					storeLocation();
				} else {
					log("Loc update received from " + player.userID + " but position not valid");
				}

				if (!player.trackActive || player.goneDark) {
					player.clearDark();
					startTracking();
				}

			},

			findSuspects: function() {
				newLocData = {}; //getInsLocData();

				for (p in players) {
					var dataAgeLimit = Date.now() - gameState.suspectTrailDuration;

					//var locArray = [];
					// if (players[p].team == 'ins' && !players[p].lockedOut) {
					// 	locArray = players[p].getLocationData(dataAgeLimit);
					// } else {
					var locArray = [players[p].getLastLocation()];
					//}

					if (locArray.length > 0 && locArray[0] !== null) {

						log("Adding suspect locData for " + players[p].userID);
						log("Loc array zero is :");
						log(locArray[0]);

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
					'capturingPlayer': player.userID,
					'liveSuspects': gameState.liveInsCount,
					'lockedSuspects': gameState.lockoutCount
				});

				setTimeout(govWinCheck, 1000);
			},

			detectHubs: function() {
				emitTo.socket('hubsByDistance', {
					hubsByDistance: player.getHubsByDistance()
				});
			},

			hubHackProgress: function() {

				var attackedHub = player['hubAttacking'] = hubs.getByName(res.hubName); //hubs[res.hubIndex];

				var decr = attackedHub.hackTime / attackedHub.hackProgressInterval;
				log("Decrements are: " + decr);
				//...then divide 100 by that to get health decrement:
				attackedHub.health -= (100 / decr);
				log("Hub " + attackedHub.id + "/" + attackedHub.name + " health decreased to " + attackedHub.health);

				if (attackedHub.health <= 0) {
					attackedHub.health = 0;
					player.stopHacking();
					//attackedHub.live = false;
					var hubsLeft = gameState.liveHubCount; //();
					log("Live hubs remaining: " + hubsLeft + " / " + hubs.length, colors.yellow.inverse);
					log("Downed Hub is now:", colors.err);
					log(attackedHub);
					log("All hubs are:");
					log(hubs);

					emitTo.socket('hackComplete', {
						hubName: attackedHub.name
					});
					setTimeout(function() {
						emitTo.all('hubDown', {
							hub: attackedHub,
							hubName: attackedHub.name,
							hubID: attackedHub.id,
							hubIndex: res.hubIndex,
							liveHubsLeft: hubsLeft
						});

						setTimeout(insWinCheck, 1000);
					}, 1000);

				} else {

					attackedHub.updateAttackingPlayers(player, 'add');

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

			hackInterrupted: function() {
				player.stopHacking();
			},

			playerLeftHubRange: function() {
				player.stopHacking();
			}

		};

		if (debugMode) {
			handleClientMsg[res.tag]();
		} else {
			//When not debugging, use this to prevent server crashes
			try {
				handleClientMsg[res.tag]();
			} catch (err) {
				log('Error: "' + res.tag + '" is not a valid socket.on message because:', colors.err);
				log(err.stack, colors.err);
			}
		}

	});

	// when a client disconnects
	socket.on('disconnect', function() {
		log('User ' + socket.id + ' just disconnected.', colors.yellow);


		try {
			clearInterval(tracking);
			gameState.getPlayerBySocketID(socket.id).disconnect();

		} catch (err) {
			log(err.stack, colors.err);
		}

		log('current players: ' + gameState.playerCount);
		log('current connected users: ' + io.sockets.sockets.length);

	});

});