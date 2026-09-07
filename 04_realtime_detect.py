import cv2
import numpy as np
import mediapipe as mp
from tensorflow.keras.models import load_model
from gtts import gTTS
import pygame
import os
import threading

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
def speak_gesture(gesture_name):
    text_to_speak = hindi_translation.get(gesture_name, gesture_name)
    
    try:
        # Generate Indian-accent audio file using gTTS (Hindi script / co.in TLD)
        tts = gTTS(text=text_to_speak, lang='hi', tld='co.in')
        filename = "temp_voice.mp3"
        tts.save(filename)
        
        # Play audio cleanly using pygame
        pygame.mixer.music.load(filename)
        pygame.mixer.music.play()
        while pygame.mixer.music.get_busy():
            pygame.time.Clock().tick(10)
            
        pygame.mixer.music.unload()
        
        # Clean up temporary file
        if os.path.exists(filename):
            os.remove(filename)
            
    except Exception as e:
        print(f"Voice Error: {e}")

# 3. Load Model and Actions
model = load_model('models/isl_model.h5')
actions = np.array(['Hello', 'ILoveYou', 'No', 'ThankYou', 'Yes'])

# 4. Initialize MediaPipe
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

def extract_keypoints(results):
    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]
        wrist = hand.landmark[0]  # Wrist landmark anchor
        
        # Calculate live keypoints relative to wrist
        keypoints = []
        for lm in hand.landmark:
            keypoints.extend([lm.x - wrist.x, lm.y - wrist.y, lm.z - wrist.z])
        return np.array(keypoints)
    return np.zeros(21 * 3)
# Tracking Variables
sequence = []
predictions = []
threshold = 0.75

current_gesture = ""
last_spoken_gesture = ""
frames_without_hand = 0

cap = cv2.VideoCapture(0)

with mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
) as hands:

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break

        frame = cv2.flip(frame, 1)
        image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        image.flags.writeable = False
        results = hands.process(image)
        image.flags.writeable = True
        image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

        # Process Hand Landmarks
        if results.multi_hand_landmarks:
            frames_without_hand = 0
            for hand_landmarks in results.multi_hand_landmarks:
                mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

            keypoints = extract_keypoints(results)
            sequence.append(keypoints)
            sequence = sequence[-30:]

            if len(sequence) == 30:
                res = model.predict(np.expand_dims(sequence, axis=0), verbose=0)[0]
                predicted_index = np.argmax(res)
                predictions.append(predicted_index)

                
                if res[predicted_index] > threshold:
                        detected_gesture = actions[predicted_index]
                        
                        # Trigger Voice only on NEW gesture
                        if detected_gesture != last_spoken_gesture:
                            current_gesture = detected_gesture
                            last_spoken_gesture = detected_gesture
                            
                            # Run Indian Voice on background thread to prevent camera lag
                            threading.Thread(target=speak_gesture, args=(current_gesture,), daemon=True).start()

        else:
            # Reset gesture lock after 20 frames without a hand
            frames_without_hand += 1
            if frames_without_hand > 20:
                last_spoken_gesture = ""
                current_gesture = ""
                sequence = []

        # Render On-Screen UI
        cv2.rectangle(image, (0, 0), (640, 60), (245, 117, 16), -1)
        
        if current_gesture:
            hindi_text = hindi_translation.get(current_gesture, "")
            display_text = f"Sign: {current_gesture} ({hindi_text})"
        else:
            display_text = "Waiting for gesture..."
            
        cv2.putText(image, display_text, (15, 40),
                    cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2, cv2.LINE_AA)

        cv2.imshow('Real-Time Gesture Translator', image)

        # Press 'q' to Quit
        if cv2.waitKey(10) & 0xFF == ord('q'):
            break

cap.release()