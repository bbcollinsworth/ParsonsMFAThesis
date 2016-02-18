var app = {};
var socket;

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

var msg = function(text, styling) {

	var msgHTML = "";

	if (typeof text === 'string' || text instanceof String) {
		msgHTML = '<p>' + text + '</p>';
	} else {
		for (line in text) {
			msgHTML += '<p>' + text[line] + '</p>';
		}
	}

	$('#alertBodyText').html(msgHTML);

	for (s in viz.headerStyles) {
		$('#alertBox .ui-collapsible-content').removeClass(viz.headerStyles[s]);
	}

	if (styling in viz.headerStyles) {
		console.log("adding header styling! " + styling);
		$('#alertBox .ui-collapsible-content').addClass(viz.headerStyles[styling]);
	}
};

var attachEvents = function() {
	$('#app').on('initialized', function() {
		readyCheckRunning = false;
		emit('clientInitialized', {});
	});

	$('#app').on('ready', function() {
		//readyCheckRunning = false;
		// localStorage.setItem('svcCheckComplete',true);
		emit('readyToPlay', {});
	});

	$('#searchButton').off('click').on('click', function() {
		msg('Ping button clicked');

		var pingFunction = function() {
			emit('findSuspects', {
				existingLocData: []
			});
		};

		storeAndSendLocation(pingFunction);

		if (!gov.ui.pingCircle.animRunning) {
			console.log("calling ping animation");
			gov.ui.pingCircle.reCenter();

			gov.ui.pingCircle.animRunning = true;
			gov.ui.pingCircle.animateBurst();

			var tempPingCircle = document.getElementsByClassName('onMapPingCircle');
			tempPingCircle[0].classList.add('run');
			//console.log(tempPingCircle[0]);

			$('.onMapPingCircle').on('animationend webkitAnimationEnd', function() {

				tempPingCircle[0].classList.remove('run');
				gov.ui.pingCircle.animRunning = false;

				console.log("Animation removed");
			});
		}
	});

};

app.init = function() {
	msg('Connecting...');
	startup.setup();
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

var storeAndSendLocation = function(callback) {
	geo.getCurrentPosition(function(position) {
		console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

		player.pos = {
			lat: position.coords.latitude,
			lng: position.coords.longitude,
			time: Date.now()
		};

		emit('locationUpdate', {
			locData: player.pos
		});

		if (callback !== undefined) {
			callback();
		}
	});
};

//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	var handleServerMsg = {

		connected: function() {
			clientState.connected = true;
			console.log("Connected to server");
			msg('Connected to server.');
			vibrate(1000); // vibrate for check
		},

		//1sec for new/returning player + teamHash, uniqueID
		playerTypeCheck: function() {
			var storedUserFound = startup.storedUserCheck(res.userIDs);

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

			if (res.firstPing) {
				storeAndSendLocation(centerOnPlayer);
			} else {
				storeAndSendLocation();
			}
		},

		trackLocation: function() {
			geo.watchPosition(function(position) {
				console.log('Latest Watched Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				storeAndSendLocation(position);
			});
		},

		insStartData: function() {
			ins.renderUI();
			attachEvents();
		},

		govStartData: function() {
			gov.renderHubs(res.hubs);
			gov.renderUI();
			attachEvents();
		},

		suspectData: function() {
			console.log('Suspect data is: ');
			console.log(res.locData);

			gov.renderPlayers(res.locData, gov.suspectRangeCheck);
		},

		lockoutAlert: function() {
			console.log('lockout Alert received');
			window.alert("FAILURE: State Agents have locked your device!");
			ins.renderLockout();
		},

		hubsByDistance: function() {
			console.log("Hubs by distance received: ");
			console.log(res.hubsByDistance);

			$('#app').on('scanComplete', function() {
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
			//Probably not necessary
			//if (!hubs[i].flashing){
			var flashSpeed = 1000;
			if (res.alertState > 0) {
				flashSpeed /= res.alertState;
			}

			hubs[i].flash(flashSpeed);

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