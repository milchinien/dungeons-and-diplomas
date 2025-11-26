/**
 * Enemy module barrel exports
 *
 * Re-exports all enemy-related classes, utilities, and types
 */
export { Enemy } from './Enemy';
export { EnemyAI } from './EnemyAI';
export { EnemyRenderer } from './EnemyRenderer';
export { handleStateTransitions } from './AggroManager';
export { moveTowards, followPath, moveDirectlyTowardsPlayer } from './EnemyMovement';
export { pickRandomWaypoint } from './EnemyWaypoints';
export type { Player, EnemyUpdateContext, Pathfinder, PathCoord } from './types';
