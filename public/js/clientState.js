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
			update: function(playerType) {
				var typeCount = 0;
				for (id in clientState.allPlayers) {
					if (clientState.allPlayers[id].type == playerType) {
						console.log(playerType + " found in allPlayers. Adding to count");
						typeCount++;
					}
				}
				this[playerType] = typeCount;
				//clientState.allPlayers.localCount[type] = typeCount;
				console.log("Now locally tracking " + this.agent + " agents and " + this.suspect + " suspects.");
			}
		}
	},
	markerEvents: {
		ins: {
			inCaptureRange: false,
			startCapture: function(p) {

				//var p = this;

				//IMPORTANT: NEED TO START WATCHING POS TO FIGURE OUT IF MOVING
				console.log("Starting capture on " + p.localID);

				if (!('captureCircle' in p)) {
					p['captureCircle'] = viz.addCaptureCircle(p.latestPos);
					p['captureCircle'].parentPlayerRef = p;
					p['captureCircle'].addTo(map);

					//newPlayer.captureCircle.remove();
					// add something to remove the old one
				}

				p['captureCircle'].startAnim();
				//map.on('mouseup', p.stopCapture);

			},
			stopCapture: function(e) {
				console.log("Mouse up - capture pausing");
				newPlayer.captureCircle.animRunning = false;
			},
			attachCaptureEvents: function() {
				var playerToCapture = this;
				console.log("Attaching Capture Events to " + playerToCapture.localID);

				playerToCapture.marker.off('click').on('click', function(e) {

					//playerToCapture.marker.on('mousedown', function(e){
					//e.preventDefault();
					//this.startCapture
					clientState.markerEvents.ins.startCapture(playerToCapture);
				}); //viz.markerOptions.mouseDownEvent);

				// this.marker.on('mouseup', function(e) {
				// 	//e.preventDefault();
				// 	console.log("Mouse up - capture pausing");
				// 	newPlayer.captureCircle.animRunning = false;
				// }); 

				//viz.markerOptions.mouseDownEvent);
				// this['captureCircle'] = viz.addCaptureCircle(this.latestPos);
				// this['captureCircle'].startAnim();
			},

			clearCaptureEvents: function() {
				var playerToCapture = this;
				playerToCapture.marker.off('click');
			}
		}
	},

	addPlayer: function(player, uID) {
		newPlayer = {
			userID: uID,
			team: player.team,
			type: player.type,
			latestPos: player.locData[0],
			oldestTime: player.oldestTime,
			locData: player.locData,
			updateLocData: function(newData) {
				for (itemKey in newData) {
					this[itemKey] = newData[itemKey];
					console.log("Updated " + itemKey + " for player " + this.userID);
				}
				if ('trail' in this) {
					console.log("Trail found in " + this.userID + "!");
					var pRef = this;
					pRef.marker.refresh();
					pRef.trail.render();
					$('#app').on('trailRendered', function() {
						pRef.marker.refresh();
						//pRef.marker.refresh(pRef.latestPos);
					});
				}
			}
		};

		clientState.allPlayers[uID] = newPlayer;

		newPlayer.marker = viz.marker(player.type, newPlayer.latestPos).addTo(map);
		newPlayer.marker['playerRef'] = newPlayer;

		console.log("ALL PLAYERS: ");
		console.log(clientState.allPlayers);

		clientState.allPlayers.localCount.update(newPlayer.type);
		//updateLocalCounts(player.type);
		if (newPlayer.userID === storage.userID) {
			newPlayer.localID = "you";
		} else {
			newPlayer.localID = player.type + " " + clientState.allPlayers.localCount[player.type].toString();
		}

		var popupData = {
			'title': newPlayer.localID,
			'text': {
				ln1: "(As of " + convertTimestamp(newPlayer.latestPos.time) + ")"
			},
			'popupClass': "playerPopup " + newPlayer.type + "Popup"
		};

		newPlayer.marker.initPopup(popupData);
		//newPlayer.marker.addPopup(true);
		newPlayer.marker.addTag(); //(newPlayer.team);

		if (newPlayer.team == 'ins') {
			newPlayer.trail = viz.initTrail(newPlayer);
			$.extend(true, newPlayer, clientState.markerEvents.ins);
		}

		console.log("New player stored locally as " + newPlayer.localID);

		//return newPlayer;
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
		deviceorientation: {
			title: 'Orientation',
			helpText: '',
			noSupportText: "Your device/browser can't detect orientation.",
			supported: false,
			ready: true,
			setup: function(orientEventHandler) {
				window.addEventListener('deviceorientation', orientEventHandler, false);
				console.log("ORIENTATION EVENT HANDLER ADDED");
				footerMsg("ORIENTATION EVENT HANDLER ADDED");
			},
			readyTest: function() {
				console.log('Ready test called for vibration but no test.');
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
			ready: false, //no prep required
			setup: localStorage,
			readyTest: function() {
				console.log("Current localStorage is: ");
				console.log(localStorage);
				this.ready = true;
				//console.log('Ready test called for localStorage but no test.');
			}
		}
	}
};

console.log("ClientState loaded");