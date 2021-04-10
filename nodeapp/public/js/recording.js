
//================= RECORDING =================
// edited socket-playground functions

function initRecording() {

  // update interface
  document.getElementById("recordButton").value="Stop Recording";
  document.getElementById("recordStatus").style.display="block";

  // start recording

  socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
  streamStreaming = true;

  AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext({
    // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
    latencyHint: 'interactive',
    noiseSuppression: useNoiseSuppression
  });

  processor = context.createScriptProcessor(bufferSize, 1, 1);
  processor.connect(context.destination);
  context.resume();

  var handleSuccess = function (stream) {
    globalStream = stream;
    input = context.createMediaStreamSource(stream);
    input.connect(processor);

    processor.onaudioprocess = function (e) {
      microphoneProcess(e);
    };
  };

  navigator.mediaDevices.getUserMedia(constraints).then(handleSuccess);
}

// microphoneProcess()
//
// process an incomnig chunk of audio data and send to server.

function microphoneProcess(e) {

  let data = e.inputBuffer.getChannelData(0);
  let left16 = downsampleBuffer(data, 44100, 16000);
  socket.emit('binaryData', left16);
}


// stopRecording()
//
// triggered by on screen button .
function stopRecording() {

  // update interface
  document.getElementById("recordButton").value="Record";
  document.getElementById("recordStatus").style.display="none";

  // stop recording
  streamStreaming = false;
  socket.emit('endGoogleCloudStream', '');

  let track = globalStream.getTracks()[0];
  track.stop();

  input.disconnect(processor);
  processor.disconnect(context.destination);
  context.close().then(function () {
    input = null;
    processor = null;
    context = null;
    AudioContext = null;
    //startButton.disabled = false;
  });
}
