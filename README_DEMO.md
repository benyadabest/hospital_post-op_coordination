# Hospital Efficiency Demo - Simplified Version

This is a simplified demo version that uses local JSON files as the database and OpenAI for intelligent note merging and queue prioritization.

## Features

- **Local JSON Database**: Uses `beds.json` as the data store (no Palantir/ontology dependencies)
- **AI-Powered Note Merging**: Uses OpenAI to intelligently merge voice input with existing patient notes
- **Smart Queue Prioritization**: Uses OpenAI to automatically prioritize patients based on medical urgency
- **Voice Input**: Web Speech API for voice-to-text conversion
- **Real-time Updates**: Queue automatically updates when patient notes change

## Setup

1. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Set OpenAI API Key** (optional):
   ```bash
   export OPENAI_API_KEY="your-api-key-here"
   ```
   
   **Note**: If no OpenAI key is provided, the system will:
   - Use simple text appending for note merging
   - Keep the current static queue order
   - Still function fully for demo purposes

3. **Start the Backend**:
   ```bash
   python app.py
   ```

4. **Start the Frontend**:
   ```bash
   cd hospital-dashboard
   npm install
   npm start
   ```

## How It Works

### Without OpenAI Key
- Voice input simply appends to existing notes
- Queue order remains static
- All UI features work normally

### With OpenAI Key
- **Smart Note Merging**: When you add voice input, OpenAI intelligently merges it with existing patient notes, updating pain levels, symptoms, and status
- **Dynamic Queue Prioritization**: After each patient or nurse voice input, OpenAI acts as a hospital operations AI and analyzes all patient notes to determine optimal doctor visit order based on:
  - Pain levels mentioned
  - Complications described  
  - Equipment needs
  - Time factors

### Voice Input Workflow
1. Click "🎤 Record Patient Update" or "🎤 Record Nurse Update" 
2. Speak your update (e.g., "My pain is now 9 out of 10, I need help urgently")
3. The system will:
   - Convert speech to text using Web Speech API
   - Merge with existing note using AI (if OpenAI key available)
   - Update the patient's status
   - Recalculate queue order based on all patient conditions
   - Move doctor to highest priority patient

## Demo Data

The `beds.json` file contains sample patient data:
- **Room 201 (bed_1)**: Sarah Johnson - Gallbladder Surgery - Feeling better, pain 2/10
- **Room 202 (bed_2)**: Michael Chen - Knee Replacement - Test patient
- **Room 203 (bed_3)**: Emma Rodriguez - Appendectomy - Severe pain 8/10
- **Room 204 (bed_4)**: James Wilson - Hernia Repair - Dizzy, needs wheelchair
- **Room 205 (bed_5)**: Lisa Thompson - Hip Replacement - Manageable pain 4/10  
- **Room 206 (bed_6)**: David Park - Shoulder Surgery - Post-op nausea, complications

## API Endpoints

- `GET /api/beds` - Get all bed data with queue positions
- `GET /api/queue` - Get current queue order
- `POST /api/voice-note` - Handle voice input and update notes
- `POST /api/priority-patient-done` - Mark priority patient as complete
- `POST /api/recalculate-queue` - Manually recalculate queue order

## Testing AI Features

To test the AI features, try these voice inputs:

**High Priority Example**:
- "My pain is now 9 out of 10, I'm having trouble breathing"
- Should move patient to top of queue

**Discharge Ready Example**:  
- "I'm feeling great, ready to go home, family is here to pick me up"
- Should move patient to bottom of queue

**Complication Example**:
- "Patient is experiencing bleeding at the surgical site, needs immediate attention"
- Should prioritize patient highly

The AI will intelligently merge these updates with existing notes and reorder the queue accordingly. 