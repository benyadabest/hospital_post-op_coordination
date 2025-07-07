# Hospital Post-Op Coordination Dashboard

A real-time hospital dashboard system built with Palantir Foundry ontology integration for post-operative patient coordination.

## Features

- Real-time patient queue management using AIP priority algorithms
- Equipment tracking and extraction from patient notes
- Patient and nurse note updates
- Ontology-based data persistence

## Tech Stack

- **Backend**: Python Flask with Palantir Foundry SDK
- **Frontend**: React with Tailwind CSS
- **Data**: Palantir Foundry Ontology
- **AI**: AIP smart priority queue function

## Setup

### Backend
```bash
pip install -r requirements.txt
export FOUNDRY_TOKEN="your_token_here"
python app.py
```

### Frontend
```bash
cd hospital-dashboard
npm install
npm start
```

## Usage

1. Access the dashboard at http://localhost:3000
2. View post-op beds with queue positions determined by AIP
3. Click beds to add patient/nurse updates
4. Priority patient queue updates automatically
5. Equipment needs are extracted and tracked

## Architecture

The system uses Palantir Foundry ontology objects for all data operations:
- `BedData` objects store patient information
- `smart_priority_queue` AIP function determines visit order
- Real-time updates through ontology actions 