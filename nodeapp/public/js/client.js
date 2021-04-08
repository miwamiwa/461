// using Google Cloud Speech Playground with node.js and socket.io  Created by Vinzenz Aubry
// also using this thing by meziantou for converting stuff to wav
// https://gist.github.com/meziantou/edb7217fddfbb70e899e

'use strict';
window.onload = start;

//connection to socket
const socket = io.connect();

// Stream Audio
let bufferSize = 2048,
AudioContext,
context,
processor,
input,
globalStream;

//variables for mic input and audio streaming
let audioElement = document.querySelector('audio'),
finalWord = false,
streamStreaming = false;

// vars for audio recording & file saving
let leftchannel = [];
let rightchannel = [];
let recordingLength = 0;
let blob = null;

//audioStream constraints (mic configuration)
let constraints;
// selection from input devices list
let audiosourceselection = "";



// start()
//
// called when page is ready to go

function start(){

  //setupMarkov();


  // get available input devices
  navigator.mediaDevices.enumerateDevices()
  .then(function(devices) { // takes a sec so wait for it

    // populate input devices list so they can be selected
    let devicesArea = document.getElementById("devicesGoHere");
    devices.forEach(function(device) {
      // console.log(device.kind + ": " + device.label + " id = " + device.deviceId);
      // add inputs only
      if(device.kind === 'audioinput'){
        devicesArea.innerHTML += `<br>
        <span class='clickableThingy' onclick='setDevice("${device.deviceId}")'>
        ${device.label}
        </span>`;
      }
    }
  );
  // set default input selection
  audiosourceselection = devices[0].deviceId;
  // update 'constraints' object (used when setting up mic input)
  devicesReady();


})
// in case theres some problem getting devices list
.catch(function(err) {
  console.log(err.name + ": " + err.message);
});
}

// devicesReady()
//
// triggered when devices list is obtained

function devicesReady(){
  // update mic input setup object
  constraints = {
    audio: {deviceId: audiosourceselection ? {exact: audiosourceselection} : undefined},
    video: false,
  };
}



// setDevice()
// called when an input device is selected from the devices list.
function setDevice(id){
  audiosourceselection = id;
}







//================= SOCKET IO =================
socket.on('connect', function (data) {
  console.log('connected to socket');
  socket.emit('join', 'Server Connected to Client');
});

socket.on('messages', function (data) {
  console.log(data);
});

window.onbeforeunload = function () {
  if (streamStreaming) {
    socket.emit('endGoogleCloudStream', '');
  }
};

//================= SANTAS HELPERS =================

/*
// this isn't used. it is part of socket-playground code.
// sampleRateHertz 16000 //saved sound is awefull
function convertFloat32ToInt16(buffer) {
  let l = buffer.length;
  let buf = new Int16Array(l / 3);

  while (l--) {
    if (l % 3 == 0) {
      buf[l / 3] = buffer[l] * 0xffff;
    }
  }
  return buf.buffer;
}
*/

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




// THESE FUNCTIONS ARE FOR THE WAV RECORDING PART:


function flattenArray(channelBuffer, recordingLength) {
  var result = new Float32Array(recordingLength);
  var offset = 0;
  for (var i = 0; i < channelBuffer.length; i++) {
    var buffer = channelBuffer[i];
    result.set(buffer, offset);
    offset += buffer.length;
  }
  return result;
}

function interleave(leftChannel, rightChannel) {
  var length = leftChannel.length + rightChannel.length;
  var result = new Float32Array(length);

  var inputIndex = 0;

  for (var index = 0; index < length;) {
    result[index++] = leftChannel[inputIndex];
    result[index++] = rightChannel[inputIndex];
    inputIndex++;
  }
  return result;
}

function writeUTFBytes(view, offset, string) {
  for (var i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
