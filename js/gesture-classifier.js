/**
 * Real-Time Client-Side ISL Gesture Classifier
 * Operates on 21 MediaPipe 3D Hand Landmarks directly inside the browser.
 */

// Calculate Euclidean distance between two 3D points
function dist(p1, p2) {
  return Math.hypot(p1.x - p2.x, p1.y - p2.y, (p1.z || 0) - (p2.z || 0));
}

// Check if a finger is extended relative to the wrist
function isFingerExtended(landmarks, tipIdx, pipIdx, mcpIdx) {
  const wrist = landmarks[0];
  const dTip = dist(landmarks[tipIdx], wrist);
  const dPip = dist(landmarks[pipIdx], wrist);
  const dMcp = dist(landmarks[mcpIdx], wrist);
  return dTip > dPip && dPip > dMcp;
}

// Thumb extension check
function isThumbExtended(landmarks) {
  const wrist = landmarks[0];
  const tip = landmarks[4];
  const ip = landmarks[3];
  const mcp = landmarks[2];
  return dist(tip, wrist) > dist(ip, wrist) && dist(tip, landmarks[17]) > 0.18;
}

export function classifyGestureFromLandmarks(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return null;
  }

  const thumbExt = isThumbExtended(landmarks);
  const indexExt = isFingerExtended(landmarks, 8, 6, 5);
  const middleExt = isFingerExtended(landmarks, 12, 10, 9);
  const ringExt = isFingerExtended(landmarks, 16, 14, 13);
  const pinkyExt = isFingerExtended(landmarks, 20, 18, 17);

  // Measure distance between index and thumb tip
  const indexThumbDist = dist(landmarks[8], landmarks[4]);
  // Measure distance between index and middle tip
  const indexMiddleDist = dist(landmarks[8], landmarks[12]);

  // 1. "I Love You" / Pyaar: Thumb, Index, Pinky extended; Middle and Ring curled
  if (thumbExt && indexExt && pinkyExt && !middleExt && !ringExt) {
    return {
      gesture: 'ILoveYou',
      hindi: 'मैं तुमसे प्यार करता हूँ',
      english: 'I Love You',
      confidence: 0.95
    };
  }

  // 2. "Yes" / Haan: Fist with all four fingers closed
  if (!indexExt && !middleExt && !ringExt && !pinkyExt) {
    return {
      gesture: 'Yes',
      hindi: 'हाँ',
      english: 'Yes (Haan)',
      confidence: 0.93
    };
  }

  // 3. "No" / Nahi: Index and Middle finger extended horizontally or snapping together
  if (indexExt && middleExt && !ringExt && !pinkyExt && indexMiddleDist < 0.08) {
    return {
      gesture: 'No',
      hindi: 'नहीं',
      english: 'No (Nahi)',
      confidence: 0.91
    };
  }
  if (indexExt && !middleExt && !ringExt && !pinkyExt && !thumbExt) {
    return {
      gesture: 'No',
      hindi: 'नहीं',
      english: 'No (Nahi)',
      confidence: 0.89
    };
  }

  // 4. "Hello" / Namaste: Open hand with all fingers extended upright
  if (thumbExt && indexExt && middleExt && ringExt && pinkyExt) {
    return {
      gesture: 'Hello',
      hindi: 'नमस्ते',
      english: 'Hello / Namaste',
      confidence: 0.97
    };
  }

  // 5. "Thank You" / Dhanyawaad: 4 fingers straight together with thumb tucked
  if (indexExt && middleExt && ringExt && pinkyExt && !thumbExt) {
    return {
      gesture: 'ThankYou',
      hindi: 'धन्यवाद',
      english: 'Thank You (Dhanyawaad)',
      confidence: 0.92
    };
  }

  // 6. "Water" / Paani: 'W' gesture (Index, Middle, Ring extended, Pinky & Thumb curled)
  if (indexExt && middleExt && ringExt && !pinkyExt && !thumbExt) {
    return {
      gesture: 'Water',
      hindi: 'पानी',
      english: 'Water (Paani)',
      confidence: 0.90
    };
  }

  return null;
}
