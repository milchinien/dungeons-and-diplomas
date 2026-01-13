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
}

export interface ShopPurchaseState {
  /** Current shop data (items, perks, bonusStats) */
  shopData: PlayerShopData;

  /** Current purchase target (for modal) */
  purchaseTarget: InteractionTarget | null;

  /** Whether to show the purchase modal */
  showPurchaseModal: boolean;

  /** Currently hovered/nearby shop room */
  currentShopRoom: Room | null;

  /** Get all bonus stats from shop purchases */
  getBonusStats: () => BonusStats;

  /** Handle purchase confirmation */
  handlePurchaseConfirm: () => void;

  /** Handle purchase cancel */
  handlePurchaseCancel: () => void;

  /** Check for nearby items/perks and update proximity state */
  updateProximity: () => void;

  /** Reset shop data (for new game) */
  resetShopData: () => void;
}

export function useShopPurchase({
  playerRef,
  rooms,
  tileSize,
  inCombat,
  gamePaused,
  onHpChange
}: UseShopPurchaseProps): ShopPurchaseState {
  const [shopData, setShopData] = useState<PlayerShopData>(createPlayerShopData());
  const [purchaseTarget, setPurchaseTarget] = useState<InteractionTarget | null>(null);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [currentShopRoom, setCurrentShopRoom] = useState<Room | null>(null);

  // Track last E key state to detect key press (not hold)
  const lastEKeyRef = useRef(false);

  // Get bonus stats
  const getBonusStats = useCallback(() => {
    return shopData.bonusStats;
  }, [shopData.bonusStats]);

  // Update proximity to shop items/perks
  const updateProximity = useCallback(() => {
    if (!rooms || inCombat || gamePaused) {
      setCurrentShopRoom(null);
      return;
    }

    const player = playerRef.current;
    const playerX = player.x + player.width / 2;
    const playerY = player.y + player.height / 2;

    // Find shop room player is in
    const shopRoom = getPlayerShopRoom(playerX, playerY, rooms);
    setCurrentShopRoom(shopRoom);
  }, [playerRef, rooms, inCombat, gamePaused]);

  // Handle E key press for shop interaction
  useEffect(() => {
    if (inCombat || gamePaused || !rooms) return;

    // Capture rooms for closure (TypeScript narrowing)
    const currentRooms = rooms;

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== 'e') return;

      // Skip if key is being held
      if (lastEKeyRef.current) return;
      lastEKeyRef.current = true;

      // If modal is open, don't process another E press
      if (showPurchaseModal) return;

      const player = playerRef.current;
      const playerX = player.x + player.width / 2;
      const playerY = player.y + player.height / 2;

      // Find shop room player is in
      const shopRoom = getPlayerShopRoom(playerX, playerY, currentRooms);
      if (!shopRoom) return;

      // Find nearby item or perk
      const target = getInteractionTarget(playerX, playerY, shopRoom);
      if (target) {
        setPurchaseTarget(target);
        setShowPurchaseModal(true);
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
  const handlePurchaseConfirm = useCallback(() => {
    if (!purchaseTarget || !currentShopRoom?.shopInventory) {
      setShowPurchaseModal(false);
      setPurchaseTarget(null);
      return;
    }

    const inventory = currentShopRoom.shopInventory;

    if (purchaseTarget.type === 'item') {
      const result = executeItemPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }
        console.log('[useShopPurchase] Item purchased:', result.item?.definition.name);
      }
    } else {
      const result = executePerkPurchase(shopData, inventory, purchaseTarget.index);
      if (result.success) {
        setShopData(result.shopData);
        if (result.hpIncrease > 0) {
          onHpChange(result.hpIncrease);
        }
        console.log('[useShopPurchase] Perk purchased:', result.perk?.definition.name);
      }
    }

    setShowPurchaseModal(false);
    setPurchaseTarget(null);
  }, [purchaseTarget, currentShopRoom, shopData, onHpChange]);

  // Handle purchase cancel
  const handlePurchaseCancel = useCallback(() => {
    setShowPurchaseModal(false);
    setPurchaseTarget(null);
  }, []);

  // Reset shop data (for new game)
  const resetShopData = useCallback(() => {
    setShopData(createPlayerShopData());
    setPurchaseTarget(null);
    setShowPurchaseModal(false);
    setCurrentShopRoom(null);
  }, []);

  return {
    shopData,
    purchaseTarget,
    showPurchaseModal,
    currentShopRoom,
    getBonusStats,
    handlePurchaseConfirm,
    handlePurchaseCancel,
    updateProximity,
    resetShopData
  };
}
