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
			'weight': 3
		},
		//flashInterval: {},

		flash: {
			flasher: {},
			start: function(intervalInSeconds) {
				var c = '#ff0000';
				var interval = intervalInSeconds * 1000;
				this.flash.flasher = setInterval(function() {

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
			stop: function() {
				clearInterval(this.flash.flasher);
			}
		}
		// {
		// 	'animation': "blink 1s steps(2, start) infinite"
		// }


	},


	marker: function(type, pos, isDraggable) {

		if (isDraggable === undefined) {
			isDraggable = false;
		}

		var m = L.marker([pos.lat, pos.lng], {
			icon: L.mapbox.marker.icon(viz.markerOptions[type]),
			draggable: isDraggable
		});

		return m;

	},

	hub: function(hData) {
		var h = {
			area: L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']),
			marker: L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']), //this.renderMarker(this.markerRadius),
			markerRadius: 10,
			flash: function(interval) {
				//gov.flashHub(this,interv);
				if (interval === undefined) {
					interval = 1000;
				}

				var c = '#ff0000';

				h.stopFlash();
				h['flasher'] = setInterval(function() {

					h.area.setStyle({
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
			stopFlash: function() {
				if (h.flasher) {
					clearInterval(h.flasher);
				}
				//gov.stopFlash(this);
			}
			//flasher: {},
		};

		h.marker.setRadius(h.markerRadius);

		return h;
	},

	// hub: function(hData) {

	// 	var renderedArea = L.circle([hData.lat, hData.lng], hData.hackRange, viz.hubOptions['area']);

	// 	var renderedMarker = L.circleMarker([hData.lat, hData.lng], viz.hubOptions['marker']);
	// 	renderedMarker.setRadius(10);

	// 	var h = {
	// 		area: renderedArea,
	// 		marker: renderedMarker,
	// 		flash: viz.hubOptions.flash
	// 	};

	// 	return h;
	// },

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