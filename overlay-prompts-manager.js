/**
 * Overlay Prompts Manager
 * Handles interactive prompts for missing CV sections with voice and text input options
 */
class OverlayPromptsManager {
    constructor(app) {
        this.app = app;
        this.container = null;
        this.activePrompts = [];
        this.promptResponses = {};
        this.currentRecordingPrompt = null;
        
        // CV section definitions with friendly names
        this.sections = {
            name: {
                title: 'Full Name',
                prompt: 'Please tell us your full name',
                icon: '👤',
                required: true
            },
            email: {
                title: 'Email Address',
                prompt: 'Please provide your email address',
                icon: '📧',
                required: true
            },
            phone: {
                title: 'Phone Number',
                prompt: 'Please provide your phone number',
                icon: '📱',
                required: true
            },
            location: {
                title: 'Location',
                prompt: 'Where are you located?',
                icon: '📍',
                required: false
            },
            workExperience: {
                title: 'Work Experience',
                prompt: 'Please tell us about your work experience',
                icon: '💼',
                required: true
            },
            education: {
                title: 'Education',
                prompt: 'Please tell us about your educational background',
                icon: '🎓',
                required: true
            },
            skills: {
                title: 'Skills',
                prompt: 'Please list your skills',
                icon: '⚡',
                required: true
            },
            languages: {
                title: 'Languages',
                prompt: 'What languages do you speak?',
                icon: '🌐',
                required: false
            }
        };
    }
    
    /**
     * Initialize the prompts manager
     */
    initialize() {
        // Create modal backdrop and container
        this.createModalStructure();
        return true;
    }
    
    /**
     * Create the modal overlay structure
     */
    createModalStructure() {
        // Check if modal already exists
        let backdrop = document.getElementById('overlayModalBackdrop');
        if (backdrop) {
            this.backdrop = backdrop;
            this.container = document.getElementById('overlayPromptsContainer');
            return;
        }
        
        // Create backdrop
        this.backdrop = document.createElement('div');
        this.backdrop.id = 'overlayModalBackdrop';
        this.backdrop.className = 'overlay-modal-backdrop';
        
        // Create modal container
        const modalContainer = document.createElement('div');
        modalContainer.className = 'overlay-modal-container';
        
        // Create modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'overlay-modal-header';
        modalHeader.innerHTML = `
            <h2 class="overlay-modal-title">📋 Complete Your CV Information</h2>
            <p class="overlay-modal-subtitle">Please provide the following missing information</p>
        `;
        
        // Create close button
        const closeButton = document.createElement('button');
        closeButton.className = 'overlay-modal-close';
        closeButton.innerHTML = '×';
        closeButton.onclick = () => this.closeModal();
        
        // Create prompts container
        this.container = document.createElement('div');
        this.container.id = 'overlayPromptsContainer';
        
        // Create progress indicator
        this.progressContainer = document.createElement('div');
        this.progressContainer.className = 'overlay-modal-progress';
        this.progressContainer.innerHTML = `
            <div class="progress-text">
                <span id="promptsCompleted">0</span> of <span id="promptsTotal">0</span> completed
            </div>
            <div class="progress-bar-container">
                <div class="progress-bar-fill" id="promptsProgressBar" style="width: 0%"></div>
            </div>
        `;
        
        // Assemble modal
        modalContainer.appendChild(closeButton);
        modalContainer.appendChild(modalHeader);
        modalContainer.appendChild(this.container);
        modalContainer.appendChild(this.progressContainer);
        this.backdrop.appendChild(modalContainer);
        
        // Add to body
        document.body.appendChild(this.backdrop);
        
        // Close on backdrop click
        this.backdrop.addEventListener('click', (e) => {
            if (e.target === this.backdrop) {
                this.closeModal();
            }
        });
    }
    
    /**
     * Analyze CV data and identify missing sections
     * @param {Object} cvData - Extracted CV data
     * @returns {Array} - Array of missing section keys
     */
    analyzeMissingSections(cvData) {
        const missing = [];
        
        // Check personal info
        if (!cvData.personalInfo?.fullName || cvData.personalInfo.fullName.trim() === '') {
            missing.push('name');
        }
        if (!cvData.personalInfo?.email || cvData.personalInfo.email.trim() === '') {
            missing.push('email');
        }
        if (!cvData.personalInfo?.phone || cvData.personalInfo.phone.trim() === '') {
            missing.push('phone');
        }
        if (!cvData.personalInfo?.location || cvData.personalInfo.location.trim() === '') {
            missing.push('location');
        }
        
        // Check work experience
        if (!cvData.workExperience || cvData.workExperience.length === 0) {
            missing.push('workExperience');
        }
        
        // Check education
        if (!cvData.education || cvData.education.length === 0) {
            missing.push('education');
        }
        
        // Check skills
        if (!cvData.skills || 
            (Array.isArray(cvData.skills) && cvData.skills.length === 0) ||
            (typeof cvData.skills === 'object' && 
             (!cvData.skills.technical || cvData.skills.technical.length === 0) &&
             (!cvData.skills.soft || cvData.skills.soft.length === 0))) {
            missing.push('skills');
        }
        
        // Check languages
        if (!cvData.languages || cvData.languages.length === 0) {
            missing.push('languages');
        }
        
        console.log('📋 Missing sections analysis:', missing);
        return missing;
    }
    
    /**
     * Show prompts for missing sections
     * @param {Array} missingSections - Array of missing section keys
     */
    showPrompts(missingSections) {
        if (!this.container) {
            console.error('Prompts container not initialized');
            return;
        }
        
        // Clear existing prompts
        this.container.innerHTML = '';
        this.activePrompts = [];
        this.promptResponses = {};
        
        if (missingSections.length === 0) {
            console.log('✅ No missing sections - all data provided');
            return;
        }
        
        // Show modal
        this.openModal();
        
        // Create prompts for each missing section
        missingSections.forEach((sectionKey, index) => {
            const section = this.sections[sectionKey];
            if (!section) return;
            
            const promptElement = this.createPromptElement(sectionKey, section, index);
            this.container.appendChild(promptElement);
            this.activePrompts.push(sectionKey);
        });
        
        // Update progress
        this.updateProgress();
        
        console.log(`📌 Showing ${missingSections.length} prompts for missing sections`);
    }
    
    /**
     * Open the modal
     */
    openModal() {
        if (this.backdrop) {
            this.backdrop.classList.add('visible');
            document.body.style.overflow = 'hidden'; // Prevent background scrolling
        }
    }
    
    /**
     * Close the modal
     */
    closeModal() {
        if (this.backdrop) {
            this.backdrop.classList.remove('visible');
            document.body.style.overflow = ''; // Restore scrolling
        }
        
        // Ask for confirmation if there are unsaved prompts
        if (this.activePrompts.length > 0) {
            const confirm = window.confirm(
                `You have ${this.activePrompts.length} incomplete field(s). ` +
                'Are you sure you want to close without completing them?'
            );
            
            if (!confirm) {
                this.openModal();
            }
        }
    }
    
    /**
     * Create a prompt element
     * @param {string} sectionKey - Section identifier
     * @param {Object} section - Section definition
     * @param {number} index - Prompt index
     * @returns {HTMLElement} - Prompt element
     */
    createPromptElement(sectionKey, section, index) {
        const promptDiv = document.createElement('div');
        promptDiv.className = 'overlay-prompt';
        promptDiv.id = `prompt-${sectionKey}`;
        promptDiv.style.animationDelay = `${index * 0.1}s`;
        
        promptDiv.innerHTML = `
            <div class="prompt-header">
                <div>
                    <div class="prompt-title">
                        <span>${section.icon}</span>
                        <span>${section.title}</span>
                        ${section.required ? '<span style="color: #ef4444;">*</span>' : ''}
                    </div>
                    <div class="prompt-section-name">${section.prompt}</div>
                </div>
            </div>
            
            <div class="prompt-input-buttons">
                <button class="prompt-input-btn" data-input-type="voice" data-section="${sectionKey}">
                    <span class="icon">🎤</span>
                    <span>Voice Input</span>
                </button>
                <button class="prompt-input-btn" data-input-type="text" data-section="${sectionKey}">
                    <span class="icon">⌨️</span>
                    <span>Type Input</span>
                </button>
            </div>
            
            <div class="prompt-recording-indicator" id="recording-${sectionKey}">
                <div class="recording-pulse"></div>
                <span>Recording...</span>
            </div>
            
            <div class="prompt-response-container" id="response-${sectionKey}">
                <textarea class="prompt-response-text" id="response-text-${sectionKey}" 
                    placeholder="Your response will appear here..."></textarea>
                <div class="prompt-response-actions">
                    <button class="prompt-action-btn prompt-accept-btn" data-action="accept" data-section="${sectionKey}">
                        ✓ Accept
                    </button>
                    <button class="prompt-action-btn prompt-decline-btn" data-action="decline" data-section="${sectionKey}">
                        ✗ Decline
                    </button>
                </div>
            </div>
        `;
        
        // Attach event listeners
        this.attachPromptEventListeners(promptDiv, sectionKey);
        
        return promptDiv;
    }
    
    /**
     * Attach event listeners to prompt elements
     * @param {HTMLElement} promptElement - The prompt element
     * @param {string} sectionKey - Section identifier
     */
    attachPromptEventListeners(promptElement, sectionKey) {
        // Voice input button
        const voiceBtn = promptElement.querySelector('[data-input-type="voice"]');
        voiceBtn.addEventListener('click', () => this.handleVoiceInput(sectionKey));
        
        // Text input button
        const textBtn = promptElement.querySelector('[data-input-type="text"]');
        textBtn.addEventListener('click', () => this.handleTextInput(sectionKey));
        
        // Accept button
        const acceptBtn = promptElement.querySelector('[data-action="accept"]');
        acceptBtn.addEventListener('click', () => this.handleAccept(sectionKey));
        
        // Decline button
        const declineBtn = promptElement.querySelector('[data-action="decline"]');
        declineBtn.addEventListener('click', () => this.handleDecline(sectionKey));
    }
    
    /**
     * Handle voice input for a prompt
     * @param {string} sectionKey - Section identifier
     */
    async handleVoiceInput(sectionKey) {
        console.log(`🎤 Starting voice input for ${sectionKey}`);
        
        // Show recording indicator
        const indicator = document.getElementById(`recording-${sectionKey}`);
        if (indicator) {
            indicator.classList.add('active');
        }
        
        // Activate button
        const voiceBtn = document.querySelector(`#prompt-${sectionKey} [data-input-type="voice"]`);
        if (voiceBtn) {
            voiceBtn.classList.add('active');
            voiceBtn.textContent = '⏹️ Stop';
        }
        
        this.currentRecordingPrompt = sectionKey;
        
        try {
            // Use app's Bhashini recording system
            this.app.showStatusMessage('🎤 Recording...', 'info');
            
            // Request microphone with optimized settings
            const audioStream = await navigator.mediaDevices.getUserMedia({ 
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                } 
            });
            
            const audioChunks = [];
            
            // Get best supported MIME type (use AudioUtils if available)
            const mimeType = typeof AudioUtils !== 'undefined' 
                ? AudioUtils.getBestMimeType() 
                : 'audio/webm';
            
            const mediaRecorder = new MediaRecorder(audioStream, {
                mimeType: mimeType,
                audioBitsPerSecond: 128000
            });
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data);
                }
            };
            
            mediaRecorder.onstop = async () => {
                console.log('Prompt recording stopped, processing audio...');
                
                // Hide recording indicator
                if (indicator) {
                    indicator.classList.remove('active');
                }
                if (voiceBtn) {
                    voiceBtn.classList.remove('active');
                    voiceBtn.innerHTML = `<span class="icon">🎤</span><span>Voice Input</span>`;
                }
                
                // Stop audio stream
                audioStream.getTracks().forEach(track => track.stop());
                
                // Process audio
                try {
                    const audioBlob = new Blob(audioChunks, { type: mimeType });
                    console.log('Created audio blob:', audioBlob.size, 'bytes');
                    
                    if (audioBlob.size === 0) {
                        throw new Error('No audio recorded');
                    }
                    
                    this.app.showStatusMessage('🔄 Converting audio...', 'info');
                    
                    // Convert to WAV if AudioUtils is available
                    let audioToProcess = audioBlob;
                    if (typeof AudioUtils !== 'undefined') {
                        audioToProcess = await AudioUtils.convertToWav(audioBlob);
                        console.log('Converted to WAV:', audioToProcess.size, 'bytes');
                    }
                    
                    // Convert to base64
                    const audioBase64 = await this.blobToBase64(audioToProcess);
                    
                    this.app.showStatusMessage('🔄 Transcribing...', 'info');
                    
                    // Use Bhashini ASR with current language
                    const transcription = await this.app.bhashiniService.transcribeAudio(
                        this.app.currentLanguage || 'en',
                        audioBase64
                    );
                    
                    console.log('Transcription result:', transcription);
                    
                    if (transcription && transcription.trim()) {
                        // Show transcription in response area
                        this.showResponse(sectionKey, transcription.trim());
                        this.app.showStatusMessage('✅ Transcription complete', 'success');
                    } else {
                        throw new Error('No transcription received');
                    }
                    
                } catch (error) {
                    console.error('Transcription error:', error);
                    this.app.showStatusMessage(`Failed to transcribe: ${error.message}`, 'error');
                }
            };
            
            mediaRecorder.onerror = (event) => {
                console.error('MediaRecorder error:', event.error);
                this.app.showStatusMessage('Recording error occurred', 'error');
                
                if (indicator) {
                    indicator.classList.remove('active');
                }
                if (voiceBtn) {
                    voiceBtn.classList.remove('active');
                    voiceBtn.innerHTML = `<span class="icon">🎤</span><span>Voice Input</span>`;
                }
            };
            
            // Start recording
            mediaRecorder.start(1000); // Collect data every second
            console.log('Recording started for prompt');
            
            // Auto-stop after 10 seconds
            const autoStopTimeout = setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    console.log('Auto-stopping recording after 10 seconds');
                    mediaRecorder.stop();
                }
            }, 10000);
            
            // Allow manual stop by clicking button again
            voiceBtn.onclick = () => {
                if (mediaRecorder.state === 'recording') {
                    console.log('Manual stop requested');
                    clearTimeout(autoStopTimeout);
                    mediaRecorder.stop();
                }
            };
            
        } catch (error) {
            console.error('Voice input error:', error);
            
            let errorMessage = 'Failed to start recording';
            if (error.name === 'NotAllowedError') {
                errorMessage = 'Microphone permission denied';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'No microphone found';
            }
            
            this.app.showStatusMessage(errorMessage, 'error');
            
            if (indicator) {
                indicator.classList.remove('active');
            }
            if (voiceBtn) {
                voiceBtn.classList.remove('active');
                voiceBtn.innerHTML = `<span class="icon">🎤</span><span>Voice Input</span>`;
            }
        }
    }
    
    /**
     * Convert Blob to base64
     * @param {Blob} blob - Audio blob
     * @returns {Promise<string>} - Base64 string
     */
    blobToBase64(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                // Remove data:audio/wav;base64, prefix
                const base64 = reader.result.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }
    
    /**
     * Handle text input for a prompt
     * @param {string} sectionKey - Section identifier
     */
    handleTextInput(sectionKey) {
        console.log(`⌨️ Starting text input for ${sectionKey}`);
        
        // Show response container with empty textarea
        const responseContainer = document.getElementById(`response-${sectionKey}`);
        const responseText = document.getElementById(`response-text-${sectionKey}`);
        
        if (responseContainer && responseText) {
            responseContainer.classList.add('visible');
            responseText.value = '';
            responseText.focus();
            responseText.readOnly = false;
        }
    }
    
    /**
     * Show response in the prompt
     * @param {string} sectionKey - Section identifier
     * @param {string} text - Response text
     */
    showResponse(sectionKey, text) {
        const responseContainer = document.getElementById(`response-${sectionKey}`);
        const responseText = document.getElementById(`response-text-${sectionKey}`);
        
        if (responseContainer && responseText) {
            responseContainer.classList.add('visible');
            responseText.value = text;
            responseText.readOnly = false; // Allow editing
        }
    }
    
    /**
     * Handle accept action
     * @param {string} sectionKey - Section identifier
     */
    handleAccept(sectionKey) {
        const responseText = document.getElementById(`response-text-${sectionKey}`);
        
        if (!responseText || !responseText.value.trim()) {
            this.app.showStatusMessage('Please provide input before accepting', 'error');
            return;
        }
        
        // Store the response
        this.promptResponses[sectionKey] = responseText.value.trim();
        
        console.log(`✅ Accepted response for ${sectionKey}:`, this.promptResponses[sectionKey]);
        
        // Remove prompt from active list
        this.activePrompts = this.activePrompts.filter(key => key !== sectionKey);
        
        // Mark prompt as completed visually
        const promptElement = document.getElementById(`prompt-${sectionKey}`);
        if (promptElement) {
            promptElement.classList.add('completed');
            
            // Add completed badge
            const header = promptElement.querySelector('.prompt-header');
            if (header && !header.querySelector('.completed-badge')) {
                const badge = document.createElement('span');
                badge.className = 'completed-badge';
                badge.innerHTML = '✓ Completed';
                header.appendChild(badge);
            }
            
            // Disable input buttons
            promptElement.querySelectorAll('.prompt-input-btn').forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.cursor = 'not-allowed';
            });
            
            // Update progress
            this.updateProgress();
            
            // Check if all prompts are completed
            setTimeout(() => {
                if (this.activePrompts.length === 0) {
                    this.onAllPromptsCompleted();
                }
            }, 500);
        }
        
        this.app.showStatusMessage(`${this.sections[sectionKey].title} saved`, 'success');
    }
    
    /**
     * Handle decline action
     * @param {string} sectionKey - Section identifier
     */
    handleDecline(sectionKey) {
        console.log(`❌ Declined response for ${sectionKey}`);
        
        // Clear the response text
        const responseText = document.getElementById(`response-text-${sectionKey}`);
        const responseContainer = document.getElementById(`response-${sectionKey}`);
        
        if (responseText) {
            responseText.value = '';
        }
        
        if (responseContainer) {
            responseContainer.classList.remove('visible');
        }
        
        // Reset buttons
        const voiceBtn = document.querySelector(`#prompt-${sectionKey} [data-input-type="voice"]`);
        const textBtn = document.querySelector(`#prompt-${sectionKey} [data-input-type="text"]`);
        
        if (voiceBtn) voiceBtn.classList.remove('active');
        if (textBtn) textBtn.classList.remove('active');
        
        this.app.showStatusMessage('Response cleared', 'info');
    }
    
    /**
     * Called when all prompts are completed
     */
    onAllPromptsCompleted() {
        console.log('🎉 All prompts completed!');
        console.log('Collected responses:', this.promptResponses);
        
        // Close modal
        this.closeModal();
        
        // Trigger CV regeneration with updated data
        if (this.app && typeof this.app.regenerateCVWithPromptData === 'function') {
            this.app.regenerateCVWithPromptData(this.promptResponses);
        }
        
        this.app.showStatusMessage('All missing information collected! Updating CV...', 'success');
    }
    
    /**
     * Get all collected responses
     * @returns {Object} - Prompt responses
     */
    getResponses() {
        return this.promptResponses;
    }
    
    /**
     * Update progress indicator
     */
    updateProgress() {
        const totalEl = document.getElementById('promptsTotal');
        const completedEl = document.getElementById('promptsCompleted');
        const progressBar = document.getElementById('promptsProgressBar');
        
        if (!totalEl || !completedEl || !progressBar) return;
        
        const total = Object.keys(this.sections).length;
        const completed = Object.keys(this.promptResponses).length;
        const percentage = total > 0 ? (completed / this.activePrompts.length + completed) * 100 : 0;
        
        totalEl.textContent = this.activePrompts.length + completed;
        completedEl.textContent = completed;
        progressBar.style.width = `${percentage}%`;
    }
    
    /**
     * Reset the prompts manager
     */
    reset() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.closeModal();
        this.activePrompts = [];
        this.promptResponses = {};
        this.currentRecordingPrompt = null;
    }
}
