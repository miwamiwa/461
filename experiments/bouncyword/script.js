window.onload = start;
let canvas,ctx;
let words=[];

function start(){
  setInterval(update,100);
  canvas =document.createElement("canvas");
  canvas.width=600;
  canvas.height=400;
  document.body.appendChild(canvas);
  ctx=canvas.getContext("2d");
  ctx.fillStyle="#bbb";
  ctx.fillRect(0,0,canvas.width,canvas.height);
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
   if(words[i].counter>80) words.splice(i,1);
  }
}

class Word {
  constructor(word){
    this.word=word;
    this.x=100+Math.random()*(canvas.width-100);
    this.y=-100+Math.random()*canvas.height;
    this.fontsize=30+Math.random()*20;
    this.color=randomColor();
    this.counter=0;
    this.vy =0;
    this.ay =0.3;
    this.stopped = false;
    this.bouncefactor=0;
    this.grey = Math.floor(Math.random()*255);
  }

  update(){
    ctx.font=`${this.fontsize}px Arial`;
    for(let i=0; i<1; i++){
      ctx.fillStyle=this.color;
      ctx.fillText(this.word,this.x,this.y);
      ctx.fillStyle=`rgba(${this.grey},${this.grey},${this.grey},${this.bouncefactor})`;
      ctx.fillText(this.word,this.x+0,this.y+2);

      if(!this.stopped){
        this.x-=1;
        this.y+=this.vy;
        this.vy+=this.ay;

        if(this.y>=canvas.height){
          this.y = canvas.height;
          this.vy /= 2.3;
          if(this.bouncefactor<1)
            this.bouncefactor += 0.2
          if(this.vy<0.5){
            this.vy=0;
            this.stopped = true;
          }
          else this.vy *=-1;
        }
      }
      else
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

  return `rgba(${r},${g},${b},0.6)`;
}
