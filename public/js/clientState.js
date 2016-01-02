var clientState = {
	connected: false,
	mapLoaded: false,
	readyCheckRunning: false,
	ready: false,
	features: {
		geolocation: {
			title: 'Geolocation',
			helpText: 'To play, "allow" geolocation when prompted.',
			noSupportText: 'Geolocation not supported. Please use another device.',
			supported: false,
			ready: false,
			setup: navigator.geolocation,
			readyTest: function() {
				setTimeout(function() {
					navigator.geolocation.getCurrentPosition(function(position) {
						console.log('Position: ' + position.coords.latitude + ', ' + position.coords.longitude);
						clientState.features.geolocation.ready = true;
						console.log('Geoloc test successful');
						svcCheckList();
					});
				}, 1000);
			}
		},
		vibrate: {
			title: 'Vibration',
			helpText: '',
			noSupportText: 'Your browser does not support vibration.',
			supported: false,
			ready: true, //no prep required
			setup: function(vibrateLength) {
				try {
					navigator.vibrate = navigator.vibrate ||
						navigator.webkitVibrate ||
						navigator.mozVibrate ||
						navigator.msVibrate;
					navigator.vibrate(vibrateLength);
					//msg("Vibrate successful!");
					console.log("Vibrate successful!");
				} catch (err) {
					msg(err.message);
				}
			},
			readyTest: function(){
				console.log('Ready test called for vibration but no test.');
			}
		},
		localstorage: {
			title: 'Local Storage',
			helpText: '',
			noSupportText: 'Your browser does not support local storage.',
			supported: false,
			ready: true, //no prep required
			setup: localStorage,
			readyTest: function(){
				console.log('Ready test called for localStorage but no test.');
			}
		}
	}
};