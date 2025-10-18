import React, { useState } from 'react';
import eventService from '../../services/eventService';
import '../../styles/CompletionChecklist.css';

const CompletionChecklist = ({ event, onUploadComplete, canManage }) => {
  const [uploading, setUploading] = useState(false);
  const [uploadingType, setUploadingType] = useState(null);

  // Calculate days remaining
  const getDaysRemaining = () => {
    if (!event.completionDeadline) return null;
    const deadline = new Date(event.completionDeadline);
    const now = new Date();
    const diffTime = deadline - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysRemaining = getDaysRemaining();

  // Get urgency level for styling
  const getUrgencyLevel = () => {
    if (daysRemaining === null) return 'normal';
    if (daysRemaining <= 2) return 'urgent';
    if (daysRemaining <= 4) return 'warning';
    return 'normal';
  };

  const urgencyLevel = getUrgencyLevel();

  // Check if event is incomplete
  const isIncomplete = event.status === 'incomplete';

  // Checklist items
  const checklistItems = [
    {
      id: 'photos',
      label: 'Event Photos',
      required: 'Minimum 5 photos',
      completed: event.completionChecklist?.photosUploaded || false,
      count: event.photos?.length || 0,
      requiredCount: 5,
      uploadType: 'photos'
    },
    {
      id: 'report',
      label: 'Event Report',
      required: 'PDF/DOC format',
      completed: event.completionChecklist?.reportUploaded || false,
      uploadType: 'report'
    },
    {
      id: 'attendance',
      label: 'Attendance Sheet',
      required: 'Excel/CSV format',
      completed: event.completionChecklist?.attendanceUploaded || false,
      uploadType: 'attendance'
    }
  ];

  // Add bills if budget exists
  if (event.budget > 0) {
    checklistItems.push({
      id: 'bills',
      label: 'Bills/Receipts',
      required: 'PDF/Image format',
      completed: event.completionChecklist?.billsUploaded || false,
      count: event.billsUrls?.length || 0,
      uploadType: 'bills'
    });
  }

  // Calculate progress
  const completedCount = checklistItems.filter(item => item.completed).length;
  const totalCount = checklistItems.length;
  const progressPercentage = Math.round((completedCount / totalCount) * 100);

  // Handle upload
  const handleUpload = async (uploadType) => {
    if (uploading) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = uploadType === 'photos' ? 'image/*' : 
                   uploadType === 'report' ? '.pdf,.doc,.docx' :
                   uploadType === 'attendance' ? '.xlsx,.xls,.csv' :
                   uploadType === 'bills' ? '.pdf,image/*' : '*';
    input.multiple = uploadType === 'photos' || uploadType === 'bills';
    
    input.onchange = async (e) => {
      const files = Array.from(e.target.files);
      if (files.length === 0) return;

      // Validate file count for photos
      if (uploadType === 'photos' && files.length < 5) {
        alert('⚠️ Please select at least 5 photos');
        return;
      }

      setUploading(true);
      setUploadingType(uploadType);
      
      try {
        const formData = new FormData();
        files.forEach(file => {
          formData.append(uploadType, file);
        });

        await eventService.uploadMaterials(event._id, formData);
        alert('✅ Upload successful!');
        
        if (onUploadComplete) {
          onUploadComplete(uploadType);
        }
      } catch (err) {
        console.error('Upload error:', err);
        alert(`❌ Upload failed: ${err.response?.data?.message || err.message}`);
      } finally {
        setUploading(false);
        setUploadingType(null);
      }
    };
    
    input.click();
  };

  if (event.status !== 'pending_completion' && !isIncomplete) {
    return null; // Don't show if not in pending_completion or incomplete status
  }

  return (
    <div className={`completion-checklist ${urgencyLevel} ${isIncomplete ? 'incomplete' : ''}`}>
      {/* Header */}
      <div className="checklist-header">
        {isIncomplete ? (
          <>
            <h3>❌ Event Marked Incomplete</h3>
            <p className="deadline-text incomplete-text">
              7-day deadline has passed. Please upload missing materials.
            </p>
            {event.incompleteReason && (
              <p className="incomplete-reason">{event.incompleteReason}</p>
            )}
          </>
        ) : (
          <>
            <h3>⏰ Complete Your Event</h3>
            {daysRemaining !== null && (
              <p className={`deadline-text ${urgencyLevel}`}>
                {daysRemaining > 0 ? (
                  <>
                    <strong>{daysRemaining}</strong> day{daysRemaining !== 1 ? 's' : ''} remaining
                  </>
                ) : daysRemaining === 0 ? (
                  <strong className="urgent">⚠️ Due today!</strong>
                ) : (
                  <strong className="urgent">⚠️ Overdue!</strong>
                )}
              </p>
            )}
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className={`progress-fill ${urgencyLevel}`}
            style={{ width: `${progressPercentage}%` }}
          >
            <span className="progress-text">{progressPercentage}%</span>
          </div>
        </div>
        <p className="progress-label">
          {completedCount} of {totalCount} items completed
        </p>
      </div>

      {/* Checklist Items */}
      <div className="checklist-items">
        {checklistItems.map(item => (
          <div key={item.id} className={`checklist-item ${item.completed ? 'completed' : 'pending'}`}>
            <div className="item-status">
              {item.completed ? (
                <span className="status-icon completed">✅</span>
              ) : (
                <span className="status-icon pending">⏳</span>
              )}
            </div>
            
            <div className="item-details">
              <h4>{item.label}</h4>
              <p className="item-requirement">{item.required}</p>
              {item.count !== undefined && (
                <p className="item-count">
                  {item.completed ? (
                    <span className="success">✓ {item.count} uploaded</span>
                  ) : (
                    <span className="pending">
                      {item.count}/{item.requiredCount || 1} uploaded
                    </span>
                  )}
                </p>
              )}
            </div>

            {canManage && !item.completed && (
              <div className="item-action">
                <button 
                  className="btn btn-sm btn-primary"
                  onClick={() => handleUpload(item.uploadType)}
                  disabled={uploading}
                >
                  {uploading && uploadingType === item.uploadType ? '⏳ Uploading...' : '📤 Upload'}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Action Buttons - Removed bulk upload, users upload individually */}

      {/* Success Message */}
      {completedCount === totalCount && !isIncomplete && (
        <div className="checklist-success">
          <p>🎉 All materials uploaded! Your event will be marked as completed shortly.</p>
        </div>
      )}

      {/* Incomplete Warning */}
      {isIncomplete && canManage && (
        <div className="checklist-warning">
          <p>⚠️ This event is marked incomplete. Contact your coordinator if you believe this is an error.</p>
        </div>
      )}
    </div>
  );
};

export default CompletionChecklist;
