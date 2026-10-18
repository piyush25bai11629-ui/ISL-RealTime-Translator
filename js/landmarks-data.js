/**
 * ISL Project Data & Landmark Coordinates
 * Contains landmark models for MediaPipe 21-point hand visualization,
 * ISL dictionary entries, community challenges, and gallery assets.
 */

export const HAND_CONNECTIONS = [
  // Thumb
  [0, 1], [1, 2], [2, 3], [3, 4],
  // Index
  [0, 5], [5, 6], [6, 7], [7, 8],
  // Middle
  [9, 10], [10, 11], [11, 12],
  // Ring
  [13, 14], [14, 15], [15, 16],
  // Pinky
  [0, 17], [17, 18], [18, 19], [19, 20],
  // Palm Base
  [5, 9], [9, 13], [13, 17]
];

// Pre-computed normalized 21-keypoint coordinate snapshots for visual canvas rendering
export const ISL_SIGNS = [
  {
    id: "sign_hello",
    name: "Hello / Namaste",
    hindiName: "नमस्ते (Namaste)",
    category: "Greetings",
    difficulty: "Beginner",
    accuracyRate: "98.4%",
    badgeColor: "#10b981",
    audioTextHindi: "नमस्ते",
    audioTextEnglish: "Namaste, Hello",
    description: "The universal Indian greeting of deep respect. Hands brought together palm-to-palm in front of chest.",
    howToSign: "Bring both palms together at chest level with fingers pointing upward. Tilt head gently forward with a welcoming smile.",
    culturalContext: "In Indian Sign Language, Namaste also incorporates two hands touching with open palms facing inward, symbolizing honor and equality.",
    landmarks: [
      {x: 0.50, y: 0.88, z: 0},
      {x: 0.44, y: 0.82, z: -0.01}, {x: 0.40, y: 0.74, z: -0.02}, {x: 0.40, y: 0.65, z: -0.03}, {x: 0.42, y: 0.58, z: -0.03},
      {x: 0.46, y: 0.68, z: -0.02}, {x: 0.46, y: 0.54, z: -0.03}, {x: 0.47, y: 0.42, z: -0.04}, {x: 0.47, y: 0.32, z: -0.05},
      {x: 0.50, y: 0.66, z: -0.01}, {x: 0.50, y: 0.51, z: -0.03}, {x: 0.50, y: 0.38, z: -0.04}, {x: 0.50, y: 0.28, z: -0.05},
      {x: 0.54, y: 0.68, z: 0.01},  {x: 0.54, y: 0.54, z: 0.01},  {x: 0.53, y: 0.42, z: 0.01},  {x: 0.53, y: 0.33, z: 0.01},
      {x: 0.58, y: 0.73, z: 0.02},  {x: 0.58, y: 0.62, z: 0.02},  {x: 0.57, y: 0.52, z: 0.02},  {x: 0.56, y: 0.44, z: 0.02}
    ]
  },
  {
    id: "sign_thankyou",
    name: "Thank You / Dhanyawaad",
    hindiName: "धन्यवाद (Dhanyawaad)",
    category: "Courtesy",
    difficulty: "Beginner",
    accuracyRate: "97.8%",
    badgeColor: "#3b82f6",
    audioTextHindi: "धन्यवाद",
    audioTextEnglish: "Thank You, Dhanyawaad",
    description: "Conveys heartfelt gratitude. Flat hand moves gently from chin forward toward the listener.",
    howToSign: "Place fingertips of flat dominant hand lightly near your lips or chin, then move hand gracefully outward toward the recipient.",
    culturalContext: "Often executed with eye contact and a gentle nod to emphasize genuine sincerity and respect.",
    landmarks: [
      {x: 0.50, y: 0.85, z: 0},
      {x: 0.42, y: 0.78, z: 0.02}, {x: 0.36, y: 0.70, z: 0.03}, {x: 0.34, y: 0.60, z: 0.04}, {x: 0.35, y: 0.52, z: 0.04},
      {x: 0.46, y: 0.62, z: 0.01}, {x: 0.45, y: 0.48, z: 0.02}, {x: 0.44, y: 0.36, z: 0.02}, {x: 0.44, y: 0.26, z: 0.02},
      {x: 0.52, y: 0.61, z: 0.00}, {x: 0.52, y: 0.46, z: 0.00}, {x: 0.52, y: 0.34, z: 0.00}, {x: 0.52, y: 0.23, z: 0.00},
      {x: 0.58, y: 0.63, z: -0.01},{x: 0.58, y: 0.49, z: -0.01},{x: 0.58, y: 0.38, z: -0.01},{x: 0.58, y: 0.28, z: -0.01},
      {x: 0.64, y: 0.68, z: -0.02},{x: 0.64, y: 0.57, z: -0.02},{x: 0.64, y: 0.48, z: -0.02},{x: 0.64, y: 0.39, z: -0.02}
    ]
  },
  {
    id: "sign_yes",
    name: "Yes / Haan",
    hindiName: "हाँ (Haan)",
    category: "Responses",
    difficulty: "Beginner",
    accuracyRate: "99.1%",
    badgeColor: "#10b981",
    audioTextHindi: "हाँ",
    audioTextEnglish: "Yes, Haan",
    description: "Affirmative confirmation. Closed fist moves up and down like a nodding head.",
    howToSign: "Form a loose fist with thumb wrapped across front. Rotate wrist up and down once or twice in a nodding rhythm.",
    culturalContext: "Mimics the natural head-nod gesture understood globally, reinforced with a supportive facial expression.",
    landmarks: [
      {x: 0.50, y: 0.85, z: 0},
      {x: 0.42, y: 0.77, z: 0.02}, {x: 0.37, y: 0.70, z: 0.04}, {x: 0.39, y: 0.62, z: 0.05}, {x: 0.44, y: 0.58, z: 0.06},
      {x: 0.46, y: 0.68, z: 0.01}, {x: 0.46, y: 0.58, z: 0.04}, {x: 0.48, y: 0.64, z: 0.06}, {x: 0.48, y: 0.69, z: 0.05},
      {x: 0.52, y: 0.68, z: 0.00}, {x: 0.52, y: 0.57, z: 0.04}, {x: 0.54, y: 0.63, z: 0.06}, {x: 0.54, y: 0.68, z: 0.05},
      {x: 0.58, y: 0.70, z: -0.01},{x: 0.58, y: 0.60, z: 0.03},{x: 0.59, y: 0.66, z: 0.05},{x: 0.59, y: 0.71, z: 0.04},
      {x: 0.63, y: 0.74, z: -0.02},{x: 0.64, y: 0.66, z: 0.02},{x: 0.64, y: 0.71, z: 0.04},{x: 0.64, y: 0.76, z: 0.03}
    ]
  },
  {
    id: "sign_no",
    name: "No / Nahi",
    hindiName: "नहीं (Nahi)",
    category: "Responses",
    difficulty: "Beginner",
    accuracyRate: "98.7%",
    badgeColor: "#ef4444",
    audioTextHindi: "नहीं",
    audioTextEnglish: "No, Nahi",
    description: "Polite negation or refusal. Index and middle fingers snap shut against thumb.",
    howToSign: "Extend index and middle finger horizontally together. Snap them downwards onto the thumb tip while shaking head slightly.",
    culturalContext: "Always accompanied by a gentle head shake. Can be signed softly for polite decline or firmly for denial.",
    landmarks: [
      {x: 0.50, y: 0.86, z: 0},
      {x: 0.44, y: 0.76, z: 0.02}, {x: 0.41, y: 0.67, z: 0.03}, {x: 0.44, y: 0.59, z: 0.04}, {x: 0.48, y: 0.54, z: 0.04},
      {x: 0.48, y: 0.66, z: 0.01}, {x: 0.49, y: 0.55, z: 0.03}, {x: 0.50, y: 0.52, z: 0.04}, {x: 0.49, y: 0.54, z: 0.04},
      {x: 0.53, y: 0.67, z: 0.00}, {x: 0.53, y: 0.56, z: 0.03}, {x: 0.52, y: 0.53, z: 0.04}, {x: 0.51, y: 0.55, z: 0.04},
      {x: 0.58, y: 0.70, z: -0.01},{x: 0.60, y: 0.64, z: 0.02},{x: 0.60, y: 0.71, z: 0.04},{x: 0.59, y: 0.76, z: 0.03},
      {x: 0.63, y: 0.74, z: -0.02},{x: 0.65, y: 0.69, z: 0.01},{x: 0.65, y: 0.75, z: 0.03},{x: 0.64, y: 0.80, z: 0.02}
    ]
  },
  {
    id: "sign_iloveyou",
    name: "I Love You / Pyaar",
    hindiName: "मैं तुमसे प्यार करता हूँ",
    category: "Affection",
    difficulty: "Intermediate",
    accuracyRate: "97.5%",
    badgeColor: "#ec4899",
    audioTextHindi: "मैं तुमसे प्यार करता हूँ",
    audioTextEnglish: "I Love You, Main tumse pyaar karta hoon",
    description: "Expression of love and deep care. Thumb, index, and pinky extended, middle and ring curled.",
    howToSign: "Hold hand upright with palm facing forward. Keep index, pinky, and thumb fully stretched while curling middle and ring finger.",
    culturalContext: "Widely used across Deaf communities in India and globally as an affectionate sign-off, greeting, and support banner.",
    landmarks: [
      {x: 0.50, y: 0.88, z: 0},
      {x: 0.40, y: 0.80, z: 0.02}, {x: 0.32, y: 0.73, z: 0.03}, {x: 0.26, y: 0.66, z: 0.04}, {x: 0.20, y: 0.60, z: 0.04},
      {x: 0.46, y: 0.66, z: 0.01}, {x: 0.44, y: 0.50, z: 0.01}, {x: 0.43, y: 0.36, z: 0.01}, {x: 0.42, y: 0.22, z: 0.01},
      {x: 0.52, y: 0.66, z: 0.00}, {x: 0.52, y: 0.56, z: 0.03}, {x: 0.53, y: 0.65, z: 0.05}, {x: 0.53, y: 0.72, z: 0.04},
      {x: 0.58, y: 0.68, z: -0.01},{x: 0.58, y: 0.58, z: 0.03},{x: 0.59, y: 0.67, z: 0.05},{x: 0.59, y: 0.74, z: 0.04},
      {x: 0.64, y: 0.71, z: -0.02},{x: 0.67, y: 0.58, z: -0.02},{x: 0.70, y: 0.46, z: -0.02},{x: 0.73, y: 0.34, z: -0.02}
    ]
  },
  {
    id: "sign_help",
    name: "Help / Madad",
    hindiName: "मदद (Madad)",
    category: "Emergency",
    difficulty: "Intermediate",
    accuracyRate: "96.9%",
    badgeColor: "#f59e0b",
    audioTextHindi: "मदद चाहिए",
    audioTextEnglish: "Help, Madad chahiye",
    description: "Crucial emergency sign. Closed fist with thumb up placed on an open supporting palm.",
    howToSign: "Hold flat non-dominant hand palm up at chest. Place dominant fist with thumb pointing upward on the palm, then elevate both together.",
    culturalContext: "One of the most vital signs in healthcare and public crisis situations. Enables instant non-verbal distress communication.",
    landmarks: [
      {x: 0.50, y: 0.82, z: 0},
      {x: 0.42, y: 0.74, z: 0.02}, {x: 0.38, y: 0.62, z: 0.04}, {x: 0.36, y: 0.48, z: 0.05}, {x: 0.35, y: 0.35, z: 0.06},
      {x: 0.48, y: 0.65, z: 0.01}, {x: 0.48, y: 0.56, z: 0.04}, {x: 0.50, y: 0.63, z: 0.06}, {x: 0.51, y: 0.69, z: 0.05},
      {x: 0.54, y: 0.66, z: 0.00}, {x: 0.54, y: 0.56, z: 0.04}, {x: 0.55, y: 0.64, z: 0.06}, {x: 0.56, y: 0.70, z: 0.05},
      {x: 0.60, y: 0.68, z: -0.01},{x: 0.60, y: 0.59, z: 0.03},{x: 0.61, y: 0.67, z: 0.05},{x: 0.61, y: 0.73, z: 0.04},
      {x: 0.65, y: 0.72, z: -0.02},{x: 0.66, y: 0.64, z: 0.02},{x: 0.67, y: 0.72, z: 0.04},{x: 0.66, y: 0.77, z: 0.03}
    ]
  },
  {
    id: "sign_water",
    name: "Water / Paani",
    hindiName: "पानी (Paani)",
    category: "Everyday",
    difficulty: "Beginner",
    accuracyRate: "97.2%",
    badgeColor: "#06b6d4",
    audioTextHindi: "पानी",
    audioTextEnglish: "Water, Paani",
    description: "Everyday essential sign. Three middle fingers form 'W' shape and gently tap beside chin.",
    howToSign: "Form 'W' shape with index, middle, and ring fingers up. Tap the side of your chin with index finger twice.",
    culturalContext: "Used in schools, restaurants, and medical centers to communicate hydration needs quickly.",
    landmarks: [
      {x: 0.50, y: 0.88, z: 0},
      {x: 0.42, y: 0.80, z: 0.02}, {x: 0.38, y: 0.72, z: 0.04}, {x: 0.42, y: 0.64, z: 0.05}, {x: 0.48, y: 0.62, z: 0.05},
      {x: 0.46, y: 0.64, z: 0.01}, {x: 0.44, y: 0.48, z: 0.01}, {x: 0.43, y: 0.35, z: 0.01}, {x: 0.42, y: 0.22, z: 0.01},
      {x: 0.51, y: 0.64, z: 0.00}, {x: 0.51, y: 0.47, z: 0.00}, {x: 0.51, y: 0.33, z: 0.00}, {x: 0.51, y: 0.20, z: 0.00},
      {x: 0.57, y: 0.66, z: -0.01},{x: 0.58, y: 0.50, z: -0.01},{x: 0.58, y: 0.37, z: -0.01},{x: 0.58, y: 0.24, z: -0.01},
      {x: 0.63, y: 0.71, z: -0.02},{x: 0.64, y: 0.64, z: 0.02},{x: 0.63, y: 0.70, z: 0.04},{x: 0.58, y: 0.71, z: 0.04}
    ]
  },
  {
    id: "sign_friend",
    name: "Friend / Dost",
    hindiName: "दोस्त (Dost)",
    category: "Everyday",
    difficulty: "Intermediate",
    accuracyRate: "96.4%",
    badgeColor: "#8b5cf6",
    audioTextHindi: "दोस्त",
    audioTextEnglish: "Friend, Dost",
    description: "Symbol of companionship and social bond. Curved index fingers hook together reciprocally.",
    howToSign: "Curve both index fingers into small hooks. Link them together once, reverse hand position, and link again.",
    culturalContext: "Celebrates inclusive friendships between Deaf and hearing individuals.",
    landmarks: [
      {x: 0.50, y: 0.86, z: 0},
      {x: 0.42, y: 0.78, z: 0.02}, {x: 0.38, y: 0.70, z: 0.03}, {x: 0.40, y: 0.62, z: 0.04}, {x: 0.46, y: 0.58, z: 0.04},
      {x: 0.47, y: 0.65, z: 0.01}, {x: 0.46, y: 0.48, z: 0.02}, {x: 0.50, y: 0.38, z: 0.03}, {x: 0.54, y: 0.42, z: 0.02},
      {x: 0.53, y: 0.67, z: 0.00}, {x: 0.54, y: 0.58, z: 0.03}, {x: 0.54, y: 0.66, z: 0.05}, {x: 0.53, y: 0.73, z: 0.04},
      {x: 0.59, y: 0.70, z: -0.01},{x: 0.60, y: 0.62, z: 0.02},{x: 0.60, y: 0.70, z: 0.04},{x: 0.59, y: 0.76, z: 0.03},
      {x: 0.64, y: 0.74, z: -0.02},{x: 0.65, y: 0.68, z: 0.01},{x: 0.65, y: 0.75, z: 0.03},{x: 0.64, y: 0.81, z: 0.02}
    ]
  }
];

export const DEAF_CHALLENGES = [
  {
    id: "challenge_interpreter_crisis",
    title: "The Catastrophic Interpreter Shortage",
    stat: "1 : 200,000",
    statLabel: "Certified Interpreter Ratio in India",
    severity: "Critical",
    summary: "Over 63 million deaf and hard-of-hearing Indians rely on fewer than 350 officially certified ISL interpreters nationwide.",
    fullDescription: "While Western nations have thousands of certified interpreters across hospitals, courts, and universities, India faces an acute shortage. In Tier-2 and rural regions, a deaf person may live an entire lifetime without meeting an accredited interpreter, leaving them utterly reliant on family members who themselves rarely possess formal signing skills.",
    realWorldImpact: "In high-stakes legal hearings or property disputes, deaf citizens frequently have judgments passed without fully grasping court proceedings. Our AI engine bridges this vacuum with instant local translation.",
    category: "Infrastructure"
  },
  {
    id: "challenge_emergency_healthcare",
    title: "Healthcare Inaccessibility & Emergency Risk",
    stat: "78%",
    statLabel: "Report High Anxiety in Medical Visits",
    severity: "Critical",
    summary: "Deaf patients cannot describe acute symptoms, allergy histories, or pain levels during clinical emergencies without an interpreter.",
    fullDescription: "Doctors and nursing staff rarely know sign language. In intensive care or triage units where family cannot enter, deaf patients face life-threatening communication barriers. Misdiagnosis, improper drug dosages, and involuntary medical consent are devastatingly common outcomes.",
    realWorldImpact: "When a deaf individual suffers chest pains or trauma, they cannot call 112/108 emergency voice helplines. Real-time vision-to-speech AI turns gestures into clear spoken Hindi & English for first responders.",
    category: "Healthcare"
  },
  {
    id: "challenge_education_dropouts",
    title: "Educational Exclusion & 85% Dropout Rate",
    stat: "85%+",
    statLabel: "Children Forced into Oralism or Dropping Out",
    severity: "Severe",
    summary: "Most deaf schools still enforce rigid speech-reading (oralism) instead of embracing Indian Sign Language as an official medium of instruction.",
    fullDescription: "Sign language is the native visual language of deaf children. Denying them ISL during early cognitive development causes language deprivation syndrome. Most regular classrooms lack sign-fluent teachers, turning examinations and learning into frustrating memorization tasks rather than conceptual understanding.",
    realWorldImpact: "Deaf students are often funneled away from STEM and tech fields solely due to communication barriers. Providing real-time sign translators empowers deaf youth in colleges and digital learning platforms.",
    category: "Education"
  },
  {
    id: "challenge_employment_bias",
    title: "Employment Disparity & Workplace Isolation",
    stat: "67%",
    statLabel: "Underemployment or Stagnated Career Growth",
    severity: "High",
    summary: "Deaf professionals face silent hiring bias during job interviews, team meetings, and promotional appraisals.",
    fullDescription: "Even when technically skilled in coding, design, accounting, or craftsmanship, deaf applicants are disqualified during conversational interview rounds. In offices, lack of real-time meeting transcription and live sign translation creates loneliness and isolates them during collaborative decision-making.",
    realWorldImpact: "Our software enables deaf workers to sign directly into a laptop camera while meeting attendees hear clear spoken words without delay, fostering workplace inclusion.",
    category: "Workplace"
  },
  {
    id: "challenge_asl_bias",
    title: "The Global ASL Tech Monopoly Bias",
    stat: "92%",
    statLabel: "AI Models Trained Only on Western Sign (ASL)",
    severity: "High",
    summary: "Almost all major tech research and open datasets focus on American Sign Language, which is completely incompatible with ISL.",
    fullDescription: "American Sign Language uses single-handed fingerspelling and Western cultural gestures. Indian Sign Language (ISL) is a rich, distinct visual language with two-handed alphabets, regional dialects, and unique syntactic structures. A model trained on ASL fails completely in Indian contexts.",
    realWorldImpact: "This project is built from scratch specifically for Indian Sign Language, honoring Indian cultural gestures, regional syntax, and dual Hindi/English phonetic outputs.",
    category: "Technology"
  },
  {
    id: "challenge_family_isolation",
    title: "Familial Isolation & Emotional Stigma",
    stat: "90%",
    statLabel: "Deaf Children Born to Hearing Parents",
    severity: "Medium",
    summary: "The overwhelming majority of deaf children grow up in homes where neither parents nor siblings know Indian Sign Language.",
    fullDescription: "Dinner table conversations, family celebrations, and emotional talks often pass in total silence for deaf children. Feeling like an outsider in one's own home produces chronic depression, anxiety, and social withdrawal from early childhood.",
    realWorldImpact: "By turning everyday sign language into friendly audible Hindi speech, family members can instantly understand their deaf child's jokes, stories, and emotions without friction.",
    category: "Social"
  }
];

export const GALLERY_ITEMS = [
  {
    id: "gal_hands_ai",
    title: "Neural Vision: MediaPipe 3D Landmark Mesh",
    category: "Technology",
    image: "images/isl_hands_ai.jpg",
    caption: "Sub-millisecond hand tracking capturing 21 spatial landmarks and spatial angles in real time.",
    tags: ["MediaPipe", "Computer Vision", "Landmarks"],
    details: "High-speed computer vision analyzes 21 distinct skeletal joints per hand, tracking spatial x, y, z positions at 30+ frames per second to recognize dynamic Indian Sign Language movements with zero expensive sensor gloves."
  },
  {
    id: "gal_community_care",
    title: "Accessible Healthcare & Clinical Empathy",
    category: "Community",
    image: "images/isl_community.jpg",
    caption: "Enabling independent communication between deaf patients and doctors during medical checkups.",
    tags: ["Healthcare", "Emergency", "Inclusion"],
    details: "In hospital consultations, real-time sign language translation allows deaf patients to explain pain levels, surgical consent, and medication reactions directly to medical professionals without privacy compromises."
  },
  {
    id: "gal_education_classroom",
    title: "Inclusive Classrooms & Empowering Young Learners",
    category: "Education",
    image: "images/isl_education.jpg",
    caption: "Indian deaf students learning collaboratively with accessible visual tools and interactive ISL pedagogy.",
    tags: ["Deaf Education", "Classroom", "ISL Culture"],
    details: "When classrooms adopt Indian Sign Language as an honored, equal medium of thought, children flourish cognitively, emotionally, and socially. Visual AI tools help bridge educational divides in schools across India."
  },
  {
    id: "gal_gesture_namaste",
    title: "The Cultural Grace of 'Namaste' & Gratitude",
    category: "ISL Signs",
    image: "images/isl_gesture_thankyou.jpg",
    caption: "Namaste and Dhanyawaad: Traditional Indian gestures of honor, gratitude, and peaceful recognition.",
    tags: ["Greetings", "Indian Culture", "Namaste"],
    details: "Unlike Western sign systems, ISL draws deeply from indigenous Indian gestures. Namaste reflects the greeting of divine light in one another, recognized instantly by our deep learning classification pipeline."
  },
  {
    id: "gal_mobile_metro",
    title: "Public Transit & Everyday Mobility",
    category: "Technology",
    image: "images/isl_assistive_tech.jpg",
    caption: "Real-time sign language subtitles on smartphones empower deaf commuters in metro transit systems.",
    tags: ["Mobile AI", "Public Transit", "Real-Time Subtitles"],
    details: "A smartphone camera pointed at a signing commuter instantly generates bilingual Hindi and English live text bubbles and synthesized audio on public buses and metro trains, making cities accessible to everyone."
  },
  {
    id: "gal_biometric_joints",
    title: "21 Skeletal Biometric Joints Architecture",
    category: "Technology",
    image: "images/isl_mediapipe_landmarks.jpg",
    caption: "Detailed anatomical layout of the 21 hand joints from Wrist to fingertip DIP/PIP/MCP coordinates.",
    tags: ["Architecture", "Biometrics", "Deep Learning"],
    details: "The system converts raw webcam pixels into a 63-dimensional coordinate feature vector (x, y, z relative to the wrist anchor). This mathematical normalization ensures robust gesture recognition across varying hand sizes, skin tones, and camera distances."
  }
];

export const ADVOCACY_RESOURCES = [
  {
    id: "res_islrtc",
    title: "Indian Sign Language Research and Training Centre (ISLRTC)",
    type: "Government Institution",
    description: "Autonomous organization under the Ministry of Social Justice & Empowerment, Government of India, dedicated to standardizing and promoting ISL education and interpreter certification.",
    url: "http://www.islrtc.nic.in",
    contact: "New Delhi, India • info@islrtc.nic.in"
  },
  {
    id: "res_nad",
    title: "National Association of the Deaf (NAD India)",
    type: "Advocacy NGO",
    description: "Premier national representative body of deaf individuals fighting for civil rights, ISL legal recognition as an official 8th Schedule language, and equal employment opportunities.",
    url: "https://nadindia.org",
    contact: "Helpline & WhatsApp Support Available"
  },
  {
    id: "res_emergency_sms",
    title: "Emergency 112 SOS & Video Relay Help",
    type: "Emergency Service",
    description: "National emergency support instructions for deaf individuals using SMS-based 112 reporting, visual SOS dispatching, and hospital sign relay assistance.",
    url: "https://112.gov.in",
    contact: "Emergency SMS: 112"
  }
];
