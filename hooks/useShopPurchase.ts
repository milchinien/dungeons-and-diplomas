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

  // Prevent concurrent purchase executions (double-click protection)
  const isPurchasingRef = useRef(false);

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
    // Use tileSize for the player center - player.width/height are always 0.
    // Must match GameRenderer.updateInteractionTarget (tooltip rendering).
    const playerX = player.x + tileSize / 2;
    const playerY = player.y + tileSize / 2;

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
  }, [playerRef, rooms, tileSize, inCombat, gamePaused]);

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
      // Use tileSize for the player center - player.width/height are always 0.
      // Must match GameRenderer.updateInteractionTarget (tooltip rendering).
      const playerX = player.x + tileSize / 2;
      const playerY = player.y + tileSize / 2;

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
        console.log('[useShopPurchase] No item/perk in interaction range');
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
  }, [playerRef, rooms, tileSize, inCombat, gamePaused, showPurchaseModal]);

  // Handle purchase confirmation
  const handlePurchaseConfirm = useCallback(async () => {
    if (!purchaseTarget || !currentShopRoom?.shopInventory || !userId) {
      setShowPurchaseModal(false);
      setPurchaseTarget(null);
      return;
    }

    // Prevent double-submission (e.g. double-click on confirm button)
    if (isPurchasingRef.current) return;
    isPurchasingRef.current = true;

    try {
      const inventory = currentShopRoom.shopInventory;

      // Get item/perk and check cost
      let cost = 0;
      let targetName = '';
      if (purchaseTarget.type === 'item') {
        const item = inventory.items[purchaseTarget.index];
        if (!item) {
          console.log('[useShopPurchase] Item already purchased or invalid');
          setShowPurchaseModal(false);
          setPurchaseTarget(null);
          return;
        }
        cost = item.finalCost;
        targetName = item.definition.name;
      } else {
        const perk = inventory.perks[purchaseTarget.index];
        if (!perk) {
          console.log('[useShopPurchase] Perk already purchased or invalid');
          setShowPurchaseModal(false);
          setPurchaseTarget(null);
          return;
        }
        cost = perk.finalCost;
        targetName = perk.definition.name;
      }

      // Check if player has enough gold
      if (currentGold < cost) {
        console.log(`[useShopPurchase] Not enough gold! Need ${cost}, have ${currentGold}`);
        setShowPurchaseModal(false);
        setPurchaseTarget(null);
        return;
      }

      // Deduct gold FIRST - the item/perk is only handed out if payment succeeds
      let newBalance: number;
      try {
        const response = await fetch('/api/gold', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: userId,
            gold_amount: -cost,
            reason: 'shop_purchase',
            item_sold: targetName
          })
        });

        if (!response.ok) {
          console.error('[useShopPurchase] Gold deduction failed, purchase cancelled');
          setShowPurchaseModal(false);
          setPurchaseTarget(null);
          return;
        }

        const data = await response.json();
        newBalance = data.new_balance;
      } catch (error) {
        console.error('[useShopPurchase] Error deducting gold, purchase cancelled:', error);
        setShowPurchaseModal(false);
        setPurchaseTarget(null);
        return;
      }

      setCurrentGold(newBalance);
      onGoldChange(newBalance);

      // Execute purchase (payment already succeeded)
      const result = purchaseTarget.type === 'item'
        ? executeItemPurchase(shopData, inventory, purchaseTarget.index)
        : executePerkPurchase(shopData, inventory, purchaseTarget.index);

      if (result.success) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          // Raise max HP so HP items/perks actually increase max HP instead of only healing
          playerRef.current.maxHp += result.hpIncrease;
          onHpChange(result.hpIncrease);
        }
        console.log(`[useShopPurchase] ${purchaseTarget.type} purchased: ${targetName} for ${cost} gold. New balance: ${newBalance}`);
      } else {
        // Should not happen (slot was checked above) - refund the deducted gold
        console.error('[useShopPurchase] Purchase failed after payment, refunding gold');
        try {
          const refundResponse = await fetch('/api/gold', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: userId,
              gold_amount: cost,
              reason: 'shop_purchase_refund',
              item_sold: targetName
            })
          });

          if (refundResponse.ok) {
            const refundData = await refundResponse.json();
            setCurrentGold(refundData.new_balance);
            onGoldChange(refundData.new_balance);
          }
        } catch (refundError) {
          console.error('[useShopPurchase] Error refunding gold:', refundError);
        }
      }

      setShowPurchaseModal(false);
      setPurchaseTarget(null);
    } finally {
      isPurchasingRef.current = false;
    }
  }, [purchaseTarget, currentShopRoom, shopData, playerRef, onHpChange, userId, currentGold, onGoldChange]);

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
