var gov = {

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

		// var testHub = hubs[hubs.length - 1];
		// var testHub2 = hubs[hubs.length - 2];

		// testHub.flash(500);
		// testHub2.flash(1500);

		// setTimeout(function() {
		// 	testHub.flash(250);

		// 	setTimeout(function() {
		// 		testHub.stopFlash();
		// 		testHub2.flash(250);
		// 	}, 3000);
		// }, 10000);

	},
	suspectRangeCheck: function() {
		var otherPlayers = clientState.allPlayers;

		for (id in otherPlayers) {

			// var dist = 1000;
			// switch (otherPlayers[id].team) {
			// 	case 'ins':
			// 		dist = player.distanceTo(otherPlayers.latestPos);
			// 		break;
			// 	default:
			// 		break;
			// }
			if (otherPlayers[id].team == 'ins') {


				var dist = player.distanceTo(otherPlayers[id].latestPos);
				console.log("Distance to " + otherPlayers[id].localID + " is " + dist + "m");

				if (dist <= gov.captureRange) {
					otherPlayers[id].attachCaptureEvents();

				} else if (otherPlayers[id].captureEventsAttached) {
					otherPlayers[id].clearCaptureEvents();
				}
			}
		}
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

			if (players[userID].team == 'ins') {
				// var dist = checkDistanceTo(players[userID].latestPos);
				// console.log("Distance to " + userID + " is " + dist + "m");
			}

		});

		gov.suspectRangeCheck();
		//if (callback !== undefined) {
			//callback();
		//}
	}
	
};