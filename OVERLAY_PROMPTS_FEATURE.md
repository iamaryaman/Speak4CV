# Overlay Prompts Feature - Modal Edition

## Overview
The Overlay Prompts feature intelligently identifies missing sections in your CV transcription and displays a **modal overlay** (popup dialog) with interactive prompts to fill in the gaps using voice or text input.

## Visual Design
The prompts appear as a **centered modal overlay** that:
- Darkens the background (with blur effect)
- Sits on top of your CV preview
- Cannot be accidentally dismissed (requires confirmation if incomplete)
- Shows progress as you complete each field
- Automatically closes when all fields are completed

## How It Works

### 1. Initial Transcription
When you complete your voice transcription, the system analyzes the captured text and generates a preliminary CV.

### 2. Missing Sections Detection
The system automatically checks for the following CV sections:
- **Personal Information**
  - Full Name
  - Email Address
  - Phone Number
  - Location
- **Work Experience**
- **Education**
- **Skills**
- **Languages**

### 3. Interactive Prompts
For each missing section, an overlay prompt appears with:

#### Prompt Components
- **Section Title**: Shows which information is missing (e.g., "Email Address", "Work Experience")
- **Icon**: Visual indicator for the section type
- **Required Indicator**: Asterisk (*) for mandatory fields

#### Input Options
Each prompt provides two input methods:

##### 🎤 Voice Input
- Click the microphone icon
- Speak your response (auto-stops after 10 seconds or click again to stop manually)
- Uses Bhashini ASR for transcription
- Transcription appears in the text area for review

##### ⌨️ Keyboard Input
- Click the keyboard icon
- Type your response directly
- Edit as needed

#### Review & Action
After providing input, you can:
- **✓ Accept**: Saves the information and adds it to your CV
- **✗ Decline**: Clears the response and allows you to try again

### 4. CV Regeneration
When all prompts are completed (or you choose to proceed), the system:
- Merges all prompt responses with the initial CV data
- Regenerates the CV preview with updated information
- Updates all sections automatically

## User Experience Flow

```
1. Record Complete CV → Transcription appears
                          ↓
2. System generates initial CV from transcription
                          ↓
3. System analyzes what sections are missing
                          ↓
4. Overlay prompts appear for missing sections
                          ↓
5. User fills in missing info via voice or text
                          ↓
6. User accepts or declines each response
                          ↓
7. CV automatically updates with new information
```

## Features

### Smart Detection
- Analyzes CV data structure to identify gaps
- Only prompts for truly missing information
- Distinguishes between required and optional fields

### Flexible Input
- Voice input uses the same Bhashini ASR as main recording
- Respects current language selection
- Text input for precise control
- Edit transcriptions before accepting

### Visual Feedback
- Color-coded prompts (red gradient for attention)
- Recording indicators with pulse animation
- Smooth animations for prompt appearance/removal
- Clear status messages

### Seamless Integration
- Non-blocking: prompts don't interfere with CV preview
- Progressive: complete prompts at your own pace
- Forgiving: decline and retry as needed
- Automatic: CV updates immediately after all prompts

## Technical Details

### Files
- `overlay-prompts-manager.js`: Core prompt logic and UI management
- `overlay-prompts.css`: Styling for prompts and animations
- Integration in `app.js`: CV generation flow

### Data Flow
1. **Analysis**: `analyzeMissingSections(cvData)` checks CV structure
2. **Display**: `showPrompts(missingSections)` renders interactive prompts
3. **Input**: Voice/text handlers capture user responses
4. **Update**: `regenerateCVWithPromptData(responses)` merges data
5. **Preview**: Updated CV displays automatically

### Customization
Section definitions in `overlay-prompts-manager.js`:
```javascript
this.sections = {
    name: {
        title: 'Full Name',
        prompt: 'Please tell us your full name',
        icon: '👤',
        required: true
    },
    // ... other sections
}
```

## Benefits

1. **Complete CVs**: Ensures all important information is captured
2. **User-Friendly**: No need to re-record entire CV for missing details
3. **Bilingual**: Supports voice input in multiple languages
4. **Efficient**: Targeted prompts save time
5. **Flexible**: Multiple input methods for user preference

## Future Enhancements

Potential improvements:
- Smart suggestions based on partial information
- Auto-fill from previous CVs
- Multi-language translation of prompt questions
- Voice guidance for each prompt
- Batch voice recording for all missing sections
