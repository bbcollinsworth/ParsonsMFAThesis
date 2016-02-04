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
			'stroke': false
		},
		marker: {
			'draggable': true,
			'weight': 3
		},
		// flash: {
		// 	flashColor: 'red',
		// 	start: setInterval(function(){

		// 		this.area.color = c;
		// 		if (c == 'red'){
		// 			c = 'blue';
		// 		} else {
		// 			c = 'red';
		// 		}
		// 	},500);


		// }
		flash: function() {
			var c = 'red';
			setInterval(function() {

				this.area.options.fillColor = c;
				if (c == 'red') {
					c = 'blue';
				} else {
					c = 'red';
				}
			}, 500);

		}
		// {
		// 	'animation': "blink 1s steps(2, start) infinite"
		// }


	},

	flashHub: function(hub) {
		var c = '#ff0000';
		setInterval(function() {

			hub.area.options.fillColor = c;
			// if (c == '#ff0000') {
			// 	c = '#0033ff';
			// } else {
			// 	c = '#ff0000';
			// }
		}, 500);

	},

	marker: function(type, pos) {

		var m = L.marker([pos.lat, pos.lng], {
			icon: L.mapbox.marker.icon(viz.markerOptions[type])
		});

		return m;

	},

	hub: function(hData) {

		var renderedArea = L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']);

		var renderedMarker = L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']);
		renderedMarker.setRadius(10);

		var h = {
			area: renderedArea,
			marker: renderedMarker,
			flash: viz.hubOptions.flash
		};

		return h;
	},

	searchButton: function() {
		// <div class="ui-btn" id="searchButton" data-icon="eye">
		//       <div class="ui-btn ui-corner-all ui-icon-eye ui-btn-icon-notext">Eye Icon</div>
		//     </div>
		var eyeIcon = $("<div />", {
			'class': "ui-btn ui-corner-all ui-icon-eye ui-btn-icon-notext"

		});

		// var content = {
		// 	'class': "ui-btn",
		// 	'id': "searchButton",
		// 	'data-icon': "eye"
		// };
		var button = $("<div />", {
			'class': "ui-btn",
			'id': "searchButton",
			'data-icon': "eye"
		});

		button.append(eyeIcon);

		return button;

	}


};