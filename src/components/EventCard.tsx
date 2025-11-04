import React from 'react';
import { Event } from '../types/Event';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
  onClick: () => void;
}

const EventCard: React.FC<EventCardProps> = ({ event, onClick }) => {
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <div 
      className="event-card"
      style={{ backgroundColor: event.color || '#3b82f6' }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <div className="event-title">{event.title}</div>
      <div className="event-time">
        {formatTime(event.start)} - {formatTime(event.end)}
      </div>
    </div>
  );
};

export default EventCard;
