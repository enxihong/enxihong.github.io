// ─────────────────────────────────────────────
// SNAKE
// ─────────────────────────────────────────────
const snake=(()=>{
  const COLS=20,ROWS=20;
  let cell,state,timer;
  function init(){
    clearInterval(timer); cell=resizeCanvas(COLS,ROWS); state=null;
    scoreEl.textContent=0; bestEl.textContent=localStorage.getItem('snake-best')||0;
    drawIdle(); showOverlay('Snake','Space · tap · swipe to start');
  }
  function resize(){cell=resizeCanvas(COLS,ROWS);state?draw():drawIdle();}
  function stop(){clearInterval(timer);timer=null;}
  function start(){
    stop();
    const body=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    state={snake:body,dir:{x:1,y:0},next:{x:1,y:0},food:spawnFood(body),score:0};
    scoreEl.textContent=0; hideOverlay(); draw();
    timer=setInterval(tick,120);
  }
  function spawnFood(s){let p;do{p={x:~~(Math.random()*COLS),y:~~(Math.random()*ROWS)};}while(s.some(b=>b.x===p.x&&b.y===p.y));return p;}
  function tick(){
    state.dir=state.next;
    const head={x:(state.snake[0].x+state.dir.x+COLS)%COLS,y:(state.snake[0].y+state.dir.y+ROWS)%ROWS};
    if(state.snake.some(b=>b.x===head.x&&b.y===head.y)){die();return;}
    state.snake.unshift(head);
    if(head.x===state.food.x&&head.y===state.food.y){
      state.score++; scoreEl.textContent=state.score;
      const prev=parseInt(localStorage.getItem('snake-best')||0);
      if(state.score>prev){localStorage.setItem('snake-best',state.score);bestEl.textContent=state.score;}
      state.food=spawnFood(state.snake);
    }else{state.snake.pop();}
    draw();
  }
  function die(){stop();showOverlay('Game Over',`Score: ${state.score} — tap to restart`);showShareScore('snake',state.score);shake();}
  function shake(){let i=0;const id=setInterval(()=>{const d=4*(1-i/8);canvas.style.transform=i%2===0?`translateX(${d}px)`:`translateX(${-d}px)`;if(++i>8){clearInterval(id);canvas.style.transform='';}},50);}
  function setDir(d){if(!state)return;if(!(d.x===-state.dir.x&&d.y===-state.dir.y))state.next=d;}
  function drawIdle(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    [{x:8,y:10},{x:9,y:10},{x:10,y:10},{x:11,y:10},{x:11,y:9},{x:10,y:9}].forEach((s,i)=>{
      ctx.fillStyle=i===0?'#ccc':'#e8e8e8';ctx.beginPath();ctx.roundRect(s.x*cell+2,s.y*cell+2,cell-4,cell-4,3);ctx.fill();
    });
  }
  function draw(){
    if(!state)return;ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(state.food.x*cell+cell/2,state.food.y*cell+cell/2,cell/2-2,0,Math.PI*2);ctx.fill();
    state.snake.forEach((seg,i)=>{
      const t=1-i/state.snake.length,g=Math.round(80+t*130);
      ctx.fillStyle=i===0?'#111':`rgb(${g},${g},${g})`;const pad=i===0?1:2;
      ctx.beginPath();ctx.roundRect(seg.x*cell+pad,seg.y*cell+pad,cell-pad*2,cell-pad*2,i===0?4:3);ctx.fill();
    });
  }
  document.addEventListener('keydown',e=>{
    if(activeGame!=='snake')return;
    const dirs={ArrowUp:{x:0,y:-1},w:{x:0,y:-1},ArrowDown:{x:0,y:1},s:{x:0,y:1},ArrowLeft:{x:-1,y:0},a:{x:-1,y:0},ArrowRight:{x:1,y:0},d:{x:1,y:0}};
    const d=dirs[e.key];if(d){e.preventDefault();setDir(d);}
  });
  $('sn-up').addEventListener('click',()=>setDir({x:0,y:-1}));
  $('sn-down').addEventListener('click',()=>setDir({x:0,y:1}));
  $('sn-left').addEventListener('click',()=>setDir({x:-1,y:0}));
  $('sn-right').addEventListener('click',()=>setDir({x:1,y:0}));
  let t0=null;
  canvas.addEventListener('touchstart',e=>{if(activeGame==='snake')t0={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{
    if(activeGame!=='snake'||!t0)return;
    const dx=e.changedTouches[0].clientX-t0.x,dy=e.changedTouches[0].clientY-t0.y;
    if(Math.abs(dx)<12&&Math.abs(dy)<12){t0=null;return;}
    setDir(Math.abs(dx)>Math.abs(dy)?(dx>0?{x:1,y:0}:{x:-1,y:0}):(dy>0?{x:0,y:1}:{x:0,y:-1}));
    t0=null;
  },{passive:true});
  return{init,start,stop,resize};
})();
