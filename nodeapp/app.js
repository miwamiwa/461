'use strict';

//  Google Cloud Speech Playground with node.js and socket.io
//  Created by Vinzenz Aubry for sansho 24.01.17
//  Feel free to improve!
//	Contact: v@vinzenzaubry.com

const express = require('express'); // const bodyParser = require('body-parser'); // const path = require('path');
const environmentVars = require('dotenv').config();

// Google Cloud
const speech = require('@google-cloud/speech');

const speechClient = new speech.SpeechClient({
  projectId: process.env.PROJECT_ID,
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(new RegExp('\\\\n', '\g'), '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL
  }
});

const app = express();
const port = process.env.PORT || 1337;


const server = require('http').createServer(app);

const io = require('socket.io')(server);


//  var server3 = io2.connect('http://localhost/osc/servers/8000'),
//    client2 = io2.connect('http://localhost/osc/clients/8000');

//  server3.on('message', function(message) {
//  console.log(message);
//  });

/*
this is the node-osc stuff

also tried: osc-js, osc-web, osc.js, osc.io
over and over again...
didn't work.
LOL
*/
const { Client, Server } = require('node-osc');

const client2 = new Client('127.0.0.1', 3332);
var server2 = new Server(6161, '0.0.0.0');
let oscReady = false;

server2.on('listening', () => {
  oscReady = true;
  console.log('OSC Server is listening.');
})

server2.on('message', (msg) => {
  console.log(`Message: ${msg}`);
  server2.close();
});
/*
//test osc
let counter =0;
setInterval(function(){
  counter++;
  client2.send('/hello', 'world '+counter, (err) => {
    if (err) console.error(err);
    //  client2.close();
  });
}, 1000);
*/
// END of the node-osc stuff.
//
//


app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');

// =========================== ROUTERS ================================ //

app.get('/', function (req, res) {
  res.render('index', {});
});

app.use('/', function (req, res, next) {
  next(); // console.log(`Request Url: ${req.url}`);
});

// =========================== SOCKET.IO ================================ //
let recognizeStream = null;

io.on('connection', function (client) {
  console.log('Client Connected to server');


  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });

  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  client.on('startGoogleCloudStream', function (data) {
    startRecognitionStream(this, data);
  });

  client.on('endGoogleCloudStream', function () {
    stopRecognitionStream();
  });

  client.on('binaryData', function (data) {
    // console.log(data); //log binary data
    if (recognizeStream !== null) {
      console.log("relayed data to g cloud")
      //console.log(data);
      recognizeStream.write(data);
    }
  });
/*
// test socket communication
  setInterval(function(){
    client.emit("/test","test");
  }, 1000);
*/

});


function startRecognitionStream(tempclient) {

  console.log("start stream");
  //console.log(speechClient)
  recognizeStream = speechClient
  .streamingRecognize(request)
  .on('error', console.error)
  .on('data', (data) => {
    process.stdout.write(
      data.results[0] && data.results[0].alternatives[0]
      ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
      : '\n\nReached transcription time limit, press Ctrl+C\n'
    );

    // send to front-end
    if(tempclient!=undefined)
    tempclient.emit('speechData', data);

    // also send thru osc
    if(oscReady){
      sendOSCmess("/test","bonsoir");
      sendOSCmess("/test",data.results[0].alternatives[0].transcript);
    }

    //else
    //console.log(data.results[0].alternatives[0]);

    // if end of utterance, let's restart stream
    // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
    if (data.results[0] && data.results[0].isFinal) {
      stopRecognitionStream();
      startRecognitionStream(tempclient);
      // console.log('restarted stream serverside');
    }
  });
}

function sendOSCmess(header,message){
  client2.send(header, message, (err) => {
    if (err) console.error(err);
    //  client2.close();
  });
}

function stopRecognitionStream() {
  console.log("stop stream command")
  if (recognizeStream!=null) {
    recognizeStream.end();
    console.log("stream stopped. ")
  }
  recognizeStream = null;
}
// =========================== GOOGLE CLOUD SETTINGS ================================ //

// The encoding of the audio file, e.g. 'LINEAR16'
// The sample rate of the audio file in hertz, e.g. 16000
// The BCP-47 language code to use, e.g. 'en-US'
const encoding = 'LINEAR16';
const sampleRateHertz = 16000;
const languageCode = 'en-US'; //en-US

const request = {
  config: {
    encoding: encoding,
    sampleRateHertz: sampleRateHertz,
    languageCode: languageCode,
    profanityFilter: false,
    enableWordTimeOffsets: true,
    // speechContexts: [{
    //     phrases: ["hoful","shwazil"]
    //    }] // add your own speech context for better recognition
  },
  interimResults: true, // If you want interim results, set this to true
};

// =========================== START SERVER ================================ //

server.listen(port, "0.0.0.0", function () {
  //http listen, to make socket work
  // app.address = "127.0.0.1";
  console.log('Server started on port:' + port);

});








/*  TCP LAN ARGON AUDIO STUFF  */


// Install
// npm install
//
// Run
// npm run

var fs = require('fs');
var path = require('path');
var net = require('net');
var wav = require('wav'); // https://github.com/TooTallNate/node-wav
const { debug } = require('console');

// For this simple test, just create wav files in the "out" directory in the directory
// where audioserver.js lives.
var outputDir = path.join(__dirname, "out");

var dataPort = 7123; // this is the port to listen on for data from the Photon

// If changing the sample frequency in the Particle code, make sure you change this!
var wavOpts = {
  'channels':1,
  'sampleRate':16000,
  'bitDepth':8
};

// Output files in the out directory are of the form 00001.wav. lastNum is used
// to speed up scanning for the next unique file.
var lastNum = 0;

// Create the out directory if it does not exist
try {
  fs.mkdirSync(outputDir);
}
catch(e) {
}

let tcpStreamStarted=false;
// Start a TCP Server. This is what receives data from the Particle Photon
// https://gist.github.com/creationix/707146
net.createServer(function (socket) {
  console.log('data connection started from ' + socket.remoteAddress);

  // The server sends a 8-bit byte value for each sample. Javascript doesn't really like
  // binary values, so we use setEncoding to read each byte of a data as 2 hex digits instead.
  socket.setEncoding('hex');

  var outPath = getUniqueOutputPath();

  var writer = new wav.FileWriter(outPath, wavOpts);

  socket.on('data', function (data) {


    // We received data on this connection.
    // var buf = Buffer.from(data, 'hex');
    let buf = new Buffer(data, 'hex');
    let result = [];
    if (wavOpts.bitDepth == 16) {
      // The Photon sends up unsigned data for both 8 and 16 bit
      // The wav file format is unsigned for 8 bit and signed two-complement for 16-bit. Go figure.
      for(let ii = 0; ii < buf.length; ii += 2) { // two hex chars per 1 int value
        let unsigned = buf.readUInt16LE(ii);
        let signed = unsigned - 32768;
        //signed = Math.floor(16*signed);
        buf.writeInt16LE(signed, ii);
      }
    }

    if(!tcpStreamStarted){
      console.log("data in! ");
      startRecognitionStream()
    }

    if (recognizeStream !== null) {
      //let arr = new Int16Array(buf);
      //console.log(buf);
      recognizeStream.write(buf);
      process.stdout.write(".");
      //console.log(buf);
    }

    tcpStreamStarted=true;

    // console.log("got data " + (data.length / 2));
    writer.write(buf);
  });
  socket.on('end', function () {
    tcpStreamStarted=false;
    stopRecognitionStream();
    console.log("transmission complete!")
    //console.log('transmission complete, saved to ' + outPath);
    writer.end();
  });
}).listen(dataPort);


function formatName(num) {
  var s = num.toString();

  while(s.length < 5) {
    s = '0' + s;
  }
  return s + '.wav';
}

function getUniqueOutputPath() {
  for(var ii = lastNum + 1; ii < 99999; ii++) {
    var outPath = path.join(outputDir, formatName(ii));
    try {
      fs.statSync(outPath);
    }
    catch(e) {
      // File does not exist, use this one
      lastNum = ii;
      return outPath;
    }
  }
  lastNum = 0;
  return "00000.wav";
}
