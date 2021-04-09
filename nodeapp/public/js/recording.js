let autoResetActive= false;

function toggleAutoReset(){
  autoResetActive = !autoResetActive;
}
//================= RECORDING =================
// edited socket-playground functions

function initRecording() {
  socket.emit('startGoogleCloudStream', ''); //init socket Google Speech Connection
  streamStreaming = true;
  AudioContext = window.AudioContext || window.webkitAudioContext;
  context = new AudioContext({
    // if Non-interactive, use 'playback' or 'balanced' // https://developer.mozilla.org/en-US/docs/Web/API/AudioContextLatencyCategory
    latencyHint: 'interactive',
    noiseSuppression: true
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

function microphoneProcess(e) {

  let data = e.inputBuffer.getChannelData(0);

  // send to buffer for file saving:

  //leftchannel.push(new Float32Array(data));
  //rightchannel.push(new Float32Array(data));
  // if stereo:
  //  rightchannel.push(new Float32Array(e.inputBuffer.getChannelData(1)));
  //recordingLength += bufferSize;

  // create another buffer and emit via sockets:

  // var left16 = convertFloat32ToInt16(left); // old 32 to 16 function
  let left16 = downsampleBuffer(data, 44100, 16000);
  socket.emit('binaryData', left16);
}

//================= INTERFACE =================
var startButton = document.getElementById('startRecButton');
startButton.addEventListener('click', startRecording);

var endButton = document.getElementById('stopRecButton');
endButton.addEventListener('click', stopRecording);
endButton.disabled = true;

var recordingStatus = document.getElementById('recordingStatus');

function startRecording() {

  emptyBuffers();
  console.log(navigator.mediaDevices.getSupportedConstraints())
  startButton.disabled = true;
  endButton.disabled = false;
  recordingStatus.style.visibility = 'visible';
  initRecording();
  playButton.disabled = true;
  downloadButton.disabled = true;
}

function stopRecording() {

  // waited for FinalWord
  startButton.disabled = false;
  endButton.disabled = true;

  playButton.disabled = false;
  downloadButton.disabled = false;
  recordingStatus.style.visibility = 'hidden';
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
    startButton.disabled = false;
  });

  // context.close();

  // audiovideostream.stop();

  // microphone_stream.disconnect(script_processor_node);
  // script_processor_node.disconnect(audioContext.destination);
  // microphone_stream = null;
  // script_processor_node = null;

  // audiovideostream.stop();
  // videoElement.srcObject = null;


  
  //recordToWav();
  //saveBuffer();
}
