'use strict';

window.onload = start;
const socket = io.connect();

// Stream Audio
let bufferSize = 2048,
AudioContext,
context,
processor,
input,
globalStream;

let recordingInProgress = false;
let useNoiseSuppression = true;

//variables for mic input and audio streaming
let audioElement = document.querySelector('audio'),
finalWord = false,
streamStreaming = false;




// start()
//
// called when page is ready to go

function start(){

  // see deviceselection.js
  populateDevicesList();
}

// toggleRecording()
//
// triggered by on-screen button
// see recording.js

function toggleRecording(){

  if(!recordingInProgress) initRecording();
  else stopRecording();

  recordingInProgress = !recordingInProgress;
}


function serverRequest(input){
  socket.emit("client-request",input);
}





//================= SOCKET IO =================
socket.on('connect', function (data) {
  console.log('connected to socket');
  socket.emit('join', 'Server Connected to Client');
});

socket.on('messages', function (data) {
  console.log(data);
});

socket.on('rita-result', function (data) {
  console.log(data);

  if(data!="nada"){
    let playButton=`<br><br> <input onclick="play()" id="playButton" type="button" value="Play" disabled="true"></input>`;
    document.getElementById("promptBox").innerHTML=data.phrase + playButton;
    loadSoundFileSequence(data.sequence);
  }
  else document.getElementById("promptBox").innerHTML="no data :(";



});

window.onbeforeunload = function () {
  if (streamStreaming) {
    socket.emit('endGoogleCloudStream', '');
  }
};


// downsamplebuffer()
//
// used to format audio before emitting via sockets

var downsampleBuffer = function (buffer, sampleRate, outSampleRate) {
  if (outSampleRate == sampleRate) {
    return buffer;
  }
  if (outSampleRate > sampleRate) {
    throw 'downsampling rate show be smaller than original sample rate';
  }
  var sampleRateRatio = sampleRate / outSampleRate;
  var newLength = Math.round(buffer.length / sampleRateRatio);
  var result = new Int16Array(newLength);
  var offsetResult = 0;
  var offsetBuffer = 0;
  while (offsetResult < result.length) {
    var nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
    var accum = 0,
    count = 0;
    for (var i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }

    result[offsetResult] = Math.min(1, accum / count) * 0x7fff;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result.buffer;
};

function capitalize(s) {
  if (s.length < 1) {
    return s;
  }
  return s.charAt(0).toUpperCase() + s.slice(1);
}

let audioFileBuffer = [];
let sequenceData;
let sequenceIndex =0;
let intervalBetweenFiles = 100; // (ms) between files while playing a sequence
// loadSoundFileSequence()
//
// load files relative to rita generation results
function loadSoundFileSequence(data){

  audioFileBuffer = [];
  sequenceData = data;


  for(let i=0; i<data.length; i++){
    // properties of data[i]: start, end, recording (file #), words, sourcephrase;

    // buffer sound:
    audioFileBuffer.push(new Audio("assets/out/"+data[i].recording+".wav"));

  }

  startSequence();
  //audioFileBuffer[0].play();
}

function startSequence(){
  sequenceIndex =0;
  playSequence();
  document.getElementById("playButton").disabled = true;
}


function playSequence(){

  let audio = audioFileBuffer[sequenceIndex];
  let length =sequenceData[sequenceIndex].end - sequenceData[sequenceIndex].start;

  audio.currentTime = sequenceData[sequenceIndex].start;
  audio.play();
  audio.volume = 1;

  // stop buffer
  setTimeout(function(){
    fadeAudio(audio);
  }, length*1000 );

  // play next
  sequenceIndex++;
  if(sequenceIndex<audioFileBuffer.length){
    setTimeout(playSequence, length*1000 + intervalBetweenFiles)
  }
  else {
    setTimeout(function(){
      console.log("sequence over");
      document.getElementById("playButton").disabled = false;
    }, length*1000 + intervalBetweenFiles/2);
  }
}

function fadeAudio(audio){
  console.log("fade!")
  audio.volume = Math.max(audio.volume - 0.1,0);

  if(audio.volume>0) setTimeout(fadeAudio, 20, audio);
  else audio.pause();
}


function play(){
  console.log("play!");
  startSequence();
}
