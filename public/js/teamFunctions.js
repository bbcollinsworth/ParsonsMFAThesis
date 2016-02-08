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
		'draggable': true
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

		//hubs[hubs.length - 1].startFlash(500);
		var testHub = hubs[hubs.length - 1];
		var testHub2 = hubs[hubs.length - 2];
		//gov.flashHub(testHub,500);
		testHub.flash(500);
		testHub2.flash(1500);

		setTimeout(function() {
			testHub.flash(250);
			//gov.flashHub(testHub,250);

			setTimeout(function() {
				testHub.stopFlash();
				testHub2.flash(250);
				//gov.clearFlash(testHub);
			}, 3000);
		}, 10000);

	},

	renderPlayers: function(pData) {
		$.each(pData, function(userID, playerData) {

			console.log("Player ID: " + userID);

			//ADD CHECK FOR OWN PLAYER
			//if (userID = ownplayer's id)
			// player.type = "self"

			var players = clientState.allPlayers;
			console.log(players);

			// var updateLocalCounts = function(type) {
			// 	var typeCount = 0;
			// 	for (id in players) {
			// 		if (type in players[id]) {
			// 			//if (players[id].type == type) {
			// 			typeCount++;
			// 		}
			// 	}
			// 	players.localCount[type] = typeCount;
			// 	console.log("Now locally tracking " + players.localCount.agent + " agents and " + players.localCount.suspect + " suspects.");
			// }

			if (!(userID in players)) {

				players[userID] = clientState.addPlayer(playerData);
				// players[userID] = {
				// 	team: player.team,
				// 	type: player.type,
				// 	latestPos: player.locData[0],
				// 	marker: viz.marker(player.type, player.locData[0])
				// };
				// console.log(players);

				// players[userID].marker.addTo(map);
				// updateLocalCounts(player.type);
				// players[userID].localID = player.type + " " + players.localCount[player.type].toString();

				// var popupData = {
				// 	'title': players[userID].localID,
				// 	'text': {
				// 		ln1: "(As of " + convertTimestamp(players[userID].latestPos.time) + ")"
				// 	},
				// 	'popupClass': "playerPopup " + players[userID].type + "Popup"
				// };

				// players[userID].marker.initPopup(popupData);
				// players[userID].marker.addPopup(true);
				// players[userID]['captureCircle'] = viz.drawCaptureCircle(players[userID].latestPos);
				// console.log("New player stored locally as " + players[userID].localID);
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
	}
};