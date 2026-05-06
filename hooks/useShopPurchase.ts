/**
 * Shop Purchase Hook
 *
 * Handles shop item/perk purchase logic including:
 * - Detecting when player is near items/perks
 * - Handling E key for purchase interaction
 * - Managing purchase confirmation modal
 * - Applying purchased items/perks to player
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { Room, BonusStats } from '@/lib/constants';
import type { Player } from '@/lib/enemy';
import type { Item } from '@/lib/shop/Item';
import type { Perk } from '@/lib/shop/Perk';
import { getInteractionTarget, getPlayerShopRoom, type InteractionTarget } from '@/lib/shop/ShopInteraction';
import {
  type PlayerShopData,
  createPlayerShopData,
  executeItemPurchase,
  executePerkPurchase
} from '@/lib/shop/ShopPurchase';

interface UseShopPurchaseProps {
  playerRef: React.MutableRefObject<Player>;
  rooms: Room[] | undefined;
  tileSize: number;
  inCombat: boolean;
  gamePaused: boolean;
  onHpChange: (hpIncrease: number) => void;
  userId: number | null;
  onGoldChange: (newGold: number) => void;
}

export interface ShopPurchaseState {
  /** Current shop data (items, perks, bonusStats) */
  shopData: PlayerShopData;

  /** Current purchase target (for modal) */
  purchaseTarget: InteractionTarget | null;

  /** Nearby target for tooltip display (null if none nearby) */
  nearbyTarget: InteractionTarget | null;

  /** Whether to show the purchase modal */
  showPurchaseModal: boolean;

  /** Currently hovered/nearby shop room */
  currentShopRoom: Room | null;

  /** Current gold balance */
  currentGold: number;

  /** Get all bonus stats from shop purchases */
  getBonusStats: () => BonusStats;

  /** Handle purchase confirmation */
  handlePurchaseConfirm: () => Promise<void>;

  /** Handle purchase cancel */
  handlePurchaseCancel: () => void;

  /** Check for nearby items/perks and update proximity state */
  updateProximity: () => void;

  /** Reset shop data (for new game) */
  resetShopData: () => void;

  /** Load current gold balance */
  loadGold: (explicitId?: number) => Promise<void>;
}

export function useShopPurchase({
  playerRef,
  rooms,
  tileSize,
  inCombat,
  gamePaused,
  onHpChange,
  userId,
  onGoldChange
}: UseShopPurchaseProps): ShopPurchaseState {
  const [shopData, setShopData] = useState<PlayerShopData>(createPlayerShopData());
  const [purchaseTarget, setPurchaseTarget] = useState<InteractionTarget | null>(null);
  const [nearbyTarget, setNearbyTarget] = useState<InteractionTarget | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentShopRoom, setCurrentShopRoom] = useState<Room | null>(null);
  const [currentGold, setCurrentGold] = useState<number>(0);

  // Track last E key state to detect key press (not hold)
  const lastEKeyRef = useRef(false);

  // Load current gold balance.
  // Optionally accepts an explicit id to avoid stale-closure issues right after login,
  // when the userId React state hasn't propagated through the hook yet.
  const loadGold = useCallback(async (explicitId?: number) => {
    const id = explicitId ?? userId;
    if (!id) return;

    try {
      const response = await fetch(`/api/gold?userId=${id}`);
      if (!response.ok) {
        console.error('[useShopPurchase] Failed to load gold');
        return;
      }

      const data = await response.json();
      setCurrentGold(data.gold);
      onGoldChange(data.gold);
    } catch (error) {
      console.error('[useShopPurchase] Error loading gold:', error);
    }
  }, [userId, onGoldChange]);

  // Get bonus stats
  const getBonusStats = useCallback(() => {
    return shopData.bonusStats;
  }, [shopData.bonusStats]);

  // Update proximity to shop items/perks
  const updateProximity = useCallback(() => {
    if (!rooms || inCombat || gamePaused) {
      setCurrentShopRoom(null);
      setNearbyTarget(null);
      return;
    }

    const player = playerRef.current;
    const playerX = player.x + player.width / 2;
    const playerY = player.y + player.height / 2;

    // Find shop room player is in
    const shopRoom = getPlayerShopRoom(playerX, playerY, rooms);
    setCurrentShopRoom(shopRoom);

    // Find nearby item/perk for tooltip
    if (shopRoom) {
      const target = getInteractionTarget(playerX, playerY, shopRoom);
      setNearbyTarget(target);
    } else {
      setNearbyTarget(null);
    }
  }, [playerRef, rooms, inCombat, gamePaused]);

  // Handle E key press for shop interaction
  useEffect(() => {
    console.log(`[useShopPurchase] Hook mounted. inCombat: ${inCombat}, gamePaused: ${gamePaused}, rooms: ${rooms?.length || 0}`);
    if (inCombat || gamePaused || !rooms) {
      console.log('[useShopPurchase] Hook inactive due to conditions');
      return;
    }

    // Capture rooms for closure (TypeScript narrowing)
    const currentRooms = rooms;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'e') return;

      console.log('[useShopPurchase] E key pressed');

      // Skip if key is being held
      if (lastEKeyRef.current) {
        console.log('[useShopPurchase] E key already held, skipping');
        return;
      }
      lastEKeyRef.current = true;

      // If modal is open, don't process another E press
      if (showPurchaseModal) {
        console.log('[useShopPurchase] Modal already open, skipping');
        return;
      }

      const player = playerRef.current;
      const playerX = player.x + player.width / 2;
      const playerY = player.y + player.height / 2;

      // Find shop room player is in
      const shopRoom = getPlayerShopRoom(playerX, playerY, currentRooms);
      if (!shopRoom) {
        console.log('[useShopPurchase] Player not in shop room');
        return;
      }

      console.log(`[useShopPurchase] Player in shop room ${shopRoom.id} at (${Math.floor(playerX)}, ${Math.floor(playerY)})`);

      // Find nearby item or perk
      const target = getInteractionTarget(playerX, playerY, shopRoom);
      if (target) {
        console.log(`[useShopPurchase] Found ${target.type} at distance, opening modal`);
        setPurchaseTarget(target);
        setShowPurchaseModal(true);
      } else {
        console.log('[useShopPurchase] No item/perk in range (need to be within 96px)');
      }
    }

    function handleKeyUp(e: KeyboardEvent) {
      if (e.key.toLowerCase() === 'e') {
        lastEKeyRef.current = false;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [playerRef, rooms, inCombat, gamePaused, showPurchaseModal]);

  // Handle purchase confirmation
  const handlePurchaseConfirm = useCallback(async () => {
    if (!purchaseTarget || !currentShopRoom?.shopInventory || !userId) {
      setShowPurchaseModal(false);
      setPurchaseTarget(null);
      return;
    }

    const inventory = currentShopRoom.shopInventory;

    // Get item/perk and check cost
    let cost = 0;
    if (purchaseTarget.type === 'item') {
      const item = inventory.items[purchaseTarget.index];
      if (!item) {
        console.log('[useShopPurchase] Item already purchased or invalid');
        setShowPurchaseModal(false);
        setPurchaseTarget(null);
        return;
      }
      cost = item.finalCost;
    } else {
      const perk = inventory.perks[purchaseTarget.index];
      if (!perk) {
        console.log('[useShopPurchase] Perk already purchased or invalid');
        setShowPurchaseModal(false);
        setPurchaseTarget(null);
        return;
      }
      cost = perk.finalCost;
    }

    // Check if player has enough gold
    if (currentGold < cost) {
      console.log(`[useShopPurchase] Not enough gold! Need ${cost}, have ${currentGold}`);
      setShowPurchaseModal(false);
      setPurchaseTarget(null);
      return;
    }

    // Execute purchase
    if (purchaseTarget.type === 'item') {
      const result = executeItemPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success && result.item) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }

        // Deduct gold via API
        try {
          const response = await fetch('/api/gold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              gold_amount: -cost,
              reason: 'shop_purchase',
              item_sold: result.item.definition.name
            })
          });

          if (response.ok) {
            const data = await response.json();
            setCurrentGold(data.new_balance);
            onGoldChange(data.new_balance);
            console.log(`[useShopPurchase] Item purchased: ${result.item.definition.name} for ${cost} gold. New balance: ${data.new_balance}`);
          }
        } catch (error) {
          console.error('[useShopPurchase] Error deducting gold:', error);
        }
      }
    } else {
      const result = executePerkPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success && result.perk) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }

        // Deduct gold via API
        try {
          const response = await fetch('/api/gold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              gold_amount: -cost,
              reason: 'shop_purchase',
              item_sold: result.perk.definition.name
            })
          });

          if (response.ok) {
            const data = await response.json();
            setCurrentGold(data.new_balance);
            onGoldChange(data.new_balance);
            console.log(`[useShopPurchase] Perk purchased: ${result.perk.definition.name} for ${cost} gold. New balance: ${data.new_balance}`);
          }
        } catch (error) {
          console.error('[useShopPurchase] Error deducting gold:', error);
        }
      }
    }

    setShowPurchaseModal(false);
    setPurchaseTarget(null);
  }, [purchaseTarget, currentShopRoom, shopData, onHpChange, userId, currentGold, onGoldChange]);

  // Handle purchase cancel
  const handlePurchaseCancel = useCallback(() => {
    setShowPurchaseModal(false);
    setPurchaseTarget(null);
  }, []);

  // Reset shop data (for new game)
  const resetShopData = useCallback(() => {
    setShopData(createPlayerShopData());
    setPurchaseTarget(null);
    setNearbyTarget(null);
    setShowPurchaseModal(false);
    setCurrentShopRoom(null);
  }, []);

  return {
    shopData,
    purchaseTarget,
    nearbyTarget,
    showPurchaseModal,
    currentShopRoom,
    currentGold,
    getBonusStats,
    handlePurchaseConfirm,
    handlePurchaseCancel,
    updateProximity,
    resetShopData,
    loadGold
  };
}
