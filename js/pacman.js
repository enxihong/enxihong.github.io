// ─────────────────────────────────────────────
// PAC-MAN
// ─────────────────────────────────────────────
const pacman=(()=>{
  // 21-wide × 23-tall maze. 0=empty,1=wall,2=dot,3=power,4=door
  const BASE_MAZE=[
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,3,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,3,1],
    [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,1,2,1],
    [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
    [1,1,1,1,2,1,1,1,0,0,0,0,0,1,1,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,0,0,1,1,1,0,0,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,1,1,4,4,4,1,1,0,1,2,1,1,1,1],
    [0,0,0,0,2,0,0,1,0,0,0,0,0,1,0,0,2,0,0,0,0],
    [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,0,0,0,0,0,0,0,0,1,2,1,1,1,1],
    [1,1,1,1,2,1,0,1,1,1,1,1,1,1,0,1,2,1,1,1,1],
    [1,2,2,2,2,2,2,2,2,2,1,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
    [1,3,2,1,2,2,2,2,2,2,0,2,2,2,2,2,2,1,2,3,1],
    [1,1,2,1,2,1,2,1,1,1,1,1,1,1,2,1,2,1,2,1,1],
    [1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1,2,2,2,2,1],
    [1,2,1,1,1,1,1,1,2,1,1,1,2,1,1,1,1,1,1,2,1],
    [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
    [1,2,1,1,2,1,1,1,2,1,1,1,2,1,1,1,2,1,1,2,1],
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  ];
  const COLS=21, ROWS=23;
  const GHOST_COLORS=['#e53935','#f48fb1','#00bcd4','#fb8c00'];
  const GHOST_NAMES=['blinky','pinky','inky','clyde'];
  // Ghost house center
  const HOUSE_X=10, HOUSE_Y=10;
  const SPAWN_X=10, SPAWN_Y=16; // pac-man start

  let tile, maze, pm, ghosts, score, lives, level, running, raf, frightTimer, ghostEatCombo;
  let nextDir={x:1,y:0};

  function copyMaze(){return BASE_MAZE.map(r=>r.slice());}

  function initCanvas(){
    const touch=window.matchMedia('(pointer: coarse)').matches;
    const ctrlH=touch?106:0;
    const maxW=Math.min(window.innerWidth-16,480);
    const maxH=window.innerHeight-58-ctrlH-20;
    tile=Math.floor(Math.min(maxW/COLS, maxH/ROWS));
    canvas.width=tile*COLS; canvas.height=tile*ROWS;
  }

  function totalDots(){
    let n=0;
    BASE_MAZE.forEach(r=>r.forEach(c=>{if(c===2||c===3)n++;}));
    return n;
  }

  function makeGhosts(){
    return GHOST_COLORS.map((color,i)=>({
      x:HOUSE_X+(i-1.5)*0.5, y:HOUSE_Y,
      tx:HOUSE_X, ty:HOUSE_Y,
      dir:{x:0,y:-1}, color,
      state:'house', // 'house'|'chase'|'scatter'|'frightened'|'eyes'
      releaseTimer: i*90,
      wobble:0,
    }));
  }

  function makePM(){
    return{x:SPAWN_X, y:SPAWN_Y, dir:{x:0,y:0}, mouthAngle:0.25, mouthDir:1, moving:false};
  }

  function canMove(gx,gy,dx,dy){
    const nx=Math.round(gx+dx), ny=Math.round(gy+dy);
    if(nx<0||nx>=COLS) return true; // wrap
    if(ny<0||ny>=ROWS) return false;
    const cell=maze[ny]?.[nx];
    return cell!==1 && cell!==4;
  }

  function canMoveGhost(gx,gy,dx,dy){
    const nx=Math.round(gx+dx), ny=Math.round(gy+dy);
    if(ny<0||ny>=ROWS) return false;
    if(nx<0) return true; if(nx>=COLS) return true;
    const cell=maze[ny]?.[nx];
    return cell!==1;
  }

  function wrapX(x){
    if(x<0) return COLS-1;
    if(x>=COLS) return 0;
    return x;
  }

  // BFS to find next step toward target
  function bfsStep(fx,fy,tx,ty,avoidDir){
    const sx=Math.round(fx), sy=Math.round(fy);
    const ttx=Math.round(tx), tty=Math.round(ty);
    if(sx===ttx&&sy===tty) return{x:0,y:0};
    const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    const queue=[[sx,sy,null]];
    const visited=new Set([`${sx},${sy}`]);
    const parent=new Map();
    while(queue.length){
      const [cx,cy,first]=queue.shift();
      for(const d of dirs){
        const nx=wrapX(cx+d.x), ny=cy+d.y;
        const key=`${nx},${ny}`;
        if(visited.has(key)) continue;
        if(ny<0||ny>=ROWS) continue;
        const cell=maze[ny]?.[nx];
        if(cell===1) continue;
        if(cell===4&&!(cy===HOUSE_Y&&d.y>0)) continue; // ghosts don't go back into house normally
        const f=first||d;
        if(nx===ttx&&ny===tty) return f;
        visited.add(key);
        queue.push([nx,ny,f]);
      }
    }
    return {x:0,y:0};
  }

  function randomDir(gx,gy,prevDir){
    const dirs=[{x:1,y:0},{x:-1,y:0},{x:0,y:1},{x:0,y:-1}];
    const valid=dirs.filter(d=>canMoveGhost(gx,gy,d.x,d.y)&&!(d.x===-prevDir.x&&d.y===-prevDir.y));
    if(!valid.length) return prevDir;
    return valid[~~(Math.random()*valid.length)];
  }

  function scatterTarget(i){
    const corners=[{x:COLS-2,y:1},{x:1,y:1},{x:COLS-2,y:ROWS-2},{x:1,y:ROWS-2}];
    return corners[i%4];
  }

  function updateGhost(g,i,tick){
    // release from house
    if(g.state==='house'){
      g.releaseTimer--;
      if(g.releaseTimer<=0){g.state='chase';g.x=HOUSE_X;g.y=HOUSE_Y-1;}
      return;
    }
    if(g.state==='eyes'){
      // return to house
      const step=bfsStep(g.x,g.y,HOUSE_X,HOUSE_Y,g.dir);
      g.dir=step;
      g.x+=g.dir.x*0.12;
      g.y+=g.dir.y*0.12;
      g.x=wrapX(g.x);
      const dx=Math.abs(g.x-HOUSE_X), dy=Math.abs(g.y-HOUSE_Y);
      if(dx<0.2&&dy<0.2){g.x=HOUSE_X;g.y=HOUSE_Y;g.state='house';g.releaseTimer=120;}
      return;
    }

    const spd=g.state==='frightened'?0.06:0.09+(level-1)*0.004;
    const snap=0.15;
    const rx=Math.abs(g.x-Math.round(g.x)), ry=Math.abs(g.y-Math.round(g.y));

    // only choose new dir at grid intersections
    if(rx<snap&&ry<snap){
      g.x=Math.round(g.x); g.y=Math.round(g.y);
      let target;
      if(g.state==='frightened'){
        g.dir=randomDir(g.x,g.y,g.dir);
      } else {
        const scatter=(tick%480)<160;
        if(scatter) target=scatterTarget(i);
        else if(i===0) target={x:Math.round(pm.x),y:Math.round(pm.y)};
        else if(i===1) target={x:Math.round(pm.x)+pm.dir.x*4,y:Math.round(pm.y)+pm.dir.y*4};
        else if(i===2){const b=ghosts[0];target={x:Math.round(pm.x)+(Math.round(pm.x)-Math.round(b.x)),y:Math.round(pm.y)+(Math.round(pm.y)-Math.round(b.y))};}
        else{const dx=Math.round(pm.x)-Math.round(g.x),dy=Math.round(pm.y)-Math.round(g.y);const dist=Math.sqrt(dx*dx+dy*dy);target=dist>8?{x:Math.round(pm.x),y:Math.round(pm.y)}:scatterTarget(3);}
        g.dir=bfsStep(g.x,g.y,target.x,target.y,g.dir);
      }
    }

    g.x+=g.dir.x*spd;
    g.y+=g.dir.y*spd;
    g.x=((g.x%COLS)+COLS)%COLS;
    g.y=Math.max(0,Math.min(ROWS-1,g.y));
    g.wobble+=0.18;
  }

  let tick=0;
  let dotsTotal=0, dotsEaten=0;

  function update(){
    tick++;
    if(frightTimer>0) frightTimer--;
    if(frightTimer===0) ghosts.forEach(g=>{if(g.state==='frightened')g.state='chase';});

    // pac-man movement
    const spd=0.12+(level-1)*0.01;
    const rx=Math.abs(pm.x-Math.round(pm.x)), ry=Math.abs(pm.y-Math.round(pm.y));
    if(rx<0.15&&ry<0.15){
      pm.x=Math.round(pm.x); pm.y=Math.round(pm.y);
      if(canMove(pm.x,pm.y,nextDir.x,nextDir.y)){pm.dir=nextDir;}
    }
    if(canMove(pm.x,pm.y,pm.dir.x,pm.dir.y)){
      pm.x+=pm.dir.x*spd; pm.y+=pm.dir.y*spd;
      pm.x=((pm.x%COLS)+COLS)%COLS;
      pm.y=Math.max(0,Math.min(ROWS-1,pm.y));
      pm.moving=true;
    } else { pm.moving=false; }

    // eat dots
    const tx=Math.round(pm.x), ty=Math.round(pm.y);
    if(maze[ty]&&maze[ty][tx]===2){
      maze[ty][tx]=0; score+=10; scoreEl.textContent=score; dotsEaten++;
      saveBest();
    } else if(maze[ty]&&maze[ty][tx]===3){
      maze[ty][tx]=0; score+=50; scoreEl.textContent=score; dotsEaten++;
      saveBest();
      frightTimer=Math.max(120,300-(level-1)*30);
      ghostEatCombo=0;
      ghosts.forEach(g=>{if(g.state==='chase'||g.state==='scatter')g.state='frightened';});
    }

    // all dots eaten → next level
    if(dotsEaten>=dotsTotal){nextLevel();return;}

    // update ghosts
    ghosts.forEach((g,i)=>updateGhost(g,i,tick));

    // ghost collisions
    for(const g of ghosts){
      if(g.state==='house'||g.state==='eyes') continue;
      const dx=pm.x-g.x, dy=pm.y-g.y;
      if(Math.sqrt(dx*dx+dy*dy)<0.7){
        if(g.state==='frightened'){
          ghostEatCombo++;
          score+=200*(1<<(ghostEatCombo-1));
          scoreEl.textContent=score; saveBest();
          g.state='eyes';
        } else {
          loseLife(); return;
        }
      }
    }

    // mouth animation
    if(pm.moving){
      pm.mouthAngle+=0.08*pm.mouthDir;
      if(pm.mouthAngle>=0.28){pm.mouthDir=-1;}
      if(pm.mouthAngle<=0.02){pm.mouthDir=1;}
    } else { pm.mouthAngle=0.15; }
  }

  function saveBest(){
    const prev=parseInt(localStorage.getItem('pacman-best')||0);
    if(score>prev){localStorage.setItem('pacman-best',score);bestEl.textContent=score;}
  }

  function loseLife(){
    lives--;
    if(lives<=0){die();return;}
    pm=makePM(); nextDir={x:1,y:0};
    ghosts=makeGhosts(); frightTimer=0; ghostEatCombo=0;
    showOverlay('Life lost!',`${lives} lives left — tap to continue`);
    cancelAnimationFrame(raf); raf=null; running=false;
  }

  function die(){
    running=false; cancelAnimationFrame(raf); raf=null;
    showOverlay('Game Over',`Score: ${score} — tap to restart`);
  }

  function nextLevel(){
    level++;
    maze=copyMaze(); dotsEaten=0; pm=makePM(); nextDir={x:1,y:0};
    ghosts=makeGhosts(); frightTimer=0; ghostEatCombo=0;
    levelEl.textContent=level;
    showOverlay(`Level ${level}!`,'tap to continue');
    cancelAnimationFrame(raf); raf=null; running=false;
  }

  // ── drawing ──
  function drawMaze(){
    for(let row=0;row<ROWS;row++){
      for(let col=0;col<COLS;col++){
        const cell=maze[row][col];
        const x=col*tile, y=row*tile;
        if(cell===1){
          ctx.fillStyle='#1a237e';
          ctx.fillRect(x,y,tile,tile);
          // inner highlight
          ctx.fillStyle='#283593';
          ctx.fillRect(x+1,y+1,tile-2,tile-2);
        } else if(cell===2){
          ctx.fillStyle='#fdd835';
          ctx.beginPath();
          ctx.arc(x+tile/2,y+tile/2,tile*0.1,0,Math.PI*2);
          ctx.fill();
        } else if(cell===3){
          ctx.fillStyle='#fdd835';
          ctx.beginPath();
          ctx.arc(x+tile/2,y+tile/2,tile*0.28,0,Math.PI*2);
          ctx.fill();
        } else if(cell===4){
          // ghost door
          ctx.fillStyle='#e91e63';
          ctx.fillRect(x+tile*0.1,y+tile*0.45,tile*0.8,tile*0.12);
        }
      }
    }
  }

  function drawPM(){
    const x=pm.x*tile+tile/2, y=pm.y*tile+tile/2;
    const r=tile*0.42;
    const angle=pm.mouthAngle*Math.PI;
    let rot=0;
    if(pm.dir.x===1) rot=0;
    else if(pm.dir.x===-1) rot=Math.PI;
    else if(pm.dir.y===-1) rot=-Math.PI/2;
    else if(pm.dir.y===1) rot=Math.PI/2;

    ctx.fillStyle='#fdd835';
    ctx.beginPath();
    ctx.moveTo(x,y);
    ctx.arc(x,y,r,rot+angle,rot+Math.PI*2-angle);
    ctx.closePath();
    ctx.fill();
  }

  function drawGhost(g){
    const x=g.x*tile+tile/2, y=g.y*tile+tile/2;
    const r=tile*0.42;
    const fright=g.state==='frightened';
    const eyes=g.state==='eyes';

    if(eyes){
      // just eyes floating
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.1,r*0.25,r*0.3,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+r*0.3,y-r*0.1,r*0.25,r*0.3,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a237e';
      ctx.beginPath();ctx.arc(x-r*0.3+g.dir.x*r*0.12,y-r*0.1+g.dir.y*r*0.12,r*0.14,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x+r*0.3+g.dir.x*r*0.12,y-r*0.1+g.dir.y*r*0.12,r*0.14,0,Math.PI*2);ctx.fill();
      return;
    }

    const col=fright?(frightTimer<60&&Math.floor(tick/8)%2===0?'#fff':'#1a237e'):g.color;
    ctx.fillStyle=col;

    // body
    ctx.beginPath();
    ctx.arc(x,y-r*0.1,r,Math.PI,0);
    // wavy bottom
    const steps=4;
    for(let i=0;i<=steps;i++){
      const px=x+r*(1-2*i/steps);
      const py=y+r*(0.85+0.2*Math.sin(i*Math.PI+g.wobble));
      i===0?ctx.lineTo(px,py):ctx.lineTo(px,py);
    }
    ctx.closePath();
    ctx.fill();

    if(!fright){
      // eyes
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.ellipse(x-r*0.3,y-r*0.2,r*0.22,r*0.28,0,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.ellipse(x+r*0.3,y-r*0.2,r*0.22,r*0.28,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#1a237e';
      ctx.beginPath();ctx.arc(x-r*0.3+g.dir.x*r*0.12,y-r*0.2+g.dir.y*r*0.12,r*0.13,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x+r*0.3+g.dir.x*r*0.12,y-r*0.2+g.dir.y*r*0.12,r*0.13,0,Math.PI*2);ctx.fill();
    } else {
      // frightened face
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(x-r*0.3,y-r*0.1,r*0.12,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(x+r*0.3,y-r*0.1,r*0.12,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='#fff';ctx.lineWidth=1.5;
      ctx.beginPath();
      for(let i=0;i<5;i++){
        const px=x-r*0.5+i*r*0.25;
        const py=y+r*0.35+(i%2===0?-2:2);
        i===0?ctx.moveTo(px,py):ctx.lineTo(px,py);
      }
      ctx.stroke();
    }
  }

  function drawLives(){
    for(let i=0;i<lives;i++){
      const x=(i+0.5)*tile*1.2+2, y=canvas.height-tile*0.5;
      const r=tile*0.32;
      ctx.fillStyle='#fdd835';
      ctx.beginPath();ctx.moveTo(x,y);
      ctx.arc(x,y,r,0.3,Math.PI*2-0.3);
      ctx.closePath();ctx.fill();
    }
  }

  function drawFrame(){
    ctx.fillStyle='#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);
    drawMaze();
    ghosts.forEach(g=>drawGhost(g));
    drawPM();
    drawLives();
  }

  function drawIdle(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);
    drawMaze();
    // show a ghost and pac-man preview
    const cx=COLS/2*tile, cy=ROWS/2*tile;
    ctx.fillStyle='#fdd835';
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,tile*0.42,0.3,Math.PI*2-0.3);ctx.closePath();ctx.fill();
  }

  function setDir(dx,dy){nextDir={x:dx,y:dy};}

  function init(){
    stop();initCanvas();
    maze=copyMaze(); dotsEaten=0; dotsTotal=totalDots();
    score=0; lives=3; level=1; tick=0; frightTimer=0; ghostEatCombo=0;
    pm=makePM(); nextDir={x:1,y:0};
    ghosts=makeGhosts();
    scoreEl.textContent=0; levelEl.textContent=1;
    bestEl.textContent=localStorage.getItem('pacman-best')||0;
    levelItem.style.display='flex';
    drawIdle();
    showOverlay('Pac-Man','Arrow keys · swipe · D-pad\nEat all dots, avoid ghosts!\nPower pellets make ghosts edible 👻');
  }

  function start(){
    if(running)return;
    running=true; hideOverlay();
    raf=requestAnimationFrame(loop);
  }

  function stop(){cancelAnimationFrame(raf);raf=null;running=false;}

  function resize(){initCanvas();if(running)drawFrame();else drawIdle();}

  function loop(){
    if(!running)return;
    update();drawFrame();
    raf=requestAnimationFrame(loop);
  }

  // keyboard
  document.addEventListener('keydown',e=>{
    if(activeGame!=='pacman')return;
    if((e.key===' '||e.key==='Enter')&&!overlay.classList.contains('hidden')){start();return;}
    const map={ArrowLeft:[-1,0],a:[-1,0],ArrowRight:[1,0],d:[1,0],ArrowUp:[0,-1],w:[0,-1],ArrowDown:[0,1],s:[0,1]};
    const d=map[e.key];if(d){e.preventDefault();setDir(d[0],d[1]);}
  });

  // D-pad buttons
  $('pm-up').addEventListener('click',()=>setDir(0,-1));
  $('pm-down').addEventListener('click',()=>setDir(0,1));
  $('pm-left').addEventListener('click',()=>setDir(-1,0));
  $('pm-right').addEventListener('click',()=>setDir(1,0));

  // touch swipe
  let t0pm=null;
  canvas.addEventListener('touchstart',e=>{if(activeGame==='pacman')t0pm={x:e.touches[0].clientX,y:e.touches[0].clientY};},{passive:true});
  canvas.addEventListener('touchend',e=>{
    if(activeGame!=='pacman'||!t0pm)return;
    const dx=e.changedTouches[0].clientX-t0pm.x, dy=e.changedTouches[0].clientY-t0pm.y;
    if(Math.abs(dx)<12&&Math.abs(dy)<12){t0pm=null;return;}
    if(Math.abs(dx)>Math.abs(dy)) setDir(dx>0?1:-1,0); else setDir(0,dy>0?1:-1);
    t0pm=null;
  },{passive:true});

  return{init,start,stop,resize};
})();
