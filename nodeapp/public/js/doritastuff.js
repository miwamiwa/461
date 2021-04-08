
let makePhraseButton = document.getElementById("generatePhraseButton");
let rm;
let ritaListening = true;
let markovready = false;


makePhraseButton.addEventListener('click', function(){
  ritaSaySomething();
});


function setupMarkov(){
  rm = new RiMarkov(2, true, false);
  makePhraseButton.disabled =true;

  setInterval(function(){

    if(!markovready){
      console.log("markov not ready!")
      if(rm.ready()){
        markovready = true;
        makePhraseButton.disabled = false;
      }
    }
  },500)
}

function addToMarkov(input){
  if(ritaListening){
    rm.loadText(input+".");
    console.log("rita: added text ("+input+")")
  }

}


let sentences = [];

function ritaSaySomething(){
if(markovready){
  let sentencesinput = document.getElementById("sentencesInput");
  //let minlengthinput = document.getElementById("minLengthInput");
  //let maxlengthinput = document.getElementById("maxLengthInput");
  //let allowduplicatesinput = document.getElementById("allowDuplicatesInput");
  let playaudioinput = document.getElementById("playAudioInput");

  let numSentences = parseInt(sentencesinput.value);

  let result=rm.generateSentences(numSentences);
/*
  ,{
    minLength: parseInt(minlengthinput.value),
    maxLength: parseInt(maxlengthinput.value),
    // tempeture:(float)(control the random level???),
    allowDuplicates: allowpudlicatesinput.checked,
    // startTokens:(string)(start of the sentence)
  });
*/
  let resultbox = document.getElementById("ritaResultBox");
  resultbox.innerHTML = "";

  sentences.push(result);
  console.log("rita generation result:")
  console.log(result);
  for(let i=sentences.length-1; i>=0; i--){
    resultbox.innerHTML += "<br>"+sentences[i];
  }


  // trigger audio:
  if(playaudioinput.checked){
    // trigger the audiooooooo
    playSentence(result[0]);
  }
}

}
