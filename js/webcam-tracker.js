/**
 * Real-Time ISL Webcam Tracking & Recognition Engine
 * Connects browser webcam, MediaPipe Hands 21-landmark tracking,
 * gesture classification, and dual-mode Python backend fallback.
 */

import { classifyGestureFromLandmarks } from './gesture-classifier.js';
import { HAND_CONNECTIONS } from './landmarks-data.js';

export class RealTimeWebcamTracker {
  constructor(options = {}) {
    this.videoElement = document.getElementById(options.videoId || 'webcamVideo');
    this.canvasElement = document.getElementById(options.canvasId || 'webcamCanvas');
    this.placeholderElement = document.getElementById(options.placeholderId || 'webcamPlaceholder');
    this.ctx = this.canvasElement ? this.canvasElement.getContext('2d') : null;

    // UI elements
    this.toggleBtn = document.getElementById('toggleWebcamBtn');
    this.gestureText = document.getElementById('webcamGestureText');
    this.hindiText = document.getElementById('webcamHindiText');
    this.confidenceBar = document.getElementById('webcamConfidenceBar');
    this.confidenceSubtext = document.getElementById('webcamConfidenceSubtext');
    this.sentenceText = document.getElementById('webcamSentenceText');
    this.historyTags = document.getElementById('webcamHistoryTags');
    this.fpsValue = document.getElementById('webcamFpsValue');
    this.latencyValue = document.getElementById('webcamLatencyValue');
    this.backendModeSelect = document.getElementById('backendModeSelect');

    // Controls
    this.landmarkOverlayCheckbox = document.getElementById('webcamOverlayCheck');
    this.speakPredictionsCheckbox = document.getElementById('webcamSpeakCheck');
    this.clearSentenceBtn = document.getElementById('clearSentenceBtn');

    // State
    this.isRunning = false;
    this.cameraInstance = null;
    this.handsInstance = null;
    this.lastDetectionTime = performance.now();
    this.frameCount = 0;
    this.fps = 0;
    this.sentence = [];
    this.lastSpokenGesture = '';
    this.gestureBuffer = [];
    this.isBackendMode = false;
    this.backendPollInterval = null;

    this.init();
  }

  init() {
    if (this.toggleBtn) {
      this.toggleBtn.addEventListener('click', () => this.toggleWebcam());
    }

    if (this.clearSentenceBtn) {
      this.clearSentenceBtn.addEventListener('click', () => {
        this.sentence = [];
        this.updateSentenceUI();
        if (this.historyTags) this.historyTags.innerHTML = '';
      });
    }

    if (this.backendModeSelect) {
      this.backendModeSelect.addEventListener('change', (e) => {
        this.isBackendMode = e.target.value === 'python';
        if (this.isRunning) {
          this.stop();
          this.start();
        }
      });
    }
  }

  async toggleWebcam() {
    if (this.isRunning) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    if (this.isBackendMode) {
      await this.startPythonBackendMode();
      return;
    }
    await this.startInBrowserMediaPipeMode();
  }

  async stop() {
    this.isRunning = false;

    // Stop MediaPipe / CameraUtils
    if (this.cameraInstance) {
      try { await this.cameraInstance.stop(); } catch (e) { console.warn(e); }
      this.cameraInstance = null;
    }

    // Stop direct WebRTC tracks
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }

    // Clear backend polling
    if (this.backendPollInterval) {
      clearInterval(this.backendPollInterval);
      this.backendPollInterval = null;
    }

    // Update UI
    if (this.videoElement) this.videoElement.style.display = 'none';
    if (this.canvasElement) this.canvasElement.style.display = 'none';
    if (this.placeholderElement) this.placeholderElement.style.display = 'flex';
    if (this.toggleBtn) {
      this.toggleBtn.innerHTML = '<i class="fa-solid fa-video"></i> Start Webcam';
      this.toggleBtn.classList.remove('btn-stop');
      this.toggleBtn.classList.add('btn-primary');
    }

    this.resetPredictionDisplay();
  }

  async startInBrowserMediaPipeMode() {
    try {
      if (this.toggleBtn) this.toggleBtn.disabled = true;

      // Ensure MediaPipe is loaded
      if (typeof window.Hands === 'undefined') {
        alert('MediaPipe Hands is loading from CDN. Please check your internet connection and try again in a few seconds.');
        if (this.toggleBtn) this.toggleBtn.disabled = false;
        return;
      }

      this.handsInstance = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsInstance.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.handsInstance.onResults((results) => this.onHandResults(results));

      // Access User Media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.canvasElement.width = 640;
      this.canvasElement.height = 480;

      // Start Camera Utils runner or manual requestAnimationFrame
      this.cameraInstance = new window.Camera(this.videoElement, {
        onFrame: async () => {
          if (this.isRunning && this.videoElement) {
            await this.handsInstance.send({ image: this.videoElement });
          }
        },
        width: 640,
        height: 480
      });

      await this.cameraInstance.start();

      this.isRunning = true;
      if (this.placeholderElement) this.placeholderElement.style.display = 'none';
      if (this.canvasElement) this.canvasElement.style.display = 'block';

      if (this.toggleBtn) {
        this.toggleBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Webcam';
        this.toggleBtn.classList.remove('btn-primary');
        this.toggleBtn.classList.add('btn-stop');
        this.toggleBtn.disabled = false;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Unable to access webcam. Please check browser permissions: ' + err.message);
      if (this.toggleBtn) this.toggleBtn.disabled = false;
      this.stop();
    }
  }

  onHandResults(results) {
    if (!this.isRunning || !this.ctx) return;

    const now = performance.now();
    const delta = now - this.lastDetectionTime;
    this.lastDetectionTime = now;
    this.fps = Math.round(1000 / (delta || 30));

    if (this.fpsValue) this.fpsValue.textContent = `${this.fps} fps`;
    if (this.latencyValue) this.latencyValue.textContent = `${Math.round(delta)} ms`;

    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    this.ctx.save();
    this.ctx.clearRect(0, 0, w, h);

    // Draw video frame onto canvas (mirrored for natural gesture experience)
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(results.image, 0, 0, w, h);

    // Draw Hand Landmarks Overlay
    const showOverlay = !this.landmarkOverlayCheckbox || this.landmarkOverlayCheckbox.checked;

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      if (showOverlay) {
        // Draw bone connection lines
        this.ctx.lineWidth = 3;
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          if (!p1 || !p2) continue;

          this.ctx.strokeStyle = '#06b6d4';
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x * w, p1.y * h);
          this.ctx.lineTo(p2.x * w, p2.y * h);
          this.ctx.stroke();
        }

        // Draw 21 landmark nodes
        for (let i = 0; i < landmarks.length; i++) {
          const pt = landmarks[i];
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const isWrist = i === 0;

          this.ctx.beginPath();
          this.ctx.arc(pt.x * w, pt.y * h, isTip ? 6 : (isWrist ? 7 : 4.5), 0, Math.PI * 2);
          this.ctx.fillStyle = isTip ? '#f43f5e' : (isWrist ? '#10b981' : '#f59e0b');
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        }
      }

      this.ctx.restore();

      // Classify the gesture
      const prediction = classifyGestureFromLandmarks(landmarks);
      this.handlePrediction(prediction);

    } else {
      this.ctx.restore();
      this.handlePrediction(null);
    }
  }

  handlePrediction(prediction) {
    if (!prediction) {
      this.gestureBuffer = [];
      this.resetPredictionDisplay();
      return;
    }

    // Add to buffer for temporal stability (avoid noisy flickering)
    this.gestureBuffer.push(prediction.gesture);
    if (this.gestureBuffer.length > 8) {
      this.gestureBuffer.shift();
    }

    // Check if the same gesture is held consecutively
    const count = this.gestureBuffer.filter(g => g === prediction.gesture).length;
    const isStable = count >= 4;

    const confidencePct = Math.round(prediction.confidence * 100);

    if (this.gestureText) this.gestureText.textContent = prediction.english;
    if (this.hindiText) this.hindiText.textContent = prediction.hindi;
    if (this.confidenceBar) this.confidenceBar.style.width = `${confidencePct}%`;
    if (this.confidenceSubtext) this.confidenceSubtext.textContent = `${confidencePct}% confidence`;

    if (isStable && prediction.gesture !== this.lastSpokenGesture) {
      this.lastSpokenGesture = prediction.gesture;

      // Speak prediction if enabled
      const shouldSpeak = !this.speakPredictionsCheckbox || this.speakPredictionsCheckbox.checked;
      if (shouldSpeak && window.speechSynthesis) {
        this.speakText(prediction.hindi);
      }

      // Add to sentence
      this.addGestureToSentence(prediction);
    }
  }

  speakText(text) {
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }

  addGestureToSentence(prediction) {
    const item = {
      gesture: prediction.english,
      hindi: prediction.hindi,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };

    this.sentence.push(prediction.hindi);
    this.updateSentenceUI();

    if (this.historyTags) {
      const tag = document.createElement('span');
      tag.className = 'history-tag';
      tag.innerHTML = `<strong>${prediction.hindi}</strong> <small>(${prediction.english})</small>`;
      this.historyTags.prepend(tag);
    }
  }

  updateSentenceUI() {
    if (!this.sentenceText) return;
    if (this.sentence.length === 0) {
      this.sentenceText.textContent = 'No signs detected yet. Start signing to translate.';
    } else {
      this.sentenceText.textContent = this.sentence.join(' ');
    }
  }

  resetPredictionDisplay() {
    if (this.gestureText) this.gestureText.textContent = 'Waiting for hand...';
    if (this.hindiText) this.hindiText.textContent = 'हाथ दिखाएं...';
    if (this.confidenceBar) this.confidenceBar.style.width = '0%';
    if (this.confidenceSubtext) this.confidenceSubtext.textContent = '0% confidence';
  }

  async startPythonBackendMode() {
    try {
      this.isRunning = true;
      if (this.placeholderElement) this.placeholderElement.style.display = 'none';

      // Call Flask toggle camera endpoint
      const response = await fetch('http://localhost:5000/api/toggle_camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();

      if (data.status === 'started') {
        const img = document.createElement('img');
        img.id = 'pythonVideoFeed';
        img.src = 'http://localhost:5000/video_feed?' + new Date().getTime();
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';

        this.canvasElement.style.display = 'none';
        this.placeholderElement.parentNode.appendChild(img);

        if (this.toggleBtn) {
          this.toggleBtn.innerHTML = '<i class="fa-solid fa-stop"></i> Stop Backend';
          this.toggleBtn.classList.add('btn-stop');
        }

        // Poll predictions from backend
        this.backendPollInterval = setInterval(async () => {
          try {
            const predRes = await fetch('http://localhost:5000/api/prediction');
            const predData = await predRes.json();
            if (predData && predData.gesture) {
              this.handlePrediction({
                gesture: predData.gesture,
                hindi: predData.hindi || predData.gesture,
                english: predData.gesture,
                confidence: predData.confidence || 0.88
              });
            }
          } catch (e) {
            console.warn('Backend poll error', e);
          }
        }, 300);
      }
    } catch (e) {
      alert('Local Python backend is not running at http://localhost:5000. Start it with `python app.py` or switch mode to "Browser AI (MediaPipe Web)".');
      this.stop();
    }
  }
}
