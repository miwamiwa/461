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
let gcloudProcessDelay = 400; // time (ms) to wait before checking final gcloud results after turning off mic
// -------give me rita!
let RiTa = require('rita');
let rm;
let markovready=false;

function setupMarkov(){
  rm = new RiTa.markov(2);
}

setupMarkov();
// ------------------ file saving stuff

var fs = require('fs');
let fileIndex=[];
let saveData = [];
let importList;
let importDone = false;

// get any index data already on file
fs.readFile('public/out/index.txt', (error, txtString) => {
  if (error){
    console.log("no index file!")
    console.log("moving on anyway chief");
    return;
  }

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

  fs.readFile('public/out/'+file+'.txt',"ascii", (error, txtString) => {
    if (error) throw err;

    let str = txtString.toString();
    let arr= str.split('###');

    let dataobj = {}
    // buffer save data

    while(arr[0].indexOf("\n")!=-1)
      arr[0] =arr[0].replace("\n"," ")

      // add to save data buffer
    dataobj.phrase = arr[0];

    // get timestamp data
    dataobj.timeStamps = [];
    let stamps = arr[1].split("\n");
    for(let i=0; i<stamps.length; i++){
      let stamp = stamps[i].split(" ");
      if(stamp[0]!="")
      dataobj.timeStamps.push( {
        start:stamp[1],
        end:stamp[2],
        word:stamp[0]
      });
    }


    saveData[file] = dataobj;
    // add string to markov model
    rm.addText(dataobj.phrase);

    if(importList.length>0) setTimeout(importImportList,1);
    else importOver();
  });
}

function importOver(){

  console.log("import over!");
  console.log(saveData);
  importDone = true;

  //getrita();

}

async function getrita(clientinput){
  try{
    //console.log("got rita:");
    let r = await rm.generate();
    //console.log(result);
    //console.log("... that was the test. good job everybody.\n")
    console.log("generating something with rita")
    console.log("result:")
    console.log(r)
    // if we successfully generated something
    if(r!=undefined&&r!=false&&r!=""){
      // send answer back to front-end
      generatePlaySequence(r,clientinput);

    }
    // otherwise
    else{
      clientinput.emit("rita-result","nada");
      console.log("not enough data to ri-generate");
    }

  }
  catch(error){
    console.log("\nrita failed!")
    console.log(error);
    return false;
  }
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
  console.log('OSC Server is listening. lets gooooo');
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


  client.on("client-request", function(data){

    switch(data){
      case 'random-recording':

      console.log("random-recording request");
      let pick = Math.floor(Math.random()*fileIndex.length);
      console.log("the result is "+fileIndex[pick]);
      client.emit("got-random-recording",{
        file:fileIndex[pick],
        phrase:saveData[fileIndex[pick]].phrase
      });

      sendOSCmess("/randomRecording",saveData[fileIndex[pick]].phrase);
      break;


      case 'latest-recording':

      console.log("\nlatest-recording request");
      let result = fileIndex[fileIndex.length-1];
      console.log("the result is "+result);
      client.emit("got-latest-recording",{
        file:result,
        phrase:saveData[result].phrase
      });
      sendOSCmess("/latestRecording",saveData[result].phrase);
      break;


      case 'generate-phrase':
      console.log("\ngenerate-phrase request");

      if(fileIndex.length>5) getrita(this);
      else console.log("Not enough recordings. Right now there are "+fileIndex.length);

      break; // case 'generate-phrase' END
    }
  });

  // receive start/stop commands from the front-end:

  client.on('startGoogleCloudStream', function (data) {
    if(!clientOnWait){
      console.log("opened mic on front-end");

      // start a new wav file
      outPath = getUniqueOutputPath();
      writer = new wav.FileWriter(outPath, wavOpts2);

      // grab only the part witht the file number
      outPath=outPath.substring(outPath.indexOf(`out`)+4,outPath.indexOf(".wav"));
      stringBuffers[outPath] ="";
      timestampBuffers[outPath] ="";

      startRecognitionStream(this, outPath);
      sendOSCmess("/micstart","start");
    }

  });


  // on stream-over request from front end
  client.on('endGoogleCloudStream', function () {

    sendOSCmess("/micstop","stop");
    console.log("closed mic on front-end");
    stopRecognitionStream();
    writer.end(); // finish wav file

    clientOnWait = true;
    client.emit("back-end-ready","not-ready");
    setTimeout(processfinaldata, gcloudProcessDelay, outPath, this);
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
let clientOnWait = false;
function processfinaldata(outPath, clientinput){
  clientinput.emit("back-end-ready","ready");
  clientOnWait = false;
  // write text file with transcript info
  fs.writeFile(
    'public/out/'+outPath+'.txt',
    stringBuffers[outPath] +"###"+ timestampBuffers[outPath],
    (error) => {
    if (error) throw error;
  });

  // add text to markov model
  let combinedstring=stringBuffers[outPath].replace("\n"," ");
  rm.addText(combinedstring);

  // update file index array
  fileIndex.push(outPath);

  // update file index files indexing file
  let str = fileIndex.join("\n");
  fs.writeFile('public/out/index.txt', str, (error) => {
    if(error) throw error;
  });

  // update current data buffer

  let dataobj = {}
  // buffer save data


    // add to save data buffer
  dataobj.phrase = combinedstring;

  // get timestamp data
  dataobj.timeStamps = [];
  let stamps = timestampBuffers[outPath].split("\n");
  for(let i=0; i<stamps.length; i++){
    let stamp = stamps[i].split(" ");
    if(stamp[0]!="")
    dataobj.timeStamps.push( {
      start:stamp[1],
      end:stamp[2],
      word:stamp[0]
    });
  }


  saveData[outPath] = dataobj;
  console.log("updated buffer!")
  console.log(saveData[outPath])

  // empty  buffer
  stringBuffers[outPath]=undefined;
  timestampBuffers[outPath]=undefined;
}

let stringBuffers = [];
let seqWordIndex=0;
let seq=[];
let splitSentence;

function generatePlaySequence(phrase,clientinput){

  splitSentence = phrase.split(" ");
  seq=[];
  seqWordIndex=0;

  bufferseq(phrase,clientinput)

}

function seqBufferOver(phrase,clientinput){
  console.log("seq buffer done!");
  /*
  for(let i=0; i<seq.length; i++){
    console.log(seq[i].recording, seq[i].start, seq[i].end , seq[i].words,seq[i].sourcephrase);
  }
 */
  clientinput.emit("rita-result",{
    phrase:phrase,
    sequence:seq
  });

  // send answer via osc too
  sendOSCmess("/ritaresult",phrase);
  let str = "";
  for(let i=0; i<seq.length; i++){
    str+= seq[i].words+"@"+seq[i].sourcephrase;
    if(i!=seq.length-1) str+="#";
  }
  sendOSCmess("/ritasources",str);
}



function bufferseq(phrase,clientinput){

    let targetWord = splitSentence[seqWordIndex].replace(".","");
    let results = [];

    // find all instances of the word and add to results array

    for (var key in saveData) {
    //console.log(saveData[key]);
    let el = saveData[key];
    let t = el.timeStamps;
    for(let i=0; i<t.length; i++){
      if(el.timeStamps[i].word==targetWord){
        results.push({recording:key,word:i});
      }
    }
    }

    /*
    saveData.forEach((el, index) => {
      console.log(".")
      let t = el.timestamps;
      for(let i=0; i<t.length; i++){
        if(el.timestamps[i].word==targetWord){
          results.push({recording:index,word:i});
        }
      }
    });
    */

    // pick one of the instances
    let pick =0;
    if(results.length>1) pick = Math.floor(Math.random()*results.length);
    let result = results[pick];
    let data = saveData[result.recording].timeStamps[result.word];
    let starttime = data.start;
    let endtime = data.end;
    let wordcontent = targetWord;

    // extend end time if possible
    let nextword =1;
    while(
      // while there are more words after this one in the recording
      result.word+nextword<saveData[result.recording].timeStamps.length
      // and the next word is the same as the next word that we need
      &&splitSentence[seqWordIndex+nextword].replace('.','')
        ==saveData[result.recording].timeStamps[result.word+nextword].word){

          // update the end time
        endtime = saveData[result.recording].timeStamps[result.word+nextword].end;
        wordcontent+=" "+saveData[result.recording].timeStamps[result.word+nextword].word;
        // check the next word
        nextword++;
      }
    seqWordIndex+=nextword;

    // buffer sequence part
    seq.push({
      recording:result.recording,
      start: starttime,
      end: endtime,
      words: wordcontent,
      sourcephrase: saveData[result.recording].phrase
    });

    // trigger next
    if(seqWordIndex<splitSentence.length){
      // delay it slightly
      setTimeout( bufferseq, 1, phrase,clientinput);
    }
    else{
      seqBufferOver(phrase,clientinput);
    }
}
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



    // if end of utterance, let's restart stream
    // this is a small hack. After 65 seconds of silence, the stream will still throw an error for speech length limit
    if (data.results[0] && data.results[0].isFinal) {

      stringBuffers[filepath] += data.results[0].alternatives[0].transcript + "\n";
      // send the transcript via OSC
      sendOSCmess("/finaltranscript",data.results[0].alternatives[0].transcript);

      let stampstring="";
      let words = data.results[0].alternatives[0].words;
      for(let i=0; i<words.length; i++){
        let word = words[i].word;
        // start and end time baboom
        let startTime = `${words[i].startTime.seconds}.${words[i].startTime.nanos}`;
        let endTime = `${words[i].endTime.seconds}.${words[i].endTime.nanos}`;

        stampstring += word+" "+startTime+" "+endTime+"\n";
      }
      timestampBuffers[filepath] += stampstring;
      stopRecognitionStream();
      startRecognitionStream(tempclient,filepath);
    }
    // if this isn't the final transcript, send thru OSC anyway
    else if(oscReady){
      sendOSCmess("/livetranscript",data.results[0].alternatives[0].transcript);
    }
  });
}

let timestampBuffers = [];

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
  console.log('socket io server started on port:' + port);
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
      // SEND DATA TO G CLOUD
      recognizeStream.write(buf);
      process.stdout.write(".");
    }

    tcpStreamStarted=true;
    // add to wav buffer
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
