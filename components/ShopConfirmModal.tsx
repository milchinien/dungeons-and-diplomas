/**
 * Shop Confirm Modal
 *
 * Displays when player presses E near an item/perk in the shop.
 * Shows item/perk details and asks for purchase confirmation.
 */
import { useEffect } from 'react';
import type { Item } from '@/lib/shop/Item';
import { getItemEffectDescription } from '@/lib/shop/Item';
import type { Perk } from '@/lib/shop/Perk';
import { getPerkEffectDescription } from '@/lib/shop/Perk';
import { RARITY_CONFIG } from '@/lib/shop/Rarity';

interface ShopConfirmModalProps {
  item?: Item;
  perk?: Perk;
  currentGold: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ShopConfirmModal({
  item,
  perk,
  currentGold,
  onConfirm,
  onCancel
}: ShopConfirmModalProps) {
  const target = item || perk;
  if (!target) return null;

  const isItem = !!item;
  const name = isItem ? item!.definition.name : perk!.definition.name;
  const description = isItem ? item!.definition.description : perk!.definition.description;
  const effectText = isItem ? getItemEffectDescription(item!) : getPerkEffectDescription(perk!);
  const cost = target.finalCost;
  const canAfford = currentGold >= cost;
  const rarity = target.rarity;
  const config = RARITY_CONFIG[rarity];

  // Handle keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onConfirm, onCancel]);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 300,
    }}>
      <div style={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #0f0f1a 100%)',
        border: `2px solid ${config.color}`,
        borderRadius: '12px',
        padding: '30px',
        maxWidth: '400px',
        width: '90%',
        boxShadow: `0 0 30px ${config.color}40`,
        animation: 'fadeIn 0.3s ease',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{
            color: config.color,
            fontSize: '28px',
            fontWeight: 'bold',
            marginBottom: '5px',
            textShadow: `0 0 10px ${config.color}80`,
          }}>
            {name}
          </h2>
          <p style={{
            color: config.color,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            {config.name}
          </p>
        </div>

        {/* Description */}
        <p style={{
          color: '#ccc',
          fontSize: '16px',
          textAlign: 'center',
          marginBottom: '20px',
          lineHeight: '1.4',
        }}>
          {description}
        </p>

        {/* Effect */}
        <div style={{
          backgroundColor: `${config.color}20`,
          border: `1px solid ${config.color}40`,
          borderRadius: '8px',
          padding: '15px',
          textAlign: 'center',
          marginBottom: '15px',
        }}>
          <span style={{
            color: config.color,
            fontSize: '20px',
            fontWeight: 'bold',
          }}>
            {effectText}
          </span>
        </div>

        {/* Cost */}
        <div style={{
          backgroundColor: 'rgba(255, 215, 0, 0.1)',
          border: '1px solid rgba(255, 215, 0, 0.3)',
          borderRadius: '8px',
          padding: '12px',
          marginBottom: '25px',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '5px',
          }}>
            <span style={{ fontSize: '20px' }}>🪙</span>
            <span style={{
              color: '#FFD700',
              fontSize: '24px',
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(255, 215, 0, 0.8)',
            }}>
              {cost}
            </span>
            <span style={{
              color: '#ccc',
              fontSize: '14px',
            }}>
              Gold
            </span>
          </div>
          <div style={{
            textAlign: 'center',
            fontSize: '12px',
            color: canAfford ? '#6c6' : '#c66',
          }}>
            {canAfford
              ? `Du hast ${currentGold} Gold`
              : `Nicht genug Gold! (${currentGold}/${cost})`
            }
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '15px',
        }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: '#333',
              border: '1px solid #555',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#444';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#333';
            }}
          >
            Abbrechen
          </button>
          <button
            onClick={onConfirm}
            disabled={!canAfford}
            style={{
              flex: 1,
              padding: '12px 20px',
              backgroundColor: canAfford ? config.color : '#555',
              border: 'none',
              borderRadius: '8px',
              color: canAfford ? '#000' : '#999',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: canAfford ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
              opacity: canAfford ? 1 : 0.6,
            }}
            onMouseEnter={(e) => {
              if (canAfford) {
                e.currentTarget.style.transform = 'scale(1.02)';
                e.currentTarget.style.boxShadow = `0 0 15px ${config.color}`;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Erwerben
          </button>
        </div>

        {/* Keyboard hint */}
        <p style={{
          color: '#666',
          fontSize: '12px',
          textAlign: 'center',
          marginTop: '15px',
        }}>
          [Enter] Bestaetigen · [Esc] Abbrechen
        </p>
      </div>
    </div>
  );
}
