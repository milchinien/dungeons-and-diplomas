// ===== GAME CONSTANTS =====
const CANVAS_WIDTH = 800;
const CANVAS_HEIGHT = 600;
const TILE_SIZE = 40;
const PLAYER_SIZE = 30;
const PLAYER_SPEED = 2; // Reduced from 3
const ENEMY_SIZE = 30;
const BARREL_SIZE = 35;
const CHEST_SIZE = 35;

// ===== GAME STATE =====
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// ===== INPUT HANDLING =====
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ArrowUp: false,
    ArrowLeft: false,
    ArrowDown: false,
    ArrowRight: false,
    e: false,
    E: false,  // Capital E fix
    ' ': false  // Space key fix
};

let mouseX = 0;
let mouseY = 0;
let mouseClicked = false;

window.addEventListener('keydown', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = true;
        e.preventDefault();
    }
});

window.addEventListener('keyup', (e) => {
    if (keys.hasOwnProperty(e.key)) {
        keys[e.key] = false;
        e.preventDefault();
    }
});

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('click', (e) => {
    mouseClicked = true;
});

// ===== UTILITY FUNCTIONS =====
function distance(x1, y1, x2, y2) {
    return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

function checkAABB(a, b) {
    return a.left < b.right &&
           a.right > b.left &&
           a.top < b.bottom &&
           a.bottom > b.top;
}

function generateMathProblem(difficulty = 1) {
    const num1 = Math.floor(Math.random() * (10 * difficulty)) + 1;
    const num2 = Math.floor(Math.random() * (10 * difficulty)) + 1;
    const operations = ['+', '-', '*'];
    const op = operations[Math.floor(Math.random() * operations.length)];

    let question, answer;
    switch(op) {
        case '+':
            question = `${num1} + ${num2}`;
            answer = num1 + num2;
            break;
        case '-':
            question = `${Math.max(num1, num2)} - ${Math.min(num1, num2)}`;
            answer = Math.max(num1, num2) - Math.min(num1, num2);
            break;
        case '*':
            const mult1 = Math.floor(Math.random() * 10) + 1;
            const mult2 = Math.floor(Math.random() * 10) + 1;
            question = `${mult1} × ${mult2}`;
            answer = mult1 * mult2;
            break;
    }

    return { question, answer };
}

// ===== PLAYER =====
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = PLAYER_SIZE;
        this.height = PLAYER_SIZE;
        this.speed = PLAYER_SPEED;
        this.color = '#4CAF50';
        this.maxHp = 100;
        this.hp = 100;
        this.score = 0;
        this.inventory = [];
        this.attackCooldown = 0;
        this.attackRange = 80; // Increased range
        this.attackDamage = 15;
        this.attackAngle = 70 * (Math.PI / 180); // 70 degrees in radians
        this.isSlowed = false;
        this.slowTimer = 0;
        this.isInvulnerable = false;
        this.invulnerabilityTimer = 0;
    }

    takeDamage(amount) {
        if (this.isInvulnerable) return; // No damage when invulnerable
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    setInvulnerable(frames) {
        this.isInvulnerable = true;
        this.invulnerabilityTimer = frames;
    }

    heal(amount) {
        this.hp += amount;
        if (this.hp > this.maxHp) this.hp = this.maxHp;
    }

    attack(enemies, mouseX, mouseY) {
        if (this.attackCooldown > 0) return null;

        const playerCenterX = this.x + this.width / 2;
        const playerCenterY = this.y + this.height / 2;

        // Calculate attack direction based on mouse position
        const attackDirection = Math.atan2(mouseY - playerCenterY, mouseX - playerCenterX);

        let hitTargets = [];

        for (let enemy of enemies) {
            if (enemy.isDead) continue;

            const enemyCenterX = enemy.x + enemy.width / 2;
            const enemyCenterY = enemy.y + enemy.height / 2;

            // Check if enemy is in range
            const dist = distance(playerCenterX, playerCenterY, enemyCenterX, enemyCenterY);
            if (dist > this.attackRange) continue;

            // Calculate angle to enemy
            const angleToEnemy = Math.atan2(enemyCenterY - playerCenterY, enemyCenterX - playerCenterX);

            // Calculate angle difference
            let angleDiff = angleToEnemy - attackDirection;
            // Normalize angle to -PI to PI
            while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
            while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

            // Check if enemy is within cone angle
            if (Math.abs(angleDiff) <= this.attackAngle / 2) {
                enemy.takeDamage(this.attackDamage);
                hitTargets.push({
                    x: playerCenterX,
                    y: playerCenterY,
                    targetX: enemyCenterX,
                    targetY: enemyCenterY
                });
            }
        }

        this.attackCooldown = 30; // 30 frames cooldown

        return hitTargets.length > 0 ? hitTargets : null;
    }

    update(room, deltaTime) {
        // Update cooldowns
        if (this.attackCooldown > 0) this.attackCooldown--;

        // Handle invulnerability
        if (this.isInvulnerable) {
            this.invulnerabilityTimer--;
            if (this.invulnerabilityTimer <= 0) {
                this.isInvulnerable = false;
            }
        }

        // Handle slow effect
        if (this.isSlowed) {
            this.slowTimer--;
            if (this.slowTimer <= 0) {
                this.isSlowed = false;
            }
        }

        // Store old position
        const oldX = this.x;
        const oldY = this.y;

        // Apply speed modifier
        const currentSpeed = this.isSlowed ? this.speed * 0.3 : this.speed;

        // Handle input - move on each axis separately
        if (keys.w || keys.ArrowUp) {
            this.y -= currentSpeed;
            if (room.checkCollision(this)) {
                this.y = oldY;
            }
        }
        if (keys.s || keys.ArrowDown) {
            this.y += currentSpeed;
            if (room.checkCollision(this)) {
                this.y = oldY;
            }
        }
        if (keys.a || keys.ArrowLeft) {
            this.x -= currentSpeed;
            if (room.checkCollision(this)) {
                this.x = oldX;
            }
        }
        if (keys.d || keys.ArrowRight) {
            this.x += currentSpeed;
            if (room.checkCollision(this)) {
                this.x = oldX;
            }
        }
    }

    draw(ctx, mouseX, mouseY) {
        const centerX = this.x + this.width / 2;
        const centerY = this.y + this.height / 2;

        // Draw attack cone indicator when attacking
        if (this.attackCooldown > 25) {
            const attackDirection = Math.atan2(mouseY - centerY, mouseX - centerX);

            ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
            ctx.strokeStyle = 'rgba(76, 175, 80, 0.4)';
            ctx.lineWidth = 2;

            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(
                centerX,
                centerY,
                this.attackRange,
                attackDirection - this.attackAngle / 2,
                attackDirection + this.attackAngle / 2
            );
            ctx.lineTo(centerX, centerY);
            ctx.fill();
            ctx.stroke();
        }

        // Invulnerability effect (flashing)
        if (this.isInvulnerable && Math.floor(this.invulnerabilityTimer / 10) % 2 === 0) {
            ctx.globalAlpha = 0.5;
        }

        // Draw player
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Face
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 8, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 18, this.y + 8, 4, 4);
        ctx.fillRect(this.x + 10, this.y + 20, 10, 3);

        // Invulnerability shield
        if (this.isInvulnerable) {
            ctx.strokeStyle = 'rgba(255, 215, 0, 0.6)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, this.width / 2 + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // HP bar
        const barWidth = this.width;
        const barHeight = 4;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 8, barWidth, barHeight);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(this.x, this.y - 8, barWidth * (this.hp / this.maxHp), barHeight);

        // Slow effect indicator
        if (this.isSlowed) {
            ctx.fillStyle = 'rgba(100, 100, 255, 0.3)';
            ctx.fillRect(this.x - 2, this.y - 2, this.width + 4, this.height + 4);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== PROJECTILE =====
class Projectile {
    constructor(x, y, targetX, targetY, speed, damage, type = 'web') {
        this.x = x;
        this.y = y;
        this.width = 12;
        this.height = 12;
        this.damage = damage;
        this.type = type;

        // Calculate direction
        const angle = Math.atan2(targetY - y, targetX - x);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;

        this.isDead = false;
        this.lifetime = 180; // 3 seconds at 60fps
    }

    update(room) {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;

        // Check wall collision
        if (room && room.checkCollision(this)) {
            this.isDead = true;
        }

        if (this.lifetime <= 0) {
            this.isDead = true;
        }
    }

    draw(ctx) {
        if (this.type === 'web') {
            // Draw web projectile
            ctx.fillStyle = '#888';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
            ctx.fill();

            // Web strands
            ctx.strokeStyle = '#ccc';
            ctx.lineWidth = 2;
            for (let i = 0; i < 4; i++) {
                const angle = (Math.PI / 2) * i;
                ctx.beginPath();
                ctx.moveTo(this.x, this.y);
                ctx.lineTo(
                    this.x + Math.cos(angle) * this.width,
                    this.y + Math.sin(angle) * this.width
                );
                ctx.stroke();
            }
        }
    }

    getBounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }
}

// ===== BAT ENEMY =====
class Bat {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_SIZE;
        this.height = ENEMY_SIZE;
        this.maxHp = 30;
        this.hp = 30;
        this.speed = 0.7; // Even slower movement speed
        this.isDead = false;
        this.state = 'idle'; // idle, charging, dashing
        this.dashCooldown = 0;
        this.dashTimer = 0;
        this.dashSpeed = 4; // Even slower dash speed
        this.dashDirection = { x: 0, y: 0 };
        this.damage = 20;
        this.stuckCounter = 0;
        this.avoidDirection = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }

    update(player, room) {
        if (this.isDead) return;

        const dist = distance(this.x, this.y, player.x, player.y);

        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;

        if (this.state === 'idle') {
            // Patrol or move toward player
            if (dist < 200 && this.dashCooldown === 0) {
                this.state = 'charging';
                this.dashCooldown = 300; // 5 seconds cooldown
            } else {
                // Simple AI: move toward player slowly
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                const moveX = Math.cos(angle) * this.speed;
                const moveY = Math.sin(angle) * this.speed;

                // Try X movement
                this.x += moveX;
                if (room.checkCollision(this)) {
                    this.x = oldX;
                }

                // Try Y movement
                this.y += moveY;
                if (room.checkCollision(this)) {
                    this.y = oldY;
                }
            }
        } else if (this.state === 'charging') {
            // Prepare to dash
            this.dashTimer++;
            if (this.dashTimer > 60) { // 1 second charge time
                // Calculate dash direction
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.dashDirection.x = Math.cos(angle);
                this.dashDirection.y = Math.sin(angle);
                this.state = 'dashing';
                this.dashTimer = 20; // Dash duration
            }
        } else if (this.state === 'dashing') {
            // Dash attack
            this.x += this.dashDirection.x * this.dashSpeed;
            this.y += this.dashDirection.y * this.dashSpeed;
            this.dashTimer--;

            if (this.dashTimer <= 0) {
                this.state = 'idle';
                this.dashTimer = 0;
            }

            // Check collisions with walls during dash
            if (room.checkCollision(this)) {
                this.x = oldX;
                this.y = oldY;
                // If dashing and hit wall, stop dashing
                this.state = 'idle';
                this.dashTimer = 0;
            }
        }

        // Update cooldown
        if (this.dashCooldown > 0) this.dashCooldown--;
    }

    draw(ctx) {
        if (this.isDead) return;

        // Draw bat
        ctx.fillStyle = this.state === 'charging' ? '#ff6b6b' : '#333';

        // Body
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
                   this.width / 2, this.height / 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Wings
        const wingOffset = Math.sin(Date.now() / 100) * 5;
        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x - 10, this.y + wingOffset);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.lineTo(this.x + this.width + 10, this.y + wingOffset);
        ctx.lineTo(this.x + this.width / 2, this.y + this.height / 2);
        ctx.fill();

        // HP bar
        const barWidth = this.width;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 6, barWidth, barHeight);
        ctx.fillStyle = '#ff6b6b';
        ctx.fillRect(this.x, this.y - 6, barWidth * (this.hp / this.maxHp), barHeight);

        // Attack charge indicator
        if (this.state === 'charging' && this.dashTimer > 0) {
            const chargeProgress = this.dashTimer / 60; // Updated to match new charge time
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 12, barWidth, 3);
            ctx.fillStyle = '#ff6b6b';
            ctx.fillRect(this.x, this.y - 12, barWidth * chargeProgress, 3);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== SPIDER ENEMY =====
class Spider {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_SIZE;
        this.height = ENEMY_SIZE;
        this.maxHp = 40;
        this.hp = 40;
        this.speed = 0.8; // Much slower
        this.isDead = false;
        this.shootCooldown = 0;
        this.damage = 10;
        this.stuckCounter = 0;
        this.avoidDirection = 0;
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isDead = true;
        }
    }

    update(player, room) {
        if (this.isDead) return;

        const dist = distance(this.x, this.y, player.x, player.y);

        // Store old position for collision detection
        const oldX = this.x;
        const oldY = this.y;

        let moveX = 0;
        let moveY = 0;

        // Keep distance and shoot
        if (dist < 150) {
            // Move away from player
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            moveX = Math.cos(angle) * this.speed;
            moveY = Math.sin(angle) * this.speed;
        } else if (dist > 200) {
            // Move toward player
            const angle = Math.atan2(player.y - this.y, player.x - this.x);
            moveX = Math.cos(angle) * this.speed;
            moveY = Math.sin(angle) * this.speed;
        }

        // Try X movement
        this.x += moveX;
        if (room.checkCollision(this)) {
            this.x = oldX;
        }

        // Try Y movement
        this.y += moveY;
        if (room.checkCollision(this)) {
            this.y = oldY;
        }

        // Update cooldown
        if (this.shootCooldown > 0) this.shootCooldown--;
    }

    shoot(player) {
        if (this.shootCooldown === 0 && !this.isDead) {
            this.shootCooldown = 360; // 6 seconds (much slower)
            return new Projectile(
                this.x + this.width / 2,
                this.y + this.height / 2,
                player.x + player.width / 2,
                player.y + player.height / 2,
                2, // Slower projectile speed (was 4)
                this.damage,
                'web'
            );
        }
        return null;
    }

    draw(ctx) {
        if (this.isDead) return;

        // Draw spider
        ctx.fillStyle = '#6b4423';

        // Body
        ctx.beginPath();
        ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2,
                   this.width / 3, this.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Head
        ctx.beginPath();
        ctx.arc(this.x + this.width / 2, this.y + this.height / 3, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        // Legs
        ctx.strokeStyle = '#6b4423';
        ctx.lineWidth = 2;
        for (let i = 0; i < 4; i++) {
            const legOffset = (i - 1.5) * 8;
            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x - 8, this.y + this.height / 2 + legOffset);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(this.x + this.width / 2, this.y + this.height / 2);
            ctx.lineTo(this.x + this.width + 8, this.y + this.height / 2 + legOffset);
            ctx.stroke();
        }

        // HP bar
        const barWidth = this.width;
        const barHeight = 3;
        ctx.fillStyle = '#333';
        ctx.fillRect(this.x, this.y - 6, barWidth, barHeight);
        ctx.fillStyle = '#6b4423';
        ctx.fillRect(this.x, this.y - 6, barWidth * (this.hp / this.maxHp), barHeight);

        // Shoot cooldown indicator
        if (this.shootCooldown > 0) {
            const cooldownProgress = this.shootCooldown / 360; // 360 frames max cooldown
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x, this.y - 12, barWidth, 3);
            ctx.fillStyle = '#888';
            ctx.fillRect(this.x, this.y - 12, barWidth * cooldownProgress, 3);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== LOOT GOBLIN =====
class LootGoblin {
    constructor(x, y, targetChest) {
        this.x = x;
        this.y = y;
        this.width = ENEMY_SIZE - 5;
        this.height = ENEMY_SIZE - 5;
        this.speed = 4;
        this.targetChest = targetChest;
        this.hasLoot = false;
        this.isDead = false;
        this.state = 'seeking'; // seeking, fleeing, escaped
    }

    update(player, room) {
        if (this.isDead || this.state === 'escaped') return;

        if (this.state === 'seeking' && this.targetChest && !this.targetChest.isOpened) {
            // Move toward chest
            const angle = Math.atan2(
                this.targetChest.y - this.y,
                this.targetChest.x - this.x
            );
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Check if reached chest
            if (distance(this.x, this.y, this.targetChest.x, this.targetChest.y) < 20) {
                this.hasLoot = true;
                this.targetChest.isOpened = true;
                this.state = 'fleeing';
            }
        } else if (this.state === 'fleeing') {
            // Run away from player toward edge
            const angle = Math.atan2(this.y - player.y, this.x - player.x);
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;

            // Check if escaped
            if (this.x < 0 || this.x > CANVAS_WIDTH ||
                this.y < 0 || this.y > CANVAS_HEIGHT) {
                this.state = 'escaped';
                this.isDead = true;
            }
        }
    }

    draw(ctx) {
        if (this.isDead) return;

        // Draw loot goblin (smaller, darker goblin)
        ctx.fillStyle = this.hasLoot ? '#FFD700' : '#2d5016';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Face
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x + 5, this.y + 5, 3, 3);
        ctx.fillRect(this.x + 12, this.y + 5, 3, 3);

        // Loot bag
        if (this.hasLoot) {
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(this.x + this.width / 4, this.y - 8, 10, 10);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== BARREL =====
class Barrel {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = BARREL_SIZE;
        this.height = BARREL_SIZE;
    }

    draw(ctx) {
        // Draw barrel
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Barrel rings
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y + 5, this.width, 3);
        ctx.strokeRect(this.x, this.y + this.height - 8, this.width, 3);
        ctx.strokeRect(this.x, this.y + this.height / 2 - 2, this.width, 3);
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== CHEST =====
class Chest {
    constructor(x, y, mathProblem) {
        this.x = x;
        this.y = y;
        this.width = CHEST_SIZE;
        this.height = CHEST_SIZE;
        this.isOpened = false;
        this.mathProblem = mathProblem;
        this.reward = 50; // score points
    }

    draw(ctx) {
        // Draw chest
        ctx.fillStyle = this.isOpened ? '#666' : '#8B7355';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Chest lid
        ctx.fillStyle = this.isOpened ? '#555' : '#6B5345';
        ctx.fillRect(this.x, this.y, this.width, this.height / 3);

        // Lock
        if (!this.isOpened) {
            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 5, 0, Math.PI * 2);
            ctx.fill();
        }

        // Math indicator
        if (!this.isOpened) {
            ctx.fillStyle = '#fff';
            ctx.font = '12px monospace';
            ctx.fillText('?', this.x + this.width / 2 - 4, this.y - 5);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== EXIT DOOR =====
class ExitDoor {
    constructor(x, y, mathProblem) {
        this.x = x;
        this.y = y;
        this.width = TILE_SIZE;
        this.height = TILE_SIZE * 2;
        this.isUnlocked = false;
        this.mathProblem = mathProblem;
    }

    draw(ctx) {
        // Draw door
        ctx.fillStyle = this.isUnlocked ? '#4CAF50' : '#654321';
        ctx.fillRect(this.x, this.y, this.width, this.height);

        // Door frame
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x, this.y, this.width, this.height);

        // Door handle
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(this.x + this.width - 10, this.y + this.height / 2, 4, 0, Math.PI * 2);
        ctx.fill();

        // Math indicator
        if (!this.isUnlocked) {
            ctx.fillStyle = '#fff';
            ctx.font = '16px monospace';
            ctx.fillText('?', this.x + this.width / 2 - 5, this.y - 5);
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== WALL =====
class Wall {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = '#333';
    }

    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x, this.y, this.width, this.height);

        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;

        for (let i = 0; i < this.height; i += 20) {
            ctx.beginPath();
            ctx.moveTo(this.x, this.y + i);
            ctx.lineTo(this.x + this.width, this.y + i);
            ctx.stroke();
        }

        for (let i = 0; i < this.width; i += 40) {
            for (let j = 0; j < this.height; j += 40) {
                ctx.beginPath();
                ctx.moveTo(this.x + i, this.y + j);
                ctx.lineTo(this.x + i, this.y + j + 20);
                ctx.stroke();
            }
        }
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }
}

// ===== ROOM =====
class Room {
    constructor(seed = 0) {
        this.walls = [];
        this.barrels = [];
        this.floor = '#2a2a2a';
        this.seed = seed;
        this.createWalls();
        this.createBarrels();
    }

    // Simple random number generator with seed
    random() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }

    createWalls() {
        const wallThickness = TILE_SIZE;

        // Outer walls
        this.walls.push(new Wall(0, 0, CANVAS_WIDTH, wallThickness));
        this.walls.push(new Wall(0, CANVAS_HEIGHT - wallThickness, CANVAS_WIDTH, wallThickness));
        this.walls.push(new Wall(0, 0, wallThickness, CANVAS_HEIGHT));
        this.walls.push(new Wall(CANVAS_WIDTH - wallThickness, 0, wallThickness, CANVAS_HEIGHT));

        // Generate random internal walls (3-6 walls)
        const numWalls = Math.floor(this.random() * 4) + 3;

        for (let i = 0; i < numWalls; i++) {
            const horizontal = this.random() > 0.5;

            if (horizontal) {
                // Horizontal wall
                const x = Math.floor(this.random() * (CANVAS_WIDTH - 300)) + 100;
                const y = Math.floor(this.random() * (CANVAS_HEIGHT - 200)) + 100;
                const width = Math.floor(this.random() * 150) + 100;
                this.walls.push(new Wall(x, y, width, wallThickness));
            } else {
                // Vertical wall
                const x = Math.floor(this.random() * (CANVAS_WIDTH - 200)) + 100;
                const y = Math.floor(this.random() * (CANVAS_HEIGHT - 300)) + 100;
                const height = Math.floor(this.random() * 150) + 100;
                this.walls.push(new Wall(x, y, wallThickness, height));
            }
        }
    }

    createBarrels() {
        // Generate random barrels (2-5 barrels)
        const numBarrels = Math.floor(this.random() * 4) + 2;

        for (let i = 0; i < numBarrels; i++) {
            const x = Math.floor(this.random() * (CANVAS_WIDTH - 200)) + 100;
            const y = Math.floor(this.random() * (CANVAS_HEIGHT - 200)) + 100;
            this.barrels.push(new Barrel(x, y));
        }
    }

    checkCollision(entity) {
        const entityBounds = entity.getBounds();

        // Check walls
        for (let wall of this.walls) {
            if (checkAABB(entityBounds, wall.getBounds())) {
                return true;
            }
        }

        // Check barrels
        for (let barrel of this.barrels) {
            if (checkAABB(entityBounds, barrel.getBounds())) {
                return true;
            }
        }

        return false;
    }

    draw(ctx) {
        ctx.fillStyle = this.floor;
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        ctx.strokeStyle = '#1a1a1a';
        ctx.lineWidth = 1;
        for (let x = 0; x < CANVAS_WIDTH; x += TILE_SIZE) {
            for (let y = 0; y < CANVAS_HEIGHT; y += TILE_SIZE) {
                ctx.strokeRect(x, y, TILE_SIZE, TILE_SIZE);
            }
        }

        for (let wall of this.walls) {
            wall.draw(ctx);
        }

        for (let barrel of this.barrels) {
            barrel.draw(ctx);
        }
    }
}

// ===== MATH DIALOG =====
class MathDialog {
    constructor(problem, onSuccess, onFail) {
        this.problem = problem;
        this.onSuccess = onSuccess;
        this.onFail = onFail;
        this.userAnswer = '';
        this.isActive = true;
        this.message = '';
    }

    handleInput(key) {
        if (!this.isActive) return;

        if (key >= '0' && key <= '9') {
            this.userAnswer += key;
        } else if (key === 'Backspace') {
            this.userAnswer = this.userAnswer.slice(0, -1);
        } else if (key === 'Enter') {
            this.submit();
        } else if (key === 'Escape') {
            this.close();
        }
    }

    submit() {
        const answer = parseInt(this.userAnswer);
        if (answer === this.problem.answer) {
            this.message = 'Richtig! ✓';
            setTimeout(() => {
                this.onSuccess();
                this.isActive = false;
            }, 500);
        } else {
            this.message = 'Falsch! Versuche es nochmal.';
            this.userAnswer = '';
            setTimeout(() => {
                this.message = '';
            }, 1500);
        }
    }

    close() {
        this.isActive = false;
        if (this.onFail) this.onFail();
    }

    draw(ctx) {
        if (!this.isActive) return;

        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Dialog box
        const boxWidth = 400;
        const boxHeight = 200;
        const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
        const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2;

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Title
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Mathe-Aufgabe', CANVAS_WIDTH / 2, boxY + 40);

        // Question
        ctx.font = '24px monospace';
        ctx.fillText(this.problem.question + ' = ?', CANVAS_WIDTH / 2, boxY + 90);

        // Answer input
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 100, boxY + 110, 200, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '20px monospace';
        ctx.fillText(this.userAnswer || '_', CANVAS_WIDTH / 2, boxY + 138);

        // Message
        if (this.message) {
            ctx.fillStyle = this.message.includes('Richtig') ? '#4CAF50' : '#ff6b6b';
            ctx.font = '16px Arial';
            ctx.fillText(this.message, CANVAS_WIDTH / 2, boxY + 170);
        }

        // Instructions
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText('Enter = Bestätigen | ESC = Abbrechen', CANVAS_WIDTH / 2, boxY + boxHeight - 15);

        ctx.textAlign = 'left';
    }
}

// ===== GAME =====
class Game {
    constructor() {
        this.levelNumber = 1;
        this.room = new Room(Date.now()); // Random seed based on timestamp
        this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.enemies = [];
        this.projectiles = [];
        this.chests = [];
        this.exitDoor = null;
        this.lootGoblin = null;
        this.mathDialog = null;
        this.lastTime = 0;
        this.fps = 0;
        this.gameTime = 0;
        this.lootGoblinSpawnTime = 600; // 10 seconds at 60fps
        this.attackEffects = []; // Visual attack effects
        this.isGameOver = false;
        this.gameOverMenu = null;

        this.initLevel();
        this.setupKeyboardForDialog();
    }

    setupKeyboardForDialog() {
        window.addEventListener('keydown', (e) => {
            if (this.mathDialog && this.mathDialog.isActive) {
                e.preventDefault();
                this.mathDialog.handleInput(e.key);
            }
        });
    }

    // Helper function to find valid spawn position
    findValidSpawnPosition(size) {
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            const x = Math.random() * (CANVAS_WIDTH - 200 - size) + 100;
            const y = Math.random() * (CANVAS_HEIGHT - 200 - size) + 100;

            // Create temporary entity to test collision
            const testEntity = {
                x: x,
                y: y,
                width: size,
                height: size,
                getBounds() {
                    return {
                        left: this.x,
                        right: this.x + this.width,
                        top: this.y,
                        bottom: this.y + this.height
                    };
                }
            };

            // Check if position is valid (not in wall)
            if (!this.room.checkCollision(testEntity)) {
                return { x, y };
            }

            attempts++;
        }

        // Fallback to center if no valid position found
        return { x: CANVAS_WIDTH / 2, y: CANVAS_HEIGHT / 2 };
    }

    initLevel() {
        // Generate random total enemy count based on level (3-8 enemies)
        const totalEnemies = Math.min(Math.floor(Math.random() * 3) + 3, 3 + this.levelNumber);

        // Create random mix of enemies
        for (let i = 0; i < totalEnemies; i++) {
            const pos = this.findValidSpawnPosition(ENEMY_SIZE);

            // Random enemy type (50% bat, 50% spider)
            if (Math.random() > 0.5) {
                this.enemies.push(new Bat(pos.x, pos.y));
            } else {
                this.enemies.push(new Spider(pos.x, pos.y));
            }
        }

        // Create chests at random positions (1-3 chests)
        const numChests = Math.floor(Math.random() * 3) + 1;
        for (let i = 0; i < numChests; i++) {
            const pos = this.findValidSpawnPosition(CHEST_SIZE);
            const difficulty = Math.min(Math.floor(this.levelNumber / 2) + 1, 5);
            this.chests.push(new Chest(pos.x, pos.y, generateMathProblem(difficulty)));
        }

        // Create exit door at top center
        this.exitDoor = new ExitDoor(
            CANVAS_WIDTH / 2 - TILE_SIZE / 2,
            TILE_SIZE,
            generateMathProblem(Math.min(this.levelNumber, 5))
        );
    }

    update(deltaTime) {
        if (this.mathDialog && this.mathDialog.isActive) {
            return; // Pause game during math dialog
        }

        if (this.isGameOver) {
            // Only handle restart input when game over
            if (keys[' ']) {
                this.restartGame();
                keys[' '] = false;
            }
            return;
        }

        this.gameTime++;

        // Update player
        this.player.update(this.room, deltaTime);

        // Player attack (use ' ' for space key)
        if (keys[' ']) {
            const attackResults = this.player.attack(this.enemies, mouseX, mouseY);
            if (attackResults) {
                // Add visual attack effects for all hits
                for (let result of attackResults) {
                    this.attackEffects.push({
                        x: result.x,
                        y: result.y,
                        targetX: result.targetX,
                        targetY: result.targetY,
                        lifetime: 15
                    });
                }
            }
        }

        // Update attack effects
        this.attackEffects = this.attackEffects.filter(effect => {
            effect.lifetime--;
            return effect.lifetime > 0;
        });

        // Update enemies
        for (let enemy of this.enemies) {
            enemy.update(this.player, this.room);

            // Spider shooting
            if (enemy instanceof Spider) {
                const projectile = enemy.shoot(this.player);
                if (projectile) {
                    this.projectiles.push(projectile);
                }
            }

            // Check enemy collision with player
            if (!enemy.isDead && checkAABB(enemy.getBounds(), this.player.getBounds())) {
                if (enemy instanceof Bat && enemy.state === 'dashing') {
                    this.player.takeDamage(enemy.damage);
                    enemy.state = 'idle';
                }
            }
        }

        // Update projectiles
        for (let proj of this.projectiles) {
            proj.update(this.room); // Pass room for wall collision

            // Check collision with player
            if (!proj.isDead && checkAABB(proj.getBounds(), this.player.getBounds())) {
                this.player.takeDamage(proj.damage);
                this.player.isSlowed = true;
                this.player.slowTimer = 120; // 2 seconds
                proj.isDead = true;
            }
        }

        // Remove dead projectiles
        this.projectiles = this.projectiles.filter(p => !p.isDead);

        // Update loot goblin
        if (this.lootGoblin) {
            this.lootGoblin.update(this.player, this.room);
        }

        // Spawn loot goblin
        if (!this.lootGoblin && this.gameTime > this.lootGoblinSpawnTime) {
            const unopenedChest = this.chests.find(c => !c.isOpened);
            if (unopenedChest) {
                this.lootGoblin = new LootGoblin(
                    CANVAS_WIDTH - 80,
                    CANVAS_HEIGHT / 2,
                    unopenedChest
                );
            }
        }

        // Check interaction with chests (E key)
        if (keys.e || keys.E) {
            for (let chest of this.chests) {
                if (!chest.isOpened &&
                    distance(this.player.x, this.player.y, chest.x, chest.y) < 50) {
                    this.openChest(chest);
                    keys.e = false; // Prevent multiple triggers
                    keys.E = false;
                    break;
                }
            }

            // Check exit door
            if (!this.exitDoor.isUnlocked &&
                distance(this.player.x, this.player.y, this.exitDoor.x, this.exitDoor.y) < 60) {
                this.openExitDoor();
                keys.e = false;
                keys.E = false;
            }
        }

        // Check if level complete
        if (this.exitDoor.isUnlocked &&
            checkAABB(this.player.getBounds(), this.exitDoor.getBounds())) {
            this.nextLevel();
        }

        // Game over check
        if (this.player.hp <= 0 && !this.isGameOver) {
            this.isGameOver = true;
        }
    }

    openChest(chest) {
        this.mathDialog = new MathDialog(
            chest.mathProblem,
            () => {
                chest.isOpened = true;
                this.player.score += chest.reward;
                this.player.heal(30); // Heal 30 HP when opening chest
                this.mathDialog = null;
            },
            () => {
                this.mathDialog = null;
            }
        );
    }

    openExitDoor() {
        this.mathDialog = new MathDialog(
            this.exitDoor.mathProblem,
            () => {
                this.exitDoor.isUnlocked = true;
                this.mathDialog = null;
            },
            () => {
                this.mathDialog = null;
            }
        );
    }

    nextLevel() {
        // Increment level
        this.levelNumber++;

        // Generate new room with new random seed
        this.room = new Room(Date.now() + this.levelNumber);

        // Reset level
        this.gameTime = 0;
        this.enemies = [];
        this.projectiles = [];
        this.chests = [];
        this.lootGoblin = null;
        this.attackEffects = [];

        // Init level first
        this.initLevel();

        // Then set player position and invulnerability AFTER level init
        const spawnPos = this.findValidSpawnPosition(PLAYER_SIZE);
        this.player.x = spawnPos.x;
        this.player.y = spawnPos.y;

        // Give player 5 seconds invulnerability (300 frames at 60fps)
        this.player.isInvulnerable = true;
        this.player.invulnerabilityTimer = 300;
    }

    restartGame() {
        // Complete restart
        this.levelNumber = 1;
        this.room = new Room(Date.now());
        this.player = new Player(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        this.gameTime = 0;
        this.enemies = [];
        this.projectiles = [];
        this.chests = [];
        this.lootGoblin = null;
        this.attackEffects = [];
        this.isGameOver = false;
        this.initLevel();
    }

    draw() {
        ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Draw room
        this.room.draw(ctx);

        // Draw exit door
        if (this.exitDoor) {
            this.exitDoor.draw(ctx);
        }

        // Draw chests
        for (let chest of this.chests) {
            chest.draw(ctx);
        }

        // Draw enemies
        for (let enemy of this.enemies) {
            enemy.draw(ctx);
        }

        // Draw projectiles
        for (let proj of this.projectiles) {
            proj.draw(ctx);
        }

        // Draw loot goblin
        if (this.lootGoblin) {
            this.lootGoblin.draw(ctx);
        }

        // Draw player
        this.player.draw(ctx, mouseX, mouseY);

        // Draw attack effects
        for (let effect of this.attackEffects) {
            const alpha = effect.lifetime / 15;
            ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(effect.x, effect.y);
            ctx.lineTo(effect.targetX, effect.targetY);
            ctx.stroke();

            // Impact flash
            ctx.fillStyle = `rgba(255, 200, 0, ${alpha * 0.5})`;
            ctx.beginPath();
            ctx.arc(effect.targetX, effect.targetY, 8, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw UI
        this.drawUI();

        // Draw math dialog
        if (this.mathDialog) {
            this.mathDialog.draw(ctx);
        }

        // Draw game over menu
        if (this.isGameOver) {
            this.drawGameOverMenu();
        }
    }

    drawGameOverMenu() {
        // Darken background
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

        // Game Over Box
        const boxWidth = 500;
        const boxHeight = 300;
        const boxX = CANVAS_WIDTH / 2 - boxWidth / 2;
        const boxY = CANVAS_HEIGHT / 2 - boxHeight / 2;

        ctx.fillStyle = '#2a2a2a';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 5;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Game Over Title
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, boxY + 80);

        // Score
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 32px Arial';
        ctx.fillText('Score: ' + this.player.score, CANVAS_WIDTH / 2, boxY + 140);

        // Stats
        ctx.fillStyle = '#888';
        ctx.font = '20px Arial';
        ctx.fillText('Enemies Defeated: ' + this.enemies.filter(e => e.isDead).length, CANVAS_WIDTH / 2, boxY + 180);

        // Restart Instructions
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('Drücke SPACE zum Neustarten', CANVAS_WIDTH / 2, boxY + 240);

        ctx.textAlign = 'left';
    }

    drawUI() {
        // HP Bar
        ctx.fillStyle = '#333';
        ctx.fillRect(10, 10, 200, 20);
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(10, 10, 200 * (this.player.hp / this.player.maxHp), 20);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 10, 200, 20);
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`HP: ${this.player.hp}/${this.player.maxHp}`, 15, 25);

        // Score
        ctx.fillStyle = '#FFD700';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Score: ${this.player.score}`, 10, 50);

        // Level
        ctx.fillStyle = '#4CAF50';
        ctx.font = 'bold 16px Arial';
        ctx.fillText(`Level: ${this.levelNumber}`, 10, 75);

        // FPS
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${Math.round(this.fps)}`, CANVAS_WIDTH - 80, 20);

        // Controls hint
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText('E = Interact | Space = Attack', 10, CANVAS_HEIGHT - 10);
    }

    gameLoop(currentTime) {
        requestAnimationFrame((time) => this.gameLoop(time));

        const deltaTime = currentTime - this.lastTime;

        // Don't run if less than a frame has passed (no limiting, just run naturally)
        if (deltaTime < 1) {
            return;
        }

        this.lastTime = currentTime;
        this.fps = 1000 / deltaTime;

        this.update(deltaTime);
        this.draw();
    }

    start() {
        console.log('Starting Dungeons & Diplomas - Full Prototype');
        requestAnimationFrame((time) => this.gameLoop(time));
    }
}

// ===== START GAME =====
const game = new Game();
game.start();
