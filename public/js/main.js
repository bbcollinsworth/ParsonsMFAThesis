var app = {};
var socket;
var gameState = {
	connected: false,
	mapReady: false
};

app.init = function() {
	$('#alertBodyText').html('<p>Connecting...</p>');
	initMap();
	socket = io.connect();
};

function emit(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	console.log('Sending ' + tag + ' to server');
}

function initMap() {
	//initializing mapbox.js / leaflet map
	L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

	var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
			zoomControl: false
		})
		.setView([40.734801, -73.998799], 16)
		.on('ready', function() {
			gameState.mapReady = true;
			console.log("Map is initialized!");
			//sendMapReady();
		});

	//to override relative positioning from leaflet style
	$('#map').css({
		"position": "static"
	});
}

function readyCheck(){
	if (gameState.connected && gameState.mapReady){
		emit('readyToPlay',{});
	} else {
		var readyCounter = 60;
		//off for demo
		//mobileAlert("CONNECTING...");

		var waitForReady = setInterval(function() {

			console.log("Waiting for server...");
			if (gameState.connected) {
				emit('mapLoaded', {});
				console.log("Connected. Alerting server...");
				//closeAlert();
				//console.log("Close alert called");
				clearInterval(waitForReady);
			} else if (readyCounter > 0) {
				readyCounter--;
				console.log(readyCounter * 0.5 + "seconds");
			} else {
				console.log("No connection. Reloading");
				clearInterval(waitForReady);
				window.location.reload();
			}
		}, 500);

	}
}

function sendMapReady() {
	console.log("Map is initialized!");

	if (gameState.connected) {
		console.log("Connected. Alerting server...");
		emit('mapLoaded', {});
	} else {
		var connectCounter = 60;
		//off for demo
		//mobileAlert("CONNECTING...");

		var waitForConnect = setInterval(function() {

			console.log("Waiting for server...");
			if (gameState.connected) {
				emit('mapLoaded', {});
				console.log("Connected. Alerting server...");
				//closeAlert();
				//console.log("Close alert called");
				clearInterval(waitForConnect);
			} else if (connectCounter > 0) {
				connectCounter--;
				console.log(connectCounter * 0.5 + "seconds");
			} else {
				console.log("No connection. Reloading");
				clearInterval(waitForConnect);
				window.location.reload();
			}
		}, 500);
	}
}

app.init();

//INCOMING SOCKET FUNCTIONS
socket.on('serverMsg', function(res, err) {

	switch (res.tag) {
		case 'handshake':
			gameState.connected = true;
			console.log("Connected to server");
			$('#alertBodyText').html('<p>Connected to server. Hello, Jasmine!</p>');
			break;
	}
});