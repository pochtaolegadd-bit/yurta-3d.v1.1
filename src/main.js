import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { initCalculator } from './calculator/ui.js';

const sceneRoot = document.getElementById('scene-root');
if (!(sceneRoot instanceof HTMLElement)) {
  throw new Error('Не найден контейнер #scene-root');
}

/** @type {string} */
let currentPage = 'home';

// ---------- Навигация ----------
const navItems = document.querySelectorAll('.nav-item');
const pages = document.querySelectorAll('.page');

const projectVideo = document.getElementById('project-video');

/**
 * Переключение разделов сайта
 * @param {string} pageId
 */
function setActivePage(pageId) {
  currentPage = pageId;

  navItems.forEach((item) => {
    const isActive = item.getAttribute('data-page') === pageId;
    item.classList.toggle('is-active', isActive);
  });

  pages.forEach((page) => {
    const isActive = page.getAttribute('data-page') === pageId;
    page.classList.toggle('is-active', isActive);
    page.hidden = !isActive;
  });

  // При уходе с главной снимаем захват мыши
  if (pageId !== 'home' && document.pointerLockElement) {
    document.exitPointerLock();
  }

  // Пауза видео при уходе с вкладки
  if (
    pageId !== 'video' &&
    projectVideo instanceof HTMLVideoElement &&
    !projectVideo.paused
  ) {
    projectVideo.pause();
  }

  if (pageId === 'home') {
    resizeRenderer();
  }
}

navItems.forEach((item) => {
  item.addEventListener('click', () => {
    const pageId = item.getAttribute('data-page');
    if (pageId) {
      setActivePage(pageId);
    }
  });
});

// ---------- 3D-сцена ----------
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xdcefff);

const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
// Стартовая точка обзора (сохранена из игры клавишей P)
camera.position.set(20.61, 5.76, 6.567);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
sceneRoot.appendChild(renderer.domElement);

const ambientLight = new THREE.AmbientLight(0xffffff, 2);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 3);
dirLight.position.set(5, 10, 5);
scene.add(dirLight);

const loader = new GLTFLoader();
loader.load(
  '/yurta.glb',
  (gltf) => {
    scene.add(gltf.scene);
    console.log('Юрта загружена');
  },
  undefined,
  (error) => {
    console.error('Ошибка загрузки юрты:', error);
  }
);

/** @type {Record<string, boolean>} */
const keys = {};

// Чтобы координаты были доступны из консоли браузера
window.camera = camera;

/**
 * Печатает текущую позицию и угол камеры (клавиша P)
 */
function logCameraPose() {
  const x = Number(camera.position.x.toFixed(3));
  const y = Number(camera.position.y.toFixed(3));
  const z = Number(camera.position.z.toFixed(3));
  const line = `camera.position.set(${x}, ${y}, ${z}); yaw=${yaw.toFixed(3)}; pitch=${pitch.toFixed(3)};`;

  console.log(line);

  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(line).catch(() => {
      // буфер обмена может быть недоступен без жеста пользователя
    });
  }
}

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  keys[key] = true;

  // P / З — вывести позицию камеры в консоль
  if (key === 'p' || key === 'з') {
    logCameraPose();
  }
});

document.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
});

let yaw = 1.248;
let pitch = -0.176;

// Применить сохранённый угол взгляда сразу при загрузке
camera.rotation.order = 'YXZ';
camera.rotation.y = yaw;
camera.rotation.x = pitch;

const isTouchDevice =
  window.matchMedia('(hover: none), (pointer: coarse)').matches ||
  navigator.maxTouchPoints > 0;

/** Движение с виртуального джойстика: -1…1 */
const touchMove = { x: 0, y: 0 };
/** Вертикаль камеры с кнопок */
const touchVert = { up: false, down: false };

sceneRoot.addEventListener('click', () => {
  if (currentPage === 'home' && !isTouchDevice) {
    sceneRoot.requestPointerLock();
  }
});

document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement !== sceneRoot) {
    return;
  }

  yaw -= e.movementX * 0.002;
  pitch -= e.movementY * 0.002;
  pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));

  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
});

// ---------- Мобильное управление ----------
const joy = document.getElementById('joy-move');
const joyKnob = document.getElementById('joy-knob');
const btnCamUp = document.getElementById('btn-cam-up');
const btnCamDown = document.getElementById('btn-cam-down');
const mobileControls = document.getElementById('mobile-controls');

if (mobileControls instanceof HTMLElement) {
  mobileControls.setAttribute('aria-hidden', isTouchDevice ? 'false' : 'true');
}

/**
 * @param {number} clientX
 * @param {number} clientY
 * @param {DOMRect} rect
 */
function updateJoystick(clientX, clientY, rect) {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = clientX - cx;
  let dy = clientY - cy;
  const max = rect.width / 2 - 8;
  const len = Math.hypot(dx, dy) || 1;
  if (len > max) {
    dx = (dx / len) * max;
    dy = (dy / len) * max;
  }
  touchMove.x = dx / max;
  touchMove.y = dy / max;
  if (joyKnob instanceof HTMLElement) {
    joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
  }
}

function resetJoystick() {
  touchMove.x = 0;
  touchMove.y = 0;
  if (joyKnob instanceof HTMLElement) {
    joyKnob.style.transform = 'translate(0px, 0px)';
  }
}

if (joy instanceof HTMLElement) {
  /** @type {number | null} */
  let joyTouchId = null;

  joy.addEventListener(
    'touchstart',
    (e) => {
      e.preventDefault();
      const t = e.changedTouches[0];
      joyTouchId = t.identifier;
      updateJoystick(t.clientX, t.clientY, joy.getBoundingClientRect());
    },
    { passive: false }
  );

  joy.addEventListener(
    'touchmove',
    (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === joyTouchId) {
          updateJoystick(t.clientX, t.clientY, joy.getBoundingClientRect());
        }
      }
    },
    { passive: false }
  );

  const endJoy = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        joyTouchId = null;
        resetJoystick();
      }
    }
  };
  joy.addEventListener('touchend', endJoy);
  joy.addEventListener('touchcancel', endJoy);
}

/**
 * @param {HTMLElement | null} btn
 * @param {'up' | 'down'} dir
 */
function bindVertButton(btn, dir) {
  if (!(btn instanceof HTMLElement)) {
    return;
  }
  const set = (value) => {
    touchVert[dir] = value;
  };
  btn.addEventListener('touchstart', (e) => {
    e.preventDefault();
    set(true);
  }, { passive: false });
  btn.addEventListener('touchend', () => set(false));
  btn.addEventListener('touchcancel', () => set(false));
  btn.addEventListener('mousedown', (e) => {
    e.preventDefault();
    set(true);
  });
  btn.addEventListener('mouseup', () => set(false));
  btn.addEventListener('mouseleave', () => set(false));
}

bindVertButton(btnCamUp, 'up');
bindVertButton(btnCamDown, 'down');

/** Обзор свайпом по сцене (не по джойстику) */
/** @type {number | null} */
let lookTouchId = null;
let lookLastX = 0;
let lookLastY = 0;

sceneRoot.addEventListener(
  'touchstart',
  (e) => {
    if (currentPage !== 'home' || lookTouchId !== null) {
      return;
    }
    const t = e.changedTouches[0];
    const target = /** @type {HTMLElement | null} */ (t.target instanceof HTMLElement ? t.target : null);
    if (target?.closest('.mobile-controls')) {
      return;
    }
    lookTouchId = t.identifier;
    lookLastX = t.clientX;
    lookLastY = t.clientY;
  },
  { passive: true }
);

sceneRoot.addEventListener(
  'touchmove',
  (e) => {
    if (lookTouchId === null) {
      return;
    }
    for (const t of e.changedTouches) {
      if (t.identifier !== lookTouchId) {
        continue;
      }
      const dx = t.clientX - lookLastX;
      const dy = t.clientY - lookLastY;
      lookLastX = t.clientX;
      lookLastY = t.clientY;

      yaw -= dx * 0.004;
      pitch -= dy * 0.004;
      pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
      camera.rotation.order = 'YXZ';
      camera.rotation.y = yaw;
      camera.rotation.x = pitch;
    }
  },
  { passive: true }
);

const endLook = (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === lookTouchId) {
      lookTouchId = null;
    }
  }
};
sceneRoot.addEventListener('touchend', endLook);
sceneRoot.addEventListener('touchcancel', endLook);

const speed = 0.08;

function updateMovement() {
  if (currentPage !== 'home') {
    return;
  }

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

  if (keys['w'] || keys['ц'] || touchMove.y < -0.2) {
    const k = keys['w'] || keys['ц'] ? 1 : Math.abs(touchMove.y);
    camera.position.add(forward.clone().multiplyScalar(speed * k));
  }
  if (keys['s'] || keys['ы'] || touchMove.y > 0.2) {
    const k = keys['s'] || keys['ы'] ? 1 : Math.abs(touchMove.y);
    camera.position.add(forward.clone().multiplyScalar(-speed * k));
  }
  if (keys['d'] || keys['в'] || touchMove.x > 0.2) {
    const k = keys['d'] || keys['в'] ? 1 : Math.abs(touchMove.x);
    camera.position.add(right.clone().multiplyScalar(speed * k));
  }
  if (keys['a'] || keys['ф'] || touchMove.x < -0.2) {
    const k = keys['a'] || keys['ф'] ? 1 : Math.abs(touchMove.x);
    camera.position.add(right.clone().multiplyScalar(-speed * k));
  }
  if (keys[' '] || touchVert.up) {
    camera.position.y += speed;
  }
  if (keys['shift'] || touchVert.down) {
    camera.position.y -= speed;
  }
}

function resizeRenderer() {
  const width = sceneRoot.clientWidth || window.innerWidth;
  const height = sceneRoot.clientHeight || window.innerHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height, false);
}

function animate() {
  requestAnimationFrame(animate);
  updateMovement();

  if (currentPage === 'home') {
    renderer.render(scene, camera);
  }
}

resizeRenderer();
animate();

window.addEventListener('resize', resizeRenderer);

const calculatorRoot = document.getElementById('calculator-root');
if (calculatorRoot instanceof HTMLElement) {
  initCalculator(calculatorRoot);
}
