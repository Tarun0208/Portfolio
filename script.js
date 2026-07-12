const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

// Theme toggle (dark/light)
const root = document.documentElement;
const themeToggle = document.getElementById('theme-toggle');

function setTheme(theme) {
  if (theme) root.setAttribute('data-theme', theme);
  else root.removeAttribute('data-theme');
  try {
    localStorage.setItem('theme', theme || '');
  } catch {}
}

// init theme
try {
  const saved = localStorage.getItem('theme');
  if (saved) setTheme(saved);
} catch {}

if (themeToggle) {
  const label = () => (root.getAttribute('data-theme') === 'light' ? 'Light' : 'Dark');
  themeToggle.textContent = label();

  themeToggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'light' ? '' : 'light';
    setTheme(next);
    themeToggle.textContent = label();
  });
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
