/*
buffersave.js

this is the code relative to buffering the mic input so that
it can be played back and downloaded.
Includes things like the code for converting mic data to wav, playing a buffer,
and the functions to run when the play or download buttons are pressed.
*/

var playButton = document.getElementById("playButton");
var downloadButton = document.getElementById("downloadButton");
playButton.disabled = true;
downloadButton.disabled = true;
let alreadySaved = false;
let recordings = [];
let selectedIndex = 0;
// click
//
// things to do when play button is pressed
playButton.addEventListener("click", function () {
  let tempblob = null;
  if(recordings.length>0) tempblob = recordings[selectedIndex];

  if (tempblob == null) {
    return;
  }

  var url = window.URL.createObjectURL(tempblob);
  var audio = new Audio(url);
  audio.play();
});

let saveData = [];


// emptyBuffers()
//
// triggered just before initiating a new recording

function emptyBuffers(){
  savedPhrase = "";
  tempwords = [];
  leftchannel = [];
  rightchannel = [];
  saveTimestamps = [];
  recordingLength =0;

  // empty displays
  let textbox = document.getElementById("pasteTextHere");
  let textbox2 = document.getElementById("pasteTextHere2");
  textbox.innerHTML="Speech to text data goes here";
  textbox2.innerHTML="Time stamps go here";
  alreadySaved = false;
}

// selectRecording()
//
// triggered when a recording is selected from the list on screen
function selectRecording(index){
  selectedIndex = index;
  let data = saveData[index];
  //blob = data.blob;
//  console.log(data.blob)
  textbox.innerHTML= data.text;
  let textbox2 = document.getElementById("pasteTextHere2");
  textbox2.innerHTML="Time stamps go here";
  for (let i = 0; i < data.words.length; i++) {
    let word = data.words[i].word;
    // start and end time baboom
    let startTime = data.words[i].start;
    let endTime = data.words[i].end;
    //console.log("yo!")
    // save and display word timestamps
    //saveTimestamps.push({word:word,start:startTime,end:endTime});

    textbox2.innerHTML+= `<br> <span class='clickableThingy' onclick='playSliceOfBlob(${startTime},${endTime})'>
    - ${word}, start: ${startTime}s, end: ${endTime}s. [click to play]
    </span>`;
  }
}



// savebuffer()
//
// add audio to buffers list. called when recording is over?

function saveBuffer(){
  if(alreadySaved)
  return;

  if(recordings[selectedIndex]==undefined||recordings[selectedIndex]==null)
  return;

  // save the data
  let tempwords = [];
  for(let i=0; i<saveTimestamps.length; i++){
    let word = saveTimestamps[i];
    tempwords.push({word:word.word,end:word.end,start:word.start});
  }
//  console.log(tempwords)
  saveData.push({
    text: savedPhrase,
    words:tempwords
  });

  let index = saveData.length-1;
  // populate UI list
  let recordingsArea = document.getElementById("recordingsGoHere");
  recordingsArea.innerHTML+=`<br>
  <span class='clickableThingy' onclick='selectRecording(${index})'>
  ${index}. ${savedPhrase}
  </span>`;

  alreadySaved = true;
}



//playBlob()
//
// copy paste of the code above but with added start time functionality nice.
// and also end time functionality damn wow.
// expects time values in seconds.
function playSliceOfBlob(starttime, endtime,index) {
    console.log("blob slice");
    //console.log(blob)
  console.log(starttime,endtime);
  if(index==undefined) index = selectedIndex;

  if (recordings[index] ==undefined || recordings[index] == null) {
    return;
  }

  var url = window.URL.createObjectURL(recordings[index]);
  var audio = new Audio(url);
  if(starttime!=undefined)
  audio.currentTime = starttime;
  audio.play();

  if(endtime!=undefined){
    let sliceLength = endtime-starttime;// + 0.1;
    //  console.log(sliceLength);
    setTimeout(function(a){a.pause();}, sliceLength*1000, audio);
  }
}

// click
//
// things to do when download button is pressed
downloadButton.addEventListener("click", function () {
  if (recordings[selectedIndex] == null) {
    return;
  }

  var url = URL.createObjectURL(recordings[selectedIndex]);

  var a = document.createElement("a");
  document.body.appendChild(a);
  a.style = "display: none";
  a.href = url;
  a.download = "sample.wav";
  a.click();
  window.URL.revokeObjectURL(url);
});

// recordtowav()
// convert mic input to wav.

function recordToWav(){
  // we flat the left and right channels down
  // Float32Array[] => Float32Array
  var leftBuffer = flattenArray(leftchannel, recordingLength);
  var rightBuffer = flattenArray(rightchannel, recordingLength);
  // we interleave both channels together
  // [left[0],right[0],left[1],right[1],...]
  var interleaved = interleave(leftBuffer, rightBuffer);

  // we create our wav file
  var buffer = new ArrayBuffer(44 + interleaved.length * 2);
  var view = new DataView(buffer);

  // RIFF chunk descriptor
  writeUTFBytes(view, 0, 'RIFF');
  view.setUint32(4, 44 + interleaved.length * 2, true);
  writeUTFBytes(view, 8, 'WAVE');
  // FMT sub-chunk
  writeUTFBytes(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // chunkSize
  view.setUint16(20, 1, true); // wFormatTag
  view.setUint16(22, 2, true); // wChannels: stereo (2 channels)
  let sampleRate = 44100;
  view.setUint32(24, sampleRate, true); // dwSamplesPerSec
  view.setUint32(28, sampleRate * 4, true); // dwAvgBytesPerSec
  view.setUint16(32, 4, true); // wBlockAlign
  view.setUint16(34, 16, true); // wBitsPerSample
  // data sub-chunk
  writeUTFBytes(view, 36, 'data');
  view.setUint32(40, interleaved.length * 2, true);

  // write the PCM samples
  var index = 44;
  var volume = 1;
  for (var i = 0; i < interleaved.length; i++) {
    view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
    index += 2;
  }

  // our final blob
  selectedIndex = recordings.length;
  recordings.push( new Blob([view], { type: 'audio/wav' }) );

  waitingForFinalSttData = true;
}
