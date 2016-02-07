var app = {};
var socket;

var player = {
	localID: '',
	pos: {}
};

var hubs = [];

var msg = function(text) {
	$('#alertBodyText').html('<p>' + text + '</p>');
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

		var pingCircle = document.getElementById('pingCircle');
		pingCircle.classList.add('run');

		$('#pingCircle').on('animationend webkitAnimationEnd', function(){
			pingCircle.classList.remove('run');
		});

		//$('#pingCircle').addClass("run");

		emit('findSuspects', {
			existingLocData: []
		});
	});
};

app.init = function() {
	msg('Connecting...');
	startup.setup();
	startup.initServices();
	startup.parseHash(); //check URL hash for team and playerID data
	startup.initMap(); //initialize map
	startup.connectToServer(); //connect to socket server
	//socket = io.connect(); //alt connect to socket server
	//msg("Initializing socket");
	attachEvents(); //attach event listeners
	startup.readyCheck(); //start checking for server and map loading

};


function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

// window.onload = function() {
 	app.init();
// };


//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	var storeAndSendLocation = function(p, callback) {
		player.pos = {
			lat: p.coords.latitude,
			lng: p.coords.longitude,
			time: Date.now()
		};

		emit('locationUpdate', {
			locData: player.pos
		});

		if (callback !== undefined) {
			callback();
		}
	};

	var centerOnPlayer = function() {
		map.panTo([player.pos.lat, player.pos.lng]);
	};

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
			geo.getCurrentPosition(function(position) {
				console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				if (res.firstPing) {
					storeAndSendLocation(position, centerOnPlayer);
				} else {
					storeAndSendLocation(position);
				}

			});
		},

		trackLocation: function() {
			geo.watchPosition(function(position) {
				console.log('Latest Watched Position: ' + position.coords.latitude + ', ' + position.coords.longitude);

				storeAndSendLocation(position);

			});
		},

		hubStartData: function() {
			gov.renderHubs(res.hubs);
		},

		govStartData: function() {
			gov.renderHubs(res.hubs);
			gov.renderUI();
			attachEvents();
		},

		suspectData: function() {
			console.log('Suspect data is: ');
			console.log(res.locData);

			gov.renderPlayers(res.locData);

		}
	};

	handleServerMsg[res.tag]();


});

