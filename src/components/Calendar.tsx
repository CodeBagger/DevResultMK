import React, { useState } from 'react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addDays, subDays, addWeeks, subWeeks, addMonths, subMonths } from 'date-fns';
import { Event, ViewType } from '../types/Event';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, LayoutGrid } from 'lucide-react';
import EventModal from './EventModal';
import EventCard from './EventCard';

interface CalendarProps {
  events: Event[];
  onAddEvent: (event: Omit<Event, 'id'>) => void;
  onUpdateEvent: (id: string, event: Omit<Event, 'id'>) => void;
  onDeleteEvent: (id: string) => void;
}

const Calendar: React.FC<CalendarProps> = ({ events, onAddEvent, onUpdateEvent, onDeleteEvent }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [selectedEvent, setSelectedEvent] = useState<Event | Omit<Event, 'id'> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navigateDate = (direction: 'prev' | 'next') => {
    if (view === 'day') {
      setCurrentDate(prev => direction === 'prev' ? subDays(prev, 1) : addDays(prev, 1));
    } else if (view === 'week') {
      setCurrentDate(prev => direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1));
    } else {
      setCurrentDate(prev => direction === 'prev' ? subMonths(prev, 1) : addMonths(prev, 1));
    }
  };

  const getDateRange = () => {
    if (view === 'day') {
      return { start: currentDate, end: currentDate };
    } else if (view === 'week') {
      return { start: startOfWeek(currentDate), end: endOfWeek(currentDate) };
    } else {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
  };

  const getDaysToShow = () => {
    const { start, end } = getDateRange();
    if (view === 'month') {
      // Show full weeks for month view
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const weekStart = startOfWeek(monthStart);
      const weekEnd = endOfWeek(monthEnd);
      return eachDayOfInterval({ start: weekStart, end: weekEnd });
    }
    return eachDayOfInterval({ start, end });
  };

  const getEventsForDay = (date: Date) => {
    return events.filter(event => 
      isSameDay(event.start, date) || 
      (event.start <= date && event.end >= date)
    );
  };

  const formatHeader = () => {
    if (view === 'day') {
      return format(currentDate, 'EEEE, MMMM d, yyyy');
    } else if (view === 'week') {
      const { start, end } = getDateRange();
      return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
    } else {
      return format(currentDate, 'MMMM yyyy');
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const handleAddEvent = (date: Date) => {
    const newEvent: Omit<Event, 'id'> = {
      title: '',
      start: date,
      end: new Date(date.getTime() + 60 * 60 * 1000), // 1 hour later
      description: '',
      color: '#3b82f6'
    };
    setSelectedEvent(newEvent);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (eventData: Omit<Event, 'id'>) => {
    if (selectedEvent && 'id' in selectedEvent) {
      onUpdateEvent(selectedEvent.id, eventData);
    } else {
      onAddEvent(eventData);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
  };

  const days = getDaysToShow();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div className="calendar-controls">
          <button onClick={() => navigateDate('prev')} className="nav-button">
            <ChevronLeft size={20} />
          </button>
          <h1 className="calendar-title">{formatHeader()}</h1>
          <button onClick={() => navigateDate('next')} className="nav-button">
            <ChevronRight size={20} />
          </button>
        </div>
        
        <div className="view-controls">
          <button 
            onClick={() => setView('day')} 
            className={`view-button ${view === 'day' ? 'active' : ''}`}
          >
            <Clock size={16} />
            Day
          </button>
          <button 
            onClick={() => setView('week')} 
            className={`view-button ${view === 'week' ? 'active' : ''}`}
          >
            <CalendarIcon size={16} />
            Week
          </button>
          <button 
            onClick={() => setView('month')} 
            className={`view-button ${view === 'month' ? 'active' : ''}`}
          >
            <LayoutGrid size={16} />
            Month
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {view !== 'day' && (
          <div className="weekday-headers">
            {weekDays.map(day => (
              <div key={day} className="weekday-header">{day}</div>
            ))}
          </div>
        )}

        <div className={`calendar-days ${view === 'day' ? 'day-view' : view === 'week' ? 'week-view' : 'month-view'}`}>
          {days.map((day, index) => {
            const dayEvents = getEventsForDay(day);
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = isSameDay(day, new Date());
            
            return (
              <div 
                key={day.toISOString()} 
                className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => handleAddEvent(day)}
              >
                <div className="day-number">{format(day, 'd')}</div>
                <div className="day-events">
                  {dayEvents.map(event => (
                    <EventCard 
                      key={event.id} 
                      event={event} 
                      onClick={() => handleEventClick(event)}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isModalOpen && (
        <EventModal
          event={selectedEvent}
          onSave={handleSaveEvent}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedEvent(null);
          }}
          onDelete={selectedEvent && 'id' in selectedEvent ? () => {
            onDeleteEvent((selectedEvent as Event).id);
            setIsModalOpen(false);
            setSelectedEvent(null);
          } : undefined}
        />
      )}
    </div>
  );
};

export default Calendar;
