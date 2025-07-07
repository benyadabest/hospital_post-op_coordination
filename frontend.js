import React, { useState, useEffect } from 'react';
import { Clock, User, AlertCircle, Stethoscope, Timer } from 'lucide-react';

const HospitalDashboard = () => {
  const [beds, setBeds] = useState([]);
  const [queueData, setQueueData] = useState({
    current_bed: '',
    timer_remaining: 0,
    next_beds: []
  });
  const [selectedBed, setSelectedBed] = useState(null);
  const [bedNotes, setBedNotes] = useState({});
  const [loading, setLoading] = useState(true);

  // API calls
  const fetchBeds = async () => {
    try {
      const response = await fetch('/api/beds');
      const data = await response.json();
      setBeds(data);
    } catch (error) {
      console.error('Error fetching beds:', error);
    }
  };

  const fetchQueue = async () => {
    try {
      const response = await fetch('/api/queue');
      const data = await response.json();
      setQueueData(data);
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  };

  const fetchBedNotes = async (bedId) => {
    try {
      const response = await fetch(`/api/notes/${bedId}`);
      const data = await response.json();
      setBedNotes(prev => ({
        ...prev,
        [bedId]: data
      }));
    } catch (error) {
      console.error('Error fetching bed notes:', error);
    }
  };

  // Initialize and polling
  useEffect(() => {
    const initializeData = async () => {
      await fetchBeds();
      await fetchQueue();
      setLoading(false);
    };

    initializeData();

    // Poll for updates every 5 seconds
    const interval = setInterval(() => {
      fetchQueue();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Timer countdown
  useEffect(() => {
    if (queueData.timer_remaining > 0) {
      const timer = setTimeout(() => {
        setQueueData(prev => ({
          ...prev,
          timer_remaining: Math.max(0, prev.timer_remaining - 1)
        }));
      }, 60000); // Update every minute

      return () => clearTimeout(timer);
    }
  }, [queueData.timer_remaining]);

  // Utility functions
  const getPriorityColor = (priority) => {
    if (priority >= 7) return 'border-red-500 bg-red-50';
    if (priority >= 4) return 'border-orange-500 bg-orange-50';
    return 'border-green-500 bg-green-50';
  };

  const getPriorityIcon = (priority) => {
    if (priority >= 7) return <AlertCircle className="w-6 h-6 text-red-500" />;
    if (priority >= 4) return <Clock className="w-6 h-6 text-orange-500" />;
    return <User className="w-6 h-6 text-green-500" />;
  };

  const getBedByIdp = (bedId) => {
    return beds.find(bed => bed.bed_id === bedId);
  };

  const formatTime = (minutes) => {
    const mins = Math.floor(minutes);
    return `${mins} min`;
  };

  const handleBedClick = async (bed) => {
    setSelectedBed(bed);
    await fetchBedNotes(bed.bed_id);
  };

  const handleVoiceNote = async (bedId, speakerType, content) => {
    try {
      const response = await fetch('/api/voice-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bed_id: bedId,
          speaker_type: speakerType,
          content: content
        })
      });

      if (response.ok) {
        // Refresh bed notes and queue
        await fetchBedNotes(bedId);
        await fetchQueue();
      }
    } catch (error) {
      console.error('Error submitting voice note:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-xl">Loading Hospital Operations Multiplier...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Hospital Operations Multiplier
          </h1>
          <p className="text-gray-600">
            Post-Op Efficiency by Palantir x ElevenLabs
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Beds Grid */}
          <div className="lg:col-span-3">
            <h2 className="text-xl font-semibold mb-4">Post-Op Beds</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {beds.map((bed) => (
                <div
                  key={bed.bed_id}
                  onClick={() => handleBedClick(bed)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-lg ${
                    getPriorityColor(bed.current_priority)
                  } ${bed.bed_id === queueData.current_bed ? 'ring-4 ring-blue-300' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-lg">{bed.bed_id}</span>
                    {getPriorityIcon(bed.current_priority)}
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="font-medium">{bed.patient_name}</div>
                    <div className="text-gray-600">{bed.procedure_type}</div>
                    <div className="text-gray-500">
                      Priority: {bed.current_priority} | {bed.time_in_postop}min
                    </div>
                    <div className={`text-xs px-2 py-1 rounded ${
                      bed.status === 'needs_attention' ? 'bg-red-100 text-red-800' :
                      bed.status === 'stable' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {bed.status.replace('_', ' ')}
                    </div>
                  </div>
                  {bed.bed_id === queueData.current_bed && (
                    <div className="mt-2 text-center">
                      <div className="text-xs font-medium text-blue-600">
                        👨‍⚕️ Doctor Here
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Doctor Status & Queue */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Stethoscope className="w-5 h-5 mr-2" />
                Doctor Status
              </h2>
              
              {/* Current Location */}
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="font-medium">Currently At</span>
                </div>
                <div className="ml-5">
                  <div className="text-lg font-semibold">
                    {queueData.current_bed}
                  </div>
                  <div className="text-sm text-gray-600">
                    {getBedByIdp(queueData.current_bed)?.patient_name}
                  </div>
                  <div className="flex items-center mt-1">
                    <Timer className="w-4 h-4 mr-1" />
                    <span className="text-sm">
                      {formatTime(queueData.timer_remaining)} remaining
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Queue */}
              <div>
                <h3 className="font-medium mb-3">Next Visits</h3>
                <div className="space-y-2">
                  {queueData.next_beds.slice(0, 4).map((bedId, index) => {
                    const bed = getBedByIdp(bedId);
                    if (!bed) return null;
                    
                    return (
                      <div
                        key={bedId}
                        className={`p-3 rounded-lg border ${
                          index === 0 ? 'border-blue-200 bg-blue-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium text-sm">{bedId}</div>
                            <div className="text-xs text-gray-600">
                              {bed.patient_name}
                            </div>
                          </div>
                          <div className="text-xs">
                            Priority: {bed.current_priority}
                          </div>
                        </div>
                        {index === 0 && (
                          <div className="text-xs text-blue-600 mt-1">
                            → Next Visit
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bed Modal */}
      {selectedBed && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">
                {selectedBed.bed_id} - {selectedBed.patient_name}
              </h2>
              <button
                onClick={() => setSelectedBed(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-semibold mb-2">Patient Info</h3>
                <div className="space-y-1 text-sm">
                  <div>Procedure: {selectedBed.procedure_type}</div>
                  <div>Priority: {selectedBed.current_priority}</div>
                  <div>Status: {selectedBed.status}</div>
                  <div>Time in Post-Op: {selectedBed.time_in_postop} min</div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Current Notes</h3>
                <div className="space-y-2 text-sm">
                  {bedNotes[selectedBed.bed_id]?.map((note, index) => (
                    <div key={index} className="bg-gray-50 p-2 rounded">
                      <div className="font-medium text-xs text-gray-600 mb-1">
                        {note.speaker_type === 'patient' ? '👤 Patient' : '👩‍⚕️ Nurse'}
                      </div>
                      <div>{note.content}</div>
                      {note.equipment_mentioned?.length > 0 && (
                        <div className="text-xs text-blue-600 mt-1">
                          Equipment: {note.equipment_mentioned.join(', ')}
                        </div>
                      )}
                    </div>
                  )) || (
                    <div className="text-gray-500 text-xs">No notes yet</div>
                  )}
                </div>
              </div>
            </div>

            {/* Voice Widgets */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">👤 Patient Voice</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Click to record patient feedback
                  </div>
                  {/* ElevenLabs widget would go here */}
                  <div className="bg-blue-100 p-3 rounded text-center text-sm">
                    🎤 ElevenLabs Patient Widget
                    <br />
                    <span className="text-xs text-gray-600">
                      (Voice widget integration)
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">👩‍⚕️ Nurse Voice</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-2">
                    Click to record nurse assessment
                  </div>
                  {/* ElevenLabs widget would go here */}
                  <div className="bg-green-100 p-3 rounded text-center text-sm">
                    🎤 ElevenLabs Nurse Widget
                    <br />
                    <span className="text-xs text-gray-600">
                      (Voice widget integration)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Demo Buttons */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm text-gray-600 mb-2">Demo: Simulate Voice Input</div>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => handleVoiceNote(selectedBed.bed_id, 'patient', 'My pain is really bad, like an 8 out of 10')}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                >
                  High Pain
                </button>
                <button
                  onClick={() => handleVoiceNote(selectedBed.bed_id, 'patient', 'I feel great! Ready to go home')}
                  className="px-3 py-1 bg-green-100 text-green-800 rounded text-xs hover:bg-green-200"
                >
                  Feeling Good
                </button>
                <button
                  onClick={() => handleVoiceNote(selectedBed.bed_id, 'nurse', 'Patient stable, ready for discharge')}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                >
                  Nurse: Stable
                </button>
                <button
                  onClick={() => handleVoiceNote(selectedBed.bed_id, 'nurse', 'Patient needs IV pump and wheelchair')}
                  className="px-3 py-1 bg-orange-100 text-orange-800 rounded text-xs hover:bg-orange-200"
                >
                  Nurse: Equipment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalDashboard;