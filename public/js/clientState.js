var clientState = {
	connected: false,
	mapLoaded: false,
	readyCheckRunning: false,
	ready: false,
	playerPos: {
		lat: 0,
		lng: 0
	},
	localID: '',
	allPlayers: {
		localCount: {
			'agent': 0,
			'suspect': 0,
			'update': function(type) {
				var typeCount = 0;
				for (id in clientState.allPlayers) {
					if (type in clientState.allPlayers[id]) {
						typeCount++;
					}
				}
				this[type] = typeCount;
				//clientState.allPlayers.localCount[type] = typeCount;
				console.log("Now locally tracking " + this.agent + " agents and " + this.suspect + " suspects.");
			}
		}
	},
	markerEvents: {
		ins: {
			inCaptureRange: false,
			startCapture: function(e) {
				//e.preventDefault();
				//if (this.inCaptureRange) {
				console.log("Starting capture on " + newPlayer.localID);

				if (!('captureCircle' in newPlayer)) {
					newPlayer['captureCircle'] = viz.addCaptureCircle(newPlayer.latestPos);
					newPlayer['captureCircle'].addTo(map);

					//newPlayer.captureCircle.remove();
					// add something to remove the old one
				}
				// newPlayer['captureCircle'] = viz.addCaptureCircle(newPlayer.latestPos);
				// newPlayer['captureCircle'].addTo(map);
				newPlayer['captureCircle'].startAnim();
				newPlayer.marker.on('mouseup', this.stopCapture); //viz.markerOptions.mouseDownEvent);

				//}
			},
			stopCapture: function(e) {
				console.log("Mouse up - capture pausing");
				newPlayer.captureCircle.animRunning = false;
			},
			attachCaptureEvents: function() {
				console.log("Attaching Capture Events to " + this.localID);

				this.marker.on('mousedown', this.startCapture); //viz.markerOptions.mouseDownEvent);
				this.marker.on('mouseup', function(e) {
					//e.preventDefault();
					console.log("Mouse up - capture pausing");
					newPlayer.captureCircle.animRunning = false;
				}); //viz.markerOptions.mouseDownEvent);
				// this['captureCircle'] = viz.addCaptureCircle(this.latestPos);
				// this['captureCircle'].startAnim();
			},

			removeCaptureEvents: function() {

			}
		}
	},

	addPlayer: function(player) {
		newPlayer = {
			team: player.team,
			type: player.type,
			latestPos: player.locData[0] //,
			// mouseDownEvent: function(e) {
			// 	e.preventDefault();
			// 	console.log("Starting capture on " + newPlayer.localID);
			// 	//newPlayer['captureCircle'] = viz.drawCaptureCircle(newPlayer.latestPos);

			//} //,
			//marker: viz.marker(player.type, player.locData[0]).addTo(map),
		};

		newPlayer.marker = viz.marker(player.type, newPlayer.latestPos).addTo(map);

		//newPlayer.marker = viz.marker(player.type, newPlayer.latestPos).addTo(map);
		console.log(clientState.allPlayers);

		//newPlayer.marker.addTo(map);
		clientState.allPlayers.localCount.update(player.type);
		//updateLocalCounts(player.type);
		newPlayer.localID = player.type + " " + clientState.allPlayers.localCount[player.type].toString();

		var popupData = {
			'title': newPlayer.localID,
			'text': {
				ln1: "(As of " + convertTimestamp(newPlayer.latestPos.time) + ")"
			},
			'popupClass': "playerPopup " + newPlayer.type + "Popup"
		};

		newPlayer.marker.initPopup(popupData);
		newPlayer.marker.addPopup(true);

		if (newPlayer.team == 'ins') {

			//newPlayer['startCaptureFn'] = 
			$.extend(true, newPlayer, clientState.markerEvents.ins);

			// newPlayer.marker.on('mouseDown', newPlayer.startCapture);
			// newPlayer.marker.on('mouseUp', newPlayer.stopCapture);

			//$.extend(true, newPlayer, clientState.markerEvents.ins);

		}

		console.log("New player stored locally as " + newPlayer.localID);



		return newPlayer;
	},
	features: {
		geolocation: {
			title: 'Geolocation',
			helpText: 'To play, "allow" geolocation when prompted.',
			noSupportText: 'Geolocation not supported. Please use another device.',
			supported: false,
			ready: false,
			setup: navigator.geolocation,
			readyTest: function() {
				setTimeout(function() {
					navigator.geolocation.getCurrentPosition(function(position) {
						console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
						clientState.features.geolocation.ready = true;
						console.log('Geoloc test successful');

						startup.svcCheck(); //re-run service check
					}, function(error) {
						switch (error.code) {
							case 1:
								// 1 === error.PERMISSION_DENIED
								console.log('User does not want to share Geolocation data.');
								break;

							case 2:
								// 2 === error.POSITION_UNAVAILABLE
								console.log('Position of the device could not be determined.');
								break;

							case 3:
								// 3 === error.TIMEOUT
								console.log('Position Retrieval TIMEOUT.');
								break;

							default:
								// 0 means UNKNOWN_ERROR
								console.log('Unknown Error');
								break;
						}
					});
				}, 1000);
			}
		},
		vibrate: {
			title: 'Vibration',
			helpText: '',
			noSupportText: 'Your browser does not support vibration.',
			supported: false,
			ready: true, //no prep required
			setup: function(vibrateLength) {
				try {
					navigator.vibrate = navigator.vibrate ||
						navigator.webkitVibrate ||
						navigator.mozVibrate ||
						navigator.msVibrate;
					navigator.vibrate(vibrateLength);
					//msg("Vibrate successful!");
					console.log("Vibrate successful!");
				} catch (err) {
					msg(err.message);
				}
			},
			readyTest: function() {
				console.log('Ready test called for vibration but no test.');
			}
		},
		localstorage: {
			title: 'Local Storage',
			helpText: '',
			noSupportText: 'Your browser does not support local storage.',
			supported: false,
			ready: true, //no prep required
			setup: localStorage,
			readyTest: function() {
				console.log('Ready test called for localStorage but no test.');
			}
		}
	}
};

console.log("ClientState loaded");