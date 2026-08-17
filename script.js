const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Reveal sections as they enter the viewport, keeping the long page easy to scan.
const revealItems = document.querySelectorAll('[data-reveal]');
revealItems.forEach((item, index) => {
  item.classList.add('js-reveal');
  item.style.transitionDelay = `${Math.min(index * 55, 220)}ms`;
});
if ('IntersectionObserver' in window) {
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });
  revealItems.forEach((item) => revealObserver.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}

// Mobile nav toggle
const toggle = document.querySelector('.nav__toggle');
const links = document.getElementById('nav-links');
if (toggle && links) {
  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

// Copy email
const copyBtn = document.getElementById('copy-email');
if (copyBtn) {
  copyBtn.addEventListener('click', async () => {
    const mailto = document.querySelector('a[href^="mailto:"]');
    const email = mailto?.getAttribute('href')?.replace('mailto:', '') || '';
    if (!email) return;

    try {
      await navigator.clipboard.writeText(email);
      const prev = copyBtn.textContent;
      copyBtn.textContent = 'Copied';
      setTimeout(() => (copyBtn.textContent = prev), 900);
    } catch {
      // Clipboard may be blocked on file:// — silently ignore.
    }
  });
}

// Lightweight portfolio contact assistant
const chatLauncher = document.querySelector('.chat-launcher');
const chat = document.getElementById('contact-chat');
const chatClose = document.querySelector('.chatbot__close');
const chatMessages = document.getElementById('chatbot-messages');
const leadForm = document.getElementById('lead-form');
let chatInput = document.getElementById('chatbot-input');
let chatQuestion = document.getElementById('chatbot-question');
let voiceBtn = document.getElementById('chatbot-voice');
let voiceStatus = document.getElementById('chatbot-voice-status');

const leadQuestions = [
  { key: 'name', label: 'What is your name?', placeholder: 'Jane Smith' },
  { key: 'email', label: 'What email should Tarun reply to?', placeholder: 'jane@example.com', type: 'email' },
  { key: 'company', label: 'Company / organization? (optional)', placeholder: 'Acme Inc.' },
  { key: 'reason', label: 'What would you like to talk about?', placeholder: 'Job opportunity, freelance project, collaboration...' },
  { key: 'timeline', label: 'Any timeline or urgency?', placeholder: 'This week, next month, flexible...' },
];

let leadStep = 0;
const leadData = {};

function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.95;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
}

function addChatMessage(text, who = 'bot', shouldSpeak = who === 'bot') {
  if (shouldSpeak) speak(text);
  if (!chatMessages) return;
  const message = document.createElement('div');
  message.className = `chatbot__message chatbot__message--${who}`;
  message.textContent = text;
  chatMessages.appendChild(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function refreshChatRefs() {
  chatInput = document.getElementById('chatbot-input');
  chatQuestion = document.getElementById('chatbot-question');
  voiceBtn = document.getElementById('chatbot-voice');
  voiceStatus = document.getElementById('chatbot-voice-status');
}

function setQuestion() {
  refreshChatRefs();
  if (!chatQuestion || !chatInput) return;
  const q = leadQuestions[leadStep];
  chatQuestion.textContent = q.label;
  chatInput.placeholder = q.placeholder || '';
  chatInput.type = q.type || 'text';
  chatInput.value = '';
  chatInput.focus();
}

function openChat() {
  if (!chat || !chatLauncher) return;
  chat.hidden = false;
  chatLauncher.setAttribute('aria-expanded', 'true');
  if (!chatMessages?.children.length) {
    addChatMessage('Hi! I can collect your details so Tarun can follow up quickly.');
    addChatMessage(leadQuestions[0].label);
  }
  setQuestion();
}

function closeChat() {
  if (!chat || !chatLauncher) return;
  chat.hidden = true;
  chatLauncher.setAttribute('aria-expanded', 'false');
}

function buildMailto() {
  const email = 'tarunkb.go@gmail.com';
  const subject = encodeURIComponent(`Portfolio inquiry from ${leadData.name || 'visitor'}`);
  const body = encodeURIComponent([
    `Name: ${leadData.name || ''}`,
    `Email: ${leadData.email || ''}`,
    `Company: ${leadData.company || ''}`,
    `Reason: ${leadData.reason || ''}`,
    `Timeline: ${leadData.timeline || ''}`,
  ].join('\n'));
  return `mailto:${email}?subject=${subject}&body=${body}`;
}

function resetChat() {
  leadStep = 0;
  Object.keys(leadData).forEach((key) => delete leadData[key]);
  if (chatMessages) chatMessages.innerHTML = '';
  if (leadForm) {
    leadForm.innerHTML = '<label class="chatbot__label" for="chatbot-input" id="chatbot-question">Your answer</label><div class="chatbot__input-row"><input id="chatbot-input" name="answer" autocomplete="off" required><button class="chatbot__voice" id="chatbot-voice" type="button" aria-label="Speak your answer" title="Speak your answer">🎙️</button><button class="btn btn--primary" type="submit">Send</button></div><p class="chatbot__hint" id="chatbot-voice-status">Tap the mic to answer by voice.</p>';
  }
  addChatMessage('Hi! I can collect your details so Tarun can follow up quickly.');
  addChatMessage(leadQuestions[0].label);
  setQuestion();
}


const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

function setVoiceStatus(text) {
  refreshChatRefs();
  if (voiceStatus) voiceStatus.textContent = text;
}

function stopListening() {
  if (recognition && isListening) recognition.stop();
}

function startListening() {
  refreshChatRefs();
  if (!SpeechRecognition) {
    setVoiceStatus('Voice input is not supported in this browser. Try Chrome.');
    addChatMessage('Voice input is not supported in this browser. You can still type your answer.');
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = 'en-US';
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  recognition.onstart = () => {
    isListening = true;
    voiceBtn?.classList.add('is-listening');
    setVoiceStatus('Listening... speak now.');
  };

  recognition.onresult = (event) => {
    const transcript = event.results?.[0]?.[0]?.transcript || '';
    refreshChatRefs();
    if (chatInput) chatInput.value = transcript;
    setVoiceStatus('Got it. Press Send, or edit the text first.');
  };

  recognition.onerror = (event) => {
    const message = event.error === 'not-allowed'
      ? 'Microphone permission was blocked. Allow mic access to use voice.'
      : 'Voice input stopped. You can try again or type instead.';
    setVoiceStatus(message);
  };

  recognition.onend = () => {
    isListening = false;
    voiceBtn?.classList.remove('is-listening');
    if (voiceStatus?.textContent === 'Listening... speak now.') setVoiceStatus('Tap the mic to answer by voice.');
  };

  recognition.start();
}

leadForm?.addEventListener('click', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest('#chatbot-voice')) {
    if (isListening) stopListening();
    else startListening();
  }
});

chatLauncher?.addEventListener('click', openChat);
chatClose?.addEventListener('click', closeChat);

leadForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  refreshChatRefs();
  if (!chatInput) return;

  const q = leadQuestions[leadStep];
  const answer = chatInput.value.trim();
  if (!answer && q.key !== 'company') return;

  leadData[q.key] = answer;
  addChatMessage(answer || 'Skipped', 'user');
  leadStep += 1;

  if (leadStep < leadQuestions.length) {
    addChatMessage(leadQuestions[leadStep].label);
    setQuestion();
    return;
  }

  try {
    localStorage.setItem('tarunPortfolioLead', JSON.stringify({ ...leadData, createdAt: new Date().toISOString() }));
  } catch {}
  addChatMessage('Thanks — I have the details. Please click the email button below so your message reaches Tarun.');

  if (leadForm) {
    leadForm.innerHTML = `<a class="btn btn--primary" href="${buildMailto()}">Email Tarun these details</a><button class="btn btn--ghost" type="button" id="chatbot-reset">Start over</button>`;
    document.getElementById('chatbot-reset')?.addEventListener('click', resetChat);
  }
});

// Removed extra cubes (Three.js background) as requested
// (function init3dBackground() {
//   const canvas = document.getElementById('bg-canvas');
//   if (!canvas || typeof THREE === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

//   const scene = new THREE.Scene();
//   const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);
//   camera.position.set(0, .1, 6.4);
//   const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
//   renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
//   renderer.setSize(innerWidth, innerHeight);
//   // Layered wireframe geometry: quiet, technical, and intentionally abstract.
//   const group = new THREE.Group();
//   const material = new THREE.LineBasicMaterial({ color: 0xc7ff5e, transparent: true, opacity: .28 });
//   for (let i = 0; i < 5; i += 1) {
//     const geometry = new THREE.IcosahedronGeometry(1.2 + i * .22, 1);
//     const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material.clone());
//     wire.material.opacity = .28 - i * .035;
//     wire.material.color.setHex(i % 2 ? 0x8da8ff : 0xc7ff5e);
//     wire.rotation.set(i * .4, i * .7, i * .2);
//     group.add(wire);
//   }
//   const satelliteMaterial = new THREE.MeshBasicMaterial({ color: 0xc7ff5e, wireframe: true, transparent: true, opacity: .72 });
//   const satellites = new THREE.Group();
//   [[-1.7, .8, .1], [1.75, .65, -.2], [-1.55, -1.05, .15], [1.45, -1.15, -.1], [.15, 1.75, .2]].forEach((position, index) => {
//     const satellite = new THREE.Mesh(new THREE.OctahedronGeometry(index % 2 ? .11 : .16, 0), satelliteMaterial.clone());
//     satellite.material.color.setHex(index % 2 ? 0x8da8ff : 0xc7ff5e);
//     satellite.position.set(...position);
//     satellites.add(satellite);
//   });
//   group.add(satellites);
//   const particlePositions = new Float32Array(240);
//   for (let i = 0; i < particlePositions.length; i += 3) {
//     particlePositions[i] = (Math.random() - .5) * 5.4;
//     particlePositions[i + 1] = (Math.random() - .5) * 4.2;
//     particlePositions[i + 2] = (Math.random() - .5) * 2.2;
//   }
//   const particleGeometry = new THREE.BufferGeometry();
//   particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
//   const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0x8da8ff, size: .018, transparent: true, opacity: .5, depthWrite: false }));
//   group.add(particles);
//   group.position.set(1.35, .05, 0);
//   scene.add(group);

//   const pointer = { x: 0, y: 0 };
//   let scrollRotation = -.45;
//   addEventListener('pointermove', (event) => {
//     pointer.x = (event.clientX / innerWidth - .5) * 2;
//     pointer.y = (event.clientY / innerHeight - .5) * 2;
//   }, { passive: true });
//   addEventListener('scroll', () => { scrollRotation = -.45 + scrollY * .0028; }, { passive: true });
//   addEventListener('resize', () => {
//     camera.aspect = innerWidth / innerHeight;
//     camera.updateProjectionMatrix();
//     renderer.setSize(innerWidth, innerHeight);
//   });

//   const clock = new THREE.Clock();
//   function animate() {
//     requestAnimationFrame(animate);
//     const time = clock.getElapsedTime();
//     group.rotation.y += (scrollRotation - group.rotation.y) * .035;
//     group.rotation.x += (pointer.y * .1 - group.rotation.x) * .02;
//     group.position.x += (1.35 + pointer.x * .22 - group.position.x) * .018;
//     group.position.y = .05 + Math.sin(time * .5) * .07;
//     satellites.rotation.y -= .003;
//     satellites.rotation.x += .001;
//     particles.rotation.y += .0005;
//     renderer.render(scene, camera);
//   }
//   animate();
// })();

(function init3dBackground() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas || typeof THREE === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .1, 100);
  camera.position.set(0, .1, 6.4);
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.7));
  renderer.setSize(innerWidth, innerHeight);

  const group = new THREE.Group();
  const material = new THREE.LineBasicMaterial({ color: 0xf4c95d, transparent: true, opacity: .34 });
  for (let i = 0; i < 5; i += 1) {
    const geometry = new THREE.IcosahedronGeometry(1.2 + i * .22, 1);
    const wire = new THREE.LineSegments(new THREE.EdgesGeometry(geometry), material.clone());
    wire.material.opacity = .34 - i * .035;
    wire.material.color.setHex(i % 2 ? 0xe8a93a : 0xffd978);
    wire.rotation.set(i * .4, i * .7, i * .2);
    group.add(wire);
  }
  const particlePositions = new Float32Array(720);
  for (let i = 0; i < particlePositions.length; i += 3) {
    particlePositions[i] = (Math.random() - .5) * 5.4;
    particlePositions[i + 1] = (Math.random() - .5) * 4.2;
    particlePositions[i + 2] = (Math.random() - .5) * 2.2;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
  group.add(new THREE.Points(particleGeometry, new THREE.PointsMaterial({ color: 0xf4c95d, size: .022, transparent: true, opacity: .52, depthWrite: false })));
  const sparkPositions = new Float32Array(180);
  for (let i = 0; i < sparkPositions.length; i += 3) {
    sparkPositions[i] = (Math.random() - .5) * 5.2;
    sparkPositions[i + 1] = (Math.random() - .5) * 4;
    sparkPositions[i + 2] = (Math.random() - .5) * 2;
  }
  const sparkGeometry = new THREE.BufferGeometry();
  sparkGeometry.setAttribute('position', new THREE.BufferAttribute(sparkPositions, 3));
  const sparkMaterial = new THREE.PointsMaterial({ color: 0xffe8a3, size: .038, transparent: true, opacity: .62, depthWrite: false });
  group.add(new THREE.Points(sparkGeometry, sparkMaterial));
  group.position.set(1.35, .05, 0);
  scene.add(group);

  const pointer = { x: 0, y: 0 };
  let scrollRotation = -.45;
  addEventListener('pointermove', (event) => {
    pointer.x = (event.clientX / innerWidth - .5) * 2;
    pointer.y = (event.clientY / innerHeight - .5) * 2;
  }, { passive: true });
  addEventListener('scroll', () => { scrollRotation = -.45 + scrollY * .0028; }, { passive: true });
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });
  const clock = new THREE.Clock();
  function animate() {
    requestAnimationFrame(animate);
    const time = clock.getElapsedTime();
    group.rotation.y += (scrollRotation - group.rotation.y) * .035;
    group.rotation.x += (pointer.y * .1 - group.rotation.x) * .02;
    group.position.x += (1.35 + pointer.x * .22 - group.position.x) * .018;
    group.position.y = .05 + Math.sin(time * .5) * .07;
    sparkMaterial.opacity = .48 + Math.sin(time * 2.2) * .16;
    renderer.render(scene, camera);
  }
  animate();
})();
