import cv2
import numpy as np
import os
import mediapipe as mp

# 1. Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils

# 2. Configuration matching your screenshot
DATA_PATH = os.path.join('data') 
# Gestures matching your folder names
actions = np.array(['Hello', 'ILoveYou', 'No', 'ThankYou', 'Yes'])
no_sequences = 60       # Number of clips per gesture
sequence_length = 30    # Number of frames per clip

# 3. Create folder structure in 'data' directory
for action in actions:
    for sequence in range(no_sequences):
        try: 
            os.makedirs(os.path.join(DATA_PATH, action, str(sequence)))
        except:
            pass

# Helper function to extract 63 hand landmarks
def extract_keypoints(results):
    if results.multi_hand_landmarks:
        hand = results.multi_hand_landmarks[0]
        return np.array([[res.x, res.y, res.z] for res in hand.landmark]).flatten()
    return np.zeros(21 * 3)

# 4. Main Collection Loop
cap = cv2.VideoCapture(0)

with mp_hands.Hands(
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
) as hands:
    
    for action in actions:
        for sequence in range(no_sequences):
            for frame_num in range(sequence_length):

                ret, frame = cap.read()
                if not ret:
                    break

                # Mirror frame for a natural mirror-like view
                frame = cv2.flip(frame, 1)

                # Process with MediaPipe
                image = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                image.flags.writeable = False
                results = hands.process(image)
                image.flags.writeable = True
                image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)

                # Draw landmarks on the hand
                if results.multi_hand_landmarks:
                    for hand_landmarks in results.multi_hand_landmarks:
                        mp_drawing.draw_landmarks(image, hand_landmarks, mp_hands.HAND_CONNECTIONS)

                # --- NEW PROMPT LOGIC ---
                if frame_num == 0:
                    # Message asking you to show your hand
                    cv2.putText(image, 'SHOW YOUR HAND FOR RECORDING...', (10, 200),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 255, 0), 3, cv2.LINE_AA)
                    cv2.putText(image, f'Next: "{action}" - Clip #{sequence}', (15, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
                    cv2.imshow('Webcam Data Collection', image)
                    
                    # 3-second pause to give you time to pose
                    cv2.waitKey(3000) 
                else:
                    # Active recording text
                    cv2.putText(image, f'RECORDING "{action}" - Clip #{sequence}', (15, 30),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 2, cv2.LINE_AA)
                    cv2.imshow('Webcam Data Collection', image)

                # Save coordinate data to .npy files
                keypoints = extract_keypoints(results)
                npy_path = os.path.join(DATA_PATH, action, str(sequence), str(frame_num))
                np.save(npy_path, keypoints)

                # Press 'q' to quit early
                if cv2.waitKey(10) & 0xFF == ord('q'):
                    break

cap.release()
cv2.destroyAllWindows()