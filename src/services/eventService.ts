import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Event } from '../types/Event';

// Convert Supabase event to our Event type
const convertFromSupabase = (supabaseEvent: any): Event => ({
  id: supabaseEvent.id,
  title: supabaseEvent.title,
  start: new Date(supabaseEvent.start),
  end: new Date(supabaseEvent.end),
  description: supabaseEvent.description,
  color: supabaseEvent.color || '#3b82f6'
});

// Convert our Event type to Supabase format
const convertToSupabase = (event: Omit<Event, 'id'>) => ({
  title: event.title,
  start: event.start.toISOString(),
  end: event.end.toISOString(),
  description: event.description || null,
  color: event.color || '#3b82f6'
});

// Local storage fallback functions
const getLocalEvents = (): Event[] => {
  try {
    const savedEvents = localStorage.getItem('scheduler-events');
    if (savedEvents) {
      return JSON.parse(savedEvents).map((event: any) => ({
        ...event,
        start: new Date(event.start),
        end: new Date(event.end)
      }));
    }
    return [];
  } catch (error) {
    console.error('Error loading events from localStorage:', error);
    return [];
  }
};

const saveLocalEvents = (events: Event[]) => {
  try {
    localStorage.setItem('scheduler-events', JSON.stringify(events));
  } catch (error) {
    console.error('Error saving events to localStorage:', error);
  }
};

// Event service class
export class EventService {
  // Get all events for the current user
  static async getEvents(): Promise<Event[]> {
    // If Supabase is not configured, use localStorage
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using localStorage');
      return getLocalEvents();
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user is logged in, return empty array
        return [];
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching events:', error);
        throw error;
      }

      return data ? data.map(convertFromSupabase) : [];
    } catch (error) {
      console.error('Error in getEvents:', error);
      // Fallback to localStorage on error
      console.log('Falling back to localStorage');
      return getLocalEvents();
    }
  }

  // Create a new event
  static async createEvent(event: Omit<Event, 'id'>): Promise<Event> {
    // If Supabase is not configured, use localStorage
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using localStorage');
      const newEvent: Event = {
        ...event,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      const currentEvents = getLocalEvents();
      const updatedEvents = [...currentEvents, newEvent];
      saveLocalEvents(updatedEvents);
      return newEvent;
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User must be authenticated to create events');
      }

      const supabaseEvent = {
        ...convertToSupabase(event),
        user_id: user.id
      };
      
      const { data, error } = await supabase
        .from('events')
        .insert([supabaseEvent])
        .select()
        .single();

      if (error) {
        console.error('Error creating event:', error);
        throw error;
      }

      return convertFromSupabase(data);
    } catch (error) {
      console.error('Error in createEvent:', error);
      // Fallback to localStorage on error
      console.log('Falling back to localStorage');
      const newEvent: Event = {
        ...event,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9)
      };
      const currentEvents = getLocalEvents();
      const updatedEvents = [...currentEvents, newEvent];
      saveLocalEvents(updatedEvents);
      return newEvent;
    }
  }

  // Update an existing event
  static async updateEvent(id: string, event: Omit<Event, 'id'>): Promise<Event> {
    // If Supabase is not configured, use localStorage
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using localStorage');
      const currentEvents = getLocalEvents();
      const updatedEvents = currentEvents.map(e => e.id === id ? { ...event, id } : e);
      saveLocalEvents(updatedEvents);
      return { ...event, id };
    }

    try {
      const supabaseEvent = convertToSupabase(event);
      
      const { data, error } = await supabase
        .from('events')
        .update(supabaseEvent)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating event:', error);
        throw error;
      }

      return convertFromSupabase(data);
    } catch (error) {
      console.error('Error in updateEvent:', error);
      // Fallback to localStorage on error
      console.log('Falling back to localStorage');
      const currentEvents = getLocalEvents();
      const updatedEvents = currentEvents.map(e => e.id === id ? { ...event, id } : e);
      saveLocalEvents(updatedEvents);
      return { ...event, id };
    }
  }

  // Delete an event
  static async deleteEvent(id: string): Promise<void> {
    // If Supabase is not configured, use localStorage
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using localStorage');
      const currentEvents = getLocalEvents();
      const updatedEvents = currentEvents.filter(e => e.id !== id);
      saveLocalEvents(updatedEvents);
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting event:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteEvent:', error);
      // Fallback to localStorage on error
      console.log('Falling back to localStorage');
      const currentEvents = getLocalEvents();
      const updatedEvents = currentEvents.filter(e => e.id !== id);
      saveLocalEvents(updatedEvents);
    }
  }

  // Get events for a specific date range
  static async getEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    // If Supabase is not configured, use localStorage
    if (!isSupabaseConfigured || !supabase) {
      console.log('Supabase not configured, using localStorage');
      const allEvents = getLocalEvents();
      return allEvents.filter(event => 
        event.start >= startDate && event.end <= endDate
      );
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // If no user is logged in, return empty array
        return [];
      }

      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('user_id', user.id)
        .gte('start', startDate.toISOString())
        .lte('end', endDate.toISOString())
        .order('start', { ascending: true });

      if (error) {
        console.error('Error fetching events by date range:', error);
        throw error;
      }

      return data ? data.map(convertFromSupabase) : [];
    } catch (error) {
      console.error('Error in getEventsByDateRange:', error);
      // Fallback to localStorage on error
      console.log('Falling back to localStorage');
      const allEvents = getLocalEvents();
      return allEvents.filter(event => 
        event.start >= startDate && event.end <= endDate
      );
    }
  }
}
