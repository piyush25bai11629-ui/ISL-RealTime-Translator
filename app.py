import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
from gtts import gTTS
import pygame
import os
import threading
from flask import Flask, render_template, Response, jsonify

app = Flask(__name__)

# Initialize Pygame Mixer for Audio Playback
pygame.mixer.init()

# 1. Hindi Translation Dictionary
hindi_translation = {
    'Hello': 'Namaste',
    'ThankYou': 'Dhanyawaad',
    'Yes': 'Haan',
    'No': 'Nahi',
    'ILoveYou': 'Main tumse pyaar karta hoon'
}

# 2.. Natural Indian Voice Function (gTTS)
audio_muted = False

def speak_gesture(gesture_name):
    if audio_muted:
        return
    text_to_speak = hindi_translation.get(gesture_name, gesture_name)
    try:
        tts = gTTS(text=text_to_speak, lang='hi', tld='co.in')
        filename = "temp_voice.mp3"
        tts.save(filename)
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
        pygame.mixer.music.unload()
        if os.path.exists(filename):
            os.remove(filename)
    except Exception as e:
        print(f"Voice Error: {e}")

# 3. Load Model and Actions
try:
    model = load_model('models/isl_model.h5')
except Exception as e:
    print(f"Model load error: {e}")
    model = None

actions = np.array(['Hello', 'ILoveYou', 'No', 'ThankYou', 'Yes'])

# 4. Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]
        wrist = hand.landmark[0]
        keypoints = []
        for lm in hand.landmark:
            keypoints.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
        return np.array(keypoints)
    return np.zeros(21 * 3)

overlay_landmarks = True

# Global Variables for sharing between video thread and API
current_prediction = {
    "gesture": "",
    "hindi": "",
    "confidence": 0.0
}
camera_active = False
cap = None

def generate_frames():
    global current_prediction, camera_active, cap
    
    sequence = []
    threshold = 0.75
    last_spoken_gesture = ""
    frames_without_hand = 0

    with mp_hands.Hands(
        max_num_hands=1,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5
    ) as hands:
        while camera_active and cap is not None and cap.isOpened():
            success, frame = cap.read()
            if not success:
                break
            
            frame = cv2.flip(frame, 1)
            image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            image.flags.writeable = False
            results = hands.process(image)
            image.flags.writeable = True
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

            if results.multi_hand_landmarks:
                frames_without_hand = 0
                if overlay_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)
                
                keypoints = extract_keypoints(results)
                sequence.append(keypoints)
                sequence = sequence[-30:]

                if len(sequence) == 30 and model:
                    res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                    predicted_index = np.argmax(res)
                    confidence = float(res[predicted_index])
                    
                    if confidence > threshold:
                        detected_gesture = actions[predicted_index]
                        
                        current_prediction['gesture'] = detected_gesture
                        current_prediction['hindi'] = hindi_translation.get(detected_gesture, "")
                        current_prediction['confidence'] = round(confidence * 100, 2)

                        if detected_gesture != last_spoken_gesture:
                            last_spoken_gesture = detected_gesture
                            threading.Thread(target=speak_gesture, args=(detected_gesture,), daemon=True).start()
            else:
                frames_without_hand += 1
                if frames_without_hand > 20:
                    last_spoken_gesture = ""
                    current_prediction['gesture'] = ""
                    current_prediction['hindi'] = ""
                    current_prediction['confidence'] = 0.0
                    sequence = []

            ret, buffer = cv2.imencode('.jpg', image)
            frame = buffer.tobytes()
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/video_feed')
def video_feed():
    global camera_active
    if not camera_active:
        return Response(status=204)
    return Response(generate_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

@app.route('/api/prediction')
def get_prediction():
    return jsonify(current_prediction)

@app.route('/api/toggle_camera', methods=['POST'])
def toggle_camera():
    global camera_active, cap
    if not camera_active:
        cap = cv2.VideoCapture(0)
        camera_active = True
        return jsonify({"status": "started"})
    else:
        camera_active = False
        if cap:
            cap.release()
            cap = None
        current_prediction['gesture'] = ""
        current_prediction['hindi'] = ""
        current_prediction['confidence'] = 0.0
        return jsonify({"status": "stopped"})

@app.route('/api/toggle_audio', methods=['POST'])
def toggle_audio():
    global audio_muted
    audio_muted = not audio_muted
    return jsonify({"muted": audio_muted})

@app.route('/api/toggle_overlay', methods=['POST'])
def toggle_overlay():
    global overlay_landmarks
    overlay_landmarks = not overlay_landmarks
    return jsonify({"overlay": overlay_landmarks})

if __name__ == '__main__':
    app.run(debug=False, threaded=True, host='0.0.0.0', port=5000)
