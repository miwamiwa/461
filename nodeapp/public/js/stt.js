// temp save for the current recording's stt data.
let savedPhrase ="";
let savedTimestamps = [];

let waitingForFinalSttData = false;
// on(speechData)
// upon receiving speech-to-text result from googleeeee

socket.on("/test",(msg)=>{
    console.log(msg);
});

socket.on('speechData', function (data) {
  // console.log(data.results[0].alternatives[0].transcript);
  var dataFinal = undefined || data.results[0].isFinal;

  if (dataFinal === false) {
    // do stuff with the interim data
    processInterimData(data);

  } else if (dataFinal === true) {
    // do stuff with the final data
    processFinalData(data);

    if(waitingForFinalSttData){
      // at this point we should have both the audio blob
      // and the stt data so we can save all that in our
      // current list of recordings
      saveBuffer();
      waitingForFinalSttData = false;
    }
  }
});

let textbox = document.getElementById("pasteTextHere");
//================= Juggling Spans for nlp Coloring =================
function processInterimData(speechData) {

  // text so far
  let wholeString = speechData.results[0].alternatives[0].transcript;
  textbox.innerHTML = wholeString;
  //console.log(wholeString);

}
let textbox2 = document.getElementById("pasteTextHere2");
function processFinalData(speechData) {
  // final text
  let wholeString = speechData.results[0].alternatives[0].transcript;
  // save and display text
  savedPhrase = wholeString;
  addToMarkov(wholeString);
  textbox.innerHTML = wholeString;
  // get words and associated metadata
  let words = speechData.results[0].alternatives[0].words;

  saveTimestamps = [];
  for (let i = 0; i < words.length; i++) {
    let word = words[i].word;
    // start and end time baboom
    let startTime = `${words[i].startTime.seconds}.${words[i].startTime.nanos}`;
    let endTime = `${words[i].endTime.seconds}.${words[i].endTime.nanos}`;

    // save and display word timestamps
    saveTimestamps.push({word:word,start:startTime,end:endTime});
    textbox2.innerHTML+= `<br> <span class='clickableThingy' onclick='playSliceOfBlob(${startTime},${endTime})'>
    - ${word}, start: ${startTime}s, end: ${endTime}s. [click to play]
    </span>`;
  }
//  console.log(saveTimestamps);

if(autoResetActive){
  // reset mic!
  stopRecording();
  setTimeout(startRecording,400);
}

}
