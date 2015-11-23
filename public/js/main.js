var app = {};
var socket;
var connectedToServer = false;

app.init = function () {
	$('#alertBodyText').html('<p>Connecting...</p>');
	socket = io.connect();
};



//initializing mapbox.js / leaflet map
L.mapbox.accessToken = 'pk.eyJ1IjoiZnVja3lvdXJhcGkiLCJhIjoiZEdYS2ZmbyJ9.6vnDgXe3K0iWoNtZ4pKvqA';

var map = L.mapbox.map('map', 'fuckyourapi.o7ne7nmm', {
	zoomControl: false
}).setView([40.734801, -73.998799], 16);

//to override relative positioning from leaflet style
$('#map').css({
	"position": "static"
});

app.init();

socket.on('handshake',function (err,res) {
	$('#alertBodyText').html('<p>Connected to server. Hello, Jasmine!</p>');
});