window.onload = start;
let canvas, ctx;
let testBox;
let sampletext = "Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";
let sampletext2 = "Lorem ipsum dolor sit amet";
let testline;
let testphrase;
let phrasevel =4;

function start(){

  canvas =document.createElement("canvas");
  canvas.width=600;
  canvas.height=400;
  document.body.appendChild(canvas);
  ctx = canvas.getContext("2d");
  // box to check character width
  testBox = document.createElement("span");
  testBox.style.width="auto";
  testBox.style.opacity=0;
  document.body.appendChild(testBox);
  //testBox.hidden=true;

  testline = new Line(20,{x:20,y:canvas.height/2});
  testphrase = new Phrase(sampletext);

  setInterval(update,50);
}

function update(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
//  testline.display();
  testphrase.movePhrase();
  testphrase.followLine(testline);
}

class Line {
  constructor(numSegments, startPoint){
    this.segments = [];
    this.fill="tomato";
    let cumulativeLength=0;

    for(let i=0; i<numSegments; i++){
      this.segments.push(new Segment(startPoint,cumulativeLength));
      cumulativeLength += this.segments[this.segments.length-1].size;
      startPoint = this.segments[this.segments.length-1].pointB;
    }
  }

  display(){
    for(let i=0; i<this.segments.length; i++){
      let seg = this.segments[i];
      ctx.moveTo(seg.pointA.x,seg.pointA.y);
      ctx.lineTo(seg.pointB.x,seg.pointB.y);
      ctx.strokeStyle=this.fill;
      ctx.stroke();
    }
  }
}

class Segment {
  constructor(pointA,cumulativeLength){

    this.cumulativeLength = cumulativeLength;

    this.pointA = {
      x:pointA.x,
      y:pointA.y
    }

    this.angle = (0.45-Math.random()*0.9)*Math.PI;
    this.size = 20+Math.floor(Math.random()*50);

    // place point b to the right and at a random height
    this.pointB = {
      x:pointA.x + this.size*Math.cos(this.angle),
      y:pointA.y - this.size*Math.sin(this.angle)
    }

    this.sideX = this.pointB.x-this.pointA.x;
    this.sideY = this.pointB.y-this.pointA.y;
  }
}

class Phrase {
  constructor(text){

    this.vel=phrasevel;
    this.text=text;
    this.chars = [];

    let initFontSize=26;
    let totallength=0;
    for(let i=0; i<text.length; i++){
      this.chars.push( new Character(text[i], initFontSize) );
      totallength+=this.chars[this.chars.length-1].width;
    }

    this.offset = 0;
  }

  followLine(line){
    let cumulativeOffset =0;
    let currentsegment =0;

    for(let i=0; i<this.chars.length; i++){
      let stopit=false;
      while(!stopit&&this.offset+cumulativeOffset>
        line.segments[currentsegment].cumulativeLength
        +line.segments[currentsegment].size
      ){
        currentsegment ++;
        if(currentsegment>=line.segments.length) stopit=true;
      }

      if(currentsegment>=line.segments.length)
        currentsegment =0;

      let seg = line.segments[currentsegment];

      let charOffsetOnSegment = (
        this.offset +cumulativeOffset -seg.cumulativeLength
      );
      let ratio = charOffsetOnSegment/seg.size;


      let charX = seg.pointA.x + ratio*seg.sideX;
      let charY = seg.pointA.y + ratio*seg.sideY;
      let angle = -seg.angle;

      this.chars[i].display(charX,charY,angle);

      cumulativeOffset += this.chars[i].width;

    }
  }

  movePhrase(){
    this.offset -= this.vel;
  }
}

class Character {
  constructor(character,size){

    this.character = character;
    this.fill = "black";
    this.updateSize(size);
  }
  // set this character's size and also
  // save its bounding rect size 
  updateSize(size){
    this.size=size;

    if(this.character!=" "){
      testBox.innerHTML=this.character;
      testBox.style.fontSize=size+"px";

      let box = testBox.getBoundingClientRect();

      this.width=box.width+1;
      this.height=box.height+1;
    }
    else {
      this.width=15;
      this.height=10;
    }

  }

  display(x,y,a){
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(a);
    ctx.fillStyle=this.fill;
    ctx.font=`${this.size}px Arial`;
    ctx.fillText(this.character,0,0);
    ctx.restore();
  }
}
