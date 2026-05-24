if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x,y,w,h,r) {
    this.moveTo(x+r,y); this.lineTo(x+w-r,y);
    this.arcTo(x+w,y,x+w,y+r,r); this.lineTo(x+w,y+h-r);
    this.arcTo(x+w,y+h,x+w-r,y+h,r); this.lineTo(x+r,y+h);
    this.arcTo(x,y+h,x,y+h-r,r); this.lineTo(x,y+r);
    this.arcTo(x,y,x+r,y,r); this.closePath();
  };
}

const $ = id => document.getElementById(id);
const screens = { start:$('screen-start'), menu:$('screen-menu'), game:$('screen-game') };
function showScreen(name) {
  Object.entries(screens).forEach(([k,el]) => el.classList.toggle('hidden', k!==name));
}

const canvas=$('canvas'), ctx=canvas.getContext('2d');
const overlay=$('overlay'), overlayTitle=$('overlay-title'), overlaySub=$('overlay-sub');
const scoreEl=$('score'), levelEl=$('level'), levelItem=$('level-item'), bestEl=$('best');
const ctrlSnake=$('controls-snake'), ctrlTetris=$('controls-tetris'), ctrlPacman=$('controls-pacman'), drawToolbar=$('draw-toolbar');
let activeGame=null;

function showOverlay(title,sub){overlayTitle.textContent=title;overlaySub.textContent=sub;overlay.classList.remove('hidden');}
function hideOverlay(){overlay.classList.add('hidden');}

function calcCell(cols,rows){
  const touch=window.matchMedia('(pointer: coarse)').matches;
  const ctrlH=touch?106:0;
  const maxW=Math.min(window.innerWidth-16,480);
  const maxH=window.innerHeight-58-ctrlH-20;
  return Math.max(8,Math.min(Math.floor(maxW/cols),Math.floor(maxH/rows)));
}
function resizeCanvas(cols,rows){const c=calcCell(cols,rows);canvas.width=c*cols;canvas.height=c*rows;return c;}
function resizeFishyCanvas(){
  canvas.width=Math.min(window.innerWidth-16,900);
  canvas.height=window.innerHeight-58-20;
}

$('play-btn').addEventListener('click',()=>showScreen('menu'));
$('name-title').addEventListener('click',()=>showScreen('menu'));

document.querySelectorAll('.card').forEach(card=>{
  card.addEventListener('click',()=>{
    activeGame=card.dataset.game;
    levelItem.style.display=activeGame==='tetris'?'flex':'none';
    $('score').closest('.score-item').style.display=activeGame==='draw'?'none':'flex';
    bestEl.closest('.score-item').style.display=activeGame==='draw'?'none':'flex';
    ctrlSnake.classList.toggle('gone',  activeGame!=='snake');
    ctrlTetris.classList.toggle('gone', activeGame!=='tetris');
    ctrlPacman.classList.toggle('gone', activeGame!=='pacman');
    drawToolbar.classList.toggle('gone', activeGame!=='draw');
    showScreen('game');
    if(activeGame==='snake')    snake.init();
    if(activeGame==='tetris')   tetris.init();
    if(activeGame==='fishy')    fishy.init();
    if(activeGame==='breakout') breakout.init();
    if(activeGame==='draw')     draw.init();
    if(activeGame==='pacman')   pacman.init();
  });
});

$('back-btn').addEventListener('click',()=>{
  snake.stop(); tetris.stop(); fishy.stop(); breakout.stop(); draw.stop(); pacman.stop();
  activeGame=null; showScreen('menu');
});

window.addEventListener('resize',()=>{
  if(activeGame==='snake')    snake.resize();
  if(activeGame==='tetris')   tetris.resize();
  if(activeGame==='fishy')    fishy.resize();
  if(activeGame==='breakout') breakout.resize();
  if(activeGame==='draw')     draw.resize();
  if(activeGame==='pacman')   pacman.resize();
});

overlay.addEventListener('click', triggerStart);
document.addEventListener('keydown',e=>{
  if((e.key===' '||e.key==='Enter')&&!overlay.classList.contains('hidden')){e.preventDefault();triggerStart();}
});
function triggerStart(){
  if(activeGame==='snake')    snake.start();
  if(activeGame==='tetris')   tetris.start();
  if(activeGame==='fishy')    fishy.start();
  if(activeGame==='breakout') breakout.start();
  if(activeGame==='pacman')   pacman.start();
}
