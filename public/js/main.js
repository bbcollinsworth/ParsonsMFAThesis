//var app = {};
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

var emit = function(tag, emitObj) {
	emitObj['tag'] = tag;
	socket.emit('clientMsg', emitObj);
	customLog('Sending ' + tag + ' to server');
};


var centerOnPlayer = function() {
	if (player.pos.lat !== undefined) {
		clientState.centeredOnPlayer = true;
		map.panTo([player.pos.lat, player.pos.lng]);
	}
};

var stopTracking;

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

	//check to make sure we've started tracking
	emit('locationUpdate', {
		//will this work or will it reset to latest for all?
		reqTimestamp: serverReqTime,
		locData: player.pos
	});

	//to catch server requestion location before it's been stored
	//...but shouldn't need anymore for centerOnPlayer at least
	if (callback !== undefined) {
		customLog("Callback is: ");
		customLog(callback);
		try {
			callback();
		} catch (error) {
			customLog("Send location callback error: ");
			customLog(error);
		}
	}
	//} else {
	if (player.pos.lat === undefined) {
		customLog("Position requested but no position stored yet.");
	}
	//emit('locationError',{});
	//}

};



startup.initMap();

window.onload = function() {
	app.init();
};