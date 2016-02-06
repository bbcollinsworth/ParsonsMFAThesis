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
		//hubs = hubData;

		$.each(hubData, function(index, h) {
			var thisHub = viz.hub(h);
			hubs.push(thisHub);

		});

		$.each(hubs, function(index, h) {



			//var renderedHub = viz.hub(h);

			//h['area'] = renderedHub.area; //.toGeoJSON();
			h.area.addTo(map);
			//h['marker'] = renderedHub.marker;
			h.marker.addTo(map);
			//h['flash'] = renderedHub.flash;

			//h.area.toGeoJson();

			//featureLayer.addData(h.area);

		});

		//hubs[hubs.length - 1].startFlash(500);
		var testHub = hubs[hubs.length-1];
		var testHub2 = hubs[hubs.length-2];
		//gov.flashHub(testHub,500);
		testHub.flash(500);
		testHub2.flash(1500);

		setTimeout(function(){
			testHub.flash(250);
			//gov.flashHub(testHub,250);

			setTimeout(function(){
				testHub.stopFlash();
				testHub2.flash(250);
				//gov.clearFlash(testHub);
			},3000);
		},10000);

		
	},

	flashHub: function(hub,interval) {
		if (interval === undefined){
			interval = 1000;
		}

		var c = '#ff0000';

		this.clearFlash(hub);
		hub['flasher'] = setInterval(function() {

			hub.area.setStyle({
				fillColor: c
			});
			//hub.area.options.fillColor = c;
			if (c == '#ff0000') {
				c = '#0033ff';
			} else {
				c = '#ff0000';
			}
		}, interval);

	},

	clearFlash: function(hub) {
		// if ('flasher' in hub) {
		if (hub.flasher) {
			clearInterval(hub.flasher);
		}
	},

	renderPlayers: function(pData) {
		$.each(pData, function(userID, player) {

			console.log("Player ID: " + userID);

			var players = clientState.allPlayers;

			console.log(players);


			var updateLocalCounts = function(type) {
				var typeCount = 0;
				for (id in players) {
					if (players[id].type == type) {
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
					type: player.type
				};
				updateLocalCounts(player.type);
				players[userID].localID = player.type + " " + players.localCount[player.type].toString();
				console.log("New player stored locally as " + players[userID].localID);
				console.log(players);
			}

			players[userID].latestPos = player.locData[0];
			//players[userID].team = player.team;

			var playerMark; // = viz.marker()

			//var markerIcon = {};

			switch (player.team) {
				case 'gov':
					players[userID]['marker'] = viz.marker(player.type, players[userID].latestPos);

					//playerMark = viz.marker('agent', latestPos);
					//markerIcon = gov.agentMarker;
					break;
				case 'ins':
				default:
					players[userID]['marker'] = viz.marker(player.type, players[userID].latestPos);
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