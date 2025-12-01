import { useState, useEffect, useCallback } from 'react';
import { Event } from '../types/Event';
import { EventService } from '../services/eventService';
import { useAuth } from '../contexts/AuthContext';

export const useEvents = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load events from Supabase
  const loadEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedEvents = await EventService.getEvents();
      setEvents(fetchedEvents);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Add a new event
  const addEvent = useCallback(async (event: Omit<Event, 'id'>) => {
    try {
      setError(null);
      const newEvent = await EventService.createEvent(event);
      setEvents(prev => [...prev, newEvent]);
      return newEvent;
    } catch (err) {
      console.error('Error adding event:', err);
      setError('Failed to add event. Please try again.');
      throw err;
    }
  }, []);

  // Update an existing event
  const updateEvent = useCallback(async (id: string, event: Omit<Event, 'id'>) => {
    try {
      setError(null);
      const updatedEvent = await EventService.updateEvent(id, event);
      setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e));
      return updatedEvent;
    } catch (err) {
      console.error('Error updating event:', err);
      setError('Failed to update event. Please try again.');
      throw err;
    }
  }, []);

  // Delete an event
  const deleteEvent = useCallback(async (id: string) => {
    try {
      setError(null);
      await EventService.deleteEvent(id);
      setEvents(prev => prev.filter(e => e.id !== id));
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete event. Please try again.');
      throw err;
    }
  }, []);

  // Load events on component mount and when user changes
  useEffect(() => {
    if (user) {
      loadEvents();
    } else {
      // Clear events when user logs out
      setEvents([]);
      setLoading(false);
    }
  }, [user, loadEvents]);

  return {
    events,
    loading,
    error,
    addEvent,
    updateEvent,
    deleteEvent,
    refreshEvents: loadEvents
  };
};






