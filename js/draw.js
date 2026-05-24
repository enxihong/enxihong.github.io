// ─────────────────────────────────────────────
// DRAW
// ─────────────────────────────────────────────
const draw = (() => {
  const COLORS=['#111111','#ffffff','#e53935','#fb8c00','#fdd835','#43a047',
                '#00bcd4','#1e88e5','#9c27b0','#e91e63','#795548','#9e9e9e'];
  let painting=false, lastX=0, lastY=0;
  let color='#111111', brushSize=10, tool='draw';
  let undoStack=[];

  function initCanvas(){
    canvas.width  = Math.min(window.innerWidth-16, 900);
    canvas.height = window.innerHeight - 58 - 130;
    canvas.style.cursor='crosshair';
    ctx.fillStyle='#ffffff';
    ctx.fillRect(0,0,canvas.width,canvas.height);
  }

  function saveUndo(){
    undoStack.push(ctx.getImageData(0,0,canvas.width,canvas.height));
    if(undoStack.length>25) undoStack.shift();
  }

  function getPos(e){
    const r=canvas.getBoundingClientRect();
    if(e.touches) return{x:e.touches[0].clientX-r.left, y:e.touches[0].clientY-r.top};
    return{x:e.clientX-r.left, y:e.clientY-r.top};
  }

  function startPaint(e){
    if(activeGame!=='draw') return;
    saveUndo();
    painting=true;
    const{x,y}=getPos(e);
    lastX=x; lastY=y;
    ctx.beginPath();
    ctx.arc(x,y,(tool==='eraser'?brushSize*1.5:brushSize)/2,0,Math.PI*2);
    ctx.fillStyle=tool==='eraser'?'#fff':color;
    ctx.fill();
  }

  function movePaint(e){
    if(!painting||activeGame!=='draw') return;
    if(e.cancelable) e.preventDefault();
    const{x,y}=getPos(e);
    ctx.beginPath();
    ctx.strokeStyle=tool==='eraser'?'#ffffff':color;
    ctx.lineWidth=tool==='eraser'?brushSize*1.5:brushSize;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.moveTo(lastX,lastY); ctx.lineTo(x,y); ctx.stroke();
    lastX=x; lastY=y;
  }

  function stopPaint(){ painting=false; }

  function setColor(c){
    color=c; tool='draw';
    document.querySelectorAll('.draw-swatch').forEach(s=>s.classList.toggle('active',s.dataset.color===c));
    $('draw-eraser').classList.remove('active');
  }

  function setSize(s){
    brushSize=parseInt(s);
    document.querySelectorAll('.draw-size').forEach(b=>b.classList.toggle('active',b.dataset.size===s));
  }

  function buildToolbar(){
    const colDiv=$('draw-colors');
    colDiv.innerHTML='';
    COLORS.forEach(c=>{
      const btn=document.createElement('button');
      btn.className='draw-swatch'+(c===color?' active':'');
      btn.dataset.color=c;
      btn.style.background=c;
      btn.addEventListener('click',()=>setColor(c));
      colDiv.appendChild(btn);
    });
    // custom color picker
    const picker=document.createElement('input');
    picker.type='color'; picker.value=color;
    picker.title='Custom color';
    picker.style.cssText='width:28px;height:28px;border-radius:50%;border:2px solid #ddd;cursor:pointer;padding:0;background:none;flex-shrink:0';
    picker.addEventListener('input',e=>setColor(e.target.value));
    colDiv.appendChild(picker);

    document.querySelectorAll('.draw-size').forEach(b=>{
      b.classList.toggle('active', b.dataset.size===String(brushSize));
      b.addEventListener('click',()=>setSize(b.dataset.size));
    });

    $('draw-eraser').addEventListener('click',()=>{
      tool=tool==='eraser'?'draw':'eraser';
      $('draw-eraser').classList.toggle('active',tool==='eraser');
    });
    $('draw-undo').addEventListener('click',()=>{
      if(undoStack.length) ctx.putImageData(undoStack.pop(),0,0);
    });
    $('draw-clear').addEventListener('click',()=>{
      saveUndo();
      ctx.fillStyle='#fff'; ctx.fillRect(0,0,canvas.width,canvas.height);
    });
    $('draw-share').addEventListener('click',shareDrawing);
  }

  async function shareDrawing(){
    canvas.toBlob(async blob=>{
      const file=new File([blob],'drawing.png',{type:'image/png'});
      if(navigator.share&&navigator.canShare&&navigator.canShare({files:[file]})){
        try{
          await navigator.share({files:[file], title:"My drawing from Enxi's page"});
          return;
        }catch(e){ if(e.name==='AbortError') return; }
      }
      // fallback: download
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      a.href=url; a.download='drawing.png'; a.click();
      URL.revokeObjectURL(url);
    },'image/png');
  }

  function init(){
    stop();
    undoStack=[]; tool='draw'; color='#111111'; brushSize=10;
    initCanvas();
    buildToolbar();
    hideOverlay();
  }

  function stop(){ painting=false; canvas.style.cursor=''; }

  function resize(){
    const img=ctx.getImageData(0,0,canvas.width,canvas.height);
    initCanvas();
    ctx.putImageData(img,0,0);
  }

  // events
  canvas.addEventListener('mousedown', e=>{ if(activeGame==='draw') startPaint(e); });
  canvas.addEventListener('mousemove', e=>{ if(activeGame==='draw') movePaint(e); });
  canvas.addEventListener('mouseup',   ()=>stopPaint());
  canvas.addEventListener('mouseleave',()=>stopPaint());
  canvas.addEventListener('touchstart', e=>{ if(activeGame==='draw'){e.preventDefault();startPaint(e);}},{passive:false});
  canvas.addEventListener('touchmove',  e=>{ if(activeGame==='draw') movePaint(e); },{passive:false});
  canvas.addEventListener('touchend',  ()=>stopPaint());

  return{init,stop,resize,start:()=>{}};
})();
