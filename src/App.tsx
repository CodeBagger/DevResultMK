import React, { useState, useEffect, useRef } from 'react';
import Calendar from './components/Calendar';
import { Login } from './components/Login';
import { useEvents } from './hooks/useEvents';
import { useAuth } from './contexts/AuthContext';
import './App.css';

function App() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { events, loading: eventsLoading, error, addEvent, updateEvent, deleteEvent } = useEvents();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if user is not authenticated
  if (!user) {
    return <Login />;
  }

  // Show loading state while loading events
  if (eventsLoading) {
    return (
      <div className="App">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your events...</p>
        </div>
      </div>
    );
  }

  const handleSignOut = async () => {
    try {
      await signOut();
      setShowUserMenu(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const userInitials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : user.id.substring(0, 2).toUpperCase();

  const userName = user.user_metadata?.full_name || user.email || 'User';

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="header-title">
            <h1>Scheduler</h1>
            <p>Manage your schedule with ease</p>
          </div>
          <div className="user-menu-container" ref={userMenuRef}>
            <button
              className="user-menu-button"
              onClick={() => setShowUserMenu(!showUserMenu)}
              aria-label="User menu"
            >
              <div className="user-avatar">{userInitials}</div>
              <span className="user-name">{userName}</span>
              <svg
                className={`user-menu-arrow ${showUserMenu ? 'open' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6L8 10L12 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            {showUserMenu && (
              <div className="user-menu-dropdown">
                <div className="user-menu-info">
                  <div className="user-menu-email">{user.email}</div>
                </div>
                <button className="user-menu-item" onClick={handleSignOut}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M10 11L13 8M13 8L10 5M13 8H6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
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
