# ISL Real-Time Translator 🤟🇮🇳
> **Real-Time Indian Sign Language Recognition & Translation Engine powered by Deep Learning, MediaPipe, and Natural Voice Synthesis.**

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)
[![Open Source](https://img.shields.io/badge/Open_Source-100%25-brightgreen.svg)](https://github.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Framework](https://img.shields.io/badge/Computer_Vision-MediaPipe_21_Landmarks-06b6d4.svg)](https://mediapipe.dev)
[![AI Architecture](https://img.shields.io/badge/Model-CNN_%2B_LSTM-f59e0b.svg)](https://tensorflow.org)

---

## 🌟 Overview & Mission

There are over **63 million deaf and hard-of-hearing individuals in India**. Yet, fewer than **350 certified Indian Sign Language (ISL) interpreters** exist nationwide—a catastrophic ratio of **1 interpreter per ~200,000 deaf citizens**.

Mainstream commercial speech-to-text and AI tools predominantly focus on **American Sign Language (ASL)**, which is completely incompatible with ISL due to distinct two-handed alphabets, regional dialects, and unique grammatical structures.

**ISL Real-Time Translator** bridges this divide by providing:
1. **Real-Time Computer Vision Translation**: Captures standard webcam video, extracts 21 spatial landmarks per hand with MediaPipe, and classifies isolated and temporal sign sequences with high accuracy.
2. **Bilingual Hindi & English Speech Output**: Automatically synthesizes natural Indian-accented Hindi voice (`gTTS` / Web Speech API) and provides dual subtitles.
3. **Dedicated Web Portal (Deployable on Vercel for Free)**: A complete, responsive web application showcasing the project mission, the societal struggles of the Deaf community, an interactive sign studio with in-browser landmark animation, bookmarking, and a high-resolution visual gallery.

---

## 🚀 Free Deployment on Vercel (1-Click)

The project includes an optimized static build (`index.html`, `css/style.css`, `js/app.js`, `vercel.json`) that can be hosted **100% free forever on Vercel's global edge network**:

### Method A: Deploy via GitHub (Recommended)
1. Push this repository to your GitHub account:
   ```bash
   git add .
   git commit -m "feat: dedicated website with bookmarks, gallery, and vercel config"
   git push origin main
   ```
2. Navigate to [vercel.com/new](https://vercel.com/new).
3. Import your `ISL-RealTime-Translator` repository.
4. Keep the default settings (**Framework Preset: Other**, **Root Directory: `./`**) and click **Deploy**.
5. Your live website will be accessible globally at `https://your-project.vercel.app` within 30 seconds!

### Method B: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm install -g vercel

# Deploy directly from terminal
vercel deploy --prod
```

---

## 📱 Dedicated Website Features

| Feature | Description |
| :--- | :--- |
| **3D Landmark Canvas HUD** | Interactive HTML5 canvas rendering 21 skeletal hand landmarks with smooth morphing animations and joint tooltips. |
| **The Deaf Community Barrier** | Comprehensive deep-dive into the 6 major systemic challenges faced by deaf Indians (Interpreter Deficit, Healthcare Anxiety, 85%+ School Dropouts, Employment Bias, ASL Monopoly, and Family Isolation). |
| **Interactive Sign Studio** | Explore core gestures (*Namaste, Dhanyawaad, Haan, Nahi, Pyar, Madad, Paani, Dost*), listen to authentic Hindi voice, and review signing instructions and cultural etiquette. |
| **Bookmark System** | Save signs, community studies, and gallery items to local storage with real-time badge count, slide-over drawer, JSON export, and quick playback. |
| **Visual Gallery & Lightbox** | Categorized high-resolution showcase with a native `<dialog closedby="any">` modal adhering to modern accessibility and scroll-containment standards. |
| **Dark & Light Themes** | Native theme switching with persistent user preference in `localStorage`. |
| **Advocacy & Emergency SOS** | Verified contact details and links for ISLRTC, National Association of the Deaf (NAD India), and Emergency 112 services. |

---

## 🧠 Technical Architecture & Pipeline

```
  [ Webcam / Camera Input ]
             │
             ▼
[ MediaPipe Hands (21 3D Landmarks) ]
  • Wrist anchor (landmark 0)
  • 20 finger joints (MCP, PIP, DIP, Tips)
             │
             ▼
[ Wrist-Relative Spatial Normalization ]
  • 63-dimensional coordinate feature vector: [x - wrist_x, y - wrist_y, z - wrist_z]
  • Scale and distance invariant
             │
             ▼
[ Temporal Sequence Window (30 Frames) ]
             │
             ▼
[ Deep Learning Classifier (CNN + LSTM) ]
  • isl_model.h5
             │
             ▼
[ Natural Speech & Bilingual Subtitles ]
  • Hindi Voice: Namaste / Dhanyawaad / Haan / Nahi / Main tumse pyaar karta hoon
  • English Captions: Hello / Thank You / Yes / No / I Love You
```

---

## 💻 Running the Python Real-Time Camera App Locally

To use your physical webcam for live sign detection and speech:

1. **Clone the repository and set up a virtual environment**:
   ```bash
   git clone https://github.com/your-username/ISL-RealTime-Translator.git
   cd ISL-RealTime-Translator
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Launch the Real-Time Detection application**:
   - Web App (Flask Dashboard):
     ```bash
     python app.py
     ```
     Open `http://localhost:5000` in your browser.
   - Desktop OpenCV App:
     ```bash
     python 04_realtime_detect.py
     ```

---

## 📂 Project Directory Structure

```plaintext
ISL-RealTime-Translator/
├── index.html               # Dedicated Master Website (Vercel Production)
├── vercel.json              # Vercel routing, cache, and security headers
├── package.json             # Web metadata and local preview scripts
├── css/
│   └── style.css            # Responsive master design system & glassmorphism
├── js/
│   ├── app.js               # Application logic, audio engine, canvas & bookmarks
│   └── landmarks-data.js    # 21-joint coordinates, dictionary, challenges & gallery
├── images/                  # High-resolution gallery and technology imagery
│   ├── isl_hands_ai.jpg
│   ├── isl_community.jpg
│   ├── isl_education.jpg
│   ├── isl_gesture_thankyou.jpg
│   ├── isl_assistive_tech.jpg
│   └── isl_mediapipe_landmarks.jpg
├── app.py                   # Local Flask camera inference server with gTTS
├── 01_hand_tracking.py      # MediaPipe baseline tracking script
├── 02_collect_data.py       # Landmark coordinate recording script
├── 03_train_models.py       # LSTM / Deep Learning training pipeline
├── 04_realtime_detect.py    # Standalone OpenCV real-time translator
├── models/
│   └── isl_model.h5         # Trained Keras neural network model
└── requirements.txt         # Python dependencies
```

---

## 🤝 Community & Support

- **ISLRTC (Indian Sign Language Research and Training Centre)**: [islrtc.nic.in](http://www.islrtc.nic.in)
- **National Association of the Deaf (NAD India)**: [nadindia.org](https://nadindia.org)
- **Emergency Helpline**: Dial or SMS **112** across India for SOS video/text relay assistance.

---

## 📄 License
This project is open-source under the [MIT License](LICENSE). Built for social good, accessibility, and deaf empowerment.
