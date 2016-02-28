var app = {};
var socket;

//for quick restting of localstorage
var lsclear = function() {
	localStorage.clear();
};

var player = {
	localID: '',
	team: '',
	pos: {},
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
		//readyCheckRunning = false;
		// localStorage.setItem('svcCheckComplete',true);

		// $('#footerText').css({
		// 	'display': 'none'
		// });
		emit('readyToPlay', {});
	});

};

app.init = function() {
	startup.setup();
	msg('Connecting...');
	startup.initServices();
	startup.parseHash(); //check URL hash for team and playerID data
	startup.initMap(); //initialize map
	startup.connectToServer(); //connect to socket server
	attachEvents(); //attach event listeners
	startup.readyCheck(); //start checking for server and map loading
};


function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
};

// window.onload = function() {
app.init();
// };

var centerOnPlayer = function() {
	map.panTo([player.pos.lat, player.pos.lng]);
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

		player.pos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			time: position.timestamp //Date.now()
		};

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

var runIntro = function(team) {
	var intro = {
		'gov': {
			'screen1': {
				1: "The U.S. Government needs your help to stop cyberterrorism.",
				2: "At this moment, hackers are trying to disable government security systems in your area.",
				3: "If they succeed, millions of lives will be endangered.",
				4: '<div id="nextButton">OK</div>'
			},
			'screen2': {
				1: "Use this app to detect the mobile activity of suspected hackers nearby.",
				2: "Sensitive security sites are marked in blue. We need you to intercept the hackers before they disable these sites.",
				3: "If you can get within 20 meters of a suspected hacker, you can lock their device and stop their attacks!",
				4: '<div id="nextButton">GO</div>'
			}
		},
		'ins': {
			'screen1': {
				1: "The government is tracking you.",
				2: "It's time to fight back.",
				3: '<div id="nextButton">OK</div>'
			},
			'screen2': {
				1: "This app enables you to detect nearby surveillance sites with your mobile phone.",
				2: "If you get close enough, you can hack these sites to disrupt government data collection.",
				3: "Be careful, though: the more you use your phone, the better State Agents can track you...",
				4: '<div id="nextButton">START</div>'
			}
		}
	};

	msg(intro[team].screen1);
	$('#nextButton').off('click').on('click', function() {
		msg(intro[team].screen2);
		$('#nextButton').off('click').on('click', function() {
			$('#app').trigger('introComplete');
		});
	});
};

//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	var handleServerMsg = {

		connected: function() {
			clientState.connected = true;
			console.log("Connected to server");
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
			if (localStorage.svcCheckComplete) {
				$('#footerText').html('');
				$('#app').trigger('ready');
			} else {
				startup.svcCheck();
			}
		},

		getLocation: function() {
			clientState['lastLocReqTime'] = res.timestamp;
			//if now - res.timestamp less than tracking interval
			var timeElapsed = Date.now() - res.timestamp;
			console.log("Time in seconds since request in GetLoc: " + timeElapsed / 1000);


			if (res.firstPing) {
				clientState['trackInterval'] = res.trackingInterval;
				storeAndSendLocation(res.timestamp, centerOnPlayer);
			} else {
				//if (timeElapsed < clientState.trackInterval) {
				storeAndSendLocation(res.timestamp);
				//}
			}
		},

		trackLocation: function() {
			geo.watchPosition(function(position) {
				console.log('Latest Watched Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				storeAndSendLocation(position);
			});
		},

		insStartData: function() {
			if (!res.playStarted) {
				runIntro('ins');

				$('#app').on('introComplete', function() {
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
			gov.renderHubs(res.hubs);

			if (!res.playStarted) {
				runIntro('gov');

				$('#app').on('introComplete', function() {
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

			$('#app').on('scanComplete', function() {
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
			//hubs[i].alertState = res.hubAlertState;
			hubs[i].setFlashByAlertState();
			//Probably not necessary
			//if (!hubs[i].flashing){
			//gov.setFlashByAlertState(hubs[i]);
			// var flashSpeed = 1000;
			// if (res.alertState > 0) {
			// 	flashSpeed /= res.alertState;
			// }

			// hubs[i].flash(flashSpeed);

			switch (res.alertState) {
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