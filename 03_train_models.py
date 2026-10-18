import os
import numpy as np
from sklearn.model_selection import train_test_split
from tensorflow.keras.utils import to_categorical
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import LSTM, Dense, Dropout

# Configuration
DATA_PATH = os.path.join('data')
actions = np.array(['Hello', 'ILoveYou', 'No', 'ThankYou', 'Yes'])
no_sequences = 60
sequence_length = 30

label_map = {label: num for num, label in enumerate(actions)}
sequences, labels = [], []

print("Loading and normalizing existing collected dataset...")

for action in actions:
    for sequence in range(no_sequences):
        window = []
        for frame_num in range(sequence_length):
            res = np.load(os.path.join(DATA_PATH, action, str(sequence), f"{frame_num}.npy"))
            
            # Programmatically convert existing saved keypoints to wrist-relative
            keypoints = res.reshape(21, 3)
            wrist = keypoints[0]
            normalized = (keypoints - wrist).flatten()
            
            window.append(normalized)
            
        sequences.append(window)
        labels.append(label_map[action])

X = np.array(sequences)
y = to_categorical(labels).astype(int)

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.10, random_state=42)

# Improved LSTM Model Architecture with Dropout to prevent gesture confusion
model = Sequential([
    LSTM(64, return_sequences=True, activation='relu', input_shape=(30, 63)),
    Dropout(0.2),
    LSTM(128, return_sequences=False, activation='relu'),
    Dropout(0.2),
    Dense(64, activation='relu'),
    Dense(len(actions), activation='softmax')
])

model.compile(optimizer='Adam', loss='categorical_crossentropy', metrics=['categorical_accuracy'])

print("Training model on existing data...")
model.fit(X_train, y_train, epochs=200, batch_size=16, validation_data=(X_test, y_test))

# Save Retrained Model
os.makedirs('models', exist_ok=True)
model.save('models/isl_model.h5')
print("[SUCCESS] Model retrained and saved to models/isl_model.h5!")