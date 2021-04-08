let wordIndex =0;
let splitSentence = [];



function playSentence(input){
  splitSentence = input.split(" ");

  wordIndex =0;
  playWord();
}





function playWord(){
  let timeToNext = 100;

  let targetWord = splitSentence[wordIndex].replace('.','');
  let results = [];

  for(let i=0; i<saveData.length; i++){
    for(let j=0; j<saveData[i].words.length; j++){
    //  console.log(targetWord,saveData[i].words[j].word)
      if(targetWord==saveData[i].words[j].word){
        results.push({recording:i,word:j});
      }
    }
  }
//  console.log(results);
//  console.log(targetWord);
  let pick =0;
  if(results.length>1) pick = Math.floor(Math.random()*results.length);

  let result = results[pick];
//  console.log(result,pick)
  let data = saveData[result.recording].words[result.word];
  let starttime = data.start;
  let endtime = data.end;
//  console.log(result.recording,result.word)
//  console.log(data, pick);
  let nextword =1;
  while(result.word+nextword<saveData[result.recording].words.length
    &&splitSentence[wordIndex+nextword].replace('.','')
      ==saveData[result.recording].words[result.word+nextword].word){
      endtime = saveData[result.recording].words[result.word+nextword].end;
      nextword++;
    }
  wordIndex+=nextword;
  // play word(s)
  playSliceOfBlob(starttime,endtime,result.recording);
  timeToNext += 1000*(endtime-starttime);
  //wordIndex++;

  // trigger next
  if(wordIndex<=splitSentence.length){
    setTimeout(playWord, timeToNext);
  }
}
