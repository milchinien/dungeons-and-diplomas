'use client';

interface CharacterHeaderProps {
  username: string;
  level: number;
}

/**
 * Character header showing username and level
 */
export function CharacterHeader({ username, level }: CharacterHeaderProps) {
  return (
    <>
      {/* Header - Username */}
      <div style={{
        fontSize: '20px',
        fontWeight: 'bold',
        color: '#4CAF50',
        marginBottom: '8px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(76, 175, 80, 0.3)',
        textAlign: 'center',
        textShadow: '0 0 10px rgba(76, 175, 80, 0.5)'
      }}>
        {username}
      </div>

      {/* Level Display */}
      <div style={{
        fontSize: '16px',
        fontWeight: 'bold',
        color: '#FFD700',
        marginBottom: '6px',
        textAlign: 'center',
        textShadow: '0 0 8px rgba(255, 215, 0, 0.6)'
      }}>
        Level {level}
      </div>
    </>
  );
}
