# Bed Note Update Script

This script updates the `current_note` property of bed data ontology objects in Foundry based on the original `beds.json` file.

## Prerequisites

1. **Foundry Token**: Set your Foundry token as an environment variable:
   ```bash
   export FOUNDRY_TOKEN="your_foundry_token_here"
   ```

2. **Python Dependencies**: Make sure you have the required packages installed:
   ```bash
   pip install hospital_operations_demo_sdk foundry_sdk_runtime
   ```

3. **beds.json File**: Ensure the `beds.json` file is in the same directory as the script.

## Usage

### Basic Usage
```bash
python update_bed_notes.py
```

### What the Script Does

1. **Loads beds.json**: Reads the original bed data from `beds.json`
2. **Connects to Foundry**: Initializes the Foundry client with your token
3. **Updates Each Bed**: For each bed in the JSON file:
   - Finds the corresponding bed in the Foundry ontology
   - Updates the `current_note` property with the note from the JSON file
   - Preserves other properties (patient_name, procedure_type, etc.)
   - Updates the `last_updated` timestamp
4. **Reports Results**: Shows a summary of successful and failed updates

### Example Output
```
INFO:__main__:Starting bed note update process...
INFO:__main__:Loaded 6 beds from beds.json
INFO:__main__:Foundry client initialized successfully
INFO:__main__:Updating bed_1 with note: Patient feeling much better, pain level 3/10...
INFO:__main__:Successfully updated note for bed_1
INFO:__main__:Updating bed_2 with note: Patient reporting severe knee pain 8-9/10...
INFO:__main__:Successfully updated note for bed_2
...
==================================================
UPDATE SUMMARY
==================================================
Total beds processed: 6
Successful updates: 6
Failed updates: 0
==================================================
INFO:__main__:All bed notes updated successfully!
```

## Error Handling

The script includes comprehensive error handling:

- **File Not Found**: If `beds.json` doesn't exist
- **JSON Parse Errors**: If the JSON file is malformed
- **Authentication Errors**: If the Foundry token is invalid
- **Bed Not Found**: If a bed ID from the JSON doesn't exist in Foundry
- **Validation Errors**: If the Foundry action validation fails

## Safety Features

- **Preserves Existing Data**: Only updates the `current_note` property, keeps other properties unchanged
- **Validation**: Uses Foundry's validation system to ensure data integrity
- **Logging**: Detailed logging for debugging and monitoring
- **Summary Report**: Clear summary of what was updated and what failed

## Troubleshooting

### Common Issues

1. **"FOUNDRY_TOKEN not set"**: Make sure you've exported your Foundry token
2. **"Bed not found"**: The bed ID in beds.json doesn't exist in the Foundry ontology
3. **"Validation failed"**: The note content doesn't meet Foundry's validation requirements

### Debug Mode

To see more detailed logs, you can modify the logging level in the script:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Files

- `update_bed_notes.py`: The main script
- `beds.json`: Source data file
- `README_update_bed_notes.md`: This documentation 