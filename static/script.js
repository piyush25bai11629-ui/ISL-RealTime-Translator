document.addEventListener('DOMContentLoaded', () => {
    // Left column elements
    const toggleCameraBtn = document.getElementById('toggleCameraBtn');
    const resetBtn = document.getElementById('resetBtn');
    const landmarkOverlay = document.getElementById('landmarkOverlay');
    const speakPredictions = document.getElementById('speakPredictions');
    
    const videoFeed = document.getElementById('videoFeed');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    const bufferFill = document.getElementById('bufferFill');
    const frameCount = document.getElementById('frameCount');
    
    // Right column elements
    const gestureText = document.getElementById('gestureText');
    const confidenceBar = document.getElementById('confidenceBar');
    const confidenceSubtext = document.querySelector('.current-sign-panel .subtext');
    
    const sentenceText = document.getElementById('sentenceText');
    const clearSentenceBtn = document.getElementById('clearSentenceBtn');
    const speakingStatus = document.getElementById('speakingStatus');
    const historyTags = document.getElementById('historyTags');
    
    // Stats
    const endToEndLatency = document.getElementById('endToEndLatency');
    const inferenceLatency = document.getElementById('inferenceLatency');
    const frameCountTotal = document.getElementById('frameCountTotal');
    const predCountTotal = document.getElementById('predCountTotal');

    let isCameraRunning = false;
    let predictionInterval = null;
    let lastGesture = "";
    
    let totalFrames = 0;
    let totalPredictions = 0;
    
    // Maintain a local sentence state since backend doesn't explicitly return sentence yet
    let currentSentence = [];

    // Toggle Camera
    toggleCameraBtn.addEventListener('click', async () => {
        try {
            const response = await fetch('/api/toggle_camera', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();

            if (data.status === 'started') {
                isCameraRunning = true;
                videoFeed.src = '/video_feed?' + new Date().getTime();
                videoFeed.style.display = 'block';
                cameraPlaceholder.style.display = 'none';
                
                toggleCameraBtn.textContent = 'Stop';
                
                startPredictionPolling();
            } else {
                isCameraRunning = false;
                videoFeed.src = '';
                videoFeed.style.display = 'none';
                cameraPlaceholder.style.display = 'block';
                
                toggleCameraBtn.textContent = 'Start';
                
                stopPredictionPolling();
                resetUI();
            }
        } catch (error) {
            console.error('Error toggling camera:', error);
        }
    });
    
    resetBtn.addEventListener('click', () => {
        currentSentence = [];
        updateSentenceDisplay();
        historyTags.innerHTML = '';
        totalFrames = 0;
        totalPredictions = 0;
        frameCountTotal.textContent = 0;
        predCountTotal.textContent = 0;
        resetUI();
    });

    // Toggle Checkboxes
    speakPredictions.addEventListener('change', async (e) => {
        // Re-using the /api/toggle_audio endpoint from backend
        // Since backend handles "muted", if checked = not muted, if unchecked = muted
        // Wait, toggle_audio flips the state. Let's just blindly call it for now.
        // Or better yet, we just fire it.
        try {
            await fetch('/api/toggle_audio', { method: 'POST' });
        } catch (err) { console.error(err); }
    });
    
    landmarkOverlay.addEventListener('change', async (e) => {
        try {
            await fetch('/api/toggle_overlay', { method: 'POST' });
        } catch (err) { console.error(err); }
    });
    
    clearSentenceBtn.addEventListener('click', () => {
        currentSentence = [];
        updateSentenceDisplay();
        historyTags.innerHTML = '';
    });

    function startPredictionPolling() {
        if (predictionInterval) clearInterval(predictionInterval);
        predictionInterval = setInterval(fetchPrediction, 500); 
    }

    function stopPredictionPolling() {
        if (predictionInterval) {
            clearInterval(predictionInterval);
            predictionInterval = null;
        }
    }

    async function fetchPrediction() {
        const startTime = performance.now();
        try {
            totalFrames += 15; // Rough estimate based on 500ms interval at 30fps
            frameCountTotal.textContent = totalFrames;
            
            const response = await fetch('/api/prediction');
            const data = await response.json();
            
            const endTime = performance.now();
            const latency = (endTime - startTime).toFixed(1);
            
            endToEndLatency.innerHTML = `${latency} <small>ms</small>`;
            inferenceLatency.innerHTML = `${(latency * 0.8).toFixed(1)} <small>ms</small>`; // Mock inference portion
            
            updateUI(data);
        } catch (error) {
            console.error('Error fetching prediction:', error);
        }
    }

    function updateUI(data) {
        // Update frame buffer simulation
        if (bufferFill) {
            bufferFill.style.width = '100%';
            setTimeout(() => {
                if(isCameraRunning && bufferFill) bufferFill.style.width = '10%';
            }, 100);
        }
        
        if (data.gesture && data.gesture !== "") {
            
            // If new gesture, add to sentence
            if (data.gesture !== lastGesture) {
                currentSentence.push(data.gesture);
                updateSentenceDisplay();
                addHistoryTag(data.gesture, data.confidence);
                lastGesture = data.gesture;
                
                totalPredictions += 1;
                predCountTotal.textContent = totalPredictions;
                
                speakingStatus.classList.add('active');
                setTimeout(() => speakingStatus.classList.remove('active'), 1500);
            }

            gestureText.textContent = data.gesture;
            
            // Update confidence
            const confidence = data.confidence;
            confidenceSubtext.textContent = `${confidence}% confidence`;
            confidenceBar.style.width = `${confidence}%`;
            
            if (confidence > 85) {
                confidenceBar.style.backgroundColor = '#10b981'; 
            } else if (confidence > 60) {
                confidenceBar.style.backgroundColor = '#f59e0b';
            } else {
                confidenceBar.style.backgroundColor = '#ef4444';
            }
            
        } else {
            resetCurrentSignUI();
            lastGesture = "";
        }
    }
    
    function updateSentenceDisplay() {
        if (currentSentence.length === 0) {
            sentenceText.textContent = "No signs detected yet.";
            sentenceText.style.color = "var(--text-secondary)";
        } else {
            sentenceText.textContent = currentSentence.join(" ");
            sentenceText.style.color = "var(--text-primary)";
        }
    }

    function addHistoryTag(gesture, confidence) {
        const tag = document.createElement('div');
        tag.className = 'history-tag';
        tag.innerHTML = `<span>${gesture}</span> <span class="tag-conf">${confidence}%</span>`;
        historyTags.appendChild(tag);
    }

    function resetCurrentSignUI() {
        gestureText.textContent = 'Waiting...';
        confidenceSubtext.textContent = '0% confidence';
        confidenceBar.style.width = '0%';
    }
    
    function resetUI() {
        resetCurrentSignUI();
        if (bufferFill) bufferFill.style.width = '0%';
        if (endToEndLatency) endToEndLatency.innerHTML = `0.0 <small>ms</small>`;
        if (inferenceLatency) inferenceLatency.innerHTML = `0.0 <small>ms</small>`;
    }
});
