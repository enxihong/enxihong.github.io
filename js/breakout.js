// ─────────────────────────────────────────────
// BREAKOUT
// ─────────────────────────────────────────────
const breakout = (() => {
  const COLS=8, ROWS=5, GAP=4;
  const ROW_COLORS=['#e53935','#fb8c00','#fdd835','#43a047','#1e88e5'];
  const ROW_PTS=[5,4,3,2,1];

  let W,H,bW,bH,balls,paddle,bricks,drops,score,lives,level,running,raf,launched,paddleTarget;
  let speedMult=1, fastUntil=0, slowUntil=0;

  function initCanvas(){
    W=Math.min(window.innerWidth-16,480);
    H=window.innerHeight-58-20;
    canvas.width=W; canvas.height=H;
    bW=(W-10-GAP*(COLS-1))/COLS;
    bH=Math.min(22,(H*0.32-GAP*(ROWS-1))/ROWS);
  }

  function makeBricks(){
    const arr=[];
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++)
      arr.push({x:5+c*(bW+GAP), y:50+r*(bH+GAP), w:bW, h:bH,
                color:ROW_COLORS[r], pts:ROW_PTS[r], hp:r===0?2:1, alive:true});
    return arr;
  }

  function makePaddle(){
    const w=W*0.22;
    return{x:W/2-w/2, y:H-38, w, h:11, baseW:w, wideUntil:0};
  }

  function newBall(launched=false, vxHint, vyHint){
    const r=Math.max(6,W*0.014);
    const spd=3.5+(level-1)*0.6;
    const angle=(Math.random()-0.5)*1.0;
    return{
      x:paddle.x+paddle.w/2, y:paddle.y-r-1,
      vx:launched?(vxHint??Math.sin(angle)*spd):0,
      vy:launched?(vyHint??-Math.cos(angle)*spd):0,
      r, launched
    };
  }

  function launchBalls(){
    if(launched) return;
    launched=true;
    const spd=3.5+(level-1)*0.6;
    balls.forEach(b=>{
      if(!b.launched){
        const angle=(Math.random()-0.5)*1.0;
        b.vx=Math.sin(angle)*spd;
        b.vy=-Math.cos(angle)*spd;
        b.launched=true;
      }
    });
  }

  function updateScore(pts){
    score+=pts; scoreEl.textContent=score;
    const prev=parseInt(localStorage.getItem('breakout-best')||0);
    if(score>prev){localStorage.setItem('breakout-best',score);bestEl.textContent=score;}
  }

  function spawnDrop(b){
    const cx=b.x+b.w/2, cy=b.y+b.h/2, rnd=Math.random();
    let type,r=8,vy=2.0;
    if     (rnd<0.08)  {type='bomb'; r=9; vy=2.4;}
    else if(rnd<0.16)  {type='wide';}
    else if(rnd<0.27)  {type='star';}
    else if(rnd<0.34)  {type='fast';}
    else if(rnd<0.42)  {type='slow'; vy=1.8;}
    else if(rnd<0.48)  {type='multi';}
    else if(rnd<0.52)  {type='life'; vy=1.6;}
    else return;
    drops.push({x:cx,y:cy,r,vy,type,wobble:0});
  }

  function applyDrop(d){
    if(d.type==='bomb'){die();return;}
    if(d.type==='star'){updateScore(50);}
    if(d.type==='wide'){paddle.wideUntil=Date.now()+8000;}
    if(d.type==='fast'){speedMult=1.75;fastUntil=Date.now()+5000;slowUntil=0;}
    if(d.type==='slow'){speedMult=0.5;slowUntil=Date.now()+7000;fastUntil=0;}
    if(d.type==='life'){lives=Math.min(lives+1,6);}
    if(d.type==='multi'){
      const ref=balls.find(b=>b.launched)||balls[0];
      const spd=Math.sqrt(ref.vx**2+ref.vy**2)||3.5+(level-1)*0.6;
      for(let i=0;i<2;i++){
        const a=Math.random()*Math.PI*2;
        balls.push({...ref, vx:Math.sin(a)*spd, vy:-Math.abs(Math.cos(a)*spd), launched:true});
      }
      if(!launched){ref.vx=Math.sin((Math.random()-0.5)*0.6)*spd;ref.vy=-spd;ref.launched=true;launched=true;}
    }
  }

  function update(){
    const now=Date.now();
    if(fastUntil&&now>fastUntil){speedMult=1;fastUntil=0;}
    if(slowUntil&&now>slowUntil){speedMult=1;slowUntil=0;}

    // paddle
    const dx=paddleTarget-(paddle.x+paddle.w/2);
    paddle.x+=dx*0.18;
    paddle.x=Math.max(0,Math.min(W-paddle.w,paddle.x));
    if(paddle.wideUntil&&now<paddle.wideUntil) paddle.w=paddle.baseW*1.65;
    else{paddle.w=paddle.baseW;paddle.wideUntil=0;}

    // each ball
    for(let i=balls.length-1;i>=0;i--){
      const ball=balls[i];
      if(!ball.launched){ball.x=paddle.x+paddle.w/2;ball.y=paddle.y-ball.r-1;continue;}
      ball.x+=ball.vx*speedMult; ball.y+=ball.vy*speedMult;

      if(ball.x-ball.r<0){ball.x=ball.r;ball.vx=Math.abs(ball.vx);}
      if(ball.x+ball.r>W){ball.x=W-ball.r;ball.vx=-Math.abs(ball.vx);}
      if(ball.y-ball.r<0){ball.y=ball.r;ball.vy=Math.abs(ball.vy);}

      if(ball.y-ball.r>H){
        balls.splice(i,1);
        if(balls.length===0){lives--;if(lives<=0){die();return;}balls=[newBall()];launched=false;}
        continue;
      }

      // paddle bounce
      if(ball.vy>0&&ball.y+ball.r>=paddle.y&&ball.y-ball.r<=paddle.y+paddle.h&&
         ball.x>=paddle.x-ball.r&&ball.x<=paddle.x+paddle.w+ball.r){
        const hit=(ball.x-paddle.x)/paddle.w;
        const a=(hit-0.5)*2*Math.PI*0.38;
        const spd=Math.sqrt(ball.vx**2+ball.vy**2);
        ball.vx=Math.sin(a)*spd; ball.vy=-Math.cos(a)*spd;
        ball.y=paddle.y-ball.r-1;
      }

      // brick collisions
      for(const b of bricks){
        if(!b.alive)continue;
        if(ball.x+ball.r<b.x||ball.x-ball.r>b.x+b.w)continue;
        if(ball.y+ball.r<b.y||ball.y-ball.r>b.y+b.h)continue;
        const oL=ball.x+ball.r-b.x,oR=b.x+b.w-(ball.x-ball.r);
        const oT=ball.y+ball.r-b.y,oB=b.y+b.h-(ball.y-ball.r);
        if(Math.min(oL,oR)<Math.min(oT,oB))ball.vx*=-1;else ball.vy*=-1;
        b.hp--;
        if(b.hp<=0){b.alive=false;updateScore(b.pts);spawnDrop(b);}
        break;
      }
    }

    if(bricks.every(b=>!b.alive)){
      level++;bricks=makeBricks();drops=[];launched=false;
      balls=[newBall()];speedMult=1;fastUntil=0;slowUntil=0;
    }

    // drops fall
    for(let i=drops.length-1;i>=0;i--){
      const d=drops[i]; d.y+=d.vy; d.wobble+=0.12;
      if(d.y>H+20){drops.splice(i,1);continue;}
      if(d.y+d.r>=paddle.y&&d.y-d.r<=paddle.y+paddle.h&&
         d.x>=paddle.x-d.r&&d.x<=paddle.x+paddle.w+d.r){
        applyDrop(d); drops.splice(i,1);
        if(!running) return;
      }
    }
  }

  // ── drawing helpers ──
  function drawStar(x,y,r,color){
    ctx.fillStyle=color; ctx.beginPath();
    for(let i=0;i<10;i++){
      const rad=i%2===0?r:r*0.42, a=(i*Math.PI/5)-Math.PI/2;
      i===0?ctx.moveTo(x+rad*Math.cos(a),y+rad*Math.sin(a)):ctx.lineTo(x+rad*Math.cos(a),y+rad*Math.sin(a));
    }
    ctx.closePath();ctx.fill();
  }

  function drawBombShape(x,y,r){
    ctx.fillStyle='#222';ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#888';ctx.lineWidth=1.5;ctx.beginPath();
    ctx.moveTo(x+r*0.5,y-r*0.8);ctx.quadraticCurveTo(x+r*0.9,y-r*1.4,x+r*0.3,y-r*1.6);ctx.stroke();
    ctx.fillStyle='#fdd835';ctx.beginPath();ctx.arc(x+r*0.3,y-r*1.6,r*0.25,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#e53935';ctx.lineWidth=1.8;ctx.beginPath();
    ctx.moveTo(x-r*0.42,y-r*0.42);ctx.lineTo(x+r*0.42,y+r*0.42);
    ctx.moveTo(x+r*0.42,y-r*0.42);ctx.lineTo(x-r*0.42,y+r*0.42);ctx.stroke();
  }

  function drawLightning(x,y,r){
    ctx.fillStyle='#fdd835';ctx.beginPath();
    ctx.moveTo(x+r*0.25,y-r);ctx.lineTo(x-r*0.35,y-r*0.05);ctx.lineTo(x+r*0.1,y-r*0.05);
    ctx.lineTo(x-r*0.25,y+r);ctx.lineTo(x+r*0.35,y+r*0.05);ctx.lineTo(x-r*0.1,y+r*0.05);
    ctx.closePath();ctx.fill();
  }

  function drawHeart(x,y,r){
    const k=r*0.65;
    ctx.fillStyle='#e91e63';
    ctx.beginPath();ctx.arc(x-k*0.5,y-k*0.2,k*0.55,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.arc(x+k*0.5,y-k*0.2,k*0.55,0,Math.PI*2);ctx.fill();
    ctx.beginPath();ctx.moveTo(x-k*1.0,y-k*0.1);ctx.lineTo(x,y+k*1.0);ctx.lineTo(x+k*1.0,y-k*0.1);ctx.closePath();ctx.fill();
  }

  function drawPill(x,y,r,color,letter){
    ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font=`bold ${r*1.3}px sans-serif`;
    ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(letter,x,y);
  }

  function drawFrame(){
    ctx.clearRect(0,0,W,H);

    // bricks
    bricks.forEach(b=>{
      if(!b.alive)return;
      ctx.fillStyle=b.hp===2?b.color:b.color+'99';
      ctx.fillRect(b.x,b.y,b.w,b.h);
      ctx.fillStyle='rgba(255,255,255,0.22)';ctx.fillRect(b.x,b.y,b.w,3);
    });

    // drops
    drops.forEach(d=>{
      const wy=d.y+Math.sin(d.wobble)*2;
      if(d.type==='star')   drawStar(d.x,wy,d.r,'#fdd835');
      else if(d.type==='wide')  drawPill(d.x,wy,d.r,'#1e88e5','W');
      else if(d.type==='fast')  drawLightning(d.x,wy,d.r);
      else if(d.type==='slow')  drawPill(d.x,wy,d.r,'#00bcd4','S');
      else if(d.type==='multi') drawPill(d.x,wy,d.r,'#fb8c00','×3');
      else if(d.type==='life')  drawHeart(d.x,wy,d.r);
      else drawBombShape(d.x,wy,d.r);
    });

    // balls
    const now=Date.now();
    const ballColor=fastUntil&&now<fastUntil?'#fdd835':slowUntil&&now<slowUntil?'#00bcd4':'#111';
    balls.forEach(ball=>{
      ctx.fillStyle=ballColor;
      ctx.beginPath();ctx.arc(ball.x,ball.y,ball.r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='rgba(255,255,255,0.45)';
      ctx.beginPath();ctx.arc(ball.x-ball.r*0.3,ball.y-ball.r*0.3,ball.r*0.32,0,Math.PI*2);ctx.fill();
    });

    // paddle
    const isWide=paddle.wideUntil&&now<paddle.wideUntil;
    ctx.fillStyle=isWide?'#1e88e5':'#111';
    ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,paddle.w,paddle.h,5);ctx.fill();

    // lives as hearts
    for(let i=0;i<lives;i++) drawHeart(12+i*22,H-10,6);

    // active effect label
    if(fastUntil&&now<fastUntil){
      ctx.fillStyle='#fdd835';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';
      ctx.fillText('FAST',W-6,H-4);
    } else if(slowUntil&&now<slowUntil){
      ctx.fillStyle='#00bcd4';ctx.font='11px sans-serif';ctx.textAlign='right';ctx.textBaseline='bottom';
      ctx.fillText('SLOW',W-6,H-4);
    }

    if(!launched){
      ctx.fillStyle='#bbb';ctx.font='12px sans-serif';ctx.textAlign='center';ctx.textBaseline='bottom';
      ctx.fillText('tap · space to launch',W/2,paddle.y-12);
    }
  }

  function drawIdle(){
    ctx.clearRect(0,0,W,H);
    const tempBricks=makeBricks();
    tempBricks.slice(0,16).forEach(b=>{ctx.fillStyle=b.color+'55';ctx.fillRect(b.x,b.y,b.w,b.h);});
    const pw=W*0.22,px=W/2-pw/2,py=H-38;
    ctx.fillStyle='#ccc';ctx.beginPath();ctx.roundRect(px,py,pw,11,5);ctx.fill();
    ctx.fillStyle='#ccc';ctx.beginPath();ctx.arc(W/2,py-20,7,0,Math.PI*2);ctx.fill();
  }

  function die(){running=false;cancelAnimationFrame(raf);showOverlay('Game Over',`Score: ${score} — tap to restart`);}

  function init(){
    stop();initCanvas();score=0;lives=3;level=1;speedMult=1;fastUntil=0;slowUntil=0;
    scoreEl.textContent=0;bestEl.textContent=localStorage.getItem('breakout-best')||0;
    paddle=makePaddle();paddleTarget=W/2;bricks=makeBricks();drops=[];launched=false;balls=[newBall()];
    drawIdle();
    showOverlay('Breakout','Steer with mouse or drag · tap / space to launch\n⭐+50pts  W=wide  ⚡fast  S=slow  ×3=multiball  ♥+life  💣=dead');
  }

  function start(){if(running)return;running=true;hideOverlay();raf=requestAnimationFrame(loop);}
  function stop(){cancelAnimationFrame(raf);raf=null;running=false;}
  function resize(){
    initCanvas();paddle=makePaddle();paddleTarget=W/2;
    bricks=makeBricks();drops=[];launched=false;balls=[newBall()];
    if(!running)drawIdle();
  }
  function loop(){if(!running)return;update();drawFrame();raf=requestAnimationFrame(loop);}

  document.addEventListener('keydown',e=>{
    if(activeGame!=='breakout')return;
    if((e.key===' '||e.key==='Enter')&&!overlay.classList.contains('hidden')){start();return;}
    if(e.key===' '&&running){e.preventDefault();launchBalls();}
    if(e.key==='ArrowLeft'||e.key==='a')  paddleTarget=Math.max(0,paddleTarget-30);
    if(e.key==='ArrowRight'||e.key==='d') paddleTarget=Math.min(W,paddleTarget+30);
  });

  canvas.addEventListener('mousemove',e=>{
    if(activeGame!=='breakout')return;
    paddleTarget=e.clientX-canvas.getBoundingClientRect().left;
  });
  canvas.addEventListener('click',e=>{
    if(activeGame!=='breakout'||!overlay.classList.contains('hidden'))return;
    launchBalls();
  });
  canvas.addEventListener('touchstart',e=>{
    if(activeGame!=='breakout')return;
    e.preventDefault();
    paddleTarget=e.touches[0].clientX-canvas.getBoundingClientRect().left;
    if(!overlay.classList.contains('hidden'))return;
    launchBalls();
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    if(activeGame!=='breakout')return;e.preventDefault();
    paddleTarget=e.touches[0].clientX-canvas.getBoundingClientRect().left;
  },{passive:false});

  return{init,start,stop,resize};
})();
