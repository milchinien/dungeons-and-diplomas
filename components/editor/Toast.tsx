import { useEffect, useState } from 'react';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface ToastProps {
  messages: ToastMessage[];
  onDismiss: (id: number) => void;
}

export default function Toast({ messages, onDismiss }: ToastProps) {
  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }}>
      {messages.map((msg) => (
        <ToastItem key={msg.id} message={msg} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ message, onDismiss }: { message: ToastMessage; onDismiss: (id: number) => void }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in
    setTimeout(() => setIsVisible(true), 10);

    // Auto dismiss after 3 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => onDismiss(message.id), 300);
    }, 3000);

    return () => clearTimeout(timer);
  }, [message.id, onDismiss]);

  const bgColor = {
    success: '#4CAF50',
    error: '#f44336',
    info: '#2196F3'
  }[message.type];

  const icon = {
    success: '✓',
    error: '✕',
    info: 'ℹ'
  }[message.type];

  return (
    <div
      style={{
        padding: '12px 20px',
        backgroundColor: bgColor,
        color: 'white',
        borderRadius: '6px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        fontFamily: 'Rajdhani, sans-serif',
        fontSize: '14px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0)' : 'translateX(100px)',
        transition: 'opacity 0.3s ease, transform 0.3s ease',
        cursor: 'pointer'
      }}
      onClick={() => {
        setIsVisible(false);
        setTimeout(() => onDismiss(message.id), 300);
      }}
    >
      <span style={{ fontSize: '18px', fontWeight: 'bold' }}>{icon}</span>
      <span>{message.message}</span>
    </div>
  );
}

// Hook for managing toasts
export function useToast() {
  const [messages, setMessages] = useState<ToastMessage[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    setMessages(prev => [...prev, { id, message, type }]);
  };

  const dismissToast = (id: number) => {
    setMessages(prev => prev.filter(m => m.id !== id));
  };

  return { messages, showToast, dismissToast };
}
