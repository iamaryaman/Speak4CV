// Bhashini Audio Language Detection (ALD) Service
// Automatically detects language from audio before sending to ASR
// Uses multi-ASR approach: tries multiple languages and picks the best one

class BhashiniALDService {
    constructor() {
        // Bhashini API credentials (reuse from main service)
        this.userId = '21d41f1e0ae54d958d93d8a1c65f96a4';
        this.apiKey = '025f6d4ca8-74bc-4847-8bbf-70f1ed42b166';
        this.inferenceApiKey = '_YAUfmAYfUNLzxvgSCskYG1SwoyckUG3fUQpED4X8ReBi-5jS-GyaUf-9W9eEplG';
        
        // API endpoints
        this.pipelineConfigUrl = 'https://meity-auth.ulcacontrib.org/ulca/apis/v0/model/getModelsPipeline';
        this.computeUrl = 'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';
        
        // Cache for pipeline configurations
        this.pipelineCache = new Map();
        
        // Detected language info
        this.detectedLanguageCode = null;
        this.detectionConfidence = 0.0;
        
        // Language code to name mapping
        this.languageNames = {
            'hi': 'Hindi',
            'en': 'English',
            'ta': 'Tamil',
            'te': 'Telugu',
            'kn': 'Kannada',
            'ml': 'Malayalam',
            'mr': 'Marathi',
            'gu': 'Gujarati',
            'bn': 'Bengali',
            'pa': 'Punjabi'
        };
        
        // Priority languages for detection (most commonly used)
        this.detectionLanguages = ['hi', 'en', 'ta', 'te'];
    }
    
    /**
     * Detect language from audio using multi-ASR approach
     * Transcribes with multiple languages and picks the best one based on confidence
     * @param {string} audioBase64 - Base64 encoded WAV audio (16kHz, mono, 16-bit PCM)
     * @returns {Promise<Object>} - {languageCode, confidence, languageName, transcription}
     */
    async detectLanguageFromAudio(audioBase64) {
        try {
            console.log('🎤 ALD: Starting multi-ASR language detection');
            console.log(`🎤 ALD: Processing ${audioBase64.length} characters of base64 audio`);
            console.log(`🎤 ALD: Testing languages: ${this.detectionLanguages.join(', ')}`);
            
            const results = [];
            
            // Try transcribing with each priority language
            for (const langCode of this.detectionLanguages) {
                try {
                    console.log(`🎤 ALD: Trying ${this.languageNames[langCode]} (${langCode})...`);
                    
                    const config = await this.getPipelineConfig(langCode);
                    const transcription = await this.transcribeWithLanguage(langCode, audioBase64, config);
                    
                    if (transcription && transcription.text) {
                        // Calculate confidence based on text and script analysis
                        const confidence = this.calculateConfidence(transcription.text, langCode);
                        
                        results.push({
                            languageCode: langCode,
                            languageName: this.languageNames[langCode],
                            transcription: transcription.text,
                            confidence: confidence,
                            wordCount: transcription.text.split(/\s+/).length
                        });
                        
                        // Enhanced logging with text preview
                        const textPreview = transcription.text.substring(0, 60);
                        console.log(`🎤 ALD: ${langCode} result - confidence: ${confidence.toFixed(2)}, words: ${results[results.length-1].wordCount}`);
                        console.log(`🎤 ALD: ${langCode} text: "${textPreview}${transcription.text.length > 60 ? '...' : ''}"`);
                    }
                } catch (error) {
                    console.warn(`🎤 ALD: ${langCode} transcription failed:`, error.message);
                }
            }
            
            if (results.length === 0) {
                throw new Error('All language detection attempts failed');
            }
            
            // Sort by confidence and pick the best
            results.sort((a, b) => b.confidence - a.confidence);
            const bestResult = results[0];
            
            // Store detected values
            this.detectedLanguageCode = bestResult.languageCode;
            this.detectionConfidence = bestResult.confidence;
            
            console.log(`🎤 ALD: Best match = ${bestResult.languageName} (${bestResult.languageCode}) with confidence ${bestResult.confidence.toFixed(2)}`);
            console.log(`🎤 ALD: Transcription preview: "${bestResult.transcription.substring(0, 100)}..."`);
            
            return {
                languageCode: bestResult.languageCode,
                confidence: bestResult.confidence,
                languageName: bestResult.languageName,
                transcription: bestResult.transcription
            };
            
        } catch (error) {
            console.error('🎤 ALD: Language detection failed:', error);
            throw error;
        }
    }
    
    /**
     * Get ASR pipeline configuration for a specific language
     * @param {string} language - Language code
     * @returns {Promise<Object>}
     */
    async getPipelineConfig(language) {
        // Check cache first
        if (this.pipelineCache.has(language)) {
            return this.pipelineCache.get(language);
        }
        
        try {
            const requestBody = {
                pipelineTasks: [{
                    taskType: "asr",
                    config: {
                        language: {
                            sourceLanguage: language
                        }
                    }
                }],
                pipelineRequestConfig: {
                    pipelineId: "64392f96daac500b55c543cd"
                }
            };
            
            const response = await fetch(this.pipelineConfigUrl, {
                method: 'POST',
                headers: {
                    'Accept': '*/*',
                    'Content-Type': 'application/json',
                    'ulcaApiKey': this.apiKey,
                    'userID': this.userId
                },
                body: JSON.stringify(requestBody)
            });
            
            if (!response.ok) {
                throw new Error(`Pipeline config failed for ${language}: ${response.statusText}`);
            }
            
            const data = await response.json();
            const asrConfig = data.pipelineResponseConfig?.[0]?.config?.[0];
            
            if (!asrConfig) {
                throw new Error(`No ASR configuration found for ${language}`);
            }
            
            const config = {
                serviceId: asrConfig.serviceId,
                modelId: asrConfig.modelId,
                language: language,
                inferenceApiKey: asrConfig.inferenceApiKey?.value || this.inferenceApiKey,
                callbackUrl: asrConfig.apiEndPoint?.callbackUrl || this.computeUrl
            };
            
            this.pipelineCache.set(language, config);
            return config;
            
        } catch (error) {
            console.error(`Failed to get pipeline config for ${language}:`, error);
            throw error;
        }
    }
    
    /**
     * Transcribe audio with a specific language
     * @param {string} language - Language code
     * @param {string} audioBase64 - Base64 audio
     * @param {Object} config - Pipeline config
     * @returns {Promise<Object>}
     */
    async transcribeWithLanguage(language, audioBase64, config) {
        const requestBody = {
            pipelineTasks: [{
                taskType: "asr",
                config: {
                    language: {
                        sourceLanguage: language
                    },
                    serviceId: config.serviceId,
                    audioFormat: "wav",
                    samplingRate: 16000
                }
            }],
            inputData: {
                audio: [{
                    audioContent: audioBase64
                }]
            }
        };
        
        const response = await fetch(config.callbackUrl || this.computeUrl, {
            method: 'POST',
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json',
                'Authorization': config.inferenceApiKey
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`Transcription failed for ${language}: ${response.statusText}`);
        }
        
        const data = await response.json();
        const text = data.pipelineResponse?.[0]?.output?.[0]?.source || '';
        
        return { text };
    }
    
    /**
     * Calculate confidence score for a transcription
     * @param {string} text - Transcribed text
     * @param {string} langCode - Language code
     * @returns {number} - Confidence score (0-1)
     */
    calculateConfidence(text, langCode) {
        if (!text || text.trim().length === 0) {
            return 0.0;
        }
        
        const trimmedText = text.trim();
        const textLength = trimmedText.length;
        const wordCount = trimmedText.split(/\s+/).filter(w => w.length > 0).length;
        
        // Define script ranges
        const scriptRanges = {
            'hi': /[\u0900-\u097F]/g, // Devanagari
            'ta': /[\u0B80-\u0BFF]/g, // Tamil
            'te': /[\u0C00-\u0C7F]/g, // Telugu
            'kn': /[\u0C80-\u0CFF]/g, // Kannada
            'ml': /[\u0D00-\u0D7F]/g, // Malayalam
            'mr': /[\u0900-\u097F]/g, // Marathi
            'gu': /[\u0A80-\u0AFF]/g, // Gujarati
            'bn': /[\u0980-\u09FF]/g, // Bengali
            'pa': /[\u0A00-\u0A7F]/g  // Punjabi
        };
        
        // Check for any Indic script
        const hasIndicScript = /[\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F]/.test(trimmedText);
        const hasAscii = /[a-zA-Z]/.test(trimmedText);
        
        let confidence = 0.0;
        
        if (langCode !== 'en') {
            // Indian language - check for correct script
            const scriptPattern = scriptRanges[langCode];
            
            if (scriptPattern) {
                const scriptMatches = trimmedText.match(scriptPattern);
                const scriptCharCount = scriptMatches ? scriptMatches.length : 0;
                const totalChars = trimmedText.replace(/[\s\d\p{P}]/gu, '').length;
                
                if (scriptCharCount > 0 && totalChars > 0) {
                    // Calculate script ratio
                    const scriptRatio = scriptCharCount / totalChars;
                    
                    // Base score from script ratio (0.2 to 0.7)
                    confidence = 0.2 + (scriptRatio * 0.5);
                    
                    // Bonuses for content quality
                    if (wordCount >= 5) confidence += 0.08;
                    if (wordCount >= 10) confidence += 0.07;
                    if (textLength >= 30) confidence += 0.08;
                    if (textLength >= 60) confidence += 0.07;
                    
                } else if (hasAscii && !hasIndicScript) {
                    // Indian model but only ASCII - likely wrong
                    confidence = 0.12;
                } else {
                    confidence = 0.20;
                }
            }
        } else {
            // English - check for ASCII and no Indic script
            if (hasIndicScript) {
                // English should never have Indic script
                confidence = 0.08;
            } else if (hasAscii) {
                // Count common English words
                const commonWords = /\b(the|is|are|was|were|have|has|had|will|would|can|could|should|may|must|a|an|and|or|but|in|on|at|to|for|of|with|by|my|your|this|that|do|does|did|he|she|it|we|they|from|about)\b/gi;
                const matches = trimmedText.match(commonWords);
                const englishWordCount = matches ? matches.length : 0;
                const ratio = englishWordCount / Math.max(wordCount, 1);
                
                // Base English confidence
                confidence = 0.35 + (ratio * 0.35);
                
                // Bonuses
                if (wordCount >= 5) confidence += 0.08;
                if (wordCount >= 10) confidence += 0.07;
                if (textLength >= 30) confidence += 0.08;
                if (textLength >= 60) confidence += 0.07;
            } else {
                confidence = 0.10;
            }
        }
        
        return Math.min(Math.max(confidence, 0.0), 1.0);
    }
    
    /**
     * Clear cached pipeline configurations
     */
    clearCache() {
        this.pipelineCache.clear();
        console.log('🎤 ALD: Cache cleared');
    }
    
    /**
     * Get the last detected language info
     * @returns {Object|null}
     */
    getLastDetectedLanguage() {
        if (this.detectedLanguageCode) {
            return {
                languageCode: this.detectedLanguageCode,
                confidence: this.detectionConfidence,
                languageName: this.languageNames[this.detectedLanguageCode] || this.detectedLanguageCode
            };
        }
        return null;
    }
}

// Export for use in other modules
window.BhashiniALDService = BhashiniALDService;
