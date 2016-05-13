var debugMode = false;
Error.stackTraceLimit = 2;

var express = require('express');
var bodyParser = require('body-parser');

var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var port = 9000;
var admin = io.of('/admin');
var setup = io.of('/setup');
var serverLog = io.of('/serverLog');

GLOBAL.serverStartTime = Date.now();
GLOBAL.logFile = {};

//********* LOAD MODULES *************
var include = require('./my_modules/moduleLoader.js');

include('globalModules');
var gameState = include('gameState');

//var start = Date.parse("May 5, 2016 22:45:00");
// log(start,colors.hilite);

gameState.createGameSession({
	//serverStart: Date.now(),
	gameStart: Date.now() //start
});

log("Game start is: " + gameState.gameStart);
//log("Timestamp of that is: " + Date.parse(gameState.gameStart));


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

setup.on('connection', function(socket) {
	console.log('SETUP CONNECTED!');
	socket.emit('greeting', {
		msg: "You're connected as setup!",
		defaultSettings: gameState.settings
		//logs: gameState.playerLogs
	});

	socket.on('createGame', function(res) {
		gameState.createGameSession(res);
	});

});

/*––––––––––– ADMIN SOCKET.IO starts here –––––––––––––––*/

admin.on('connection', function(socket) {
	console.log('ADMIN CONNECTED!');
	socket.emit('greeting', {
		msg: "You're connected as admin!",
		logs: gameState.playerLogs
	});

});

/*––––––––––– ADMIN SOCKET.IO starts here –––––––––––––––*/

serverLog.on('connection', function(socket) {
	console.log('SERVER LOG CONNECTED!');

	console.log(logFile);
	socket.emit('greeting', {
		msg: "You're connected as server log!",
		logs: logFile //;//gameState.playerLogs
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

	//USED BUT IN STARTUP FUNCTIONS ON client side...
	socket.emit('connected', {
		socketID: socket.id,
		settings: gameState.settings
		// serverStartTime: gameState.serverStart,
		// gameCreateTime: gameState.gameCreatedAt,
		// gameStartTime: gameState.gameStart
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
			gameStartTime: gameState.settings.gameStart, //should be ok as long as nothing's stored before game start
			gameCreateTime: gameState.settings.gameCreateTime,
			team: socket.team
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
		// var hubsDown = gameState.startingHubs - gameState.liveHubCount;
		// log("There are " + hubsDown + " Hubs down.", colors.alert);

		// if (hubsDown >= gameState.settings.hubDownTarget) {
		//var hubsDown = gameState.startingHubs - gameState.liveHubCount;
		log("There are " + gameState.score.hubs.hacked + " Hubs down.", colors.alert);

		if (gameState.score.hubs.hacked >= gameState.score.hubs.goal) {
			log("Ins win condition met!");
			emitTo.all('insWon', {});
		}
	};

	var govWinCheck = function() {

		log("Live hacker count is: " + gameState.score.hackers.live);

		// if (gameState.liveInsCount < 1) {

		//TEMPORARILY DISABLED
		// if (+gameState.score.hackers.live < 1) {
		// 	log("Live hacker count is: " + gameState.score.hackers.live);
		// 	log("No Ins left - Gov win condition met!");
		// 	emitTo.all('govWon', {});
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
				log("ClientData for " + socket.id + " is: ", colors.bgGreen);
				log(res);
				// if ('foundTeam' in res){
				// 	socket['team'] = res.foundTeam;
				// 	log("Client has team. Storing team " + res.foundTeam + " in socket info:");
				// 	log(socket);
				// }
				//player.connected = true;
				emitTo.socket('mapInitCheck', { //'checkSocketAndMapInit', {
					//socketID: socket.id
				});
			},

			disconnectDuplicate: function() {
				console.log("Disconnecting duplicate: " + socket.id);
				socket.disconnect();
			},

			clientInitialized: function() {
				log(socket.id + " server and map are initialized!", colors.yellow);
				log("Client info is: ");
				log(res);
				if ('foundTeam' in res) {
					socket['team'] = res.foundTeam;
					log("Client has team. Storing team " + res.foundTeam + " in socket info:");
					log(socket);
				} else {
					log("Client does NOT have stored team. Setting and storing team from hash: " + res.teamHash);
					socket['team'] = gameState.getTeam(res.teamHash);
					log("Team set to: " + socket.team);
				}
				//ONLY SEND IF GAME STARTED. OTHERWISE, SHOW SPLASH SCREEN BASED ON HASH
				if (gameState.gameStarted) {
					checkPlayerType();
				} else {

					//var team = gameState.getTeam(res.teamHash);
					emitTo.socket('showPregame', {
						team: socket.team,
						startTime: gameState.settings.gameStart,
						startZone: gameState.settings.startZones[socket.team] //startZone(team)
					});

					var millisToStart = gameState.settings.gameStart - Date.now();
					setTimeout(function() {
						checkPlayerType();
					}, millisToStart);
				}
			},

			connectedCheck: function() {
				log('The user ' + player.userID + " / " + socket.id + ' pinged to see if still connected.', colors.yellow);
				emitTo.socket('stillConnected', {});
			},

			newPlayer: function() {
				player = userModule(players, emitTo); //socket); //instantiate new player object
				var team = "";

				if ('team' in socket) {
					//SHOULD ALWAYS DO THIS BASED ON INITIALIZE ABOVE
					log("Stored team for new player found in socket " + socket.id, colors.bgGreen);
					//log("Setting team to: " + socket.team);
					team = socket.team; //create player
				} else {
					//REDUNDANT...SHOULD NEVER FIRE...
					log("NO stored team for new player found in socket " + socket.id, colors.err);
					team = gameState.getTeam(res.teamHash);

				}
				log("Setting team to: " + team);
				player.create(team);
				player.addToTeam(team);

				players[player.userID] = player; //add player to playersObject
				//log("Total # of players: " + gameState.playerCount());
				log("Total # of players: " + gameState.playerCount);
				log('Added player to database:');
				log(players[player.userID]);
				log("Score is now: ");
				log(gameState.score);

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

			readyToPlay: function() {
				//player.connected = true;
				player.svcCheckComplete = true;
				log(player.userID + " / " + socket.id + " is ready to play!", colors.bgGreen);
				log("Team is " + player.team, colors.bgGreen);

				switch (player.team) {
					case 'gov':
						emitTo.socket('govStartData', {
							playStarted: player.playStarted,
							hubs: hubs,
							score: gameState.score,
							introContent: gameState.settings.introContent
						});

						break;
					case 'ins':
					default:
						emitTo.socket('insStartData', {
							playStarted: player.playStarted,
							playerLockedOut: player.lockedOut,
							hubs: hubs,
							score: gameState.score,
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
				log("Compiling found suspects in response to gov request.");
				for (p in players) {

					//only sends players who have completed intro
					//TO PREVENT COMPROMISE BEFORE PLAY START
					if (players[p].playStarted) {
						log("Player who has started playing found!");
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
					}
				}

				//log('First bit of data to be sent to ' + socket.id + ":");
				//log(newLocData);
				emitTo.socket('suspectData', {
					locData: newLocData
				});
			},

			agentGettingClose: function() {
				log("agentGettingClose received:");
				log(res);

				for (var id in res.ranges) {
					var otherPlayer = players[id]; //res.otherPlayerID];

					var warnObj = {};

					if (otherPlayer.closestGov.id == res.govPlayerID || res.ranges[id] < otherPlayer.closestGov.dist) {
						log("Updating closest gov for " + id + " from:", colors.hilite);
						if ('closestGov' in otherPlayer) {
							log(otherPlayer.closestGov);
						} else {
							log("Empty");
						}

						otherPlayer.closestGov = {
							'id': res.govPlayerID,
							'dist': res.ranges[id]
						}
						log("...to:");
						log(otherPlayer.closestGov);

						warnObj['dist'] = otherPlayer.closestGov.dist;
					} else { //if range is closer than current closest

					}

					var warned = false;
					// var minWarned = 1000;

					for (var threshold in otherPlayer.warned) {
						log("MinWarned is " + otherPlayer.minWarned + " and threshold is " + threshold);
						log("MinWarned < threshold is " + (+otherPlayer.minWarned < +threshold));
						if (warned || (+otherPlayer.minWarned < +threshold)) {
							continue;
						} else if (otherPlayer.closestGov.dist < threshold && !otherPlayer.warned[threshold]) {
							log("Warning " + otherPlayer.userID + "of Gov proximity", colors.orange);
							warned = true;

							otherPlayer.warned[threshold] = true;
							otherPlayer.minWarned = threshold;
							log("MinWarned set to " + otherPlayer.minWarned, colors.hilite);

							warnObj['threshold'] = threshold;
							// emitTo.user(otherPlayer, "agentCloseWarning", {
							// 	distance: threshold
							// });
							var warningResetTime = 180000;
							log("Will reset warning for " + threshold + " to false in " + warningResetTime / 60000 + " minutes.");

							setTimeout(function() {
								otherPlayer.warned[res.distance] = false;
								otherPlayer.minWarned = 1000;
							}, warningResetTime);
						}
					}

					if ('dist' in warnObj) {

						emitTo.user(otherPlayer, "agentCloseWarning", warnObj);
					}
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
					'liveSuspects': gameState.score.hackers.live, //liveInsCount,
					'lockedSuspects': gameState.score.hackers.locked, //lockoutCount
					'score': gameState.score
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
							liveHubsLeft: hubsLeft,
							score: gameState.score
							//hubsHacked: gameState.score.hubs.hacked,//hackedHubCount,
							//hackTarget: gameState.score.hubs.goal//settings.hubDownTarget
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