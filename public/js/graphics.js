var viz = {
	suspect: {
		'marker-size': 'large',
		'marker-symbol': 'pitch',
		'marker-color': '#ff0000'
	},

	agent: {
		'marker-size': 'large',
		'marker-symbol': 'police',
		'marker-color': '#0000ff'
	},
	marker: function(type, pos) {
		var markerOptions = {};

		var m = L.marker([pos.lat, pos.lng], {
					icon: L.mapbox.marker.icon(viz[type])
				});

		return m;

		// switch (type) {
		// 	case 'agent':
		// 		markerOptions = agentOptions;
		// 		break;
		// 	case 'suspect':
		// 		break;
		// 	default:
		// 		break;
		// }

		// L.marker([latestPos.lat, latestPos.lng], {
		// 			icon: L.mapbox.marker.icon(markerIcon)
		// 		})
	}
};