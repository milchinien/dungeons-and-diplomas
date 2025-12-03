import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GameContainer } from './components/ui/GameContainer';
import { MapScene } from './components/map/MapScene';
import { CombatScene } from './components/combat/CombatScene';
import { TreasureScene } from './components/rooms/TreasureScene';
import { ShopScene } from './components/rooms/ShopScene';
import { Inventory } from './components/ui/Inventory';
import { HUD } from './components/ui/HUD';
import { PauseMenu } from './components/ui/PauseMenu';
import { useGameStore } from './store/gameStore';
import { GameScene } from './types/game';
import { generateFloor } from './utils/floorGenerator';

function App() {
  const { scene, currentFloor, nextFloor } = useGameStore();
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isPauseMenuOpen, setIsPauseMenuOpen] = useState(false);

  useEffect(() => {
    // Initialize game with first floor
    if (!currentFloor) {
      const floor = generateFloor(1);
      nextFloor(floor);
    }
  }, [currentFloor, nextFloor]);

  useEffect(() => {
    // Add keyboard listener for inventory and pause menu
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'i' || e.key === 'I') {
        if (!isPauseMenuOpen) {
          setIsInventoryOpen((prev) => !prev);
        }
      }
      if (e.key === 'Escape') {
        if (isInventoryOpen) {
          setIsInventoryOpen(false);
        } else {
          setIsPauseMenuOpen((prev) => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isInventoryOpen, isPauseMenuOpen]);

  if (!currentFloor) {
    return (
      <GameContainer>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#00ff00',
            fontSize: '24px',
            fontFamily: 'monospace',
            textShadow: '0 0 20px rgba(0, 255, 0, 0.8)',
          }}
        >
          Loading game...
        </motion.div>
      </GameContainer>
    );
  }

  const sceneVariants = {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.95 },
  };

  const sceneTransition = {
    duration: 0.3,
    ease: [0.4, 0.0, 0.2, 1.0] as const,
  };

  return (
    <GameContainer>
      <AnimatePresence mode="wait">
        {scene === GameScene.MAP && (
          <motion.div
            key="map"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={sceneVariants}
            transition={sceneTransition}
            style={{ width: '100%', height: '100%' }}
          >
            <MapScene />
          </motion.div>
        )}
        {scene === GameScene.COMBAT && (
          <motion.div
            key="combat"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={sceneVariants}
            transition={sceneTransition}
            style={{ width: '100%', height: '100%' }}
          >
            <CombatScene />
          </motion.div>
        )}
        {scene === GameScene.TREASURE && (
          <motion.div
            key="treasure"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={sceneVariants}
            transition={sceneTransition}
            style={{ width: '100%', height: '100%' }}
          >
            <TreasureScene />
          </motion.div>
        )}
        {scene === GameScene.SHOP && (
          <motion.div
            key="shop"
            initial="initial"
            animate="animate"
            exit="exit"
            variants={sceneVariants}
            transition={sceneTransition}
            style={{ width: '100%', height: '100%' }}
          >
            <ShopScene />
          </motion.div>
        )}
      </AnimatePresence>
      <HUD />
      <Inventory isOpen={isInventoryOpen} onClose={() => setIsInventoryOpen(false)} />
      <PauseMenu isOpen={isPauseMenuOpen} onClose={() => setIsPauseMenuOpen(false)} />
    </GameContainer>
  );
}

export default App;
