var ins = {
	ui: {
		'hubPointers': [],
		'maxHubsDetected': 3,
	},

	//hackRange: 75,

	renderUI: function() {

		//***doing this in reverse so pointer[0] will be last appended (i.e. on top?)
		for (var i = ins.ui.maxHubsDetected - 1; i >= 0; i--) {
			var newPointer = viz.scanPointer.init('spinner' + i);
			newPointer.addTo('#container');
			this.ui.hubPointers.unshift(newPointer);
		}

		this.ui['scanButton'] = viz.scanButton();
		$('#container').append(this.ui['scanButton']);

		console.log('Hub pointers created: ');
		console.log(this.ui.hubPointers);

		// var p = this.ui.hubPointers[0];
		// setTimeout(function() {
		// 	p.rotate(360, 1);

		// 	setTimeout(function() {
		// 		//p.fade();
		// 	}, 1000);
		// }, 1000);

	},

	popPointers: function() {
		for (i in ins.ui.hubPointers) {

			ins.ui.hubPointers[i].show();

		}
	},

	enableHack: function() {
		msg({
			1: "Surveillence site in range!",
			2: "<b>Press below to begin hacking.</b>",
			3: "(NOTE: More hackers will increase hack speed.)"
		}, 'urgent');
	},

	pointToHubs: function(hubArray, callback) {

		var hubToAttack = {};

		for (h in hubArray) {
			if (hubArray[h].distance < hubArray[h].hackRange) {
				hubToAttack = hubArray[h];
				break;
			}
		}

		//Check if object isn't empty:
		if ('hackRange' in hubToAttack) {
			ins.enableHack();
		} else {

			var getAngleFromMapCenter = function(screenPos) {

				var screenCenter = map.project(map.getCenter());

				var vec = {
					'x': screenPos.x - screenCenter.x,
					'y': screenPos.y - screenCenter.y
				};

				var theta = Math.atan2(vec.y, vec.x); // range (-PI, PI]
				theta *= 180 / Math.PI;

				//ADJUST FOR ROTATION FROM TOP:
				theta += 90;
				return theta;
			};

			for (var i = 0; i < ins.ui.maxHubsDetected; i++) {

				var hubScreenCoords = map.project([hubArray[i].lat, hubArray[i].lng]);
				hubArray[i]['angleTo'] = getAngleFromMapCenter(hubScreenCoords);
				console.log("Angle to " + hubArray[i].name + " is " + hubArray[i]['angleTo'] + " degrees");

				ins.ui.hubPointers[i].update(hubArray[i]);
			}

			if (callback !== undefined) {
				callback();
			}
		}
	}
};


var gov = {

	ui: {},

	captureRange: 20,

	suspectMarker: {
		'marker-size': 'large',
		'marker-symbol': 'pitch',
		'marker-color': '#ff0000'
	},

	agentMarker: {
		'marker-size': 'large',
		'marker-symbol': 'police',
		'marker-color': '#0000ff',
		'fill-opacity': 0.5
	},

	renderUI: function() {
		var pingButton = viz.searchButton();
		$('#mobileFooter').prepend(pingButton);

		gov.ui['pingCircle'] = viz.addPingCircle();
	},

	renderHubs: function(hubData) {
		//hubs = hubData;

		$.each(hubData, function(index, h) {
			var thisHub = viz.hub(h);
			hubs.push(thisHub);

		});

		$.each(hubs, function(index, h) {

			h.area.addTo(map);
			h.marker.addTo(map);
		});

	},

	suspectRangeCheck: function() {
		var otherPlayers = clientState.allPlayers;

		for (id in otherPlayers) {

			if (otherPlayers[id].team == 'ins') {

				var dist = player.distanceTo(otherPlayers[id].latestPos);
				console.log("Distance to " + otherPlayers[id].localID + " is " + dist + "m");

				if (dist <= gov.captureRange) {
					otherPlayers[id].inCaptureRange = true;
					//otherPlayers[id].marker.attachCaptureEvents();
					otherPlayers[id].attachCaptureEvents();
					msg("Suspect in capture range! Click and hold on suspect marker to lock out device.", 'urgent');

				} else if (otherPlayers[id].inCaptureRange) {

					//} else if (otherPlayers[id].captureEventsAttached) {
					otherPlayers[id].inCaptureRange = false;
					//otherPlayers[id].marker.clearCaptureEvents();
					otherPlayers[id].clearCaptureEvents();
				}
			}
		}
	},

	captureComplete: function(capturedPlayerRef) {
		console.log("Sending captureComplete for: ");
		console.log(capturedPlayerRef);
		emit("capturedPlayer", {
			//playerID
		});
	},

	startCaptureFn: function() {

	},

	stopCaptureFn: function() {

	},

	renderPlayers: function(pData) {
		$.each(pData, function(userID, playerData) {

			console.log("Player ID: " + userID);

			//ADD CHECK FOR OWN PLAYER
			//if (userID = ownplayer's id)
			// player.type = "self"

			var players = clientState.allPlayers;
			console.log(players);

			if (!(userID in players)) {
				players[userID] = clientState.addPlayer(playerData);

			} else {

				players[userID].latestPos = playerData.locData[0];
				players[userID].marker.updatePopup({
					'text': {
						ln1: "(As of " + convertTimestamp(players[userID].latestPos.time) + ")"
					}
				});
				players[userID].marker.refresh(players[userID].latestPos);
			}

		});

		gov.suspectRangeCheck();
	}

};

console.log("Team functions loaded");