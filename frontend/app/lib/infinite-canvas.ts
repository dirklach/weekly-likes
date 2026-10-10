// Infinite 3D image canvas, ported to plain three.js from Codrops' "Infinite Canvas"
// (https://github.com/edoardolunardi/infinite-canvas, MIT).
//
// Space is cut into cubic chunks; each chunk gets a few image planes at seeded-random
// positions, so revisiting a place shows the same images. Only chunks around the camera
// exist, and planes fade out by chunk distance and depth (plus fog). Planes coming close to
// the camera blur out on purpose and swap to a sharper texture on the way in.
import * as THREE from "three";

export type CanvasItem = {
  src: string;
  /** Higher resolution, loaded only while the plane is close. */
  srcLarge: string;
  width: number;
  height: number;
  href: string;
};

const CHUNK_SIZE = 110;
const ITEMS_PER_CHUNK = 5;
const RENDER_DISTANCE = 2;
const CHUNK_FADE_MARGIN = 1;
const MAX_VELOCITY = 3.2;
const DEPTH_FADE_START = 140;
const DEPTH_FADE_END = 260;
const INVIS_THRESHOLD = 0.01;
const KEYBOARD_SPEED = 0.18;
const VELOCITY_LERP = 0.16;
const VELOCITY_DECAY = 0.9;
const INITIAL_CAMERA_Z = 50;
const CLICK_TOLERANCE = 6;
// Blur ramps up from BLUR_START units in front of the camera to full strength at BLUR_FULL.
const BLUR_START = 35;
const BLUR_FULL = 8;
const MAX_BLUR_LOD = 5.0;
const MAX_BLUR_RADIUS = 0.08;
// Sharper textures only where planes are both big and in focus: loaded between HIRES_NEAR
// and HIRES_FAR in front of the camera, released outside the wider RELEASE band (closer
// planes are blurred anyway).
const HIRES_NEAR = 12;
const HIRES_FAR = 100;
const HIRES_RELEASE_NEAR = 8;
const HIRES_RELEASE_FAR = 150;

// Golden-angle spiral taps on a coarser mip level: a cheap, smooth blur without extra
// render passes.
const BLUR_TAPS = Array.from({ length: 24 }, (_, i) => {
  const r = Math.sqrt((i + 0.5) / 24);
  const a = i * 2.39996;
  return [+(r * Math.cos(a)).toFixed(4), +(r * Math.sin(a)).toFixed(4)];
});
const BLUR_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec4 sampledDiffuseColor;
  if (uBlur < 0.001) {
    sampledDiffuseColor = texture2D(map, vMapUv);
  } else {
    float lod = uBlur * ${MAX_BLUR_LOD.toFixed(1)};
    vec2 radius = uBlur * ${MAX_BLUR_RADIUS.toFixed(3)} * vec2(1.0 / uAspect, 1.0);
    // Rotate the spiral per pixel so the taps don't show up as ghost copies.
    float angle = 6.2831853 * fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    sampledDiffuseColor = vec4(0.0);
    ${BLUR_TAPS.map(([x, y]) => `sampledDiffuseColor += texture2D(map, vMapUv + rotation * vec2(${x}, ${y}) * radius, lod);`).join("\n    ")}
    sampledDiffuseColor /= ${BLUR_TAPS.length.toFixed(1)};
    // Soft edges, so a blurred plane doesn't keep a crisp rectangular outline.
    vec2 edge = vec2(uBlur * 0.14 / uAspect, uBlur * 0.14);
    vec2 fade = smoothstep(vec2(0.0), edge, vMapUv) * smoothstep(vec2(0.0), edge, 1.0 - vMapUv);
    sampledDiffuseColor.a *= fade.x * fade.y;
  }
  diffuseColor *= sampledDiffuseColor;
#endif
`;

const CHUNK_OFFSETS = (() => {
  const max = RENDER_DISTANCE + CHUNK_FADE_MARGIN;
  const offsets: { dx: number; dy: number; dz: number }[] = [];
  for (let dx = -max; dx <= max; dx++)
    for (let dy = -max; dy <= max; dy++)
      for (let dz = -max; dz <= max; dz++) offsets.push({ dx, dy, dz });
  return offsets;
})();

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

type Plane = {
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  item: CanvasItem;
  opacity: number;
  ready: boolean;
  blur: { value: number };
  large: "none" | "loading" | "shown";
};

type Chunk = { cx: number; cy: number; cz: number; planes: Plane[] };

export function createInfiniteCanvas(
  container: HTMLElement,
  items: CanvasItem[],
  options: {
    background: string;
    onNavigate: (href: string) => void;
  },
) {
  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const renderer = new THREE.WebGLRenderer({
    antialias: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, isTouch ? 1.25 : 1.5),
  );
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);
  const canvas = renderer.domElement;
  canvas.style.cursor = "grab";
  canvas.style.touchAction = "none";

  const scene = new THREE.Scene();
  const background = new THREE.Color(options.background);
  scene.background = background;
  scene.fog = new THREE.Fog(background, 120, 320);

  const camera = new THREE.PerspectiveCamera(60, 1, 1, 500);
  camera.position.set(0, 0, INITIAL_CAMERA_Z);

  const geometry = new THREE.PlaneGeometry(1, 1);
  const loader = new THREE.TextureLoader();
  const textures = new Map<
    string,
    { texture: THREE.Texture; loaded: boolean; waiting: Set<() => void> }
  >();

  function getTexture(src: string, onLoad: () => void) {
    let entry = textures.get(src);
    if (!entry) {
      const waiting = new Set<() => void>();
      const texture = loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        entry!.loaded = true;
        entry!.waiting.forEach((cb) => cb());
        entry!.waiting.clear();
      });
      entry = { texture, loaded: false, waiting };
      textures.set(src, entry);
    }
    if (entry.loaded) onLoad();
    else entry.waiting.add(onLoad);
    return entry.texture;
  }

  // Large textures are shared by every plane showing the same pick and freed (GPU memory)
  // once no plane near the camera needs them.
  const largeTextures = new Map<
    string,
    { texture: THREE.Texture; loaded: boolean; users: Set<Plane> }
  >();

  function acquireLarge(plane: Plane) {
    const src = plane.item.srcLarge;
    let entry = largeTextures.get(src);
    if (!entry) {
      const created = {
        texture: null as unknown as THREE.Texture,
        loaded: false,
        users: new Set<Plane>(),
      };
      created.texture = loader.load(src, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        created.loaded = true;
        for (const user of created.users) showLarge(user, tex);
      });
      largeTextures.set(src, created);
      entry = created;
    }
    entry.users.add(plane);
    plane.large = "loading";
    if (entry.loaded) showLarge(plane, entry.texture);
  }

  function showLarge(plane: Plane, texture: THREE.Texture) {
    if (plane.large !== "loading") return;
    plane.large = "shown";
    plane.mesh.material.map = texture;
  }

  function releaseLarge(plane: Plane) {
    if (plane.large === "none") return;
    plane.large = "none";
    plane.mesh.material.map = textures.get(plane.item.src)!.texture;
    const entry = largeTextures.get(plane.item.srcLarge);
    if (!entry) return;
    entry.users.delete(plane);
    if (entry.users.size) return;
    entry.texture.dispose();
    largeTextures.delete(plane.item.srcLarge);
  }

  const chunks = new Map<string, Chunk>();

  function createChunk(cx: number, cy: number, cz: number): Chunk {
    const seed = hashString(`${cx},${cy},${cz}`);
    const planes: Plane[] = [];
    for (let i = 0; i < ITEMS_PER_CHUNK; i++) {
      const r = (n: number) => seededRandom(seed + i * 1000 + n);
      const item = items[Math.floor(r(5) * 1_000_000) % items.length]!;
      const size = 12 + r(4) * 8;
      const material = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      const blur = { value: 0 };
      const aspect = { value: item.width / item.height };
      material.onBeforeCompile = (shader) => {
        shader.uniforms.uBlur = blur;
        shader.uniforms.uAspect = aspect;
        shader.fragmentShader = shader.fragmentShader
          .replace(
            "#include <common>",
            "#include <common>\nuniform float uBlur;\nuniform float uAspect;",
          )
          .replace("#include <map_fragment>", BLUR_FRAGMENT);
      };
      // Every plane runs the same shader; only the uniforms differ.
      material.customProgramCacheKey = () => "infinite-canvas-blur";
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        cx * CHUNK_SIZE + r(0) * CHUNK_SIZE,
        cy * CHUNK_SIZE + r(1) * CHUNK_SIZE,
        cz * CHUNK_SIZE + r(2) * CHUNK_SIZE,
      );
      mesh.scale.set(size * (item.width / item.height), size, 1);
      mesh.visible = false;

      const plane: Plane = {
        mesh,
        item,
        opacity: 0,
        ready: false,
        blur,
        large: "none",
      };
      material.map = getTexture(item.src, () => {
        plane.ready = true;
        material.needsUpdate = true;
      });
      scene.add(mesh);
      planes.push(plane);
    }
    return { cx, cy, cz, planes };
  }

  function disposeChunk(chunk: Chunk) {
    for (const plane of chunk.planes) {
      releaseLarge(plane);
      scene.remove(plane.mesh);
      plane.mesh.material.dispose();
    }
  }

  function syncChunks(cx: number, cy: number, cz: number) {
    const wanted = new Set<string>();
    for (const o of CHUNK_OFFSETS) {
      const key = `${cx + o.dx},${cy + o.dy},${cz + o.dz}`;
      wanted.add(key);
      if (!chunks.has(key))
        chunks.set(key, createChunk(cx + o.dx, cy + o.dy, cz + o.dz));
    }
    for (const [key, chunk] of chunks) {
      if (wanted.has(key)) continue;
      disposeChunk(chunk);
      chunks.delete(key);
    }
  }

  // Camera controller: drag pans, wheel/pinch flies forward and back, the mouse adds a
  // slight drift; everything eases through a target velocity.
  const s = {
    velocity: { x: 0, y: 0, z: 0 },
    targetVel: { x: 0, y: 0, z: 0 },
    basePos: { x: 0, y: 0, z: INITIAL_CAMERA_Z },
    drift: { x: 0, y: 0 },
    mouse: { x: 0, y: 0 },
    lastMouse: { x: 0, y: 0 },
    downAt: { x: 0, y: 0 },
    scrollAccum: 0,
    isDragging: false,
    lastTouches: [] as Touch[],
    lastTouchDist: 0,
    keys: new Set<string>(),
    chunkKey: "",
  };
  const camGrid = { cx: 0, cy: 0, cz: 0 };

  const frustum = new THREE.Frustum();
  const viewProjection = new THREE.Matrix4();

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  function planeAt(clientX: number, clientY: number) {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((clientX - rect.left) / rect.width) * 2 - 1,
      -((clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const visible: THREE.Object3D[] = [];
    const byMesh = new Map<THREE.Object3D, Plane>();
    for (const chunk of chunks.values()) {
      for (const plane of chunk.planes) {
        if (!plane.mesh.visible || plane.opacity < 0.5) continue;
        visible.push(plane.mesh);
        byMesh.set(plane.mesh, plane);
      }
    }
    const hit = raycaster.intersectObjects(visible, false)[0];
    return hit ? byMesh.get(hit.object) : undefined;
  }

  const touchDistance = (touches: Touch[]) => {
    if (touches.length < 2) return 0;
    const [a, b] = touches as [Touch, Touch];
    return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
  };

  const onMouseDown = (e: MouseEvent) => {
    s.isDragging = true;
    s.lastMouse = { x: e.clientX, y: e.clientY };
    s.downAt = { x: e.clientX, y: e.clientY };
    canvas.style.cursor = "grabbing";
  };
  const onMouseUp = (e: MouseEvent) => {
    if (!s.isDragging) return;
    s.isDragging = false;
    canvas.style.cursor = "grab";
    const moved = Math.hypot(e.clientX - s.downAt.x, e.clientY - s.downAt.y);
    if (moved < CLICK_TOLERANCE && e.target === canvas) {
      const plane = planeAt(e.clientX, e.clientY);
      if (plane) options.onNavigate(plane.item.href);
    }
  };
  const onMouseMove = (e: MouseEvent) => {
    s.mouse = {
      x: (e.clientX / window.innerWidth) * 2 - 1,
      y: -(e.clientY / window.innerHeight) * 2 + 1,
    };
    if (s.isDragging) {
      s.targetVel.x -= (e.clientX - s.lastMouse.x) * 0.025;
      s.targetVel.y += (e.clientY - s.lastMouse.y) * 0.025;
      s.lastMouse = { x: e.clientX, y: e.clientY };
    } else if (e.target === canvas) {
      canvas.style.cursor = planeAt(e.clientX, e.clientY) ? "pointer" : "grab";
    }
  };
  const onMouseLeave = () => {
    s.mouse = { x: 0, y: 0 };
    s.isDragging = false;
    canvas.style.cursor = "grab";
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    s.scrollAccum += e.deltaY * 0.006;
  };
  const onTouchStart = (e: TouchEvent) => {
    e.preventDefault();
    s.lastTouches = Array.from(e.touches);
    s.lastTouchDist = touchDistance(s.lastTouches);
    if (e.touches.length === 1) {
      s.downAt = { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY };
    }
  };
  const onTouchMove = (e: TouchEvent) => {
    e.preventDefault();
    const touches = Array.from(e.touches);
    const [touch] = touches;
    const [last] = s.lastTouches;
    if (touches.length === 1 && touch && last) {
      s.targetVel.x -= (touch.clientX - last.clientX) * 0.02;
      s.targetVel.y += (touch.clientY - last.clientY) * 0.02;
    } else if (touches.length === 2 && s.lastTouchDist > 0) {
      const dist = touchDistance(touches);
      s.scrollAccum += (s.lastTouchDist - dist) * 0.006;
      s.lastTouchDist = dist;
    }
    s.lastTouches = touches;
  };
  const onTouchEnd = (e: TouchEvent) => {
    const ended = e.changedTouches[0];
    if (e.touches.length === 0 && s.lastTouches.length === 1 && ended) {
      const moved = Math.hypot(
        ended.clientX - s.downAt.x,
        ended.clientY - s.downAt.y,
      );
      if (moved < CLICK_TOLERANCE) {
        const plane = planeAt(ended.clientX, ended.clientY);
        if (plane) options.onNavigate(plane.item.href);
      }
    }
    s.lastTouches = Array.from(e.touches);
    s.lastTouchDist = touchDistance(s.lastTouches);
  };
  // Arrow keys only; letters are taken by the metabar shortcuts.
  const ARROWS = ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
  const onKeyDown = (e: KeyboardEvent) => {
    if (!ARROWS.includes(e.key)) return;
    e.preventDefault();
    s.keys.add(e.key);
  };
  const onKeyUp = (e: KeyboardEvent) => s.keys.delete(e.key);

  canvas.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);
  canvas.addEventListener("mouseleave", onMouseLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.addEventListener("touchstart", onTouchStart, { passive: false });
  canvas.addEventListener("touchmove", onTouchMove, { passive: false });
  canvas.addEventListener("touchend", onTouchEnd, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);

  function resize() {
    const { clientWidth: w, clientHeight: h } = container;
    renderer.setSize(w, h, false);
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
  }
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  resize();

  function updatePlane(plane: Plane, chunk: Chunk) {
    const { mesh } = plane;
    const material = mesh.material;
    if (!plane.ready) return;

    const dist = Math.max(
      Math.abs(chunk.cx - camGrid.cx),
      Math.abs(chunk.cy - camGrid.cy),
      Math.abs(chunk.cz - camGrid.cz),
    );
    const depth = Math.abs(mesh.position.z - s.basePos.z);
    // Distance in front of the camera (negative once it has flown past).
    const ahead = s.basePos.z - mesh.position.z;
    if (depth > DEPTH_FADE_END + 50) {
      plane.opacity = 0;
      material.opacity = 0;
      mesh.visible = false;
      releaseLarge(plane);
      return;
    }

    if (
      plane.large === "none" &&
      ahead > HIRES_NEAR &&
      ahead < HIRES_FAR &&
      plane.opacity > 0.5 &&
      frustum.intersectsObject(mesh)
    ) {
      acquireLarge(plane);
    } else if (
      plane.large !== "none" &&
      (ahead < HIRES_RELEASE_NEAR || ahead > HIRES_RELEASE_FAR)
    ) {
      releaseLarge(plane);
    }

    const blurTarget = clamp((BLUR_START - ahead) / (BLUR_START - BLUR_FULL), 0, 1);
    plane.blur.value = lerp(plane.blur.value, blurTarget * blurTarget, 0.2);
    const gridFade =
      dist <= RENDER_DISTANCE
        ? 1
        : Math.max(0, 1 - (dist - RENDER_DISTANCE) / CHUNK_FADE_MARGIN);
    const depthFade =
      depth <= DEPTH_FADE_START
        ? 1
        : Math.max(
            0,
            1 - (depth - DEPTH_FADE_START) / (DEPTH_FADE_END - DEPTH_FADE_START),
          );
    const target = Math.min(gridFade, depthFade * depthFade);
    plane.opacity =
      target < INVIS_THRESHOLD && plane.opacity < INVIS_THRESHOLD
        ? 0
        : lerp(plane.opacity, target, 0.18);

    const opaque = plane.opacity > 0.99;
    material.opacity = opaque ? 1 : plane.opacity;
    // Blurred planes have soft, see-through edges, so they mustn't hide what's behind them.
    material.depthWrite = opaque && plane.blur.value < 0.001;
    mesh.visible = plane.opacity > INVIS_THRESHOLD;
  }

  let frame = 0;
  let lastChunkUpdate = 0;
  let pendingChunk: [number, number, number] | null = null;

  function tick(now: number) {
    frame = requestAnimationFrame(tick);

    if (s.keys.has("ArrowUp")) s.targetVel.z -= KEYBOARD_SPEED;
    if (s.keys.has("ArrowDown")) s.targetVel.z += KEYBOARD_SPEED;
    if (s.keys.has("ArrowLeft")) s.targetVel.x -= KEYBOARD_SPEED;
    if (s.keys.has("ArrowRight")) s.targetVel.x += KEYBOARD_SPEED;

    const isZooming = Math.abs(s.velocity.z) > 0.05;
    const zoomFactor = clamp(s.basePos.z / 50, 0.3, 2);
    const driftAmount = 8 * zoomFactor;
    const driftLerp = isZooming ? 0.2 : 0.12;
    if (!s.isDragging) {
      s.drift.x = lerp(s.drift.x, isTouch ? 0 : s.mouse.x * driftAmount, driftLerp);
      s.drift.y = lerp(s.drift.y, isTouch ? 0 : s.mouse.y * driftAmount, driftLerp);
    }

    s.targetVel.z += s.scrollAccum;
    s.scrollAccum *= 0.8;
    for (const axis of ["x", "y", "z"] as const) {
      s.targetVel[axis] = clamp(s.targetVel[axis], -MAX_VELOCITY, MAX_VELOCITY);
      s.velocity[axis] = lerp(s.velocity[axis], s.targetVel[axis], VELOCITY_LERP);
      s.basePos[axis] += s.velocity[axis];
      s.targetVel[axis] *= VELOCITY_DECAY;
    }
    camera.position.set(
      s.basePos.x + s.drift.x,
      s.basePos.y + s.drift.y,
      s.basePos.z,
    );

    camGrid.cx = Math.floor(s.basePos.x / CHUNK_SIZE);
    camGrid.cy = Math.floor(s.basePos.y / CHUNK_SIZE);
    camGrid.cz = Math.floor(s.basePos.z / CHUNK_SIZE);
    const key = `${camGrid.cx},${camGrid.cy},${camGrid.cz}`;
    if (key !== s.chunkKey) {
      s.chunkKey = key;
      pendingChunk = [camGrid.cx, camGrid.cy, camGrid.cz];
    }
    // Creating chunks is the expensive part; batch it while flying fast.
    const zoomSpeed = Math.abs(s.velocity.z);
    const throttle = zoomSpeed > 1 ? 500 : isZooming ? 400 : 100;
    if (pendingChunk && now - lastChunkUpdate >= throttle) {
      syncChunks(...pendingChunk);
      pendingChunk = null;
      lastChunkUpdate = now;
    }

    camera.updateMatrixWorld();
    viewProjection.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse,
    );
    frustum.setFromProjectionMatrix(viewProjection);
    for (const chunk of chunks.values())
      for (const plane of chunk.planes) updatePlane(plane, chunk);

    renderer.render(scene, camera);
  }

  syncChunks(0, 0, 0);
  frame = requestAnimationFrame(tick);

  return {
    setBackground(color: string) {
      background.set(color);
      (scene.fog as THREE.Fog).color.set(color);
    },
    destroy() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      canvas.removeEventListener("wheel", onWheel);
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      for (const chunk of chunks.values()) disposeChunk(chunk);
      chunks.clear();
      for (const { texture } of textures.values()) texture.dispose();
      textures.clear();
      for (const { texture } of largeTextures.values()) texture.dispose();
      largeTextures.clear();
      geometry.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
