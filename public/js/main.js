var app = {};
var socket;

var player = {
	localID: '',
	pos: {},
	distanceTo: function(otherPos) {
		var d = L.latLng(player.pos.lat, player.pos.lng).distanceTo([otherPos.lat, otherPos.lng]);
		return d;
	}
};

var hubs = [];

var msg = function(text, styling) {
	$('#alertBodyText').html('<p>' + text + '</p>');

	if (styling in viz.headerStyles){
		console.log("adding header styling! " + styling);
		$('#alertBox .ui-collapsible-content').addClass(viz.headerStyles[styling]);
	} //else {
		//$('#alertBox .ui-collapsible-content').addClass(viz.headerStyles['normal']);
	
	//}

	// if (stylingOptions !== undefined) {
	// 	$('#alertBox .u').css(stylingOptions);
	// }
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
			console.log("calling animation");
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
				clientState.localID = localStorage.userID;
				console.log("UserID stored locally as: " + localStorage.userID);
			} else {
				console.log("Warning: localStorage unsupported. ID not stored.");
			}
			msg('Hello Player ' + res.newID + '!');

			startup.svcCheck();
		},

		returningReadyCheck: function() {
			if (localStorage.svcCheckComplete) {
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

		govStartData: function() {
			gov.renderHubs(res.hubs);
			gov.renderUI();
			attachEvents();
		},

		suspectData: function() {
			console.log('Suspect data is: ');
			console.log(res.locData);

			gov.renderPlayers(res.locData, gov.suspectRangeCheck);
		}
	};

	handleServerMsg[res.tag]();


});