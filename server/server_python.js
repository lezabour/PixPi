


//Attrape toutes les erreurs et evitent de faire planter NODejs
process.on('uncaughtException', function (err) {
  console.log('Caught exception: ', err);
});


var PythonShell = require('python-shell');
var options = {
mode: 'text',
pythonOptions: ['-u'],
//args: [latitude,longitude],
scriptPath: '/home/pi/projets/qav500/'
};
var latitude=0;
var longitude=0;

var pyshell = new PythonShell('node_mavlink.py', options);
//pyshell.send('hello11111');

//On gere les messages issus de Python
pyshell.on('message', function (message) {
// received a message sent from the Python script (a simple "print" statement)
  try {
    obj = JSON.parse(message);
    latitude = obj.latitude;
    longitude = obj.longitude;
    console.log("PY->latitude:"+obj.latitude+" longitude:"+obj.longitude);
  } catch (e) {
    console.log("PY->"+message);
  }
});



var express = require('express')
  , http = require('http')
  , morgan = require('morgan');
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

  socket.on('status', function(){
      pyshell.send('status');
  });

	socket.on('photo', function () {
    console.log('NJS-> Prendre une photo - GPS: '+latitude+"-"+longitude);
    if(latitude){
      pyshell.send('photo');
		  socket.emit('photo', { data: 'lat:'+latitude+';lon:'+longitude });
    } else {
    console.log('NJS-> Erreur GPS coord undefined');
      socket.emit('photo', { data: 'error - undefined gps coordinate' });
    }
  });
});
