import cv2
import numpy as np
import os
import mediapipe as mp

# Actions and Configuration
actions = np.array(['Hello', 'ThankYou', 'Yes', 'No', 'ILoveYou'])
sequence_length = 30

VIDEO_DATASET_PATH = 'video_dataset'
DATA_PATH = 'data'

# Initialize MediaPipe Hands
mp_hands = mp.solutions.hands
hands = mp_hands.Hands(
    static_image_mode=False,
    max_num_hands=1,
    min_detection_confidence=0.5,
    min_tracking_confidence=0.5
)

# Process each gesture folder
for action in actions:
    video_dir = os.path.join(VIDEO_DATASET_PATH, action)
    if not os.path.exists(video_dir):
        print(f"Directory missing: {video_dir}. Create it and add .mp4 files.")
        continue

    video_files = [f for f in os.listdir(video_dir) if f.endswith(('.mp4', '.avi', '.mov'))]
    print(f"\nProcessing '{action}' ({len(video_files)} videos found)...")

    for seq_num, video_file in enumerate(video_files):
        if seq_num >= 10:  # Cap at 10 sequences per gesture
            break

        video_path = os.path.join(video_dir, video_file)
        cap = cv2.VideoCapture(video_path)
        
        sequence_data = []
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            results = hands.process(rgb_frame)

            if results.multi_hand_landmarks:
                landmarks = []
                for hand_landmarks in results.multi_hand_landmarks:
                    for lm in hand_landmarks.landmark:
                        landmarks.extend([lm.x, lm.y, lm.z])
                    break
                keypoints = np.array(landmarks)
            else:
                keypoints = np.zeros(21 * 3)

            sequence_data.append(keypoints)

        cap.release()

        # Resample or trim sequence to exactly 30 frames
        if len(sequence_data) == 0:
            print(f"  [X] Warning: No hand detected in {video_file}")
            continue

        indices = np.linspace(0, len(sequence_data) - 1, sequence_length, dtype=int)
        final_sequence = [sequence_data[idx] for idx in indices]

        # Save to data directory
        save_dir = os.path.join(DATA_PATH, action, str(seq_num))
        os.makedirs(save_dir, exist_ok=True)

        for frame_idx, keypoints in enumerate(final_sequence):
            npy_path = os.path.join(save_dir, f"{frame_idx}.npy")
            np.save(npy_path, keypoints)

        print(f"  [✓] Processed: {video_file} -> Folder '{seq_num}' ({sequence_length} frames)")

print("\nVideo Dataset Processing Complete!")