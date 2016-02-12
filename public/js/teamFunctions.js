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
		//$('#container').append(pingButton);
		$('#mobileFooter').prepend(pingButton);

		// $('#pingCircle').css({
		// 	'transform': 'translate(' + window.width * 0.5 + ',' + window.height*0.5 + ')',
		// 	'cx': window.width * 0.5,
		// 	'cy': window.height * 0.5
		// });

		gov.ui['pingCircle'] = viz.addPingCircle();
		//$('.onMapPingCircle').css('color': rgba)

		//var pingCircle = ;

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

				} else if (otherPlayers[id].inCaptureRange) {

					//} else if (otherPlayers[id].captureEventsAttached) {
					otherPlayers[id].inCaptureRange = false;
					//otherPlayers[id].marker.clearCaptureEvents();
					otherPlayers[id].clearCaptureEvents();
				}
			}
		}
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
		//if (callback !== undefined) {
		//callback();
		//}
	}

};

console.log("Team functions loaded");