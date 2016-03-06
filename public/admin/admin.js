var app = {};
var socket; // = io('/admin');
var serverMsg = 'Connecting...';

//Google Maps variables
var map;
//var popups = [];

app.init = function() {
    var namespaceAddr = "http://rproto-dev.elasticbeanstalk.com/admin";
    if (location.hostname == "localhost") {
        namespaceAddr = location.hostname + ":" + location.port + '/admin';
        console.log("Location: " + namespaceAddr);
    }
    socket = io.connect(namespaceAddr); //'http://localhost:9000/admin'

    $('#getUsers').on('click', function(){
        socket.emit('adminWantsUsers',{});
    })
};

app.init();

socket.on('greeting', function(res, err) {
    console.log(res.msg);

    var logs = JSON.stringify(res.logs, null, 4);
    //var logs = JSON.parse(res.logs);

    // var formatLogs = function(){
    // 	for (p in res.logs){

    // 		var player = res.logs[p];
    // 		for (i in player){
    // 			var logline = player.msg[i].time + ": " + player.msg[i].content;
    // 		}
    // 	}
    // }

    $('#app').html(logs);
    //getMapData();
});