/**
 * ISL Real-Time Translator - Master Web Application Logic
 * Implements interactive landmark canvas, speech synthesis, bookmark manager (localStorage),
 * gallery lightbox with modern <dialog closedby="any">, and live theme management.
 */

import {
  HAND_CONNECTIONS,
  ISL_SIGNS,
  DEAF_CHALLENGES,
  GALLERY_ITEMS,
  ADVOCACY_RESOURCES
} from './landmarks-data.js';

// ==========================================
// 1. STATE & STORAGE MANAGEMENT
// ==========================================
const STORAGE_KEYS = {
  BOOKMARKS: 'isl_bookmarks_v1',
  THEME: 'isl_theme_mode'
};

class BookmarkStore {
  constructor() {
    this.bookmarks = this.load();
    this.listeners = new Set();
  }

  load() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.warn('LocalStorage unavailable, defaulting to empty bookmarks', e);
      return [];
    }
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(this.bookmarks));
    } catch (e) {
      console.warn('Unable to persist bookmarks', e);
    }
    this.notify();
  }

  toggle(item) {
    const index = this.bookmarks.findIndex(b => b.id === item.id);
    let added = false;
    if (index > -1) {
      this.bookmarks.splice(index, 1);
      added = false;
    } else {
      this.bookmarks.push({
        ...item,
        savedAt: new Date().toISOString()
      });
      added = true;
    }
    this.save();
    return added;
  }

  isBookmarked(id) {
    return this.bookmarks.some(b => b.id === id);
  }

  remove(id) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== id);
    this.save();
  }

  clear() {
    this.bookmarks = [];
    this.save();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    callback(this.bookmarks);
  }

  notify() {
    for (const callback of this.listeners) {
      callback(this.bookmarks);
    }
  }

  exportData() {
    return JSON.stringify(this.bookmarks, null, 2);
  }
}

const bookmarkStore = new BookmarkStore();

// ==========================================
// 2. SPEECH SYNTHESIS ENGINE (HINDI & ENGLISH)
// ==========================================
class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.isSupported = !!this.synth;
    this.voices = [];
    this.currentSpeakingText = '';

    if (this.isSupported) {
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  loadVoices() {
    this.voices = this.synth.getVoices();
  }

  speak(text, lang = 'hi-IN') {
    if (!this.isSupported) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }

    this.synth.cancel(); // Stop prior audio

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    // Pick best matching voice (Hindi or Indian English)
    const matchingVoice = this.voices.find(v => 
      v.lang.toLowerCase().includes('hi') || 
      v.name.toLowerCase().includes('hindi') || 
      v.lang.toLowerCase().includes('in')
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    this.updateAudioIndicator(true, text);

    utterance.onend = () => {
      this.updateAudioIndicator(false);
    };

    utterance.onerror = (e) => {
      console.warn('Speech synthesis error', e);
      this.updateAudioIndicator(false);
    };

    this.synth.speak(utterance);
  }

  updateAudioIndicator(isSpeaking, text = '') {
    const indicator = document.getElementById('globalAudioIndicator');
    const label = document.getElementById('audioStatusText');
    if (indicator && label) {
      if (isSpeaking) {
        indicator.classList.add('active');
        label.textContent = `Speaking: "${text}"`;
      } else {
        indicator.classList.remove('active');
        label.textContent = 'Voice idle';
      }
    }
  }
}

const voiceEngine = new VoiceSynthesizer();

// ==========================================
// 3. INTERACTIVE 3D LANDMARK CANVAS
// ==========================================
class LandmarkCanvasVisualizer {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.currentLandmarks = null;
    this.targetLandmarks = null;
    this.morphProgress = 1;
    this.animFrameId = null;
    this.hoveredJoint = -1;

    this.setupResolution();
    window.addEventListener('resize', () => this.setupResolution());

    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoveredJoint = -1;
      this.draw();
    });
  }

  setupResolution() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.draw();
  }

  setLandmarks(landmarks, animate = true) {
    if (!animate || !this.currentLandmarks) {
      this.currentLandmarks = landmarks.map(pt => ({ ...pt }));
      this.targetLandmarks = landmarks.map(pt => ({ ...pt }));
      this.morphProgress = 1;
      this.draw();
      return;
    }

    this.targetLandmarks = landmarks;
    this.morphProgress = 0;
    this.startMorphAnimation();
  }

  startMorphAnimation() {
    if (this.animFrameId) cancelAnimationFrame(this.animFrameId);

    const step = () => {
      this.morphProgress += 0.08;
      if (this.morphProgress >= 1) {
        this.morphProgress = 1;
        this.currentLandmarks = this.targetLandmarks.map(pt => ({ ...pt }));
        this.draw();
      } else {
        // Linear interpolation with smooth ease
        const ease = 0.5 - Math.cos(this.morphProgress * Math.PI) / 2;
        this.currentLandmarks = this.currentLandmarks.map((pt, i) => {
          const target = this.targetLandmarks[i] || pt;
          return {
            x: pt.x + (target.x - pt.x) * ease,
            y: pt.y + (target.y - pt.y) * ease,
            z: pt.z + (target.z - pt.z) * ease
          };
        });
        this.draw();
        this.animFrameId = requestAnimationFrame(step);
      }
    };
    this.animFrameId = requestAnimationFrame(step);
  }

  handleMouseMove(event) {
    if (!this.currentLandmarks) return;
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    let closest = -1;
    let minDistance = 16; // Threshold in pixels

    this.currentLandmarks.forEach((pt, idx) => {
      const cx = pt.x * rect.width;
      const cy = pt.y * rect.height;
      const dist = Math.hypot(mouseX - cx, mouseY - cy);
      if (dist < minDistance) {
        minDistance = dist;
        closest = idx;
      }
    });

    if (this.hoveredJoint !== closest) {
      this.hoveredJoint = closest;
      this.draw();
    }
  }

  draw() {
    if (!this.canvas || !this.ctx || !this.currentLandmarks) return;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;

    this.ctx.clearRect(0, 0, w, h);

    // Subtle background futuristic biometric grid
    this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.08)';
    this.ctx.lineWidth = 1;
    const gridSize = 28;
    for (let x = 0; x < w; x += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, h);
      this.ctx.stroke();
    }
    for (let y = 0; y < h; y += gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(w, y);
      this.ctx.stroke();
    }

    // Draw Skeletal Connection Lines
    this.ctx.lineWidth = 2.5;
    for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
      const p1 = this.currentLandmarks[startIdx];
      const p2 = this.currentLandmarks[endIdx];
      if (!p1 || !p2) continue;

      const grad = this.ctx.createLinearGradient(
        p1.x * w, p1.y * h,
        p2.x * w, p2.y * h
      );
      grad.addColorStop(0, 'rgba(6, 182, 212, 0.85)');
      grad.addColorStop(1, 'rgba(59, 130, 246, 0.85)');

      this.ctx.strokeStyle = grad;
      this.ctx.beginPath();
      this.ctx.moveTo(p1.x * w, p1.y * h);
      this.ctx.lineTo(p2.x * w, p2.y * h);
      this.ctx.stroke();
    }

    // Joint Names for Annotation
    const JOINT_NAMES = [
      'Wrist', 'Thumb CMC', 'Thumb MCP', 'Thumb IP', 'Thumb Tip',
      'Index MCP', 'Index PIP', 'Index DIP', 'Index Tip',
      'Middle MCP', 'Middle PIP', 'Middle DIP', 'Middle Tip',
      'Ring MCP', 'Ring PIP', 'Ring DIP', 'Ring Tip',
      'Pinky MCP', 'Pinky PIP', 'Pinky DIP', 'Pinky Tip'
    ];

    // Draw 21 Landmark Nodes
    this.currentLandmarks.forEach((pt, index) => {
      const x = pt.x * w;
      const y = pt.y * h;
      const isTip = [4, 8, 12, 16, 20].includes(index);
      const isWrist = index === 0;
      const isHovered = this.hoveredJoint === index;

      // Glow halo
      this.ctx.beginPath();
      this.ctx.arc(x, y, isHovered ? 12 : (isTip ? 7 : (isWrist ? 9 : 5.5)), 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered 
        ? 'rgba(245, 158, 11, 0.4)' 
        : (isTip ? 'rgba(236, 72, 153, 0.3)' : (isWrist ? 'rgba(16, 185, 129, 0.3)' : 'rgba(6, 182, 212, 0.25)'));
      this.ctx.fill();

      // Core dot
      this.ctx.beginPath();
      this.ctx.arc(x, y, isHovered ? 6 : (isTip ? 4.5 : (isWrist ? 5 : 3.5)), 0, Math.PI * 2);
      this.ctx.fillStyle = isHovered 
        ? '#f59e0b' 
        : (isTip ? '#f43f5e' : (isWrist ? '#10b981' : '#06b6d4'));
      this.ctx.fill();
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Tooltip for hovered joint
      if (isHovered) {
        const text = `${index}: ${JOINT_NAMES[index]} [${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}]`;
        this.ctx.font = '600 12px Inter, sans-serif';
        const metrics = this.ctx.measureText(text);
        const padding = 6;
        const boxW = metrics.width + padding * 2;
        const boxH = 22;
        const boxX = Math.min(Math.max(x - boxW / 2, 8), w - boxW - 8);
        const boxY = Math.max(y - 30, 26);

        this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(boxX, boxY, boxW, boxH, 4);
        this.ctx.fill();
        this.ctx.stroke();

        this.ctx.fillStyle = '#f8fafc';
        this.ctx.fillText(text, boxX + padding, boxY + 15);
      }
    });
  }
}

let landmarkCanvas = null;

// ==========================================
// 4. RENDERING SECTIONS
// ==========================================

// Populate Interactive Sign Studio Cards
function renderSignStudioCards() {
  const container = document.getElementById('signStudioGrid');
  if (!container) return;

  container.innerHTML = ISL_SIGNS.map((sign, index) => {
    const isSaved = bookmarkStore.isBookmarked(sign.id);
    return `
      <div class="sign-card ${index === 0 ? 'active' : ''}" data-sign-id="${sign.id}" tabindex="0" role="button" aria-pressed="${index === 0}">
        <div class="sign-card-top">
          <span class="sign-badge" style="background-color: ${sign.badgeColor}20; color: ${sign.badgeColor}; border: 1px solid ${sign.badgeColor}50;">
            ${sign.category}
          </span>
          <button class="bookmark-btn ${isSaved ? 'bookmarked' : ''}" 
                  data-action="bookmark" 
                  data-item-id="${sign.id}" 
                  data-item-type="sign"
                  title="${isSaved ? 'Remove Bookmark' : 'Bookmark this Sign'}"
                  aria-label="${isSaved ? 'Remove Bookmark' : 'Bookmark this Sign'}">
            <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
          </button>
        </div>

        <h3 class="sign-name">${sign.name}</h3>
        <p class="sign-hindi">${sign.hindiName}</p>
        <p class="sign-desc">${sign.description}</p>

        <div class="sign-card-footer">
          <button class="listen-btn" data-action="speak" data-text="${sign.audioTextHindi}" data-lang="hi-IN">
            <i class="fa-solid fa-volume-high"></i> Listen Hindi
          </button>
          <span class="sign-accuracy"><i class="fa-solid fa-chart-line"></i> ${sign.accuracyRate}</span>
        </div>
      </div>
    `;
  }).join('');

  // Initial selection
  if (ISL_SIGNS.length > 0) {
    updateActiveSignDetails(ISL_SIGNS[0]);
    if (landmarkCanvas) landmarkCanvas.setLandmarks(ISL_SIGNS[0].landmarks, false);
  }
}

// Update the Detail Inspector when a sign card is clicked
function updateActiveSignDetails(sign) {
  const titleEl = document.getElementById('inspectorTitle');
  const hindiEl = document.getElementById('inspectorHindi');
  const descEl = document.getElementById('inspectorDesc');
  const howEl = document.getElementById('inspectorHow');
  const cultEl = document.getElementById('inspectorCulture');
  const speakHindiBtn = document.getElementById('inspectorSpeakHindi');
  const speakEnglishBtn = document.getElementById('inspectorSpeakEnglish');
  const bookmarkBtn = document.getElementById('inspectorBookmark');

  if (titleEl) titleEl.textContent = sign.name;
  if (hindiEl) hindiEl.textContent = sign.hindiName;
  if (descEl) descEl.textContent = sign.description;
  if (howEl) howEl.textContent = sign.howToSign;
  if (cultEl) cultEl.textContent = sign.culturalContext;

  if (speakHindiBtn) {
    speakHindiBtn.onclick = () => voiceEngine.speak(sign.audioTextHindi, 'hi-IN');
  }
  if (speakEnglishBtn) {
    speakEnglishBtn.onclick = () => voiceEngine.speak(sign.audioTextEnglish, 'en-IN');
  }
  if (bookmarkBtn) {
    const isSaved = bookmarkStore.isBookmarked(sign.id);
    bookmarkBtn.innerHTML = `<i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i> ${isSaved ? 'Bookmarked' : 'Bookmark Sign'}`;
    bookmarkBtn.classList.toggle('active', isSaved);
    bookmarkBtn.onclick = () => {
      bookmarkStore.toggle({
        id: sign.id,
        type: 'sign',
        title: sign.name,
        subtitle: sign.hindiName,
        description: sign.description,
        category: sign.category,
        audioTextHindi: sign.audioTextHindi
      });
      renderSignStudioCards();
      updateActiveSignDetails(sign);
    };
  }
}

// Render Deaf Community Problems Section
function renderChallenges() {
  const container = document.getElementById('challengesGrid');
  if (!container) return;

  container.innerHTML = DEAF_CHALLENGES.map(item => {
    const isSaved = bookmarkStore.isBookmarked(item.id);
    return `
      <article class="challenge-card" data-challenge-id="${item.id}">
        <div class="challenge-header">
          <div class="challenge-stat-box">
            <span class="stat-number">${item.stat}</span>
            <span class="stat-meta">${item.statLabel}</span>
          </div>
          <button class="bookmark-btn ${isSaved ? 'bookmarked' : ''}" 
                  data-action="bookmark" 
                  data-item-id="${item.id}" 
                  data-item-type="challenge"
                  title="${isSaved ? 'Remove Bookmark' : 'Bookmark this topic'}"
                  aria-label="${isSaved ? 'Remove Bookmark' : 'Bookmark this topic'}">
            <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
          </button>
        </div>
        <h3 class="challenge-title">${item.title}</h3>
        <p class="challenge-summary">${item.summary}</p>
        <p class="challenge-full">${item.fullDescription}</p>
        <div class="challenge-impact">
          <strong><i class="fa-solid fa-lightbulb"></i> How ISL Translator Solves This:</strong>
          <span>${item.realWorldImpact}</span>
        </div>
      </article>
    `;
  }).join('');
}

// Render Gallery with Categories
function renderGallery(filterCategory = 'All') {
  const container = document.getElementById('galleryGrid');
  if (!container) return;

  const items = filterCategory === 'All' 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(item => item.category === filterCategory);

  container.innerHTML = items.map(item => {
    const isSaved = bookmarkStore.isBookmarked(item.id);
    return `
      <div class="gallery-card" data-gallery-id="${item.id}">
        <div class="gallery-image-wrapper">
          <img src="${item.image}" alt="${item.title}" loading="lazy">
          <div class="gallery-overlay">
            <button class="gallery-view-btn" data-action="open-modal" data-item-id="${item.id}">
              <i class="fa-solid fa-expand"></i> View Details
            </button>
          </div>
          <span class="gallery-category-badge">${item.category}</span>
          <button class="bookmark-btn-gallery ${isSaved ? 'bookmarked' : ''}" 
                  data-action="bookmark" 
                  data-item-id="${item.id}" 
                  data-item-type="gallery"
                  title="${isSaved ? 'Remove Bookmark' : 'Bookmark Image'}"
                  aria-label="${isSaved ? 'Remove Bookmark' : 'Bookmark Image'}">
            <i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i>
          </button>
        </div>
        <div class="gallery-info">
          <h4 class="gallery-title">${item.title}</h4>
          <p class="gallery-caption">${item.caption}</p>
          <div class="gallery-tags">
            ${item.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Bookmarks List inside Drawer and Dedicated Section
function renderBookmarks(filterType = 'all') {
  const listEl = document.getElementById('bookmarksList');
  const drawerListEl = document.getElementById('drawerBookmarksList');
  const countBadge = document.getElementById('bookmarkCountBadge');
  const heroBadge = document.getElementById('heroBookmarkCount');
  const emptyState = document.getElementById('bookmarksEmptyState');

  const allBookmarks = bookmarkStore.bookmarks;

  if (countBadge) countBadge.textContent = allBookmarks.length;
  if (heroBadge) heroBadge.textContent = allBookmarks.length;

  const filtered = filterType === 'all' 
    ? allBookmarks 
    : allBookmarks.filter(b => b.type === filterType);

  const markup = allBookmarks.length === 0 ? '' : filtered.map(item => `
    <div class="bookmark-item" data-id="${item.id}">
      <div class="bookmark-item-left">
        <span class="bookmark-type-pill ${item.type}">${item.type.toUpperCase()}</span>
        <div class="bookmark-texts">
          <h4>${item.title || item.name}</h4>
          <p>${item.subtitle || item.hindiName || item.summary || item.caption || ''}</p>
        </div>
      </div>
      <div class="bookmark-item-actions">
        ${item.audioTextHindi ? `
          <button class="btn-icon" data-action="speak" data-text="${item.audioTextHindi}" title="Listen Pronunciation">
            <i class="fa-solid fa-volume-high"></i>
          </button>
        ` : ''}
        <button class="btn-icon remove" data-action="remove-bookmark" data-id="${item.id}" title="Remove">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      </div>
    </div>
  `).join('');

  if (listEl) {
    if (allBookmarks.length === 0) {
      if (emptyState) emptyState.style.display = 'block';
      listEl.innerHTML = '';
    } else {
      if (emptyState) emptyState.style.display = 'none';
      listEl.innerHTML = markup;
    }
  }

  if (drawerListEl) {
    drawerListEl.innerHTML = allBookmarks.length === 0 
      ? '<p style="color: var(--text-dim); font-size: 0.88rem; text-align: center; padding: 24px 0;">No saved items yet.</p>'
      : markup;
  }
}

// ==========================================
// 5. NATIVE <dialog> LIGHTBOX IMPLEMENTATION
// Following modern-web-guidance: closedby="any",
// overscroll-behavior: contain, and boundary fallback
// ==========================================
function setupGalleryModal() {
  const modal = document.getElementById('galleryModal');
  const closeBtn = document.getElementById('closeModalBtn');
  if (!modal) return;

  // Fallback for browsers without native closedBy support
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;
      const rect = modal.getBoundingClientRect();
      const isDialogContent = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (isDialogContent) return;
      modal.close();
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => modal.close());
  }

  // Handle opening modal from gallery items
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-action="open-modal"]');
    if (!trigger) return;

    const itemId = trigger.getAttribute('data-item-id');
    const item = GALLERY_ITEMS.find(g => g.id === itemId);
    if (!item) return;

    const img = document.getElementById('modalImage');
    const title = document.getElementById('modalTitle');
    const category = document.getElementById('modalCategory');
    const caption = document.getElementById('modalCaption');
    const details = document.getElementById('modalDetails');
    const tags = document.getElementById('modalTags');
    const bookmarkBtn = document.getElementById('modalBookmarkBtn');

    if (img) {
      img.src = item.image;
      img.alt = item.title;
    }
    if (title) title.textContent = item.title;
    if (category) category.textContent = item.category;
    if (caption) caption.textContent = item.caption;
    if (details) details.textContent = item.details;
    if (tags) {
      tags.innerHTML = item.tags.map(t => `<span class="tag-pill">#${t}</span>`).join('');
    }

    if (bookmarkBtn) {
      const isSaved = bookmarkStore.isBookmarked(item.id);
      bookmarkBtn.innerHTML = `<i class="fa-${isSaved ? 'solid' : 'regular'} fa-bookmark"></i> ${isSaved ? 'Bookmarked' : 'Bookmark Image'}`;
      bookmarkBtn.onclick = () => {
        bookmarkStore.toggle({
          id: item.id,
          type: 'gallery',
          title: item.title,
          subtitle: item.caption,
          description: item.details,
          category: item.category,
          image: item.image
        });
        renderGallery();
        setupGalleryModal();
      };
    }

    modal.showModal();
  });
}

// ==========================================
// 6. EVENT DELEGATION & USER INTERACTIONS
// ==========================================
function setupGlobalEvents() {
  // Sign Card Selection in Sign Studio
  document.addEventListener('click', (e) => {
    const card = e.target.closest('.sign-card');
    if (!card) return;

    // If clicking bookmark button inside card, don't trigger select
    if (e.target.closest('[data-action="bookmark"]')) return;
    if (e.target.closest('[data-action="speak"]')) return;

    const signId = card.getAttribute('data-sign-id');
    const sign = ISL_SIGNS.find(s => s.id === signId);
    if (!sign) return;

    document.querySelectorAll('.sign-card').forEach(c => {
      c.classList.remove('active');
      c.setAttribute('aria-pressed', 'false');
    });
    card.classList.add('active');
    card.setAttribute('aria-pressed', 'true');

    updateActiveSignDetails(sign);
    if (landmarkCanvas) landmarkCanvas.setLandmarks(sign.landmarks, true);
  });

  // Global Speech Trigger
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="speak"]');
    if (!btn) return;
    e.stopPropagation();
    const text = btn.getAttribute('data-text');
    const lang = btn.getAttribute('data-lang') || 'hi-IN';
    if (text) voiceEngine.speak(text, lang);
  });

  // Global Bookmark Toggle Trigger
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="bookmark"]');
    if (!btn) return;
    e.stopPropagation();

    const itemId = btn.getAttribute('data-item-id');
    const itemType = btn.getAttribute('data-item-type');

    let itemData = null;
    if (itemType === 'sign') {
      const s = ISL_SIGNS.find(x => x.id === itemId);
      if (s) itemData = { id: s.id, type: 'sign', title: s.name, subtitle: s.hindiName, description: s.description, category: s.category, audioTextHindi: s.audioTextHindi };
    } else if (itemType === 'challenge') {
      const c = DEAF_CHALLENGES.find(x => x.id === itemId);
      if (c) itemData = { id: c.id, type: 'challenge', title: c.title, subtitle: `${c.stat} ${c.statLabel}`, description: c.summary, category: c.category };
    } else if (itemType === 'gallery') {
      const g = GALLERY_ITEMS.find(x => x.id === itemId);
      if (g) itemData = { id: g.id, type: 'gallery', title: g.title, subtitle: g.caption, description: g.details, category: g.category, image: g.image };
    }

    if (itemData) {
      bookmarkStore.toggle(itemData);
      renderSignStudioCards();
      renderChallenges();
      renderGallery();
      renderBookmarks();
    }
  });

  // Remove Bookmark inside Drawer
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-action="remove-bookmark"]');
    if (!btn) return;
    const id = btn.getAttribute('data-id');
    if (id) {
      bookmarkStore.remove(id);
      renderSignStudioCards();
      renderChallenges();
      renderGallery();
      renderBookmarks();
    }
  });

  // Gallery Filter Tabs
  const galleryFilterBtns = document.querySelectorAll('.gallery-filter-btn');
  galleryFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      galleryFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.getAttribute('data-category');
      renderGallery(cat);
    });
  });

  // Bookmark Drawer Toggles
  const drawer = document.getElementById('bookmarkDrawer');
  const openDrawerBtn = document.getElementById('openBookmarksBtn');
  const closeDrawerBtn = document.getElementById('closeDrawerBtn');

  if (openDrawerBtn && drawer) {
    openDrawerBtn.addEventListener('click', () => drawer.classList.add('open'));
  }
  if (closeDrawerBtn && drawer) {
    closeDrawerBtn.addEventListener('click', () => drawer.classList.remove('open'));
  }

  // Export Bookmarks
  const exportBtn = document.getElementById('exportBookmarksBtn');
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const json = bookmarkStore.exportData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `isl_bookmarks_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Clear All Bookmarks
  const clearBtn = document.getElementById('clearBookmarksBtn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear all your saved bookmarks?')) {
        bookmarkStore.clear();
        renderSignStudioCards();
        renderChallenges();
        renderGallery();
        renderBookmarks();
      }
    });
  }

  // Filter Bookmarks by Type
  const bookmarkFilterBtns = document.querySelectorAll('.bookmark-tab-btn');
  bookmarkFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      bookmarkFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const type = btn.getAttribute('data-filter');
      renderBookmarks(type);
    });
  });

  // Theme Mode Switcher
  const themeToggle = document.getElementById('themeToggleBtn');
  if (themeToggle) {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme') || 'dark';
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(STORAGE_KEYS.THEME, next);
      updateThemeIcon(next);
      if (landmarkCanvas) landmarkCanvas.draw();
    });
  }

  function updateThemeIcon(theme) {
    if (!themeToggle) return;
    themeToggle.innerHTML = theme === 'dark' 
      ? '<i class="fa-solid fa-sun"></i>' 
      : '<i class="fa-solid fa-moon"></i>';
    themeToggle.title = `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`;
  }

  // Interactive Live Camera Simulator Toggle
  const startSimBtn = document.getElementById('startSimBtn');
  if (startSimBtn) {
    let simIndex = 0;
    let simInterval = null;
    startSimBtn.addEventListener('click', () => {
      if (simInterval) {
        clearInterval(simInterval);
        simInterval = null;
        startSimBtn.innerHTML = '<i class="fa-solid fa-play"></i> Auto-Play Sign Sequence';
        startSimBtn.classList.remove('active');
      } else {
        startSimBtn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Sequence';
        startSimBtn.classList.add('active');
        simInterval = setInterval(() => {
          simIndex = (simIndex + 1) % ISL_SIGNS.length;
          const sign = ISL_SIGNS[simIndex];
          updateActiveSignDetails(sign);
          if (landmarkCanvas) landmarkCanvas.setLandmarks(sign.landmarks, true);
          voiceEngine.speak(sign.audioTextHindi, 'hi-IN');

          // Highlight card
          document.querySelectorAll('.sign-card').forEach(c => {
            const match = c.getAttribute('data-sign-id') === sign.id;
            c.classList.toggle('active', match);
            c.setAttribute('aria-pressed', match ? 'true' : 'false');
          });
        }, 3200);
      }
    });
  }

  // Mobile navigation drawer toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const navMenu = document.getElementById('navMenu');
  if (mobileMenuBtn && navMenu) {
    mobileMenuBtn.addEventListener('click', () => {
      navMenu.classList.toggle('mobile-open');
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('mobile-open'));
    });
  }
}

// ==========================================
// 7. INITIALIZATION ON DOM CONTENT LOADED
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  landmarkCanvas = new LandmarkCanvasVisualizer('landmarkCanvas');

  renderSignStudioCards();
  renderChallenges();
  renderGallery();
  renderBookmarks();
  setupGalleryModal();
  setupGlobalEvents();

  // Subscribe bookmark manager to updates
  bookmarkStore.subscribe(() => {
    renderBookmarks();
  });
});
