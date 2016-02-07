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
		$('#container').append(pingButton);

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
		$.each(pData, function(userID, player) {

			console.log("Player ID: " + userID);

			var players = clientState.allPlayers;
			console.log(players);

			var updateLocalCounts = function(type) {
				var typeCount = 0;
				for (id in players) {
					if (type in players[id]) {
						//if (players[id].type == type) {
						typeCount++;
					}
				}
				players.localCount[type] = typeCount;
				// players.localCount[type]++;
				console.log("Now locally tracking " + players.localCount.agent + " agents and " + players.localCount.suspect + " suspects.");
			}

			if (!(userID in players)) {
				players[userID] = {
					team: player.team,
					type: player.type,
					marker: viz.marker(player.type, player.locData[0])
				};
				console.log(players);
				players[userID].marker.addTo(map);
				updateLocalCounts(player.type);
				players[userID].localID = player.type + " " + players.localCount[player.type].toString();
				//players[userID]['marker'] = viz.marker(player.type, [0,0]);
				console.log("New player stored locally as " + players[userID].localID);
				// console.log(players);
			} else {

				players[userID].latestPos = player.locData[0];
				players[userID].marker.refresh(players[userID].latestPos);
			} //players[userID]['marker'] = viz.marker(player.type, players[userID].latestPos);
			// players[userID].marker.addTo(map);

		});
	}
};