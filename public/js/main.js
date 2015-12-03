var app = {};
var socket;
var gameState = {
	connected: false,
	mapLoaded: false,
	ready: false
};

var govHash, insHash;
var teamHash, uniqueHash;

var alert = function(text){
	$('#alertBodyText').html('<p>'+text+'</p>');
};

app.init = function() {
	alert('Connecting...');
	parseHash();
	initMap();
	socket = io.connect();
	alert("Initializing socket");
	readyCheck();
};

function parseHash() {
	alert('Parsing hash...');
	var thisHash = location.hash;
	alert('Hash is ' + thisHash);
	var parsedHash = thisHash.split("&");
	parsedHash[0]=parsedHash[0].slice(1,100);
	alert('Parsed hash is ' + parsedHash[0] + ', ' + parsedHash[1]);
	console.log("Hash:");
	console.log(parsedHash[0]);
	console.log(parsedHash[1]);

	teamHash = parsedHash[0];
	uniqueHash = parsedHash[1];
	// localStorage.setItem("teamHash", teamHash);
	// localStorage.setItem("uniqueID", uniqueHash);
}

function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

function initMap() {
	alert("Initializing map");
	//initializing mapbox.js / leaflet map
	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
		.setView([40.734801, -73.998799], 16)
		.on('ready', function() {
			gameState.mapLoaded = true;
			console.log("Map is initialized!");
			//sendMapReady();
		});

	//to override relative positioning from leaflet style
	$('#map').css({
		"position": "static"
	});
}

function readyCheck() {
	alert("Checking if ready");
	if (gameState.connected && gameState.mapLoaded) {
		gameState.ready = true;
		emit('clientReady', {});
	} else {
		var readyCounter = 60;
		//off for demo
		//mobileAlert("CONNECTING...");

		var waitForReady = setInterval(function() {

			console.log("Waiting for ready state...");
			if (gameState.connected && gameState.mapLoaded) {
				gameState.ready = true;
				emit('clientReady', {});
				console.log("Ready. Alerting server...");
				//closeAlert();
				//console.log("Close alert called");
				clearInterval(waitForReady);
			} else if (readyCounter > 0) {
				readyCounter--;
				if (!gameState.connected) {
					console.log("Waiting for connection.");
				}
				if (!gameState.mapLoaded) {
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
			gameState.connected = true;
			console.log("Connected to server");
			$('#alertBodyText').html('<p>Connected to server.</p>');
		},

		//check for new/returning player + teamHash, uniqueID
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
			$('#alertBodyText').html('<p>Hello Player ' + res.newID + '!</p>');
		}

	};

	handleServerMsg[res.tag]();


});