var app = {};
var socket;

//for quick restting of localstorage
var lsclear = function() {
	localStorage.clear();
};

var player = {
	localID: '',
	team: '',
	pos: {
		'heading': undefined,
		update: function(newData) {
			for (key in newData) {
				this[key] = newData[key];
			}
		}
	},
	distanceTo: function(otherPos) {
		var d = L.latLng(player.pos.lat, player.pos.lng).distanceTo([otherPos.lat, otherPos.lng]);
		return d;
	}
};

var hubs = [];


var attachEvents = function() {
	$('#app').on('initialized', function() {
		readyCheckRunning = false;
		emit('clientInitialized', {});
	});

	$('#app').on('ready', function() {
		$('#footerText').css({
			'display': 'none'
		});

		app.addStyling[player.team]();

		if (!clientState.tracking) {
			app.trackLocation();
		}
		emit('readyToPlay', {});
	});

};

app.init = function() {
	startup.setup();
	msg('Connecting...');
	startup.initServices();
	startup.parseHash(); //check URL hash for team and playerID data
	// startup.initMap(); //initialize map
	startup.connectToServer(); //connect to socket server
	attachEvents(); //attach event listeners
	startup.readyCheck(); //start checking for server and map loading
};

app.addStyling = {
	gov: function() {

	},
	ins: function() {
		$('#app').addClass('ins-app-styling');
		$('.ui-collapsible-content').addClass('ins-alert-styling');
	}

};

app.trackLocation = function() {

	clientState.tracking = true;

	var posUpdateHandler = function(position) {
		console.log('Latest Watched Position: <br />' + position.coords.latitude + ', ' + position.coords.longitude + '<br />Heading: ' + player.pos.heading + '<br />' + convertTimestamp(Date.now(), true));
		//footerMsg('Latest Watched Position: <br />' + position.coords.latitude + ', ' + position.coords.longitude + '<br />Heading: ' + player.pos.heading + '<br />' + convertTimestamp(Date.now(), true));

		var newPos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			time: position.timestamp //Date.now()
		};

		player.pos.update(newPos);
		console.log("Playerpos updated: ");
		console.log(player);

		if (player.team == 'ins') {
			centerOnPlayer();
		}

	};

	var watchPosError = function(error) {
		console.log("Watch position error: ");
		console.log(error);
	};

	clientState['trackID'] = geo.watchPosition(
		posUpdateHandler,
		watchPosError, {
			//timeout: 0,
			enableHighAccuracy: true //,
			// maximumAge: Infinity
		}
	);
};

var emit = function(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
};
// function emit(tag, emitObj) {
// 	emitObj['tag'] = tag;
// 	socket.emit('clientMsg', emitObj);
// 	console.log('Sending ' + tag + ' to server');
// };

var centerOnPlayer = function() {
	map.panTo([player.pos.lat, player.pos.lng]);
};


var stopTracking;

// var posUpdateHandler = function(position) {
// 	console.log('Latest Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
// 	footerMsg('Latest Watched Position: <br />' + position.coords.latitude + ', ' + position.coords.longitude + '<br />Heading: ' + player.pos.heading + '<br />' + convertTimestamp(Date.now(), true));

// 	var newPos = {
// 		lat: position.coords.latitude,
// 		lng: position.coords.longitude,
// 		time: position.timestamp //Date.now()
// 	};

// 	player.pos.update(newPos);
// 	console.log("Playerpos updated: ");
// 	console.log(player);

// 	if (player.team == 'ins') {
// 		centerOnPlayer();
// 	}

// };

var sendStoredLocation = function(v1, v2) { //callback) {
	var callback;
	var serverReqTime;
	if (isNaN(v1)) {
		callback = v1;
	} else {
		serverReqTime = v1;
		if (v2 !== undefined) {
			callback = v2;
		}
	}

	emit('locationUpdate', {
		//will this work or will it reset to latest for all?
		reqTimestamp: serverReqTime,
		locData: player.pos
	});

	//to catch server requestion location before it's been stored
	if (callback !== undefined) {
		console.log("Callback is: ");
		console.log(callback);
		try {
			callback();
		} catch (error) {
			console.log("Send location callback error: ");
			console.log(error);
		}
	}

};

var storeAndSendLocation = function(v1, v2) { //callback) {
	var callback;
	var serverReqTime;
	if (isNaN(v1)) {
		callback = v1;
	} else {
		serverReqTime = v1;
		if (v2 !== undefined) {
			callback = v2;
		}
	}

	geo.getCurrentPosition(function(position) {
		console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
		console.log(position);

		var newPos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			time: position.timestamp //Date.now()
		};

		player.pos.update(newPos);

		// console.log("Heading isNAN is " + isNaN(position.coords.heading));
		// console.log(position.coords.heading);
		if (position.coords.heading) {
			player.pos['heading'] = position.coords.heading;
			footerMsg("Heading found: " + player.pos.heading);
		}

		emit('locationUpdate', {
			//will this work or will it reset to latest for all?
			reqTimestamp: serverReqTime,
			locData: player.pos
		});

		if (callback !== undefined) {
			callback();
		}
	});
	//}
};

// var runIntro = function(team) {
// 	var intro = clientState.intro;

// 	msg(intro[team].screen1);
// 	$('#nextButton').off('click').on('click', function() {
// 		msg(intro[team].screen2);
// 		$('#nextButton').off('click').on('click', function() {
// 			$('#app').trigger('introComplete');
// 		});
// 	});
// };
app.attachSocketEvents = function() {
	//INCOMING SOCKET FUNCTIONS
	socket.on('serverMsg', function(res, err) {

		var handleServerMsg = {

			stillConnected: function() {
				clientState.connected = true;
				console.log("Still connected to server");
				//msg('Connected to server.');
				//vibrate(1000); // vibrate for check
			},

			//1sec for new/returning player + teamHash, uniqueID
			playerTypeCheck: function() {
				var storedUserFound = startup.storedUserCheck(res.userIDs);
				console.log("Stored user found is: " + storedUserFound);

				if (storedUserFound) { //send returning player
					clientState.localID = localStorage.userID;
					player.localID = localStorage.userID;
					emit('returningPlayer', {
						userID: localStorage.userID
					});
				} else { //send new player
					emit('newPlayer', {
						teamHash: teamHash,
						uniqueID: uniqueHash
					});
				}
			},

			newUserID: function() {
				if (supported('localstorage')) {
					localStorage.setItem("userID", res.newID);
					//not sure this one is used...
					clientState.localID = localStorage.userID;
					player.localID = localStorage.userID;
					player.team = res.team;
					console.log("UserID stored locally as: " + localStorage.userID);
				} else {
					console.log("Warning: localStorage unsupported. ID not stored.");
				}
				msg('Hello Player ' + res.newID + '!');

				startup.svcCheck();
			},

			returningReadyCheck: function() {

				player.team = res.team;
				//if (res.introComplete || storage.svcCheckComplete) {
				// 	$('#app').trigger('ready');
				// } else if (storage.svcCheckComplete) {
				$('#footerText').html('');
				$('#app').trigger('ready');
				// } else {
				// 	startup.svcCheck();
				// }
			},

			getLocation: function() {

				clientState['lastLocReqTime'] = res.timestamp;
				//if now - res.timestamp less than tracking interval
				var timeElapsed = Date.now() - res.timestamp;
				console.log("Time in seconds since request in GetLoc: " + timeElapsed / 1000);

				if (res.firstPing) {
					clientState['trackInterval'] = res.trackingInterval;
					if (!clientState.tracking) {
						app.trackLocation();
					}
					sendStoredLocation(res.timestamp, centerOnPlayer);
				} else {
					sendStoredLocation(res.timestamp);
				}
			},

			insStartData: function() {
				clientState.intro.content = res.introContent;

				console.log("My lockout State is: " + res.playerLockedOut);
				//clientState['intro'] = res.introContent;
				if (res.playerLockedOut) {
					console.log('lockout Alert received');
					//window.alert("FAILURE: State Agents have locked your device!");
					ins.renderLockout();
				} else if (!res.playStarted) {
					clientState.intro.run('ins');
					//runIntro('ins');

					$('#app').off('introComplete').on('introComplete', function() {
						emit('introCompleted', {});
						ins.renderUI();
						attachEvents();
					});
				} else {
					ins.renderUI();
					attachEvents();
				}
			},

			govStartData: function() {
				clientState.intro.content = res.introContent;
				//clientState['intro'] = res.introContent;
				gov.renderHubs(res.hubs);

				if (!res.playStarted) {
					clientState.intro.run('gov');

					$('#app').off('introComplete').on('introComplete', function() {
						emit('introCompleted', {});
						gov.renderUI();
						attachEvents();
					});
				} else {
					gov.renderUI();
					attachEvents();
				}

			},

			suspectData: function() {
				console.log('Suspect data is: ');
				console.log(res.locData);

				gov.renderPlayers(res.locData, gov.suspectRangeCheck);
			},

			agentCloseWarning: function() {
				window.alert("WARNING: State agents within " + res.distance + " meters.");
			},

			lockoutAlert: function() {
				console.log('lockout Alert received');
				window.alert("FAILURE: State Agents have locked your device!");
				ins.renderLockout();
			},

			playerLockoutsUpdate: function() {
				var lP = res.lockedPlayer;
				var players = clientState.allPlayers;
				if (lP.userID !== player.localID) {
					switch (player.team) {
						case "gov":
							players[lP.userID]['lockedOut'] = true;
							players[lP.userID].marker.renderLockout();
							console.log("Locking out player: ");
							console.log(players[lP.userID]);
							setTimeout(function() {
								window.alert("UPDATE: A suspect has been successfully neutralized.");
								gov.ui.attachPingEvents();
							}, 750);
							break;
						case "ins":
							window.alert("ALERT: A fellow hacker has been neutralized.");
							break;
						default:
							break;
					}
				}
			},

			hubsByDistance: function() {
				console.log("Hubs by distance received: ");
				console.log(res.hubsByDistance);

				$('#app').off('scanComplete').on('scanComplete', function() {
					centerOnPlayer();
					ins.runHubRangeCheck(res.hubsByDistance);
					// ins.pointToHubs(res.hubsByDistance,ins.popPointers);
				});

			},

			hubHealthUpdate: function() {

				console.log("Health left: " + res.healthLeft);
				//Probably don't need
				//if (res.hubName == ins.targetHub.name){
				ins.targetHub.health = res.healthLeft;
				ins.ui.refreshHackProgress();
			},

			hubAttackUpdate: function() {
				console.log("Hub attack update received");
				var i = res.hubIndex;
				hubs[i].update(res.latestHubInfo);
				hubs[i].setFlashByAlertState();

				switch (hubs[i].alertState) {
					case 3:
						if (!hubs[i].alerts.lvl3) {
							window.alert("WARNING: Security hub attack 50% complete.");
							hubs[i].alerts.lvl3 = true;
						}
						break;
					case 1:
						//THIS SHOULD NOT have if test
						window.alert("WARNING: A security hub is under attack.");
						hubs[i].alerts.lvl1 = true;
						break;
					default:
						break;
				}
				//}
			},

			hubAttackStopped: function() {
				console.log("Hub attack stop received");
				var i = res.hubIndex;
				hubs[i].update(res.latestHubInfo);
				hubs[i].stopFlash();
				// if (hubs[i].flashing){

				// }
			},

			hackComplete: function() {
				ins.ui.hackSuccess();
			},

			hubDown: function() {
				switch (player.team) {
					case "gov":
						hubs[res.hubIndex].stopFlash();
						hubs[res.hubIndex].shutDown();
						window.alert("Hackers have taken down a security hub!");
						break;
					case "ins":
					default:
						window.alert("SUCCESS: A surveillance site has been hacked!");
						break;
				}
			}
		};

		handleServerMsg[res.tag]();


	});
};

startup.initMap();

window.onload = function() {
	app.init();
};