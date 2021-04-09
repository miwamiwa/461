'use strict';

/*
hello world
*/

const express = require('express');
const environmentVars = require('dotenv').config();
const app = express();
const port = process.env.PORT || 1337;

// -------------------------------- g cloud setup stuff
const speech = require('@google-cloud/speech');
const speechClient = new speech.SpeechClient({
  projectId: process.env.PROJECT_ID,
  credentials: {
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(new RegExp('\\\\n', '\g'), '\n'),
    client_email: process.env.GOOGLE_CLIENT_EMAIL
  }
});

// ------------------ file saving stuff

var fs = require('fs');
let fileIndex=[];
let saveData = [];
let importList;
let importDone = false;

// get any index data already on file
fs.readFile('text_files/index.txt', (error, txtString) => {
  if (error) throw err;

  let str = txtString.toString();
  let arr= str.split('\n');

  // remove any empty entries
  for(let i=arr.length-1; i>=0; i--){
    if(arr[i]=='') arr.splice(i,1);
  }

  // update file index array
  fileIndex=arr;
  console.log("fileIndex:")
  console.log(fileIndex);

  importList = Array.from(fileIndex);
  console.log(importList);
  if(importList.length>0) importImportList();
  else importDone = true;
});

function importImportList(){
  console.log("importing!")
  let file = importList[0];
  importList.shift();

  fs.readFile('text_files/'+file+'.txt',"ascii", (error, txtString) => {
    if (error) throw err;

    let str = txtString.toString();
    let arr= str.split('\n');
    // buffer save data

    while(str.indexOf("\n")!=-1)
      str =str.replace("\n"," ")

    saveData[file]=str;

    if(importList.length>0) setTimeout(importImportList,1);
    else importOver();
  });


}

function importOver(){
  console.log("import over!");
  console.log(saveData);
  importDone = true;
}

// -------------------------- tcp stuff and wav-saving stuff:

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

// this is the wav configuration for front end mic input
var wavOpts2 = {
  'channels':1,
  'sampleRate':16000,
  'bitDepth':16
};

// ------------------------------ more gcloud setup stuff:

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

// socket io setup stuff
const server = require('http').createServer(app);
const io = require('socket.io')(server);



// ============ OSC SETUP  ============ //



// node-osc also uses socket.io, plus some other thing/library that enables
// the udp communication to happen.

// osc sends data to unity or touch designer
const { Client, Server } = require('node-osc');
const client2 = new Client('127.0.0.1', 3332); // osc output port
var server2 = new Server(6161, '0.0.0.0'); // osc input port
let oscReady = false;

// start listening
server2.on('listening', () => {
  oscReady = true;
  console.log('OSC Server is listening.');
})

// print any messages coming in thru osc
server2.on('message', (msg) => {
  console.log(`Message: ${msg}`);
  //server2.close();
});

// a function to send osc messages without worrying about syntax
function sendOSCmess(header,message){
  client2.send(header, message, (err) => {
    if (err) console.error(err);
  });
}



// ============ EXPRESS SETUP idk  ============ //

// ( it came with the template project )
// lays a front end.

app.use('/assets', express.static(__dirname + '/public'));
app.use('/session/assets', express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
app.get('/', function (req, res) {
  res.render('index', {});
});
app.use('/', function (req, res, next) {
  next(); // console.log(`Request Url: ${req.url}`);
});




// ============= SOCKET.IO  setup woop woop ================= //
// socket.io sends data to gcloud and to the front end




// this var holds stream output & listener. it is null when not streaming.
let recognizeStream = null;

io.on('connection', function (client) {
  // setup listeners whenever a client (the front end) connects
  console.log('Client Connected to server');
  let writer=null;
  let outPath;

  // send message back to confirm connection
  client.on('join', function () {
    client.emit('messages', 'Socket Connected to Server');
  });
  // idk what that's for? sounds useless
  client.on('messages', function (data) {
    client.emit('broad', data);
  });

  // receive start/stop commands from the front-end:

  client.on('startGoogleCloudStream', function (data) {
    console.log("opened mic on front-end");

    // start a new wav file
    outPath = getUniqueOutputPath();
    writer = new wav.FileWriter(outPath, wavOpts2);

    // grab only the part witht the file number
    outPath=outPath.substring(outPath.indexOf(`out`)+4,outPath.indexOf(".wav"));
    stringBuffers[outPath] ="";
    startRecognitionStream(this, outPath);

  });

  client.on('endGoogleCloudStream', function () {
    console.log("closed mic on front-end");
    stopRecognitionStream();
    writer.end(); // finish wav file

    // write text file with transcript info
    fs.writeFile('text_files/'+outPath+'.txt', stringBuffers[outPath], (error) => {
      if (error) throw error;
    });

    // update file index array
    fileIndex.push(outPath);

    // update file index files indexing file
    let str = fileIndex.join("\n");
    fs.writeFile('text_files/index.txt', str, (error) => {
      if(error) throw error;
    });

    // empty string buffer
    stringBuffers[outPath]=undefined;
  });

  // funnel mic data from front end to g-cloud
  // & write to buffer to save as wav

  client.on('binaryData', function (data) {
    if (recognizeStream !== null) {
      process.stdout.write("."); // print a dot in the console
      recognizeStream.write(data);
      writer.write(data); // add data to wav file
    }
  });
});

let stringBuffers = [];


// startRecognitionStream()
//
// Start streaming mic data to gcloud, and listen for the
// transcript data that comes back.
// g-cloud sends its latest transcript results while the mic
// stream is running, then a "final" transcript after a pause
// or when the mic stream ends.

function startRecognitionStream(tempclient,filepath) {
  console.log("started streaming mic data to gcloud");

  // listened for incoming data
  recognizeStream = speechClient
  .streamingRecognize(request)
  .on('error', console.error)
  // handler function for data coming in from g-cloud.
  .on('data', (data) => {

    // print transcript to console
    process.stdout.write(
      data.results[0] && data.results[0].alternatives[0]
      ? `Transcription: ${data.results[0].alternatives[0].transcript}\n`
      : '\n\nReached transcription time limit, press Ctrl+C\n'
    );

    // relay full data to front-end
    if(tempclient!=undefined)
      tempclient.emit('speechData', data);

    // send the most likely transcript through OSC
    if(oscReady){
      sendOSCmess("/test",data.results[0].alternatives[0].transcript);
    }

    // if end of utterance, let's restart stream
    // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
    if (data.results[0] && data.results[0].isFinal) {

      stringBuffers[filepath] += data.results[0].alternatives[0].transcript + "\n";
      stopRecognitionStream();
      startRecognitionStream(tempclient,filepath);
    }
  });
}



// stopRecognitionStream()
//
// end stream to gcloud

function stopRecognitionStream() {
  console.log("stopping streaming mic data to gcloud")
  if (recognizeStream!=null) {
    recognizeStream.end();
    console.log("stream stopped. ")
  }
  recognizeStream = null;
}

// start the socket.io server
server.listen(port, "0.0.0.0", function () {
  console.log('Server started on port:' + port);
});





/*  TCP LAN ARGON AUDIO STUFF  */

/* and also stuff pertaining to saving .wav files */
/* right now the front end can also save wav files using a different thing LOL */


// Output files in the out directory are of the form 00001.wav. lastNum is used
// to speed up scanning for the next unique file.
var lastNum = 0;

// Create the out directory if it does not exist
try { fs.mkdirSync(outputDir); }
catch(e) {}

let tcpStreamStarted=false;

// Start a TCP Server. This is what receives data from the Particle Photon
// https://gist.github.com/creationix/707146
net.createServer(function (socket) {
  console.log('data connection started from ' + socket.remoteAddress);

  // The server sends a 8-bit byte value for each sample. Javascript doesn't really like
  // binary values, so we use setEncoding to read each byte of a data as 2 hex digits instead.
  socket.setEncoding('hex');

  var outPath = getUniqueOutputPath();

  let writer = new wav.FileWriter(outPath, wavOpts);
  //writer.write(buf);
  //writer.end();

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

      // SEND DATA TO G CLOUD
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
  return "00000";
}

//  using "Google Cloud Speech Playground with node.js and socket.io"
//  Created by Vinzenz Aubry for sansho 24.01.17 v@vinzenzaubry.com
