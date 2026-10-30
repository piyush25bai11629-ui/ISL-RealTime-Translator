/**
 * Real-Time ISL Webcam Recognition & Recording Engine
 * 100% In-Browser MediaPipe Hands Client-Side AI (No Terminal Required on Vercel).
 * Matches OpenCV 04_realtime_detect.py output: Hello, Namaste, confidence level, and authentic Indian voice!
 */

import { classifyGestureFromLandmarks } from './gesture-classifier.js';
import { HAND_CONNECTIONS, ISL_SIGNS } from './landmarks-data.js';

export class DashboardWebcamEngine {
  constructor() {
    // Primary Video & Canvas Elements
    this.videoElement = document.getElementById('videoElement');
    this.canvasElement = document.getElementById('gestureCanvas');
    this.videoFeed = document.getElementById('videoFeed');
    this.videoPanel = document.querySelector('.video-panel');
    this.cameraPlaceholder = document.getElementById('cameraPlaceholder');
    
    // Buttons & Controls
    this.toggleCameraBtn = document.getElementById('toggleCameraBtn');
    this.heroStartCameraBtn = document.getElementById('heroStartCameraBtn');
    this.resetBtn = document.getElementById('resetBtn');
    this.backendBtn = document.getElementById('backendBtn');
    this.exportCorrectionsBtn = document.getElementById('exportCorrectionsBtn');
    this.correctionCount = document.getElementById('correctionCount');
    this.snapshotBtn = document.getElementById('snapshotBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');

    // Toggles
    this.landmarkOverlay = document.getElementById('landmarkOverlay');
    this.speakPredictions = document.getElementById('speakPredictions');

    // Right Column Elements (Identical to 04_realtime_detect.py output)
    this.gestureText = document.getElementById('gestureText');
    this.hindiText = document.getElementById('hindiText');
    this.confidenceBar = document.getElementById('confidenceBar');
    this.confidenceSubtext = document.getElementById('confidenceSubtext');
    this.replayVoiceBtn = document.getElementById('replayVoiceBtn');

    // Sentence Panel
    this.sentenceText = document.getElementById('sentenceText');
    this.speakingStatus = document.getElementById('speakingStatus');
    this.clearSentenceBtn = document.getElementById('clearSentenceBtn');
    this.copySentenceBtn = document.getElementById('copySentenceBtn');
    this.speakSentenceBtn = document.getElementById('speakSentenceBtn');
    this.historyTags = document.getElementById('historyTags');

    // Practice / Challenge Mode Element
    this.practiceTargetName = document.getElementById('practiceTargetName');
    this.practiceStatusText = document.getElementById('practiceStatusText');
    this.practiceTarget = 'Hello'; // Default target to practice

    // Telemetry Stats
    this.throughputVal = document.getElementById('throughputVal');
    this.endToEndLatency = document.getElementById('endToEndLatency');
    this.landmarksLatency = document.getElementById('landmarksLatency');
    this.inferenceLatency = document.getElementById('inferenceLatency');
    this.frameCountTotal = document.getElementById('frameCountTotal');
    this.predCountTotal = document.getElementById('predCountTotal');

    this.ctx = this.canvasElement ? this.canvasElement.getContext('2d') : null;

    // State
    this.isRunning = false;
    this.isPythonMode = false;
    this.cameraInstance = null;
    this.handsInstance = null;
    this.pythonInterval = null;
    this.currentAudio = null;

    this.frameCount = 0;
    this.predictionCount = 0;
    this.corrections = [];
    this.sentence = [];
    this.gestureBuffer = [];
    this.lastSpokenGesture = '';
    this.currentDetectedSign = null;
    this.lastFrameTime = performance.now();

    this.init();
  }

  init() {
    // 1-Click Start Camera buttons
    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
    }
    if (this.heroStartCameraBtn) {
      this.heroStartCameraBtn.addEventListener('click', () => this.start());
    }

    if (this.resetBtn) {
      this.resetBtn.addEventListener('click', () => this.resetAll());
    }

    // Sentence Actions
    if (this.clearSentenceBtn) {
      this.clearSentenceBtn.addEventListener('click', () => {
        this.sentence = [];
        this.updateSentenceDisplay();
        if (this.historyTags) this.historyTags.innerHTML = '';
      });
    }

    if (this.copySentenceBtn) {
      this.copySentenceBtn.addEventListener('click', () => this.copySentence());
    }

    if (this.speakSentenceBtn) {
      this.speakSentenceBtn.addEventListener('click', () => this.speakFullSentence());
    }

    // Replay Audio button
    if (this.replayVoiceBtn) {
      this.replayVoiceBtn.addEventListener('click', () => this.replayCurrentAudio());
    }

    // Snapshot button
    if (this.snapshotBtn) {
      this.snapshotBtn.addEventListener('click', () => this.takeSnapshot());
    }

    // Theater / Fullscreen button
    if (this.fullscreenBtn) {
      this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Local Backend Toggle (Advanced mode)
    if (this.backendBtn) {
      this.backendBtn.addEventListener('click', () => this.toggleBackendMode());
    }

    if (this.exportCorrectionsBtn) {
      this.exportCorrectionsBtn.addEventListener('click', () => this.exportCorrections());
    }

    // Quick Simulation / Demo Buttons (Enables testing on Vercel without webcam)
    const simButtons = document.querySelectorAll('[data-simulate-sign]');
    simButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const sign = btn.getAttribute('data-simulate-sign');
        this.simulateSign(sign);
      });
    });

    // Close Fullscreen on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.videoPanel && this.videoPanel.classList.contains('fullscreen-theater')) {
        this.toggleFullscreen();
      }
    });
  }

  toggleBackendMode() {
    this.isPythonMode = !this.isPythonMode;
    if (this.backendBtn) {
      if (this.isPythonMode) {
        this.backendBtn.textContent = 'Using Python Backend';
        this.backendBtn.classList.add('active');
      } else {
        this.backendBtn.textContent = 'In-Browser AI (Default)';
        this.backendBtn.classList.remove('active');
      }
    }
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }

  async toggleCamera() {
    if (this.isRunning) {
      await this.stop();
    } else {
      await this.start();
    }
  }

  async start() {
    if (this.isPythonMode) {
      await this.startPythonMode();
      return;
    }
    await this.startInBrowserMode();
  }

  async stop() {
    this.isRunning = false;

    // Stop MediaPipe Camera
    if (this.cameraInstance) {
      try { await this.cameraInstance.stop(); } catch (e) { console.warn(e); }
      this.cameraInstance = null;
    }

    // Stop WebRTC tracks
    if (this.videoElement && this.videoElement.srcObject) {
      const stream = this.videoElement.srcObject;
      const tracks = stream.getTracks();
      tracks.forEach(track => track.stop());
      this.videoElement.srcObject = null;
    }

    // Clear Python polling
    if (this.pythonInterval) {
      clearInterval(this.pythonInterval);
      this.pythonInterval = null;
    }

    // Update UI elements
    if (this.canvasElement) this.canvasElement.style.display = 'none';
    if (this.videoFeed) this.videoFeed.style.display = 'none';
    if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'flex';

    if (this.toggleCameraBtn) {
      this.toggleCameraBtn.textContent = 'Start';
      this.toggleCameraBtn.classList.remove('btn-stop');
    }

    if (this.speakingStatus) {
      this.speakingStatus.textContent = 'Idle';
      this.speakingStatus.classList.remove('active');
    }

    this.currentDetectedSign = null;
    this.resetSignDisplay();
  }

  async startInBrowserMode() {
    try {
      if (this.toggleCameraBtn) this.toggleCameraBtn.disabled = true;

      // Ensure MediaPipe is loaded
      if (typeof window.Hands === 'undefined') {
        const placeholderText = this.cameraPlaceholder ? this.cameraPlaceholder.querySelector('p') : null;
        if (placeholderText) {
          placeholderText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Loading MediaPipe neural vision models from CDN... Please wait a few seconds.';
        }
        await new Promise(resolve => setTimeout(resolve, 1500));
        if (typeof window.Hands === 'undefined') {
          alert('MediaPipe Hands is initializing. Please click Start again in 3 seconds.');
          if (this.toggleCameraBtn) this.toggleCameraBtn.disabled = false;
          return;
        }
      }

      this.handsInstance = new window.Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      });

      this.handsInstance.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });

      this.handsInstance.onResults((results) => this.onHandResults(results));

      // Request webcam stream with friendly error catching
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false
      });

      this.videoElement.srcObject = stream;
      await this.videoElement.play();

      this.canvasElement.width = 640;
      this.canvasElement.height = 480;

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
      if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'none';
      if (this.canvasElement) this.canvasElement.style.display = 'block';

      if (this.toggleCameraBtn) {
        this.toggleCameraBtn.textContent = 'Stop';
        this.toggleCameraBtn.classList.add('btn-stop');
        this.toggleCameraBtn.disabled = false;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Webcam Access Error: ' + err.message + '\nPlease allow camera permission in your browser URL bar.');
      if (this.toggleCameraBtn) this.toggleCameraBtn.disabled = false;
      this.stop();
    }
  }

  onHandResults(results) {
    if (!this.isRunning || !this.ctx) return;

    const tStart = performance.now();
    const dt = tStart - this.lastFrameTime;
    this.lastFrameTime = tStart;

    this.frameCount++;
    if (this.frameCountTotal) this.frameCountTotal.textContent = this.frameCount;

    const fps = Math.round(1000 / (dt || 30));
    if (this.throughputVal) this.throughputVal.innerHTML = `${fps}.0 <small>fps</small>`;

    const w = this.canvasElement.width;
    const h = this.canvasElement.height;

    this.ctx.save();
    this.ctx.clearRect(0, 0, w, h);

    // Mirror video for natural, intuitive signing (like looking into a mirror)
    this.ctx.translate(w, 0);
    this.ctx.scale(-1, 1);
    this.ctx.drawImage(results.image, 0, 0, w, h);

    const showOverlay = !this.landmarkOverlay || this.landmarkOverlay.checked;

    const tLandmarksStart = performance.now();
    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      const landmarks = results.multiHandLandmarks[0];

      if (showOverlay) {
        // Draw Skeleton Connections
        this.ctx.lineWidth = 3;
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const p1 = landmarks[startIdx];
          const p2 = landmarks[endIdx];
          if (!p1 || !p2) continue;

          this.ctx.strokeStyle = '#3b82f6';
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x * w, p1.y * h);
          this.ctx.lineTo(p2.x * w, p2.y * h);
          this.ctx.stroke();
        }

        // Draw 21 Landmark Joint Dots
        for (let i = 0; i < landmarks.length; i++) {
          const pt = landmarks[i];
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const isWrist = i === 0;

          this.ctx.beginPath();
          this.ctx.arc(pt.x * w, pt.y * h, isTip ? 6 : (isWrist ? 7 : 4.5), 0, Math.PI * 2);
          this.ctx.fillStyle = isTip ? '#ef4444' : (isWrist ? '#10b981' : '#3b82f6');
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        }
      }

      this.ctx.restore();

      const tLandmarksEnd = performance.now();
      const landmarkTime = (tLandmarksEnd - tLandmarksStart).toFixed(1);
      if (this.landmarksLatency) this.landmarksLatency.innerHTML = `${landmarkTime} <small>ms</small>`;

      // Classification
      const tInferStart = performance.now();
      const prediction = classifyGestureFromLandmarks(landmarks);
      const tInferEnd = performance.now();
      const inferTime = (tInferEnd - tInferStart).toFixed(1);
      if (this.inferenceLatency) this.inferenceLatency.innerHTML = `${inferTime} <small>ms</small>`;

      const totalLatency = (tInferEnd - tStart).toFixed(1);
      if (this.endToEndLatency) this.endToEndLatency.innerHTML = `${totalLatency} <small>ms</small>`;

      this.currentDetectedSign = prediction;
      this.drawOnScreenHUD();
      this.handlePrediction(prediction);

    } else {
      this.ctx.restore();
      if (this.landmarksLatency) this.landmarksLatency.innerHTML = `0.0 <small>ms</small>`;
      if (this.inferenceLatency) this.inferenceLatency.innerHTML = `0.0 <small>ms</small>`;
      this.currentDetectedSign = null;
      this.drawOnScreenHUD();
      this.handlePrediction(null);
    }
  }

  /**
   * Draws the exact on-screen OpenCV HUD header banner on the canvas
   * Matches 04_realtime_detect.py: cv2.rectangle(image, (0, 0), (640, 60), (245, 117, 16), -1)
   * Displays: "Sign: Hello (Namaste)" with confidence pill!
   */
  drawOnScreenHUD() {
    if (!this.ctx) return;
    const w = this.canvasElement.width;
    const bannerHeight = 56;

    this.ctx.save();

    // Vibrant OpenCV Orange when gesture active, sleek dark slate when waiting
    if (this.currentDetectedSign) {
      this.ctx.fillStyle = 'rgba(245, 117, 16, 0.96)'; // Exact OpenCV color (245, 117, 16)
    } else {
      this.ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
    }
    this.ctx.fillRect(0, 0, w, bannerHeight);

    // Glowing divider line
    this.ctx.strokeStyle = this.currentDetectedSign ? '#fb923c' : '#334155';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(0, bannerHeight);
    this.ctx.lineTo(w, bannerHeight);
    this.ctx.stroke();

    // Left Text: "Sign: Hello (Namaste)" or "Waiting for gesture..."
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 20px "Outfit", "Inter", sans-serif';
    this.ctx.textBaseline = 'middle';

    if (this.currentDetectedSign) {
      const displayLabel = `Sign: ${this.currentDetectedSign.english} (${this.currentDetectedSign.hindi})`;
      this.ctx.fillText(displayLabel, 16, bannerHeight / 2);

      // Right-aligned Confidence Level Badge
      const confPct = Math.round(this.currentDetectedSign.confidence * 100);
      const confText = `${confPct}% Confidence`;
      
      this.ctx.font = 'bold 14px "Inter", sans-serif';
      const confWidth = this.ctx.measureText(confText).width;
      const badgeX = w - confWidth - 32;

      // Dark translucent pill container
      this.ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      this.ctx.beginPath();
      if (this.ctx.roundRect) {
        this.ctx.roundRect(badgeX, 12, confWidth + 20, 32, 16);
      } else {
        this.ctx.rect(badgeX, 12, confWidth + 20, 32);
      }
      this.ctx.fill();

      // Neon green confidence label
      this.ctx.fillStyle = '#4ade80';
      this.ctx.fillText(confText, badgeX + 10, bannerHeight / 2);

    } else {
      this.ctx.fillStyle = '#94a3b8';
      this.ctx.fillText('Waiting for gesture...', 16, bannerHeight / 2);
    }

    this.ctx.restore();
  }

  handlePrediction(prediction) {
    if (!prediction) {
      this.gestureBuffer = [];
      this.resetSignDisplay();
      return;
    }

    this.gestureBuffer.push(prediction.gesture);
    if (this.gestureBuffer.length > 8) {
      this.gestureBuffer.shift();
    }

    const count = this.gestureBuffer.filter(g => g === prediction.gesture).length;
    const isStable = count >= 3;
    const confidencePct = Math.round(prediction.confidence * 100);

    // Update Right Column Current Sign UI (Keeps previous output exact)
    if (this.gestureText) this.gestureText.textContent = prediction.english;
    if (this.hindiText) this.hindiText.textContent = `${prediction.hindi} (${prediction.english})`;
    if (this.confidenceBar) this.confidenceBar.style.width = `${confidencePct}%`;
    if (this.confidenceSubtext) this.confidenceSubtext.textContent = `${confidencePct}% confidence`;

    // Check Practice Match Challenge
    this.checkPracticeChallenge(prediction.gesture, confidencePct);

    // Trigger speech and sentence addition on stable new sign
    if (isStable && prediction.gesture !== this.lastSpokenGesture) {
      this.lastSpokenGesture = prediction.gesture;
      this.predictionCount++;
      if (this.predCountTotal) this.predCountTotal.textContent = this.predictionCount;

      // Speak predictions using authentic Indian MP3 or Web Speech
      this.speakGesture(prediction.gesture, prediction.hindi);

      // Add to sentence builder
      this.addGestureToSentence(prediction);

      // Record correction log
      this.corrections.push({
        gesture: prediction.english,
        hindi: prediction.hindi,
        confidence: confidencePct,
        timestamp: new Date().toISOString()
      });
      if (this.correctionCount) this.correctionCount.textContent = this.corrections.length;
    }
  }

  /**
   * Natural Indian Voice Function
   * Plays the pre-recorded authentic gTTS Indian MP3 files (audio/Hello.mp3, etc.)
   * Fallback to Web Speech API
   */
  speakGesture(gestureName, hindiText) {
    const shouldSpeak = !this.speakPredictions || this.speakPredictions.checked;
    if (!shouldSpeak) return;

    const audioMap = {
      'Hello': 'audio/Hello.mp3',
      'ThankYou': 'audio/ThankYou.mp3',
      'Yes': 'audio/Yes.mp3',
      'No': 'audio/No.mp3',
      'ILoveYou': 'audio/ILoveYou.mp3'
    };

    const audioSrc = audioMap[gestureName];

    if (this.speakingStatus) {
      this.speakingStatus.textContent = `Speaking: "${hindiText || gestureName}"`;
      this.speakingStatus.classList.add('active');
    }

    if (audioSrc) {
      if (this.currentAudio) {
        try { this.currentAudio.pause(); } catch (e) {}
      }
      this.currentAudio = new Audio(audioSrc);
      this.currentAudio.volume = 1.0;
      this.currentAudio.onended = () => {
        if (this.speakingStatus) {
          this.speakingStatus.textContent = 'Idle';
          this.speakingStatus.classList.remove('active');
        }
      };
      this.currentAudio.play().catch(() => {
        this.speakBrowserSynthesis(hindiText || gestureName);
      });
    } else {
      this.speakBrowserSynthesis(hindiText || gestureName);
    }
  }

  replayCurrentAudio() {
    if (this.currentDetectedSign) {
      this.speakGesture(this.currentDetectedSign.gesture, this.currentDetectedSign.hindi);
    } else if (this.lastSpokenGesture) {
      this.speakGesture(this.lastSpokenGesture, this.lastSpokenGesture);
    } else {
      this.speakGesture('Hello', 'Namaste');
    }
  }

  speakBrowserSynthesis(text) {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'hi-IN';
      utterance.rate = 1.0;
      utterance.onend = () => {
        if (this.speakingStatus) {
          this.speakingStatus.textContent = 'Idle';
          this.speakingStatus.classList.remove('active');
        }
      };
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech error:', e);
    }
  }

  addGestureToSentence(prediction) {
    this.sentence.push(prediction.hindi);
    this.updateSentenceDisplay();

    if (this.historyTags) {
      const tag = document.createElement('span');
      tag.className = 'history-item';
      tag.innerHTML = `<strong>${prediction.hindi}</strong> (${prediction.english})`;
      this.historyTags.prepend(tag);
    }
  }

  updateSentenceDisplay() {
    if (!this.sentenceText) return;
    if (this.sentence.length === 0) {
      this.sentenceText.textContent = 'No signs detected yet.';
    } else {
      this.sentenceText.textContent = this.sentence.join(' ');
    }
  }

  copySentence() {
    if (this.sentence.length === 0) {
      alert('No signs in sentence to copy!');
      return;
    }
    const text = this.sentence.join(' ');
    navigator.clipboard.writeText(text).then(() => {
      const originalText = this.copySentenceBtn.innerHTML;
      this.copySentenceBtn.innerHTML = '<i class="fa-solid fa-check"></i> Copied!';
      setTimeout(() => {
        this.copySentenceBtn.innerHTML = originalText;
      }, 1800);
    });
  }

  speakFullSentence() {
    if (this.sentence.length === 0) {
      alert('Sentence is empty!');
      return;
    }
    const fullText = this.sentence.join(' ');
    this.speakBrowserSynthesis(fullText);
  }

  takeSnapshot() {
    if (!this.canvasElement) return;

    // If camera is stopped, start a test snapshot
    if (!this.isRunning) {
      alert('Please start the webcam or click a Simulate Sign button before capturing a snapshot.');
      return;
    }

    const dataUrl = this.canvasElement.toDataURL('image/png');
    const signName = this.currentDetectedSign ? this.currentDetectedSign.english : 'gesture';
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ISL_Snapshot_${signName}_${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  }

  toggleFullscreen() {
    if (!this.videoPanel) return;
    this.videoPanel.classList.toggle('fullscreen-theater');
    const isTheater = this.videoPanel.classList.contains('fullscreen-theater');
    if (this.fullscreenBtn) {
      this.fullscreenBtn.innerHTML = isTheater 
        ? '<i class="fa-solid fa-compress"></i> Exit' 
        : '<i class="fa-solid fa-expand"></i> Theater';
    }
  }

  checkPracticeChallenge(gesture, confidencePct) {
    if (!this.practiceStatusText) return;
    if (gesture.toLowerCase() === this.practiceTarget.toLowerCase() && confidencePct >= 85) {
      this.practiceStatusText.innerHTML = `<span class="practice-status matched"><i class="fa-solid fa-circle-check"></i> 🎯 MATCH CONFIRMED! ${gesture} (${confidencePct}%)</span>`;
    }
  }

  /**
   * Simulation / Demo function
   * Enables testing the real-time pipeline instantly with 1-click on Vercel without a camera!
   */
  simulateSign(signKey) {
    const simMap = {
      'Hello': { gesture: 'Hello', hindi: 'Namaste', english: 'Hello', confidence: 0.97 },
      'ThankYou': { gesture: 'ThankYou', hindi: 'Dhanyawaad', english: 'ThankYou', confidence: 0.94 },
      'Yes': { gesture: 'Yes', hindi: 'Haan', english: 'Yes', confidence: 0.95 },
      'No': { gesture: 'No', hindi: 'Nahi', english: 'No', confidence: 0.92 },
      'ILoveYou': { gesture: 'ILoveYou', hindi: 'Main tumse pyaar karta hoon', english: 'ILoveYou', confidence: 0.96 },
      'Water': { gesture: 'Water', hindi: 'Paani', english: 'Water', confidence: 0.91 }
    };

    const simData = simMap[signKey] || simMap['Hello'];

    // If camera canvas is not open, open canvas
    if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'none';
    if (this.canvasElement) {
      this.canvasElement.style.display = 'block';
      this.canvasElement.width = 640;
      this.canvasElement.height = 480;
    }

    // Draw simulated background and hand skeleton
    if (this.ctx) {
      const w = 640;
      const h = 480;
      this.ctx.fillStyle = '#0f172a';
      this.ctx.fillRect(0, 0, w, h);

      // Find landmark template from ISL_SIGNS
      const signTemplate = ISL_SIGNS.find(s => s.name.toLowerCase().includes(simData.english.toLowerCase()));
      if (signTemplate && signTemplate.landmarks) {
        // Draw Skeleton Lines
        this.ctx.lineWidth = 3;
        for (const [startIdx, endIdx] of HAND_CONNECTIONS) {
          const p1 = signTemplate.landmarks[startIdx];
          const p2 = signTemplate.landmarks[endIdx];
          if (!p1 || !p2) continue;
          this.ctx.strokeStyle = '#3b82f6';
          this.ctx.beginPath();
          this.ctx.moveTo(p1.x * w, p1.y * h);
          this.ctx.lineTo(p2.x * w, p2.y * h);
          this.ctx.stroke();
        }

        // Draw Joints
        for (let i = 0; i < signTemplate.landmarks.length; i++) {
          const pt = signTemplate.landmarks[i];
          const isTip = [4, 8, 12, 16, 20].includes(i);
          const isWrist = i === 0;
          this.ctx.beginPath();
          this.ctx.arc(pt.x * w, pt.y * h, isTip ? 6 : (isWrist ? 7 : 4.5), 0, Math.PI * 2);
          this.ctx.fillStyle = isTip ? '#ef4444' : (isWrist ? '#10b981' : '#3b82f6');
          this.ctx.fill();
          this.ctx.strokeStyle = '#ffffff';
          this.ctx.lineWidth = 1.5;
          this.ctx.stroke();
        }
      }
    }

    this.currentDetectedSign = simData;
    this.drawOnScreenHUD();
    this.handlePrediction(simData);
  }

  resetSignDisplay() {
    if (this.gestureText) this.gestureText.textContent = 'Waiting...';
    if (this.hindiText) this.hindiText.textContent = '';
    if (this.confidenceBar) this.confidenceBar.style.width = '0%';
    if (this.confidenceSubtext) this.confidenceSubtext.textContent = '0% confidence';
  }

  resetAll() {
    this.sentence = [];
    this.updateSentenceDisplay();
    if (this.historyTags) this.historyTags.innerHTML = '';
    this.frameCount = 0;
    this.predictionCount = 0;
    this.corrections = [];
    if (this.frameCountTotal) this.frameCountTotal.textContent = 0;
    if (this.predCountTotal) this.predCountTotal.textContent = 0;
    if (this.correctionCount) this.correctionCount.textContent = 0;
    this.resetSignDisplay();
  }

  exportCorrections() {
    if (this.corrections.length === 0) {
      alert('No corrections or gesture events recorded yet. Start camera and sign to log predictions.');
      return;
    }
    const json = JSON.stringify(this.corrections, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isl_corrections_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async startPythonMode() {
    try {
      this.isRunning = true;
      if (this.cameraPlaceholder) this.cameraPlaceholder.style.display = 'none';

      const res = await fetch('http://localhost:5000/api/toggle_camera', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (data.status === 'started') {
        if (this.videoFeed) {
          this.videoFeed.src = 'http://localhost:5000/video_feed?' + new Date().getTime();
          this.videoFeed.style.display = 'block';
        }
        if (this.canvasElement) this.canvasElement.style.display = 'none';

        if (this.toggleCameraBtn) {
          this.toggleCameraBtn.textContent = 'Stop';
          this.toggleCameraBtn.classList.add('btn-stop');
        }

        this.pythonInterval = setInterval(async () => {
          try {
            const predRes = await fetch('http://localhost:5000/api/prediction');
            const pred = await predRes.json();
            if (pred && pred.gesture) {
              this.handlePrediction({
                gesture: pred.gesture,
                hindi: pred.hindi || pred.gesture,
                english: pred.gesture,
                confidence: pred.confidence || 0.85
              });
            }
          } catch (e) {
            console.warn('Backend poll error:', e);
          }
        }, 250);
      }
    } catch (e) {
      alert('Local Python backend is not running at http://localhost:5000.\nTo run it: open terminal and run `python app.py`.\nOr use the default In-Browser AI mode.');
      this.stop();
    }
  }
}
