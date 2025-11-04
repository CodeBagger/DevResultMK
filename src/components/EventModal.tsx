import React, { useState, useEffect } from 'react';
import { Event } from '../types/Event';
import { format } from 'date-fns';
import { X, Trash2, Save } from 'lucide-react';

interface EventModalProps {
  event: Event | Omit<Event, 'id'> | null;
  onSave: (event: Omit<Event, 'id'>) => void;
  onClose: () => void;
  onDelete?: () => void;
}

const EventModal: React.FC<EventModalProps> = ({ event, onSave, onClose, onDelete }) => {
  const [formData, setFormData] = useState({
    title: '',
    start: new Date(),
    end: new Date(),
    description: '',
    color: '#3b82f6'
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description || '',
        color: event.color || '#3b82f6'
      });
    }
  }, [event]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title.trim()) {
      onSave(formData);
    }
  };

  const handleChange = (field: string, value: string | Date) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTime = (date: Date) => {
    return format(date, "yyyy-MM-dd'T'HH:mm");
  };

  const parseDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{event && 'id' in event ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="close-button">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="event-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Event title"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="start">Start</label>
              <input
                id="start"
                type="datetime-local"
                value={formatDateTime(formData.start)}
                onChange={(e) => handleChange('start', parseDateTime(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label htmlFor="end">End</label>
              <input
                id="end"
                type="datetime-local"
                value={formatDateTime(formData.end)}
                onChange={(e) => handleChange('end', parseDateTime(e.target.value))}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Event description"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="color">Color</label>
            <div className="color-picker">
              <input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => handleChange('color', e.target.value)}
              />
              <span className="color-label">{formData.color}</span>
            </div>
          </div>

          <div className="modal-actions">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="delete-button"
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
            <div className="action-buttons">
              <button type="button" onClick={onClose} className="cancel-button">
                Cancel
              </button>
              <button type="submit" className="save-button">
                <Save size={16} />
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EventModal;
