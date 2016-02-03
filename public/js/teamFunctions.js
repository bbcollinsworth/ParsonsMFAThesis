var gov = {

	suspectMarker: {
		'marker-size': 'large',
		'marker-symbol': 'pitch',
		'marker-color': '#ff0000'
	},

	agentMarker: {
		'marker-size': 'large',
		'marker-symbol': 'police',
		'marker-color': '#0000ff'
	},
	
	renderHubs: function(hubData) {
		hubs = hubData;

		var circleOptions = {
			stroke: false
		};

		var circleMarkerOptions = {
			draggable: true,
			weight: 3
		};

		$.each(hubs, function(i, hub) {
			hub['area'] = L.circle([hub.lat, hub.lng], hub.hackRange, circleOptions);
			// hub.marker.options = circleOptions;
			hub.area.addTo(map);
			hub['marker'] = L.circleMarker([hub.lat, hub.lng], circleMarkerOptions);
			hub.marker.setRadius(10);
			hub.marker.addTo(map);

		});
	},

	renderPlayers: function(pData) {
		$.each(pData, function(userID, player) {

			var latestPos = player.locData[0];

			var playerMark;// = viz.marker()

			//var markerIcon = {};

			switch (player.team) {
				case 'gov':
					playerMark = viz.marker('agent',latestPos);
					//markerIcon = gov.agentMarker;
					break;
				case 'ins':
				default:
					playerMark = viz.marker('suspect',latestPos);
					//markerIcon = gov.suspectMarker;
					break;
			}

			playerMark.addTo(map);

			// L.marker([latestPos.lat, latestPos.lng], {
			// 	icon: L.mapbox.marker.icon(markerIcon)
			// }).addTo(map);
		});
	}
};