// ─────────────────────────────────────────────
// FISHY
// ─────────────────────────────────────────────
const fishy=(()=>{
  const FISH_COLORS=['#e74c3c','#e67e22','#f1c40f','#2ecc71','#1abc9c','#3498db','#9b59b6','#e91e63'];
  const PLAYER_COLOR='#ff9800';
  const TARGET_FISH=18;
  let player, fish, score, running, raf, mouseX, mouseY, touchActive;

  function init(){
    cancelAnimationFrame(raf); running=false;
    resizeFishyCanvas();
    mouseX=canvas.width/2; mouseY=canvas.height/2; touchActive=false;
    scoreEl.textContent=0; bestEl.textContent=localStorage.getItem('fishy-best')||0;
    player=null; fish=[];
    drawIdle(); showOverlay('Fishy','Move your mouse · tap and drag to swim\nEat smaller fish, avoid bigger ones');
  }

  function resize(){
    resizeFishyCanvas();
    if(player){
      player.x=Math.min(player.x,canvas.width);
      player.y=Math.min(player.y,canvas.height);
    }
    if(running)drawFrame(); else if(!player)drawIdle();
  }

  function stop(){cancelAnimationFrame(raf);raf=null;running=false;}

  function start(){
    stop();
    score=0; scoreEl.textContent=0;
    player={
      x:canvas.width/2, y:canvas.height/2,
      r:22, vx:0, vy:0, dir:1, wobble:0,
    };
    mouseX=canvas.width/2; mouseY=canvas.height/2;
    fish=[];
    for(let i=0;i<TARGET_FISH;i++) fish.push(spawnFish(true));
    running=true; hideOverlay();
    raf=requestAnimationFrame(loop);
  }

  function spawnFish(anywhere){
    const W=canvas.width, H=canvas.height;
    const minR=8, maxR=Math.min(80, player ? player.r*2.5 : 50);
    const r=minR+Math.random()*(maxR-minR);
    const speed=(1+Math.random()*2)*(50/r+0.3);
    const dir=Math.random()<0.5?1:-1;
    let x,y;
    if(anywhere){
      x=Math.random()*W; y=Math.random()*H;
    } else {
      // spawn from edges
      if(dir===1){ x=-r*2; } else { x=W+r*2; }
      y=r+Math.random()*(H-r*2);
    }
    return {
      x, y, r, vx:speed*dir,
      vy:(Math.random()-0.5)*0.6,
      color:FISH_COLORS[~~(Math.random()*FISH_COLORS.length)],
      wobble:Math.random()*Math.PI*2,
    };
  }

  function loop(){
    if(!running)return;
    update();
    drawFrame();
    raf=requestAnimationFrame(loop);
  }

  function update(){
    const W=canvas.width, H=canvas.height;

    // move player toward mouse/touch
    const dx=mouseX-player.x, dy=mouseY-player.y;
    const dist=Math.sqrt(dx*dx+dy*dy);
    const maxSpeed=4+player.r*0.05;
    if(dist>2){
      const speed=Math.min(dist*0.1, maxSpeed);
      player.vx+=(dx/dist)*speed;
      player.vy+=(dy/dist)*speed;
    }
    // damping
    player.vx*=0.82; player.vy*=0.82;
    player.x+=player.vx; player.y+=player.vy;
    // bounce off walls
    if(player.x<player.r){player.x=player.r;player.vx*=-0.5;}
    if(player.x>W-player.r){player.x=W-player.r;player.vx*=-0.5;}
    if(player.y<player.r){player.y=player.r;player.vy*=-0.5;}
    if(player.y>H-player.r){player.y=H-player.r;player.vy*=-0.5;}
    if(Math.abs(player.vx)>0.1) player.dir=player.vx>0?1:-1;
    player.wobble+=0.15;

    // move fish
    fish.forEach(f=>{
      f.wobble+=0.08+0.02*Math.random();
      f.x+=f.vx; f.y+=f.vy+Math.sin(f.wobble)*0.4;
      // wrap horizontally
      if(f.vx>0&&f.x>W+f.r*2) f.x=-f.r*2;
      if(f.vx<0&&f.x<-f.r*2)  f.x=W+f.r*2;
      // bounce vertically
      if(f.y<f.r)     {f.y=f.r;    f.vy=Math.abs(f.vy);}
      if(f.y>H-f.r)   {f.y=H-f.r;  f.vy=-Math.abs(f.vy);}
    });

    // collisions with player
    for(let i=fish.length-1;i>=0;i--){
      const f=fish[i];
      const dx=player.x-f.x, dy=player.y-f.y;
      const dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<player.r*0.85+f.r*0.85){
        if(player.r>=f.r*0.85){
          // eat it
          player.r+=f.r*0.05;
          score++;
          scoreEl.textContent=score;
          const prev=parseInt(localStorage.getItem('fishy-best')||0);
          if(score>prev){localStorage.setItem('fishy-best',score);bestEl.textContent=score;}
          fish.splice(i,1);
        } else if(f.r>player.r*1.15){
          // eaten by it
          die(); return;
        }
      }
    }

    // maintain fish count
    while(fish.length<TARGET_FISH) fish.push(spawnFish(false));
  }

  function die(){
    stop();
    showOverlay('You got eaten!',`Score: ${score} — tap to try again`);
  }

  function drawFish(x,y,r,color,dir,wobble,alpha){
    ctx.save();
    ctx.globalAlpha=alpha||1;
    ctx.translate(x,y+Math.sin(wobble)*r*0.08);
    if(dir<0) ctx.scale(-1,1);

    // tail
    ctx.fillStyle=color;
    ctx.beginPath();
    ctx.moveTo(-r*0.55, 0);
    ctx.lineTo(-r*1.35, -r*0.65);
    ctx.lineTo(-r*1.35,  r*0.65);
    ctx.closePath();
    ctx.fill();

    // body
    ctx.beginPath();
    ctx.ellipse(r*0.1, 0, r, r*0.58, 0, 0, Math.PI*2);
    ctx.fill();

    // lighter belly
    ctx.fillStyle='rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.ellipse(r*0.1, r*0.15, r*0.6, r*0.3, 0, 0, Math.PI*2);
    ctx.fill();

    // eye white
    ctx.fillStyle='#fff';
    ctx.beginPath();
    ctx.arc(r*0.52, -r*0.16, r*0.2, 0, Math.PI*2);
    ctx.fill();
    // pupil
    ctx.fillStyle='#111';
    ctx.beginPath();
    ctx.arc(r*0.57, -r*0.16, r*0.11, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  function drawFrame(){
    ctx.clearRect(0,0,canvas.width,canvas.height);

    // subtle water gradient
    const grad=ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'#f8fbff');
    grad.addColorStop(1,'#e8f4fd');
    ctx.fillStyle=grad;
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // fish
    fish.forEach(f=>drawFish(f.x,f.y,f.r,f.color,f.vx>0?1:-1,f.wobble));

    // size ring around player (eating range indicator)
    ctx.strokeStyle='rgba(255,152,0,0.15)';
    ctx.lineWidth=2;
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
    ctx.stroke();

    // player
    drawFish(player.x,player.y,player.r,PLAYER_COLOR,player.dir,player.wobble);
  }

  function drawIdle(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const grad=ctx.createLinearGradient(0,0,0,canvas.height);
    grad.addColorStop(0,'#f8fbff'); grad.addColorStop(1,'#e8f4fd');
    ctx.fillStyle=grad; ctx.fillRect(0,0,canvas.width,canvas.height);
    const cx=canvas.width/2, cy=canvas.height/2;
    drawFish(cx-60,cy,28,'#3498db',1,0);
    drawFish(cx+20,cy-10,14,'#2ecc71',1,1);
    drawFish(cx+80,cy+20,10,'#e74c3c',1,2);
    drawFish(cx-20,cy+30,50,'#9b59b6',-1,0.5);
  }

  // mouse
  canvas.addEventListener('mousemove',e=>{
    if(activeGame!=='fishy')return;
    const r=canvas.getBoundingClientRect();
    mouseX=e.clientX-r.left; mouseY=e.clientY-r.top;
  });

  // touch
  canvas.addEventListener('touchstart',e=>{
    if(activeGame!=='fishy')return;
    e.preventDefault();
    const r=canvas.getBoundingClientRect();
    mouseX=e.touches[0].clientX-r.left; mouseY=e.touches[0].clientY-r.top;
    touchActive=true;
  },{passive:false});
  canvas.addEventListener('touchmove',e=>{
    if(activeGame!=='fishy')return;
    e.preventDefault();
    const r=canvas.getBoundingClientRect();
    mouseX=e.touches[0].clientX-r.left; mouseY=e.touches[0].clientY-r.top;
  },{passive:false});
  canvas.addEventListener('touchend',()=>{touchActive=false;});

  return{init,start,stop,resize};
})();
