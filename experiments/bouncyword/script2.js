window.onload = start;
let canvas,ctx;
let words=[];

function start(){
  setInterval(update,40);
  canvas =document.createElement("canvas");
  canvas.width=600;
  canvas.height=400;
  document.body.appendChild(canvas);
  ctx=canvas.getContext("2d");

  setInterval(()=>{
    let index=Math.floor(Math.random()*fabrics.length);
    let newword = fabrics[index];
    console.log(newword,index);
    words.push(new Word(newword));
  }, 800);
}

function update(){
  for(let i=words.length-1; i>=0; i--){
    words[i].update();
    if(words[i].counter>200) words.splice(i,1);
  }
}

class Word {
  constructor(word){
    this.word=word;
    this.x=100+Math.random()*canvas.width;
    this.y=-100+Math.random()*canvas.height;
    this.fontsize=10+Math.random()*20;
    this.color=randomColor();
    this.counter=0;
  }

  update(){
    ctx.font=`${this.fontsize}px Arial`;
    for(let i=0; i<3; i++){
      ctx.fillStyle=this.color;
      ctx.fillText(this.word,this.x,this.y);
      ctx.fillStyle="white";
      ctx.fillText(this.word,this.x+0,this.y+2);
      this.x-=1;
      this.y+=1;
      this.counter++;
    }

  }
}

function randomColor(){

  let r = 100+Math.floor(Math.random()*155);
  let g = 255-r;
  let b = 50+Math.floor(Math.random()*205);

  if(Math.random()<0.5){
    g=b;
    b=255-r;
  }

  return `rgba(${r},${g},${b},1)`;
}
