'use client';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant
}: ConfirmModalProps) {
  const getVariantColor = () => {
    switch (variant) {
      case 'danger': return '#ef4444';
      case 'warning': return '#fbbf24';
      case 'info': return '#4a9eff';
    }
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        fontFamily: 'Rajdhani, monospace'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#2a2a2a',
          border: `2px solid ${getVariantColor()}`,
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          color: 'white'
        }}
      >
        {/* Title */}
        <h3 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          marginBottom: '12px',
          color: getVariantColor()
        }}>
          {title}
        </h3>

        {/* Message */}
        <p style={{
          fontSize: '14px',
          color: '#ccc',
          marginBottom: '24px',
          lineHeight: '1.5'
        }}>
          {message}
        </p>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onCancel}
            style={{
              padding: '10px 20px',
              backgroundColor: '#444',
              color: 'white',
              border: '1px solid #555',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Rajdhani, monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#555';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#444';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            {cancelText}
          </button>

          <button
            onClick={onConfirm}
            style={{
              padding: '10px 20px',
              backgroundColor: getVariantColor(),
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Rajdhani, monospace',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.15s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.85';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
              e.currentTarget.style.transform = 'scale(1)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
