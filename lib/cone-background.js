/* cone-background.js — scroll-rotating 3D raspberry cone as a fixed page background.
   Reuses the full verified pipeline from icecream-real.html (council-fixed texture
   treatment: milky pink, colour-keyed gloss, whipped normal grain, waffle de-glow).
   Usage: include three.min.js, GLTFLoader.js, RGBELoader.js first, add
   <canvas id="coneBg"></canvas> (CSS: position:fixed;inset:0;z-index:0), then this file. */
(function(){
  var canvas=document.getElementById('coneBg');
  if(!canvas || !window.THREE || !THREE.GLTFLoader) return;
  var reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var renderer;
  try{ renderer=new THREE.WebGLRenderer({canvas:canvas,antialias:true,alpha:true}); }catch(e){ return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,1.75));
  renderer.outputEncoding=THREE.sRGBEncoding;
  renderer.toneMapping=THREE.ACESFilmicToneMapping; renderer.toneMappingExposure=0.97;
  canvas.addEventListener('webglcontextlost',function(e){ e.preventDefault(); location.reload(); });

  var scene=new THREE.Scene();
  var camera=new THREE.PerspectiveCamera(34,1,0.01,100);

  /* lights + HDRI (council values) */
  scene.add(new THREE.HemisphereLight(0xfffdf8,0xEBE2CC,0.3));
  var key=new THREE.DirectionalLight(0xfff6ea,1.15); key.position.set(-1.1,9.5,2.2); scene.add(key);
  var fill=new THREE.DirectionalLight(0xffe9dc,0.24); fill.position.set(4,2.5,2); scene.add(fill);
  var rim=new THREE.DirectionalLight(0xffe6ef,0.5); rim.position.set(1.5,3,-5); scene.add(rim);
  var pmrem=new THREE.PMREMGenerator(renderer); pmrem.compileEquirectangularShader();

  /* council texture pipeline (identical to icecream-real.html) */
  function treatMaterial(m, sat){
    if(!m) return;
    m.side=THREE.DoubleSide;
    m.transparent=false;
    m.opacity=1;
    m.alphaTest=0;
    m.depthTest=true;
    m.depthWrite=true;
    if(!m.map || !m.map.image){ m.needsUpdate=true; return; }
    var MAXT=2048, tf=Math.min(1, MAXT/Math.max(m.map.image.width,m.map.image.height));
    var im=m.map.image, W=Math.round(im.width*tf), H=Math.round(im.height*tf);
    var cv=document.createElement('canvas'); cv.width=W; cv.height=H;
    var cx=cv.getContext('2d'); cx.drawImage(im,0,0,W,H);
    var d; try{ d=cx.getImageData(0,0,W,H); }catch(e){ return; }
    var a=d.data;
    for(var i=0;i<a.length;i+=4){ var r=a[i],g=a[i+1],b=a[i+2], l=0.299*r+0.587*g+0.114*b;
      var isBerry=r>110&&g<105&&(r-g)>55&&(r-b)>40;
      var isPink=!isBerry&&r>140&&r>b&&(r-g)>12&&b>90;
      var s2=isBerry?sat*1.25:(isPink?sat*0.93:sat*0.69);
      var dk=(!isBerry&&!isPink)?0.90:1.0;
      a[i]=Math.max(0,Math.min(255,(l+(r-l)*s2)*dk)); a[i+1]=Math.max(0,Math.min(255,(l+(g-l)*s2)*dk)); a[i+2]=Math.max(0,Math.min(255,(l+(b-l)*s2)*dk)); }
    var src=new Uint8ClampedArray(a), MIXS=0.38;
    for(var y=1;y<H-1;y++){ for(var x=1;x<W-1;x++){ var o=(y*W+x)*4;
      for(var c=0;c<3;c++){ var v=5*src[o+c]-src[o-4+c]-src[o+4+c]-src[(o-W*4)+c]-src[(o+W*4)+c];
        a[o+c]=Math.max(0,Math.min(255, src[o+c]*(1-MIXS)+v*MIXS )); } } }
    cx.putImageData(d,0,0);
    var nt=new THREE.CanvasTexture(cv); nt.flipY=m.map.flipY; nt.encoding=m.map.encoding; nt.wrapS=m.map.wrapS; nt.wrapT=m.map.wrapT;
    var oldMap=m.map; m.map=nt; oldMap.dispose();
    var rc=document.createElement('canvas'); rc.width=W; rc.height=H; var rx=rc.getContext('2d');
    var rd=rx.createImageData(W,H), ra=rd.data, pinkMask=new Uint8Array(W*H);
    for(var j=0;j<a.length;j+=4){ var R=a[j],G=a[j+1],B=a[j+2];
      var rough=235;
      if(R>140&&R>B&&(R-G)>12&&B>90){ rough=150; pinkMask[j>>2]=1; }
      else if(R>110&&G<105&&(R-G)>55&&(R-B)>40) rough=72;
      ra[j]=rough; ra[j+1]=rough; ra[j+2]=rough; ra[j+3]=255; }
    rx.putImageData(rd,0,0);
    var rt=new THREE.CanvasTexture(rc); rt.flipY=nt.flipY; rt.wrapS=nt.wrapS; rt.wrapT=nt.wrapT;
    m.roughnessMap=rt; m.roughness=1.0;
    if(m.normalMap && m.normalMap.image){
      var nc=document.createElement('canvas'); nc.width=W; nc.height=H; var nx=nc.getContext('2d');
      nx.drawImage(m.normalMap.image,0,0,W,H);
      var nd; try{ nd=nx.getImageData(0,0,W,H); }catch(e){ nd=null; }
      if(nd){ var na=nd.data;
        for(var k=0;k<W*H;k++){ if(pinkMask[k]){ var o2=k*4, nz=(Math.random()-0.5)*20;
          na[o2]=Math.max(0,Math.min(255,na[o2]+nz)); na[o2+1]=Math.max(0,Math.min(255,na[o2+1]+nz*0.8)); } }
        nx.putImageData(nd,0,0);
        var nt2=new THREE.CanvasTexture(nc); nt2.flipY=m.normalMap.flipY; nt2.wrapS=m.normalMap.wrapS; nt2.wrapT=m.normalMap.wrapT;
        var oldN=m.normalMap; m.normalMap=nt2; oldN.dispose();
      }
    }
    m.envMapIntensity=1.0; m.needsUpdate=true;
  }

  var pivot=new THREE.Group(); scene.add(pivot);
  var YAW0=2.72, targetYaw=YAW0, dist=8, topY=3.5, baseY=0.28;

  function frameCamera(){
    var w=innerWidth,h=innerHeight;
    renderer.setSize(w,h,false); camera.aspect=w/Math.max(h,1); camera.updateProjectionMatrix();
    var halfH=topY*0.86;
    /* Bring the camera in closer so the cone reads noticeably larger on the page. */
    dist=(halfH/Math.tan(camera.fov*0.5*Math.PI/180))*0.9;
    camera.position.set(0, topY*0.54, dist);
    camera.lookAt(0, topY*0.48, 0);
    /* Keep the one continuous cone whole, pushed a touch further right so the bigger
       scoop frames the content instead of covering it. */
    var halfW=Math.tan(camera.fov*0.5*Math.PI/180)*dist*camera.aspect;
    pivot.position.x=Math.min(halfW*0.72, 4.2);
    pivot.position.y=baseY;
  }

  function loadHDR(cb){
    if(!THREE.RGBELoader){ cb(); return; }
    new THREE.RGBELoader().setDataType(THREE.UnsignedByteType).load('lib/studio.hdr', function(hdr){
      scene.environment=pmrem.fromEquirectangular(hdr).texture; hdr.dispose(); cb();
    }, undefined, function(){ cb(); });
  }

  loadHDR(function(){
    new THREE.GLTFLoader().load('models/icecream-small.glb', function(gltf){
      var model=gltf.scene;
      model.traverse(function(o){ if(o.isMesh&&o.material) treatMaterial(o.material,1.38); });
      var box=new THREE.Box3().setFromObject(model), size=box.getSize(new THREE.Vector3()), center=box.getCenter(new THREE.Vector3());
      var s=2.55/Math.max(size.x,size.y,size.z);
      model.position.sub(center); model.scale.setScalar(s);
      var b2=new THREE.Box3().setFromObject(model); model.position.y-=b2.min.y;
      topY=b2.max.y-b2.min.y;
      pivot.add(model);
      frameCamera();
      canvas.classList.add('on');
      if(reduce){ pivot.rotation.y=YAW0; renderer.render(scene,camera); return; }   // static for reduced motion
      start();
    });
  });

  /* The cone rotates a gentle three-quarter turn as the page scrolls past it. */
  function onScroll(){
    var max=Math.max(1, document.documentElement.scrollHeight-innerHeight);
    targetYaw=YAW0 + (scrollY/max)*Math.PI*1.5;
  }
  if(!reduce){ addEventListener('scroll',onScroll,{passive:true}); onScroll(); }
  addEventListener('resize',frameCamera);

  var running=false,raf=0,t0=null;
  function frame(now){ if(!running)return;
    if(t0===null)t0=now; var t=(now-t0)/1000;
    pivot.rotation.y += (targetYaw-pivot.rotation.y)*0.07;          // eased scroll response
    pivot.position.y = baseY;
    renderer.render(scene,camera); raf=requestAnimationFrame(frame); }
  function start(){ if(running)return; running=true; raf=requestAnimationFrame(frame); }
  function stop(){ running=false; cancelAnimationFrame(raf); }
  document.addEventListener('visibilitychange',function(){ document.hidden?stop():start(); });
})();
