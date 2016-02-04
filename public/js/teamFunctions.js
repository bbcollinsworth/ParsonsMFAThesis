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

		// $('#searchButton').off('click').on('click', function() {
		// msg('Ping button clicked');
		// emit('findSuspects', {
		// 	existingLocData: []
		// });
		//});

	},

	renderHubs: function(hubData) {
		hubs = hubData;

		$.each(hubs, function(index, h) {
			var renderedHub = viz.hub(h);

			h['area'] = renderedHub.area; //.toGeoJSON();
			h.area.addTo(map);
			h['marker'] = renderedHub.marker;
			h.marker.addTo(map);
			h['flash'] = renderedHub.flash;

			//h.area.toGeoJson();

			//featureLayer.addData(h.area);

		});

		// hubs[0].flash();
		viz.flashHub(hubs[0]);
	},

	renderPlayers: function(pData) {
		$.each(pData, function(userID, player) {

			console.log("Player ID: " + userID);

			var players = clientState.allPlayers;

			console.log(players);

			if (players.userID == null) {
				players[userID] = {};
				//NEED TO FIND A WAY TO CREATE SUSPECT NUMBERS
			}
			
			players[userID].latestPos = player.locData[0];
			players[userID].team = player.team;

			console.log(players);

			var playerMark; // = viz.marker()

			//var markerIcon = {};

			switch (player.team) {
				case 'gov':
					players[userID]['marker'] = viz.marker('agent', players[userID].latestPos);
					//playerMark = viz.marker('agent', latestPos);
					//markerIcon = gov.agentMarker;
					break;
				case 'ins':
				default:
					players[userID]['marker'] = viz.marker('suspect', players[userID].latestPos);
					//playerMark = viz.marker('suspect', latestPos);
					//markerIcon = gov.suspectMarker;
					break;
			}

			players[userID].marker.addTo(map);

			//playerMark.addTo(map);

			// L.marker([latestPos.lat, latestPos.lng], {
			// 	icon: L.mapbox.marker.icon(markerIcon)
			// }).addTo(map);
		});
	}
};