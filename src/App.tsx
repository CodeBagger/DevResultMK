import React from 'react';
import Calendar from './components/Calendar';
import { useEvents } from './hooks/useEvents';
import './App.css';

function App() {
  const { events, loading, error, addEvent, updateEvent, deleteEvent } = useEvents();

  if (loading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="app-header">
        <h1>Scheduler</h1>
        <p>Manage your schedule with ease</p>
        {error && (
          <div className="error-banner">
            <p>⚠️ {error}</p>
          </div>
        )}
      </header>
      <main className="app-main">
        <Calendar 
          events={events}
          onAddEvent={addEvent}
          onUpdateEvent={updateEvent}
          onDeleteEvent={deleteEvent}
        />
      </main>
    </div>
  );
}

export default App;
