var app = {};
var socket;
var clientState = {
	connected: false,
	mapLoaded: false,
	readyCheckRunning: false,
	ready: false,
	geolocation: {
		supported: false,
		setup: navigator.geolocation
	},
	vibrate: {
		supported: false,
		setup: function(vibrateLength) {
			try {
				navigator.vibrate = navigator.vibrate ||
                  navigator.webkitVibrate ||
                  navigator.mozVibrate ||
                  navigator.msVibrate;
				navigator.vibrate(vibrateLength);
				msg ("Vibrate successful!");
			} catch (err) {
				msg(err.message);
			}
		}
	}
};

var govHash, insHash;
var teamHash, uniqueHash;

var vibrate, geo;


var msg = function(text) {
	$('#alertBodyText').html('<p>' + text + '</p>');
};

var attachEvents = function() {
	$('#app').on('ready', function() {
		readyCheckRunning = false;
		emit('clientReady', {});
	});
};
//alt ready function
app.ready = function() {
	readyCheckRunning = false;
	emit('clientReady', {});
};

var initServices = function(argument) {

	var supportCheck = function(api) {
		clientState[api].supported = api in navigator;
		console.log("Raw var for " + api + ": " + (api in navigator));
		if (clientState[api].supported) {
			console.log(api + " supported.");
			//need to return api variable
			return clientState[api].setup;
		} else {
			console.log(api + " not supported.");
			return null;
		}
	};

	//clientState.supports['vibrate'] = 'geolocation' in navigator;
	vibrate = supportCheck('vibrate');
	//console.log(supportCheck('vibrate'));
	console.log(vibrate);
	//navigator.vibrate(100);
	//vib = navigator.vibrate;
	vibrate(1000);

	geo = supportCheck('geolocation');
	geo.getCurrentPosition(function(position) {
		console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
	});
	// if (clientState.supports.vibrate) {
	// 	vibrate = navigator.vibrate || navigator.mozVibrate;
	// 	console.log("Vibrate initialized");
	// } else {
	// 	console.log("Vibration not supported");
	// }

	// clientState.supports['geolocation'] = 'geolocation' in navigator;

	// locate = navigator.location;
	console.log("Location Svcs initialized");
};

app.init = function() {
	msg('Connecting...');
	initServices();
	parseHash(); //check URL hash for team and playerID data
	initMap(); //initialize map
	socket = io.connect(); //connect to socket server
	msg("Initializing socket");
	attachEvents(); //attach event listeners
	readyCheck(); //start checking for ready state
};

function parseHash() {
	msg('Parsing hash...');
	var thisHash = location.hash;
	msg('Hash is ' + thisHash);
	var parsedHash = thisHash.split("&");
	parsedHash[0] = parsedHash[0].slice(1, 100);
	msg('Parsed hash is ' + parsedHash[0] + ', ' + parsedHash[1]);
	console.log("Hash:");
	console.log(parsedHash[0]);
	console.log(parsedHash[1]);

	teamHash = parsedHash[0];
	uniqueHash = parsedHash[1];
	//NEED TO DO LOCALSTORAGE CHECK
	// localStorage.setItem("teamHash", teamHash);
	// localStorage.setItem("uniqueID", uniqueHash);
}

function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

function initMap() {
	msg("Initializing map");
	//initializing mapbox.js / leaflet map
	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
		.setView([40.734801, -73.998799], 16)
		.on('ready', function() {
			clientState.mapLoaded = true;
			console.log("Map is initialized!");
			//sendMapReady();
		});

	//to override relative positioning from leaflet style
	$('#map').css({
		"position": "static"
	});
}

function readyCheck() {
	clientState.readyCheckRunning = true;

	msg("Checking if ready");
	if (clientState.connected && clientState.mapLoaded) {
		clientState.ready = true;
		$('#app').trigger('ready');
		// emit('clientReady', {});
	} else {
		var readyCounter = 60;
		//mobileAlert("CONNECTING...");

		var waitForReady = setInterval(function() {

			console.log("Waiting for ready state...");
			if (clientState.connected && clientState.mapLoaded) {
				clientState.ready = true;
				$('#app').trigger('ready');
				//emit('clientReady', {});
				//closeAlert();
				//console.log("Close msg called");
				clearInterval(waitForReady);
			} else if (readyCounter > 0) {
				readyCounter--;
				if (!clientState.connected) {
					console.log("Waiting for connection.");
				}
				if (!clientState.mapLoaded) {
					console.log("Waiting for map.");
				}

				console.log(readyCounter * 0.5 + "seconds");
			} else {
				console.log("Not ready. Reloading");
				clearInterval(waitForReady);
				window.location.reload();
			}
		}, 500);

	}
}

app.init();

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
			var storedUserFound = false;
			var allIDs = res.userIDs;
			//check for stored id matching existing player:
			if (localStorage.userID !== undefined) {
				for (var i in allIDs) {
					if (localStorage.userID == allIDs[i]) {
						console.log("Stored User Found!:" + allIDs[i]);
						storedUserFound = true;
						break;
					}
				}
			}

			if (storedUserFound) { //send returning player
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
			localStorage.setItem("userID", res.newID);
			console.log("UserID stored locally as: " + localStorage.userID);
			msg('Hello Player ' + res.newID + '!');
		}

	};

	handleServerMsg[res.tag]();


});