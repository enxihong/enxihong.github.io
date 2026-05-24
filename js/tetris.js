// ─────────────────────────────────────────────
// TETRIS
// ─────────────────────────────────────────────
const tetris=(()=>{
  const COLS=10,ROWS=20;
  const PIECES=[
    {shape:[[1,1,1,1]],color:'#00bcd4'},{shape:[[1,1],[1,1]],color:'#fdd835'},
    {shape:[[0,1,0],[1,1,1]],color:'#9c27b0'},{shape:[[0,1,1],[1,1,0]],color:'#43a047'},
    {shape:[[1,1,0],[0,1,1]],color:'#e53935'},{shape:[[1,0,0],[1,1,1]],color:'#1e88e5'},
    {shape:[[0,0,1],[1,1,1]],color:'#fb8c00'},
  ];
  let cell,board,cur,nxt,score,level,lines,dropTimer,running;
  const rotate=shape=>shape[0].map((_,c)=>shape.map(r=>r[c]).reverse());
  const newBoard=()=>Array.from({length:ROWS},()=>Array(COLS).fill(0));
  const randPiece=()=>{const p=PIECES[~~(Math.random()*PIECES.length)];return{shape:p.shape.map(r=>[...r]),color:p.color,x:~~(COLS/2)-~~(p.shape[0].length/2),y:0};};
  function valid(shape,px,py){
    for(let r=0;r<shape.length;r++)for(let c=0;c<shape[r].length;c++){
      if(!shape[r][c])continue;const nx=px+c,ny=py+r;
      if(nx<0||nx>=COLS||ny>=ROWS)return false;if(ny>=0&&board[ny][nx])return false;
    }return true;
  }
  function lock(){
    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v)board[cur.y+r][cur.x+c]=cur.color;}));
    let cleared=0;
    for(let r=ROWS-1;r>=0;r--){if(board[r].every(v=>v)){board.splice(r,1);board.unshift(Array(COLS).fill(0));cleared++;r++;}}
    if(cleared){
      score+=[0,100,300,500,800][Math.min(cleared,4)]*level;lines+=cleared;level=Math.floor(lines/10)+1;
      scoreEl.textContent=score;levelEl.textContent=level;
      const prev=parseInt(localStorage.getItem('tetris-best')||0);
      if(score>prev){localStorage.setItem('tetris-best',score);bestEl.textContent=score;}
      restartTimer();
    }
    cur=nxt;nxt=randPiece();if(!valid(cur.shape,cur.x,cur.y))die();
  }
  const dropSpeed=()=>Math.max(80,1000-(level-1)*80);
  function restartTimer(){clearInterval(dropTimer);dropTimer=setInterval(gravityDrop,dropSpeed());}
  function gravityDrop(){if(!running)return;valid(cur.shape,cur.x,cur.y+1)?cur.y++:lock();draw();}
  function softDrop(){if(valid(cur.shape,cur.x,cur.y+1)){cur.y++;draw();}}
  function hardDrop(){while(valid(cur.shape,cur.x,cur.y+1))cur.y++;lock();draw();}
  function moveLeft(){if(valid(cur.shape,cur.x-1,cur.y)){cur.x--;draw();}}
  function moveRight(){if(valid(cur.shape,cur.x+1,cur.y)){cur.x++;draw();}}
  function doRotate(){const r=rotate(cur.shape);for(const k of[0,1,-1,2,-2]){if(valid(r,cur.x+k,cur.y)){cur.shape=r;cur.x+=k;draw();return;}}}
  const ghostY=()=>{let gy=cur.y;while(valid(cur.shape,cur.x,gy+1))gy++;return gy;};
  function die(){running=false;clearInterval(dropTimer);showOverlay('Game Over',`Score: ${score} — tap to restart`);}
  function drawCell(c,r,color){
    ctx.fillStyle=color;ctx.fillRect(c*cell+1,r*cell+1,cell-2,cell-2);
    ctx.fillStyle='rgba(255,255,255,0.22)';ctx.fillRect(c*cell+1,r*cell+1,cell-2,Math.min(4,cell/4));
  }
  function drawGrid(){
    ctx.strokeStyle='#f2f2f2';ctx.lineWidth=0.5;
    for(let r=0;r<=ROWS;r++){ctx.beginPath();ctx.moveTo(0,r*cell);ctx.lineTo(COLS*cell,r*cell);ctx.stroke();}
    for(let c=0;c<=COLS;c++){ctx.beginPath();ctx.moveTo(c*cell,0);ctx.lineTo(c*cell,ROWS*cell);ctx.stroke();}
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);drawGrid();
    board.forEach((row,r)=>row.forEach((col,c)=>{if(col)drawCell(c,r,col);}));
    const gy=ghostY();
    if(gy!==cur.y)cur.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v){ctx.fillStyle='#ebebeb';ctx.fillRect((cur.x+c)*cell+1,(gy+r)*cell+1,cell-2,cell-2);}}));
    cur.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawCell(cur.x+c,cur.y+r,cur.color);}));
  }
  function drawIdle(){
    ctx.clearRect(0,0,canvas.width,canvas.height);drawGrid();
    [{c:4,r:19,col:'#1e88e5'},{c:5,r:19,col:'#1e88e5'},{c:6,r:19,col:'#1e88e5'},
     {c:4,r:18,col:'#fb8c00'},{c:5,r:18,col:'#fb8c00'},{c:3,r:18,col:'#43a047'},{c:6,r:18,col:'#43a047'},{c:7,r:18,col:'#43a047'},
     {c:5,r:17,col:'#9c27b0'},{c:6,r:17,col:'#9c27b0'},{c:7,r:17,col:'#9c27b0'},
    ].forEach(({c,r,col})=>drawCell(c,r,col));
  }
  function init(){
    stop();cell=resizeCanvas(COLS,ROWS);board=null;running=false;score=0;level=1;lines=0;
    scoreEl.textContent=0;levelEl.textContent=1;bestEl.textContent=localStorage.getItem('tetris-best')||0;
    drawIdle();showOverlay('Tetris','Space · tap · swipe to start');
  }
  function start(){
    stop();board=newBoard();cur=randPiece();nxt=randPiece();score=0;level=1;lines=0;running=true;
    scoreEl.textContent=0;levelEl.textContent=1;hideOverlay();draw();restartTimer();
  }
  function stop(){clearInterval(dropTimer);dropTimer=null;running=false;}
  function resize(){cell=resizeCanvas(COLS,ROWS);board?draw():drawIdle();}
  document.addEventListener('keydown',e=>{
    if(activeGame!=='tetris')return;
    if((e.key===' '||e.key==='Enter')&&!overlay.classList.contains('hidden')){start();return;}
    if(!running)return;
    const map={ArrowLeft:moveLeft,a:moveLeft,ArrowRight:moveRight,d:moveRight,ArrowDown:softDrop,s:softDrop,ArrowUp:doRotate,w:doRotate,z:doRotate,' ':hardDrop};
    const fn=map[e.key];if(fn){e.preventDefault();fn();}
  });
  $('tet-left').addEventListener('click',moveLeft);$('tet-right').addEventListener('click',moveRight);
  $('tet-rotate').addEventListener('click',doRotate);$('tet-drop').addEventListener('click',hardDrop);
  let t0=null;
  canvas.addEventListener('touchstart',e=>{if(activeGame==='tetris')t0={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{
    if(activeGame!=='tetris'||!t0)return;
    const dx=e.changedTouches[0].clientX-t0.x,dy=e.changedTouches[0].clientY-t0.y;
    if(Math.abs(dx)<14&&Math.abs(dy)<14){if(running)doRotate();t0=null;return;}
    if(Math.abs(dx)>Math.abs(dy)){dx>0?moveRight():moveLeft();}else{if(dy>0)hardDrop();}
    t0=null;
  },{passive:true});
  return{init,start,stop,resize};
})();
