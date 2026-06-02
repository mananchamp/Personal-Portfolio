/**
 * MotionForge. // 3D Creative Developer
 * Core Interactive Client Script
 * Features:
 *   1. Three.js Hero Geometry Renders & Interactive Morphing
 *   2. Custom WebGL Fragment Shader Playground & Sliders
 *   3. 2D Interactive Particle Physics Sandbox (Project 3)
 *   4. Scroll Spy Navigation (Intersection Observer)
 *   5. Brutalist Contact Form & Interactive State Animations
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // -------------------------------------------------------------
  // 1. THREE.JS HERO GEOMETRY SHOWCASE
  // -------------------------------------------------------------
  let heroScene, heroCamera, heroRenderer, heroGroup;
  let currentGeoName = 'torusknot';
  let activeSolidMesh, activeWireframeMesh, activePoints;
  
  const canvasContainer = document.getElementById('hero-canvas-container');
  const fpsCounter = document.getElementById('fps-counter');
  
  let targetRotationX = 0;
  let targetRotationY = 0;
  let mouseX = 0;
  let mouseY = 0;
  
  // FPS Counter tracking
  let lastTime = performance.now();
  let frameCount = 0;
  
  function initHeroThreeJS() {
    if (typeof THREE === 'undefined') {
      console.warn('Three.js is not loaded. Skipping 3D renderer.');
      if (canvasContainer) {
        canvasContainer.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;font-size:12px;color:#1a1a1a;">[WebGL Failed to Load]</div>';
      }
      return;
    }
    
    // Scene setup
    heroScene = new THREE.Scene();
    
    // Camera
    const width = canvasContainer.clientWidth;
    const height = canvasContainer.clientHeight;
    heroCamera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    heroCamera.position.z = 6;
    
    // Renderer
    heroRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    heroRenderer.setSize(width, height);
    heroRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    heroRenderer.shadowMap.enabled = true;
    canvasContainer.appendChild(heroRenderer.domElement);
    
    // Group container for rotations
    heroGroup = new THREE.Group();
    heroScene.add(heroGroup);
    
    // Add lighting (High-contrast brutalist color setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    heroScene.add(ambientLight);
    
    // Main directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight.position.set(5, 5, 5);
    heroScene.add(dirLight);
    
    // Accent Point Lights (Pink and Yellow)
    const pinkLight = new THREE.PointLight(0xec4899, 1.8, 15);
    pinkLight.position.set(-3, 2, 2);
    heroScene.add(pinkLight);
    
    const yellowLight = new THREE.PointLight(0xfde047, 1.5, 15);
    yellowLight.position.set(3, -2, 2);
    heroScene.add(yellowLight);
    
    // Create base geometry
    createHeroMesh(currentGeoName);
    
    // Register events
    canvasContainer.addEventListener('mousemove', onHeroMouseMove);
    canvasContainer.addEventListener('mouseleave', onHeroMouseLeave);
    
    // Touch support
    canvasContainer.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = canvasContainer.getBoundingClientRect();
        mouseX = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouseY = -((touch.clientY - rect.top) / rect.height) * 2 + 1;
        targetRotationX = mouseX * Math.PI * 0.3;
        targetRotationY = mouseY * Math.PI * 0.3;
      }
    });
    
    // Resize Observer
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        const h = entry.contentRect.height;
        if (heroCamera && heroRenderer) {
          heroCamera.aspect = w / h;
          heroCamera.updateProjectionMatrix();
          heroRenderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(canvasContainer);
    
    // Start animation loop
    tickHero();
  }
  
  function getGeometry(name) {
    switch (name) {
      case 'icosahedron':
        return new THREE.IcosahedronGeometry(1.6, 1);
      case 'torusknot':
        return new THREE.TorusKnotGeometry(1.1, 0.3, 120, 16);
      case 'box':
        return new THREE.BoxGeometry(1.7, 1.7, 1.7, 4, 4, 4);
      case 'sphere':
        return new THREE.SphereGeometry(1.6, 24, 24);
      case 'torus':
        return new THREE.TorusGeometry(1.2, 0.45, 16, 100);
      case 'plane':
        // Cone represents a 3D prism for shader concepts
        return new THREE.ConeGeometry(1.4, 2.4, 4);
      default:
        return new THREE.TorusKnotGeometry(1.1, 0.3, 120, 16);
    }
  }
  
  function createHeroMesh(name) {
    // Clear previous if any
    if (activeSolidMesh) heroGroup.remove(activeSolidMesh);
    if (activeWireframeMesh) heroGroup.remove(activeWireframeMesh);
    if (activePoints) heroGroup.remove(activePoints);
    
    const geometry = getGeometry(name);
    
    // 1. Solid Shiny Inner Geometry (Dark Slate/Black)
    const solidMat = new THREE.MeshStandardMaterial({
      color: 0x18181b,
      roughness: 0.15,
      metalness: 0.9,
      flatShading: true
    });
    activeSolidMesh = new THREE.Mesh(geometry, solidMat);
    
    // 2. Outer Wireframe Outline (Neon Pink)
    const wireMat = new THREE.MeshBasicMaterial({
      color: 0xec4899,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    activeWireframeMesh = new THREE.Mesh(geometry, wireMat);
    activeWireframeMesh.scale.setScalar(1.005); // slightly larger to avoid Z-fighting
    
    // 3. Glowing Vertex Points (Neon Yellow)
    const pointsMat = new THREE.PointsMaterial({
      color: 0xfde047,
      size: 0.1,
      transparent: true,
      opacity: 0.9
    });
    activePoints = new THREE.Points(geometry, pointsMat);
    activePoints.scale.setScalar(1.008);
    
    // Add to group
    heroGroup.add(activeSolidMesh);
    heroGroup.add(activeWireframeMesh);
    heroGroup.add(activePoints);
    
    currentGeoName = name;
  }
  
  function morphGeometry(name) {
    if (!heroGroup) return;
    
    // Animate scale out -> Swap -> Bounce scale back in (simulates elastic motion)
    let scaleVal = 1;
    let morphingOut = true;
    
    function animateMorph() {
      if (morphingOut) {
        scaleVal -= 0.15;
        if (scaleVal <= 0.1) {
          scaleVal = 0.1;
          morphingOut = false;
          createHeroMesh(name); // Swap geometry
        }
      } else {
        scaleVal += 0.2;
        if (scaleVal >= 1.0) {
          scaleVal = 1.0;
          heroGroup.scale.setScalar(1);
          return; // Done
        }
      }
      
      heroGroup.scale.setScalar(scaleVal);
      requestAnimationFrame(animateMorph);
    }
    
    animateMorph();
  }
  
  function onHeroMouseMove(e) {
    const rect = canvasContainer.getBoundingClientRect();
    mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    
    // Set target rotation angles based on cursor offset
    targetRotationX = mouseX * Math.PI * 0.35;
    targetRotationY = mouseY * Math.PI * 0.35;
  }
  
  function onHeroMouseLeave() {
    targetRotationX = 0;
    targetRotationY = 0;
  }
  
  function tickHero() {
    requestAnimationFrame(tickHero);
    
    // Auto idle rotating
    const time = performance.now() * 0.0005;
    const idleRotX = Math.sin(time) * 0.25;
    const idleRotY = time * 0.4;
    
    // Smooth damping (lerp) towards target mouse rotation combined with idle drift
    heroGroup.rotation.x += ((targetRotationY + idleRotX) - heroGroup.rotation.x) * 0.08;
    heroGroup.rotation.y += ((targetRotationX + idleRotY) - heroGroup.rotation.y) * 0.08;
    
    // Render scene
    heroRenderer.render(heroScene, heroCamera);
    
    // Measure FPS
    frameCount++;
    const currentTime = performance.now();
    if (currentTime >= lastTime + 1000) {
      const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
      fpsCounter.innerText = `${fps} FPS`;
      frameCount = 0;
      lastTime = currentTime;
    }
  }
  
  // Hook up tech stack buttons to morph 3D shape
  const stackChips = document.querySelectorAll('.tech-chip-btn');
  stackChips.forEach(chip => {
    chip.addEventListener('click', (e) => {
      stackChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const targetMesh = chip.getAttribute('data-mesh');
      if (targetMesh && targetMesh !== currentGeoName) {
        morphGeometry(targetMesh);
      }
    });
  });
  
  
  // -------------------------------------------------------------
  // 2. WEBGL FRAGMENT SHADER PLAYGROUND
  // -------------------------------------------------------------
  const shaderCanvas = document.getElementById('shader-playground-canvas');
  const shaderParent = document.getElementById('shader-canvas-parent');
  const renderTimeDisplay = document.getElementById('render-time');
  
  // Sliders & value displays
  const controlSpeed = document.getElementById('control-speed');
  const valSpeed = document.getElementById('val-speed');
  const controlFreq = document.getElementById('control-freq');
  const valFreq = document.getElementById('val-freq');
  const controlHue = document.getElementById('control-hue');
  const valHue = document.getElementById('val-hue');
  
  let gl, shaderProgram, positionBuffer;
  let startTime = Date.now();
  let shaderSpeed = 1.0;
  let shaderFreq = 3.0;
  let shaderHue = 0.40;
  let activePreset = 'liquid';
  
  // GLSL Shader Sources
  const vsSource = `
    attribute vec2 position;
    void main() {
      gl_Position = vec4(position, 0.0, 1.0);
    }
  `;
  
  // Three shader fragment modes compiled dynamically
  const fsPresets = {
    liquid: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_frequency;
      uniform float u_hue;
      
      void main() {
        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        float t = u_time * u_speed * 0.4;
        
        float x = p.x * u_frequency;
        float y = p.y * u_frequency;
        
        float val0 = x + y + sin(t);
        float val1 = sin(x + t) + sin(y + t);
        float val2 = sin(sqrt(x*x + y*y) + t * 0.5);
        
        float sum = val0 + val1 + val2;
        
        // Colors
        float r = sin(sum + t) * 0.5 + 0.5;
        float g = sin(sum + t + 2.09) * 0.5 + 0.5;
        float b = sin(sum + t + 4.18) * 0.5 + 0.5;
        
        vec3 col = vec3(r, g, b);
        
        // Hue shift matrix
        float c = cos(u_hue * 6.28);
        float s = sin(u_hue * 6.28);
        vec3 k = vec3(0.577, 0.577, 0.577);
        col = col * c + cross(k, col) * s + k * dot(col, k) * (1.0 - c);
        
        // Boost contrast (Brutalist styling)
        col = smoothstep(0.15, 0.85, col);
        
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    aurora: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_frequency;
      uniform float u_hue;
      
      void main() {
        vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
        float t = u_time * u_speed * 0.8;
        
        // Compute neon sine waves
        float wave1 = sin(p.x * u_frequency + t) * 0.22;
        wave1 += cos(p.x * (u_frequency * 1.6) - t * 0.7) * 0.12;
        
        float dist1 = abs(p.y - wave1);
        float glow1 = 0.035 / (dist1 + 0.05);
        
        // Secondary opposing wave
        float wave2 = sin(p.x * (u_frequency * 0.8) - t * 1.1) * 0.18;
        float dist2 = abs(p.y - wave2 + 0.25);
        float glow2 = 0.025 / (dist2 + 0.04);
        
        // Mixing colors
        vec3 pink = vec3(0.92, 0.28, 0.6);
        vec3 lime = vec3(0.74, 0.95, 0.39);
        vec3 yellow = vec3(0.99, 0.88, 0.28);
        
        vec3 col1 = mix(pink, lime, p.x + 0.5) * glow1;
        vec3 col2 = yellow * glow2;
        
        vec3 finalCol = col1 + col2;
        
        // Applying color offset
        finalCol = mix(finalCol, finalCol.gbr, u_hue);
        
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `,
    grid: `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      uniform float u_speed;
      uniform float u_frequency;
      uniform float u_hue;
      
      void main() {
        vec2 p = gl_FragCoord.xy / u_resolution.xy;
        float t = u_time * u_speed;
        
        // Grid setup
        vec2 grid = fract(p * u_frequency);
        vec2 gridId = floor(p * u_frequency);
        
        float dist = length(grid - 0.5);
        float size = 0.15 + 0.2 * sin(gridId.x * 1.5 + gridId.y * 2.2 + t);
        
        float dotShape = smoothstep(size, size - 0.03, dist);
        
        // Neon color map
        vec3 p1 = vec3(0.92, 0.28, 0.6); // Pink
        vec3 p2 = vec3(0.99, 0.88, 0.28); // Yellow
        vec3 p3 = vec3(0.74, 0.95, 0.39); // Lime
        
        vec3 itemCol = mix(p1, p3, sin(gridId.x + t) * 0.5 + 0.5);
        itemCol = mix(itemCol, p2, cos(gridId.y - t) * 0.5 + 0.5);
        
        vec3 bgCol = vec3(0.08, 0.08, 0.08); // Dark gray base
        vec3 finalCol = mix(bgCol, itemCol, dotShape);
        
        // Hue mapping
        finalCol = mix(finalCol, finalCol.brg, u_hue);
        
        gl_FragColor = vec4(finalCol, 1.0);
      }
    `
  };
  
  function initShaderPlayground() {
    if (!shaderCanvas) return;
    
    gl = shaderCanvas.getContext('webgl');
    if (!gl) {
      console.warn('WebGL context not available on playground canvas.');
      shaderParent.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;font-family:monospace;font-size:12px;color:#ffffff;">[WebGL Context Unavailable]</div>';
      return;
    }
    
    // Fit canvas size
    resizeShaderCanvas();
    
    // Compile and link base shader
    compileProgram(activePreset);
    
    // Setup vertex positions (2 triangles for full quad)
    positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]), gl.STATIC_DRAW);
    
    // Resize Observer for shader card container
    const resizeObserver = new ResizeObserver(() => {
      resizeShaderCanvas();
    });
    resizeObserver.observe(shaderParent);
    
    // Set slider listeners
    controlSpeed.addEventListener('input', (e) => {
      shaderSpeed = parseFloat(e.target.value);
      valSpeed.innerText = shaderSpeed.toFixed(1);
    });
    
    controlFreq.addEventListener('input', (e) => {
      shaderFreq = parseFloat(e.target.value);
      valFreq.innerText = shaderFreq.toFixed(1);
    });
    
    controlHue.addEventListener('input', (e) => {
      shaderHue = parseFloat(e.target.value);
      valHue.innerText = shaderHue.toFixed(2);
    });
    
    // Preset buttons
    const presetBtns = document.querySelectorAll('.shader-preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const preset = btn.getAttribute('data-preset');
        applyPreset(preset);
      });
    });
    
    // Run shader loop
    tickShader();
  }
  
  function resizeShaderCanvas() {
    if (!shaderCanvas || !gl) return;
    const w = shaderParent.clientWidth;
    const h = shaderParent.clientHeight;
    shaderCanvas.width = w;
    shaderCanvas.height = h;
    gl.viewport(0, 0, w, h);
  }
  
  function compileShader(source, type) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }
  
  function compileProgram(presetKey) {
    if (!gl) return;
    
    const vs = compileShader(vsSource, gl.VERTEX_SHADER);
    const fs = compileShader(fsPresets[presetKey], gl.FRAGMENT_SHADER);
    
    if (!vs || !fs) return;
    
    const program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('WebGL linking failed:', gl.getProgramInfoLog(program));
      return;
    }
    
    shaderProgram = program;
    activePreset = presetKey;
  }
  
  function applyPreset(presetName) {
    compileProgram(presetName);
    
    // Load default slider configurations for preset
    if (presetName === 'liquid') {
      controlSpeed.value = 1.0;
      controlFreq.value = 3.0;
      controlHue.value = 0.40;
    } else if (presetName === 'aurora') {
      controlSpeed.value = 1.5;
      controlFreq.value = 5.0;
      controlHue.value = 0.15;
    } else if (presetName === 'grid') {
      controlSpeed.value = 0.8;
      controlFreq.value = 8.0;
      controlHue.value = 0.70;
    }
    
    // Force inputs updates
    controlSpeed.dispatchEvent(new Event('input'));
    controlFreq.dispatchEvent(new Event('input'));
    controlHue.dispatchEvent(new Event('input'));
  }
  
  function tickShader() {
    if (!gl || !shaderProgram) {
      return; // Stop loop if WebGL is not supported or program failed to link
    }
    
    // Clear
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    
    gl.useProgram(shaderProgram);
    
    // Enable Position attribute
    const posAttr = gl.getAttribLocation(shaderProgram, 'position');
    gl.enableVertexAttribArray(posAttr);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);
    
    // Compute uniforms
    const timeSecs = (Date.now() - startTime) / 1000;
    renderTimeDisplay.innerText = `TIME: ${timeSecs.toFixed(2)}s`;
    
    // Uniform bindings
    const uTimeLoc = gl.getUniformLocation(shaderProgram, 'u_time');
    const uResLoc = gl.getUniformLocation(shaderProgram, 'u_resolution');
    const uSpeedLoc = gl.getUniformLocation(shaderProgram, 'u_speed');
    const uFreqLoc = gl.getUniformLocation(shaderProgram, 'u_frequency');
    const uHueLoc = gl.getUniformLocation(shaderProgram, 'u_hue');
    
    gl.uniform1f(uTimeLoc, timeSecs);
    gl.uniform2f(uResLoc, shaderCanvas.width, shaderCanvas.height);
    gl.uniform1f(uSpeedLoc, shaderSpeed);
    gl.uniform1f(uFreqLoc, shaderFreq);
    gl.uniform1f(uHueLoc, shaderHue);
    
    // Draw
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    requestAnimationFrame(tickShader);
  }
  
  
  // -------------------------------------------------------------
  // 3. 2D INTERACTIVE PARTICLE PHYSICS SANDBOX (Project 3)
  // -------------------------------------------------------------
  const particleCanvas = document.getElementById('particle-simulation-canvas');
  const particleParent = document.getElementById('particle-mockup-container');
  let particleCtx, particlesArray = [];
  let particleMouse = { x: null, y: null, radius: 120 };
  
  function initParticleSandbox() {
    if (!particleCanvas) return;
    
    particleCtx = particleCanvas.getContext('2d');
    resizeParticleCanvas();
    
    // Mouse tracking on container
    particleParent.addEventListener('mousemove', (e) => {
      const rect = particleCanvas.getBoundingClientRect();
      particleMouse.x = e.clientX - rect.left;
      particleMouse.y = e.clientY - rect.top;
    });
    
    particleParent.addEventListener('mouseleave', () => {
      particleMouse.x = null;
      particleMouse.y = null;
    });
    
    // Resize hook
    const resizeObserver = new ResizeObserver(() => {
      resizeParticleCanvas();
      spawnParticles();
    });
    resizeObserver.observe(particleParent);
    
    // Spawn baseline
    spawnParticles();
    
    // Start animation loop
    animateParticles();
  }
  
  function resizeParticleCanvas() {
    if (!particleCanvas) return;
    particleCanvas.width = particleParent.clientWidth;
    particleCanvas.height = particleParent.clientHeight;
  }
  
  class Particle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.vx = (Math.random() - 0.5) * 1.0;
      this.vy = (Math.random() - 0.5) * 1.0;
      this.size = Math.random() * 12 + 10; // larger sizes for puzzle blocks (10 to 22px)
      this.angle = Math.random() * Math.PI * 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.02;
      
      // Wooden block shapes
      const shapes = ['rect', 'triangle', 'circle', 'semicircle', 'pill'];
      this.shape = shapes[Math.floor(Math.random() * shapes.length)];
      
      // Warm wood colors + signature accents
      const colors = [
        '#d7a15c', // Oak
        '#a07044', // Teak
        '#e8c39e', // Maple
        '#fde047', // Portfolio Yellow
        '#ec4899', // Portfolio Pink
        '#FAF9F6'  // Cream
      ];
      this.color = colors[Math.floor(Math.random() * colors.length)];
      this.opacity = Math.random() * 0.4 + 0.6; // 60% to 100% opacity
    }
    
    draw() {
      particleCtx.save();
      particleCtx.translate(this.x, this.y);
      particleCtx.rotate(this.angle);
      
      // Set style
      particleCtx.fillStyle = this.color;
      particleCtx.globalAlpha = this.opacity;
      
      const s = this.size;
      particleCtx.beginPath();
      
      if (this.shape === 'rect') {
        // Draw a rectangle block
        particleCtx.rect(-s, -s / 2, s * 2, s);
        particleCtx.fill();
      } else if (this.shape === 'triangle') {
        // Draw a triangular wedge
        particleCtx.moveTo(-s, s);
        particleCtx.lineTo(s, s);
        particleCtx.lineTo(0, -s);
        particleCtx.closePath();
        particleCtx.fill();
      } else if (this.shape === 'circle') {
        // Draw a circular block
        particleCtx.arc(0, 0, s, 0, Math.PI * 2);
        particleCtx.fill();
      } else if (this.shape === 'semicircle') {
        // Draw a half-round piece
        particleCtx.arc(0, 0, s, 0, Math.PI, true);
        particleCtx.closePath();
        particleCtx.fill();
      } else if (this.shape === 'pill') {
        // Draw a rounded column
        const w = s * 2.2;
        const h = s * 0.8;
        const r = h / 2;
        particleCtx.moveTo(-w/2 + r, -h/2);
        particleCtx.lineTo(w/2 - r, -h/2);
        particleCtx.quadraticCurveTo(w/2, -h/2, w/2, -h/2 + r);
        particleCtx.lineTo(w/2, h/2 - r);
        particleCtx.quadraticCurveTo(w/2, h/2, w/2 - r, h/2);
        particleCtx.lineTo(-w/2 + r, h/2);
        particleCtx.quadraticCurveTo(-w/2, h/2, -w/2, h/2 - r);
        particleCtx.lineTo(-w/2, -h/2 + r);
        particleCtx.quadraticCurveTo(-w/2, -h/2, -w/2 + r, -h/2);
        particleCtx.closePath();
        particleCtx.fill();
      }
      
      particleCtx.restore();
    }
    
    update() {
      // Mouse repulsion interaction (push away gently)
      if (particleMouse.x !== null && particleMouse.y !== null) {
        const dx = this.x - particleMouse.x;
        const dy = this.y - particleMouse.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < particleMouse.radius) {
          const force = (particleMouse.radius - dist) / particleMouse.radius;
          this.vx += (dx / dist) * force * 0.15;
          this.vy += (dy / dist) * force * 0.15;
        }
      }
      
      // Damp velocities slightly to prevent runaway speeds
      this.vx *= 0.96;
      this.vy *= 0.96;
      
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.rotationSpeed;
      
      // Bounce boundaries with shape offset margin
      const margin = this.size * 2;
      if (this.x < margin) {
        this.x = margin;
        this.vx *= -1;
      } else if (this.x > particleCanvas.width - margin) {
        this.x = particleCanvas.width - margin;
        this.vx *= -1;
      }
      
      if (this.y < margin) {
        this.y = margin;
        this.vy *= -1;
      } else if (this.y > particleCanvas.height - margin) {
        this.y = particleCanvas.height - margin;
        this.vy *= -1;
      }
    }
  }
  
  function spawnParticles() {
    particlesArray = [];
    const particleCount = Math.floor((particleCanvas.width * particleCanvas.height) / 12000);
    const count = Math.min(Math.max(particleCount, 15), 45);
    
    for (let i = 0; i < count; i++) {
      const x = Math.random() * particleCanvas.width;
      const y = Math.random() * particleCanvas.height;
      particlesArray.push(new Particle(x, y));
    }
  }
  
  function animateParticles() {
    if (!particleCtx || !particleCanvas) return;
    
    // Clear overlay with soft decay trail
    particleCtx.fillStyle = 'rgba(15, 23, 42, 0.18)'; // #0f172a
    particleCtx.fillRect(0, 0, particleCanvas.width, particleCanvas.height);
    
    // Update & draw blocks
    for (let i = 0; i < particlesArray.length; i++) {
      particlesArray[i].update();
      particlesArray[i].draw();
    }
    
    // Draw connection lines
    drawParticleLines();
    
    requestAnimationFrame(animateParticles);
  }
  
  function drawParticleLines() {
    const maxLinkDist = 95;
    particleCtx.save();
    particleCtx.setLineDash([2, 4]); // Dashed drafting/blueprint style guidelines
    for (let i = 0; i < particlesArray.length; i++) {
      for (let j = i + 1; j < particlesArray.length; j++) {
        const dx = particlesArray[i].x - particlesArray[j].x;
        const dy = particlesArray[i].y - particlesArray[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist < maxLinkDist) {
          const alpha = (maxLinkDist - dist) / maxLinkDist;
          particleCtx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.1})`;
          particleCtx.lineWidth = 0.8;
          particleCtx.beginPath();
          particleCtx.moveTo(particlesArray[i].x, particlesArray[i].y);
          particleCtx.lineTo(particlesArray[j].x, particlesArray[j].y);
          particleCtx.stroke();
        }
      }
    }
    particleCtx.restore();
  }
  
  
  // -------------------------------------------------------------
  // 4. SCROLL SPY NAVIGATION (Intersection Observer)
  // -------------------------------------------------------------
  const sections = document.querySelectorAll('.section-group');
  const navLinks = document.querySelectorAll('.nav-link');
  
  function initScrollSpy() {
    if (sections.length === 0 || navLinks.length === 0) return;
    
    const observerOptions = {
      root: null, // viewport
      rootMargin: '-30% 0px -60% 0px', // focus window on center screen
      threshold: 0
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const sectionId = entry.target.getAttribute('id');
          updateActiveNavLink(sectionId);
        }
      });
    }, observerOptions);
    
    sections.forEach(section => observer.observe(section));
  }
  
  function updateActiveNavLink(activeId) {
    navLinks.forEach(link => {
      link.classList.remove('active');
      const href = link.getAttribute('href').substring(1);
      if (href === activeId) {
        link.classList.add('active');
      }
    });
  }
  
  // Smooth scroll hijack for sidebar anchor navigation
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href');
      const targetSection = document.querySelector(targetId);
      if (targetSection) {
        // Scroll into view smoothly
        targetSection.scrollIntoView({ behavior: 'smooth' });
        
        // URL hash change without reload
        history.pushState(null, null, targetId);
      }
    });
  });
  // -------------------------------------------------------------
  // 5. PRICING TABS CONTROLLER
  // -------------------------------------------------------------
  function initPricingTabs() {
    const tabBtns = document.querySelectorAll('.pricing-tab-btn');
    const tabPanes = document.querySelectorAll('.pricing-tab-content');
    
    if (tabBtns.length === 0) return;
    
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Remove active class from all buttons and panes
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));
        
        // Add active to current button
        btn.classList.add('active');
        
        // Add active to matching content pane
        const targetTab = btn.getAttribute('data-tab');
        const targetPane = document.getElementById(`pane-${targetTab}`);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }
  
  
  // -------------------------------------------------------------
  // INITIALIZER BOOTSTRAPPER
  // -------------------------------------------------------------
  initHeroThreeJS();
  initShaderPlayground();
  initParticleSandbox();
  initScrollSpy();
  initPricingTabs();
  
});
