from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import json
import os
from hospital_operations_demo_sdk import FoundryClient
from hospital_operations_demo_sdk.types import ActionConfig, ActionMode, ValidationResult, ReturnEditsMode
from foundry_sdk_runtime.auth import UserTokenAuth

app = Flask(__name__)
CORS(app)

auth = UserTokenAuth(
    hostname="https://benshvartsman1.usw-18.palantirfoundry.com",
    token=os.environ["FOUNDRY_TOKEN"]
)
foundry_client = FoundryClient(auth=auth, hostname="https://benshvartsman1.usw-18.palantirfoundry.com")

current_doctor_bed = None

def initialize_doctor_position():
    global current_doctor_bed
    queue_order = get_queue_order()
    current_doctor_bed = queue_order[0] if queue_order else None

def get_queue_order():
    bed_data_set = foundry_client.ontology.objects.BedData
    queue_result = foundry_client.ontology.queries.smart_priority_queue(bed_data_set)
    
    if isinstance(queue_result, str):
        try:
            queue_order = json.loads(queue_result)
        except json.JSONDecodeError:
            queue_order = [bed_id.strip() for bed_id in queue_result.split(',') if bed_id.strip()]
    else:
        queue_order = ["bed_1", "bed_2", "bed_3", "bed_4", "bed_5", "bed_6"]
    
    return queue_order

def get_bed_priority_color_by_queue_position(bed_id, queue_order):
    try:
        position = queue_order.index(bed_id) + 1
        if position <= 2:
            return "border-red-500 bg-red-50"
        elif position <= 4:
            return "border-orange-500 bg-orange-50"
        else:
            return "border-green-500 bg-green-50"
    except ValueError:
        return "border-green-500 bg-green-50"

def update_bed_note(bed_id, content):
    bed = foundry_client.ontology.objects.BedData.get(bed_id)
    if not bed:
        return False
    
    response = foundry_client.ontology.actions.edit_bed_data(
        action_config=ActionConfig(
            mode=ActionMode.VALIDATE_AND_EXECUTE,
            return_edits=ReturnEditsMode.ALL
        ),
        bed_data=bed_id,
        patient_name=getattr(bed, 'patient_name', 'Unknown Patient'),
        procedure_type=getattr(bed, 'procedure_type', 'Unknown Procedure'),
        current_note=content,
        last_updated=datetime.now()
    )
    
    return response.validation.validation_result == ValidationResult.VALID

def extract_equipment_simple(transcript):
    equipment_keywords = [
        "pain medication", "IV pump", "wheelchair", "blood pressure monitor",
        "oxygen", "catheter", "IV bag", "bandages", "anti-nausea medication",
        "discharge papers", "prescription", "walker", "crutches"
    ]
    
    mentioned = []
    transcript_lower = transcript.lower()
    
    for equipment in equipment_keywords:
        if equipment.lower() in transcript_lower:
            mentioned.append(equipment)
    
    return mentioned

def get_bed_status_from_note(note_content):
    if not note_content:
        return "stable"
    
    content_lower = note_content.lower()
    
    if any(phrase in content_lower for phrase in [
        "ready for discharge", "discharge papers", "family here", "going home"
    ]):
        return "ready_discharge"
    elif any(phrase in content_lower for phrase in [
        "severe pain", "urgently", "complications", "needs attention", "bleeding"
    ]):
        return "needs_attention"
    else:
        return "stable"

@app.route('/api/beds')
def get_beds():
    beds = list(foundry_client.ontology.objects.BedData.iterate())
    queue_order = get_queue_order()
    
    beds_data = []
    for bed in beds:
        bed_data = {
            "bed_id": bed.bed_data,
            "patient_name": bed.patient_name,
            "procedure_type": bed.procedure_type,
            "current_note": bed.current_note,
            "last_updated": bed.last_updated.strftime('%a, %d %b %Y %H:%M:%S GMT') if bed.last_updated else "",
            "status": get_bed_status_from_note(bed.current_note),
            "priority_color": get_bed_priority_color_by_queue_position(bed.bed_data, queue_order),
            "queue_position": queue_order.index(bed.bed_data) + 1 if bed.bed_data in queue_order else 999
        }
        beds_data.append(bed_data)
    
    return jsonify(beds_data)

@app.route('/api/queue')
def get_queue():
    return jsonify({"queue": get_queue_order()})

@app.route('/api/voice-note', methods=['POST'])
def handle_voice_note():
    data = request.json
    bed_id = data.get('bed_id')
    content = data.get('content')
    
    success = update_bed_note(bed_id, content)
    
    if success:
        return jsonify({"status": "success", "message": "Note updated successfully"})
    else:
        return jsonify({"status": "error", "message": "Failed to update note"}), 500

@app.route('/api/equipment/<bed_id>')
def get_bed_equipment(bed_id):
    bed = foundry_client.ontology.objects.BedData.get(bed_id)
    if bed:
        equipment = extract_equipment_simple(bed.current_note or '')
        return jsonify(equipment)
    return jsonify([])

@app.route('/api/equipment-summary')
def get_equipment_summary():
    beds = list(foundry_client.ontology.objects.BedData.iterate())
    all_equipment = {}
    
    for bed in beds:
        equipment = extract_equipment_simple(bed.current_note or '')
        for item in equipment:
            all_equipment[item] = all_equipment.get(item, 0) + 1
    
    return jsonify(all_equipment)

@app.route('/api/priority-patient-done', methods=['POST'])
def priority_patient_done():
    data = request.json
    bed_id = data.get('bed_id')
    
    if bed_id:
        success = update_bed_note(bed_id, 'Patient met with doctor and resolved.')
        if success:
            return jsonify({"status": "success", "message": "Patient marked as done"})
        else:
            return jsonify({"status": "error", "message": "Failed to update patient status"}), 500
    else:
        return jsonify({"status": "error", "message": "Invalid bed ID"}), 400

if __name__ == '__main__':
    initialize_doctor_position()
    app.run(debug=True, host='0.0.0.0', port=5001)