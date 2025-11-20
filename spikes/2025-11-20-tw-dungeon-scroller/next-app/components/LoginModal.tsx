'use client';

import { useState } from 'react';

interface LoginModalProps {
  onLogin: (userId: number, username: string) => void;
}

export default function LoginModal({ onLogin }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim()) {
      setError('Bitte gib einen Benutzernamen ein');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: username.trim() }),
      });

      if (!response.ok) {
        throw new Error('Login fehlgeschlagen');
      }

      const data = await response.json();

      // Store in localStorage
      localStorage.setItem('userId', data.id.toString());
      localStorage.setItem('username', data.username);

      // Call parent callback
      onLogin(data.id, data.username);
    } catch (err) {
      setError('Login fehlgeschlagen. Bitte versuche es erneut.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: '#1a1a1a',
        padding: '40px',
        borderRadius: '8px',
        border: '2px solid #4CAF50',
        maxWidth: '400px',
        width: '90%'
      }}>
        <h2 style={{
          color: '#4CAF50',
          marginTop: 0,
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '24px'
        }}>
          Dungeons & Diplomas
        </h2>
        <p style={{
          color: '#ccc',
          marginBottom: '20px',
          textAlign: 'center',
          fontSize: '14px'
        }}>
          Gib deinen Benutzernamen ein, um zu starten
        </p>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Benutzername"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              borderRadius: '4px',
              border: '1px solid #555',
              backgroundColor: '#2a2a2a',
              color: '#fff',
              marginBottom: '10px',
              boxSizing: 'border-box'
            }}
            autoFocus
          />
          {error && (
            <p style={{
              color: '#ff6b6b',
              fontSize: '14px',
              marginTop: 0,
              marginBottom: '10px'
            }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1
            }}
          >
            {isLoading ? 'Lädt...' : 'Starten'}
          </button>
        </form>
      </div>
    </div>
  );
}
