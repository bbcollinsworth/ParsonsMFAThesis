var viz = {
	markerOptions: {
		suspect: {
			'marker-size': 'large',
			'marker-symbol': 'pitch',
			'marker-color': '#ff0000'
		},

		agent: {
			'marker-size': 'large',
			'marker-symbol': 'police',
			'marker-color': '#0000ff'
		}
	},
	hubOptions: {
		area: {
			stroke: false
		},
		marker: {
			draggable: true,
			weight: 3
		}
	},
	marker: function(type, pos) {

		var m = L.marker([pos.lat, pos.lng], {
			icon: L.mapbox.marker.icon(viz.markerOptions[type])
		});

		return m;

	},
	hub: function(hData){

		// area: function(pos) {
		// 	var a = L.circle([pos.lat, pos.lng], hub.hackRange, circleOptions);
		// 	//return m;
		// }

		var renderedArea = L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']);
			
		var renderedMarker = L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']);
		renderedMarker.setRadius(10);

		var h = {
			area: renderedArea,
			marker: renderedMarker
		};

		return h;
	}

	// marker: {
	// 	options: {},
	// 	suspect: function(pos) {
	// 		vis.marker.options = {
	// 			'marker-size': 'large',
	// 			'marker-symbol': 'pitch',
	// 			'marker-color': '#ff0000'
	// 		};
	// 	},
	// 	agent: function(pos) {
	// 		var options
	// 	}
	// }

};