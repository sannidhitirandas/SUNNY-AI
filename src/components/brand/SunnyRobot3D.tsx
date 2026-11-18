import React, { useEffect, useRef } from 'react';

interface SunnyRobot3DProps {
  className?: string;
  compact?: boolean;
}

/**
 * Shared Three.js Sunny companion. The scene is built from procedural geometry
 * and a generated face texture; no model or image assets are required.
 */
export const SunnyRobot3D: React.FC<SunnyRobot3DProps> = ({
  className = '',
  compact = false,
}) => {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let disposed = false;
    let renderer: any;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let cleanup: (() => void) | undefined;

    const boot = async () => {
      try {
        // The import map in index.html pins Three.js and its addons to r160.
        const threeName = 'three';
        const roundedName = 'three/addons/geometries/RoundedBoxGeometry.js';
        const environmentName = 'three/addons/environments/RoomEnvironment.js';
        const [THREE, roundedModule, environmentModule] = await Promise.all([
          import(/* @vite-ignore */ threeName),
          import(/* @vite-ignore */ roundedName),
          import(/* @vite-ignore */ environmentName),
        ]);
        if (disposed || !host) return;

        const RoundedBoxGeometry = roundedModule.RoundedBoxGeometry;
        const RoomEnvironment = environmentModule.RoomEnvironment;
        const scene = new THREE.Scene();
        scene.background = null;

        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
        camera.position.set(0, compact ? 0.2 : 0.35, compact ? 7.7 : 8.4);
        camera.lookAt(0, compact ? 0.05 : 0.12, 0);

        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setSize(host.clientWidth || 1, host.clientHeight || 1);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.05;
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.domElement.setAttribute('aria-hidden', 'true');
        renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;outline:none;';
        host.appendChild(renderer.domElement);
        host.classList.add('sunny-robot-ready');

        const pmrem = new THREE.PMREMGenerator(renderer);
        const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        scene.environment = environment;
        scene.environmentIntensity = 0.9;

        scene.add(new THREE.HemisphereLight(0xfdf4ff, 0x3b1768, 0.9));
        const key = new THREE.DirectionalLight(0xfff6ff, 2.0);
        key.position.set(-3.5, 5.5, 4.5);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.camera.near = 0.5;
        key.shadow.camera.far = 18;
        key.shadow.bias = -0.0005;
        key.shadow.radius = 4;
        key.shadow.normalBias = 0.02;
        scene.add(key);
        const rim = new THREE.DirectionalLight(0xf0abfc, 1.5);
        rim.position.set(4, 2.5, -4);
        scene.add(rim);
        const warm = new THREE.PointLight(0xe879f9, 1.6, 9);
        warm.position.set(-3, 1.2, 1.5);
        scene.add(warm);
        const fill = new THREE.PointLight(0x8b5cf6, 1.4, 9);
        fill.position.set(3.2, -0.6, 2.2);
        scene.add(fill);

        const shell = new THREE.MeshPhysicalMaterial({
          color: 0xeeebf2, roughness: 0.38, metalness: 0.02,
          clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 1,
        });
        const shellLight = new THREE.MeshPhysicalMaterial({
          color: 0xf8f6fc, roughness: 0.34, metalness: 0.02,
          clearcoat: 0.45, clearcoatRoughness: 0.3, envMapIntensity: 1.05,
        });
        const dark = new THREE.MeshStandardMaterial({ color: 0x211936, roughness: 0.48, metalness: 0.24 });
        const deep = new THREE.MeshPhysicalMaterial({ color: 0x100b1e, roughness: 0.16, metalness: 0.12, clearcoat: 1 });
        const gold = new THREE.MeshStandardMaterial({ color: 0xffd84d, roughness: 0.3, metalness: 0.18, emissive: 0x8a6100, emissiveIntensity: 0.3 });
        const purpleGlow = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.3, metalness: 0.12, emissive: 0x6d28d9, emissiveIntensity: 0.5 });

        const rounded = (w: number, h: number, d: number, r: number, material: any) => {
          const mesh = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 12, r), material);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          return mesh;
        };
        const sphere = (radius: number, material: any, segments = 48) => {
          const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), material);
          mesh.castShadow = true;
          return mesh;
        };

        // Pedestal and soft ground shadow.
        const pedestal = rounded(1.95, 0.34, 1.75, 0.12, new THREE.MeshStandardMaterial({ color: 0x292333, roughness: 0.82 }));
        pedestal.position.y = -1.82;
        scene.add(pedestal);
        const pedestalTop = rounded(1.76, 0.055, 1.58, 0.025, purpleGlow);
        pedestalTop.position.y = -1.62;
        scene.add(pedestalTop);


        const robot = new THREE.Group();
        scene.add(robot);

        // Legs, ankles and feet.
        for (const side of [-1, 1]) {
          const leg = rounded(0.38, 0.78, 0.42, 0.13, shell);
          leg.position.set(side * 0.34, -1.02, 0);
          robot.add(leg);
          const ankle = sphere(0.17, dark);
          ankle.scale.set(1, 0.75, 1);
          ankle.position.set(side * 0.34, -1.47, 0.04);
          robot.add(ankle);
          const foot = rounded(0.55, 0.22, 0.72, 0.09, shellLight);
          foot.position.set(side * 0.36, -1.58, 0.16);
          robot.add(foot);
        }

        // Torso and chest details.
        const torso = rounded(1.25, 1.05, 0.82, 0.22, shell);
        torso.position.set(0, -0.05, 0);
        robot.add(torso);
        const chest = rounded(0.88, 0.2, 0.16, 0.07, shellLight);
        chest.position.set(0, 0.38, 0.43);
        robot.add(chest);
        const chestPanel = rounded(0.54, 0.38, 0.045, 0.08, dark);
        chestPanel.position.set(0, 0.02, 0.43);
        robot.add(chestPanel);
        [-0.16, 0, 0.16].forEach((x, index) => {
          const led = sphere(0.045, index === 0 ? purpleGlow : gold, 16);
          led.position.set(x, 0.1, 0.47);
          robot.add(led);
        });
        const belt = rounded(0.76, 0.16, 0.72, 0.06, dark);
        belt.position.set(0, -0.57, 0);
        robot.add(belt);

        // Articulated arms.
        const arms: any[] = [];
        for (const side of [-1, 1]) {
          const shoulder = sphere(0.22, dark);
          shoulder.position.set(side * 0.72, 0.34, 0);
          robot.add(shoulder);
          const arm = new THREE.Group();
          arm.position.set(side * 0.77, 0.26, 0);
          const upper = rounded(0.32, 0.63, 0.34, 0.12, shell);
          upper.position.y = -0.3;
          upper.rotation.z = side * -0.13;
          arm.add(upper);
          const elbow = sphere(0.16, dark);
          elbow.position.set(side * 0.04, -0.64, 0.02);
          arm.add(elbow);
          const forearm = rounded(0.34, 0.54, 0.36, 0.12, shellLight);
          forearm.position.set(side * 0.07, -0.98, 0.03);
          forearm.rotation.z = side * 0.12;
          arm.add(forearm);
          const hand = rounded(0.38, 0.28, 0.35, 0.11, shell);
          hand.position.set(side * 0.08, -1.34, 0.08);
          arm.add(hand);
          const thumb = sphere(0.105, shellLight);
          thumb.position.set(-side * 0.13, -1.31, 0.19);
          arm.add(thumb);
          arm.rotation.z = side * 0.12;
          robot.add(arm);
          arms.push({ arm, side });
        }

        // Head pivot with a subtle initial tilt.
        const headPivot = new THREE.Group();
        headPivot.position.set(0, 0.63, 0);
        headPivot.rotation.set(0.09, -0.18, 0.17);
        robot.add(headPivot);
        const skull = rounded(1.56, 1.34, 1.12, 0.22, shellLight);
        skull.position.set(0, 0.28, 0);
        headPivot.add(skull);
        const back = rounded(1.32, 1.12, 0.82, 0.16, shell);
        back.position.set(0, 0.28, -0.49);
        headPivot.add(back);

        // Gradient ring generated at runtime.
        const ringCanvas = document.createElement('canvas');
        ringCanvas.width = 512;
        ringCanvas.height = 512;
        const ringCtx = ringCanvas.getContext('2d');
        if (ringCtx) {
          const gradient = ringCtx.createConicGradient(3.5, 256, 256);
          gradient.addColorStop(0, '#D946EF');
          gradient.addColorStop(0.2, '#8B2BE2');
          gradient.addColorStop(0.4, '#F472B6');
          gradient.addColorStop(0.6, '#A78BFA');
          gradient.addColorStop(0.8, '#E879F9');
          gradient.addColorStop(1, '#D946EF');
          ringCtx.fillStyle = gradient;
          ringCtx.fillRect(0, 0, 512, 512);
        }
        const ringTexture = new THREE.CanvasTexture(ringCanvas);
        ringTexture.colorSpace = THREE.SRGBColorSpace;
        const ringMaterial = new THREE.MeshPhysicalMaterial({
          map: ringTexture, emissiveMap: ringTexture, emissive: 0xffffff,
          emissiveIntensity: 0.18, roughness: 0.32, clearcoat: 0.65,
        });
        const faceRing = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.075, 32, 180), ringMaterial);
        faceRing.position.set(0, 0.28, 0.61);
        headPivot.add(faceRing);

        const bezel = new THREE.Mesh(new THREE.TorusGeometry(0.615, 0.045, 24, 160), shell);
        bezel.position.set(0, 0.28, 0.625);
        headPivot.add(bezel);

        // Face is a generated canvas texture so blinking never needs image assets.
        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = 1024;
        faceCanvas.height = 768;
        const faceCtx = faceCanvas.getContext('2d');
        const faceTexture = new THREE.CanvasTexture(faceCanvas);
        faceTexture.colorSpace = THREE.SRGBColorSpace;
        faceTexture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        const drawFace = (blink = 1) => {
          if (!faceCtx) return;
          faceCtx.setTransform(2, 0, 0, 2, 0, 0);
          faceCtx.clearRect(0, 0, 512, 384);
          faceCtx.fillStyle = '#100b1e';
          faceCtx.beginPath();
          faceCtx.roundRect(12, 12, 488, 360, 78);
          faceCtx.fill();
          faceCtx.shadowColor = '#F0ABFC';
          faceCtx.shadowBlur = 30;
          faceCtx.fillStyle = '#ffffff';
          faceCtx.beginPath();
          faceCtx.ellipse(174, 184, 30, Math.max(3, 43 * blink), 0, 0, Math.PI * 2);
          faceCtx.ellipse(338, 184, 30, Math.max(3, 43 * blink), 0, 0, Math.PI * 2);
          faceCtx.fill();
          faceCtx.shadowBlur = 0;
          faceCtx.strokeStyle = '#F0ABFC';
          faceCtx.lineWidth = 11;
          faceCtx.lineCap = 'round';
          faceCtx.beginPath();
          faceCtx.arc(256, 225, 44, 0.25, Math.PI - 0.25);
          faceCtx.stroke();
          faceTexture.needsUpdate = true;
        };
        drawFace();
        const face = new THREE.Mesh(
          new RoundedBoxGeometry(1.08, 0.83, 0.045, 12, 0.14),
          new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: faceTexture, emissive: 0xffffff, emissiveMap: faceTexture, emissiveIntensity: 1.25, roughness: 0.18, clearcoat: 1, toneMapped: false }),
        );
        face.position.set(0, 0.28, 0.64);
        headPivot.add(face);

        // Side ear pods and small gold status caps.
        for (const side of [-1, 1]) {
          const ear = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.18, 64), shell);
          ear.rotation.z = Math.PI / 2;
          ear.position.set(side * 0.83, 0.28, 0);
          ear.castShadow = true;
          headPivot.add(ear);
          const cap = sphere(0.12, gold);
          cap.position.set(side * 0.93, 0.28, 0);
          headPivot.add(cap);
        }
        const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.23, 32), dark);
        antenna.position.set(0, 1.02, 0);
        headPivot.add(antenna);
        const antennaTip = sphere(0.105, gold);
        antennaTip.position.set(0, 1.15, 0);
        headPivot.add(antennaTip);


        const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
        const onPointer = (event: PointerEvent) => {
          const rect = host!.getBoundingClientRect();
          pointer.tx = ((event.clientX - rect.left) / Math.max(rect.width, 1) - 0.5) * 2;
          pointer.ty = ((event.clientY - rect.top) / Math.max(rect.height, 1) - 0.5) * 2;
        };
        const onLeave = () => { pointer.tx = 0; pointer.ty = 0; };
        host.addEventListener('pointermove', onPointer);
        host.addEventListener('pointerleave', onLeave);

        const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        let nextBlink = 2.8 + Math.random() * 2.5;
        let blinkStarted = -1;
        const clock = new THREE.Clock();
        let elapsed = 0;
        let visible = true;
        const visibilityObserver = typeof IntersectionObserver !== 'undefined'
          ? new IntersectionObserver((entries) => { visible = entries.some((entry) => entry.isIntersecting); })
          : undefined;
        visibilityObserver?.observe(host);

        const render = () => {
          if (disposed) return;
          frame = requestAnimationFrame(render);
          const delta = Math.min(clock.getDelta(), 0.05);
          if (!visible || document.hidden) return;
          elapsed += delta;
          const smooth = 1 - Math.exp(-delta * 4.5);
          pointer.x += (pointer.tx - pointer.x) * smooth;
          pointer.y += (pointer.ty - pointer.y) * smooth;
          const pulse = 0.5 + 0.5 * Math.sin(elapsed * 2.2);
          gold.emissiveIntensity = 0.25 + pulse * 0.45;

          if (!reducedMotion) {
            robot.position.y = Math.sin(elapsed * 1.35) * 0.035;
            robot.rotation.y = -0.12 + pointer.x * 0.14 + Math.sin(elapsed * 0.42) * 0.035;
            headPivot.rotation.y = -0.18 + pointer.x * 0.28;
            headPivot.rotation.x = 0.09 - pointer.y * 0.11 + Math.sin(elapsed * 0.8) * 0.018;
            headPivot.rotation.z = 0.17 + Math.sin(elapsed * 0.65) * 0.018;
            arms.forEach(({ arm, side }) => {
              arm.rotation.z = side * (0.12 + Math.sin(elapsed * 1.35 + side) * 0.03);
              arm.rotation.x = Math.sin(elapsed * 1.1 + side) * 0.025;
            });
            camera.position.x += (pointer.x * 0.18 - camera.position.x) * smooth * 0.6;
            camera.position.y += ((compact ? 0.2 : 0.35) - pointer.y * 0.08 - camera.position.y) * smooth * 0.6;
            if (elapsed > nextBlink && blinkStarted < 0) blinkStarted = elapsed;
            if (blinkStarted >= 0) {
              const progress = (elapsed - blinkStarted) / 0.18;
              const blink = progress < 0.5 ? 1 - progress * 1.8 : Math.min(1, (progress - 0.5) * 1.8);
              drawFace(Math.max(0.08, blink));
              if (progress >= 1) {
                blinkStarted = -1;
                nextBlink = elapsed + 2.8 + Math.random() * 2.7;
                drawFace();
              }
            }
          }
          renderer.render(scene, camera);
        };

        const resize = () => {
          if (!host || !renderer) return;
          const width = Math.max(host.clientWidth, 1);
          const height = Math.max(host.clientHeight, 1);
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
        };
        resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(host);
        resize();
        render();

        cleanup = () => {
          cancelAnimationFrame(frame);
          host.removeEventListener('pointermove', onPointer);
          host.removeEventListener('pointerleave', onLeave);
          resizeObserver?.disconnect();
          visibilityObserver?.disconnect();
          scene.traverse((object: any) => {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
              const materials = Array.isArray(object.material) ? object.material : [object.material];
              materials.forEach((material: any) => {
                Object.values(material).forEach((value: any) => {
                  if (value && typeof value.dispose === 'function') value.dispose();
                });
                material.dispose();
              });
            }
          });
          ringTexture.dispose();
          faceTexture.dispose();
          environment.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };
      } catch (error) {
        console.error('[SunnyRobot3D] Could not initialize the 3D companion:', error);
        host?.classList.remove('sunny-robot-ready');
        host?.classList.add('sunny-robot-fallback');
      }
    };

    void boot();
    return () => {
      disposed = true;
      cleanup?.();
      if (renderer && host.contains(renderer.domElement)) renderer.domElement.remove();
    };
  }, [compact]);

  return (
    <>
    <style>{`
      .sunny-robot-3d { position:relative; min-width:0; min-height:0; overflow:visible; }
      .sunny-robot-3d-fallback { position:absolute; inset:0; display:grid; place-items:center; color:#D946EF; font-size:2.5rem; pointer-events:none; }
      .sunny-robot-ready .sunny-robot-3d-fallback { display:none; }
      .sunny-robot-fallback .sunny-robot-3d-fallback { display:grid; }
      @media(prefers-reduced-motion:reduce) { .sunny-robot-3d canvas { animation:none; } }
    `}</style>
    <div
      ref={hostRef}
      className={`sunny-robot-3d ${compact ? 'sunny-robot-3d-compact' : ''} ${className}`}
      role="img"
      aria-label="Sunny, a friendly 3D robot with a glowing face and purple and pink details"
    >
      <span className="sunny-robot-3d-fallback" aria-hidden="true">✦</span>
    </div>
    </>
  );
};
