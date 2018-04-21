//Serveur NodeJS avec Mavlink + Connection PixHawk + photo
/**
 * Created by Elie on 15/04/2018.
 */

// modules web
var express = require('express')
  , http = require('http')
  , morgan = require('morgan');

//Communication Python Node Shell
var PythonShell = require('python-shell');

//Communication via SerialPort
var SerialPort = require('serialport').SerialPort;
var port = new SerialPort('/dev/ttyACM0', {
  baudRate: 115200
});

//Communication via Mavlink
var mavlink = require('mavlink');
var mymavlink = new mavlink(0,0);
var mavlinkData = "";
var latitude;
var longitude;
mymavlink.on("ready",function() {
	console.log('mavlink Ready');
	port.on('data',function(data) {
		mymavlink.parse(data);
		//console.log(data);
	});
  mymavlink.on("GPS_RAW_INT",function(message,fields) {
		latitude = fields.lat;
		longitude = fields.lon;
		//console.log(fields);
		console.log(latitude+"--"+longitude);
	});
	//On enregistre les coordonnes GPS en temps reel
	mymavlink.on("message",function(message,fields) {
		//console.log("message");
		//console.log(message);
    //console.log(message);
	});
	mymavlink.on("sequenceError",function(message) {
		//console.log("sequenceError");
		//console.log(message);
	});

	mymavlink.on("checksumFail", function(message) {
		//console.log("checksumFail");
		//console.log(message);
	});

  mymavlink.on("ATTITUDE",function(message, fields) {
		//console.log("ATTITUDE");
		//console.log(message);
    //console.log(fields);
	});

  mymavlink.on("GPS_STATUS",function(message) {
		console.log('GPS STATUS');
		console.log(message);
	});




});

// configuration files
var configServer = require('./lib/config/server');

// app parameters
var app = express();
app.set('port', configServer.httpPort);
app.use(express.static(configServer.staticFolder));
app.use(morgan('dev'));

// server index - //Declaration des chemins d'acces
require('./lib/routes').serveIndex(app, configServer.staticFolder);

// HTTP server
var server = http.createServer(app);
server.listen(app.get('port'), function () {
  console.log('Serveur: HTTP server listening on port ' + app.get('port'));
});
module.exports.app = app;

//Socket
var io = require('socket.io')(server);

io.on('connection', function (socket) {
	console.log('Nouvelle Connection web');
	//On ecoute le mavlink

    socket.emit('robot status', { data: 'server connected' });

    socket.on('disconnect', function(){
        console.log( socket.name + ' has disconnected from the chat.' + socket.id);

    });
    socket.on('photo', function () {
      console.log('Prendre une photo - GPS: '+latitude+"-"+longitude);
      if(latitude){
        coord = Prendre_Photo(socket,latitude,longitude);
  		socket.emit('photo', { data: 'lat:'+latitude+';lon:'+longitude });
      } else {
	    console.log('Erreur GPS coord undefined');
        socket.emit('photo', { data: 'error - undefined gps coordinate' });
      }

    });

});





//////////////////////////////////////////////////////////
//FONCTIONS POUR LE GPS
//////////////////////////////////////////////////////////

function get_GPSPosition(mymavlink){
	var position = [0,0];
	mymavlink.on("GPS_RAW_INT",function(message,fields) {
		console.log(fields.lat+"-".fields.lon);
		position[0] = fields.lat;
		position [1] = fields.lon;
		//return position;
	});
}

//////////////////////////////////////////////////////////
//FONCTIONS POUR LA WEBCAM
//////////////////////////////////////////////////////////
function prendre_photo(mymavlink){
	return "coucou";
}

function Prendre_Photo(socket,latitude,longitude) {
    image="";
    folder="";
    image_url="";

	console.log('Serveur: --> JS: Demande de prise de photo');
	//Options pour lancer le script Py
    var options = {
	  mode: 'text',
	  pythonOptions: ['-u'],
	  args: [latitude,longitude],
	  scriptPath: '/home/pi/projets/qav500/'
	};

	var pyshell = new PythonShell('take_picture_with_gps.py', options);
	pyshell.on('message', function (message) {
	  // received a message sent from the Python script (a simple "print" statement)
		if(stringContains(message,'-') ) {
			var res = message.split("-");
			console.log("latitude:"+res[0]+" longitude:"+res[1]);
			return "latitude:"+res[0]+" longitude:"+res[1];
		}
	});


}


function lancer_camera(socket) {
	console.log("lancer camera");
	var sys = require('sys');
	var exec = require('child_process').exec;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec('/home/pi/projects/libraries/mjpg-streamer/mjpg_streamer -i "/usr/local/lib/input_uvc.so -f 25 -r 320x240" -o "/usr/local/lib/output_http.so -w /usr/local/lib/www" &',puts);
	console.log("camera ok");
	socket.emit('camera_on');

}

function arret_camera() {
	console.log("stoper camera");
	var sys = require('sys');
	var exec = require('child_process').exec;
	function puts(error, stdout, stderr) { sys.puts(stdout) }
	exec('kill $(pgrep mjpg_streamer) > /dev/null 2>&1',puts);


}

function stringContains(inputString, stringToFind) {
    return (inputString.indexOf(stringToFind) != -1);
}

//CGeneration d'un entier aleatoir
function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low + 1) + low);
}
