'use client';

interface ActionButtonsProps {
  onRestart: () => void;
  onSkills: () => void;
  onLogout: () => void;
}

interface ActionButtonProps {
  onClick: () => void;
  title: string;
  icon: string;
  color: string;
  rgbValues: string;
}

/**
 * Single action button with hover effect
 */
function ActionButton({ onClick, title, icon, color, rgbValues }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        flex: 1,
        padding: '5px 8px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: `rgba(${rgbValues}, 0.3)`,
        color: color,
        border: `1px solid rgba(${rgbValues}, 0.5)`,
        borderRadius: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.backgroundColor = `rgba(${rgbValues}, 0.5)`;
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.backgroundColor = `rgba(${rgbValues}, 0.3)`;
      }}
    >
      {icon}
    </button>
  );
}

/**
 * Action buttons row (Restart, Skills, Logout)
 */
export function ActionButtons({ onRestart, onSkills, onLogout }: ActionButtonsProps) {
  return (
    <div style={{
      display: 'flex',
      gap: '4px',
      paddingTop: '8px',
      borderTop: '1px solid rgba(76, 175, 80, 0.2)'
    }}>
      <ActionButton
        onClick={onRestart}
        title="Restart"
        icon="🔄"
        color="#4CAF50"
        rgbValues="76, 175, 80"
      />
      <ActionButton
        onClick={onSkills}
        title="Skills"
        icon="📊"
        color="#2196F3"
        rgbValues="33, 150, 243"
      />
      <ActionButton
        onClick={onLogout}
        title="Logout"
        icon="🚪"
        color="#f44336"
        rgbValues="244, 67, 54"
      />
    </div>
  );
}
