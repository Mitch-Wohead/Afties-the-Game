const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 600;

const player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 20,
    height: 20,
    speed: 3,
    dx: 0,
    dy: 0
};

const obstacles = [];
const rewards = [];
const missiles = [];
const obstacleSpeed = 4;
const missileSpeed = 2; // Slightly slower than the player
const obstacleInterval = 400;
const rewardInterval = obstacleInterval * 10; // Rewards appear 1/10th as often as obstacles
let gameOver = false;
let offsetX = 0;
let offsetY = 0;
let score = 0;
let scoreInterval;
const rewardSpeed = 2;
let showBonusText = false;
let bonusTextTimer = 0;

function drawPlayer() {
    ctx.fillStyle = 'blue';
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

function createObstacle() {
    const size = Math.random() * 30 + 20;
    const position = Math.random();
    let x, y, dx, dy;

    if (position < 0.25) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY - canvas.height / 2 - size;
        dx = 0;
        dy = obstacleSpeed;
    } else if (position < 0.5) {
        x = offsetX + canvas.width / 2 + size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
        dx = -obstacleSpeed;
        dy = 0;
    } else if (position < 0.75) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY + canvas.height / 2 + size;
        dx = 0;
        dy = -obstacleSpeed;
    } else {
        x = offsetX - canvas.width / 2 - size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
        dx = obstacleSpeed;
        dy = 0;
    }

    obstacles.push({ x, y, size, dx, dy });
}

function createReward() {
    const size = 10;
    const position = Math.random();
    let x, y, dx, dy;

    if (position < 0.25) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY - canvas.height / 2 - size;
        dx = 0;
        dy = rewardSpeed;
    } else if (position < 0.5) {
        x = offsetX + canvas.width / 2 + size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
        dx = -rewardSpeed;
        dy = 0;
    } else if (position < 0.75) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY + canvas.height / 2 + size;
        dx = 0;
        dy = -rewardSpeed;
    } else {
        x = offsetX - canvas.width / 2 - size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
        dx = rewardSpeed;
        dy = 0;
    }

    rewards.push({ x, y, size, dx, dy });
}

function createMissile() {
    const size = 15;
    const position = Math.random();
    let x, y;

    if (position < 0.25) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY - canvas.height / 2 - size;
    } else if (position < 0.5) {
        x = offsetX + canvas.width / 2 + size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
    } else if (position < 0.75) {
        x = Math.random() * canvas.width + offsetX - canvas.width / 2;
        y = offsetY + canvas.height / 2 + size;
    } else {
        x = offsetX - canvas.width / 2 - size;
        y = Math.random() * canvas.height + offsetY - canvas.height / 2;
    }

    missiles.push({ x, y, size, timer: 300 }); // 300 frames = 10 seconds at 30 FPS
}

function drawObstacles() {
    obstacles.forEach(obstacle => {
        ctx.fillStyle = 'red';
        ctx.fillRect(obstacle.x - offsetX + canvas.width / 2, obstacle.y - offsetY + canvas.height / 2, obstacle.size, obstacle.size);
    });
}

function drawRewards() {
    rewards.forEach(reward => {
        ctx.fillStyle = 'green';
        ctx.beginPath();
        ctx.arc(reward.x - offsetX + canvas.width / 2, reward.y - offsetY + canvas.height / 2, reward.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function drawMissiles() {
    missiles.forEach(missile => {
        ctx.fillStyle = 'purple';
        ctx.beginPath();
        ctx.arc(missile.x - offsetX + canvas.width / 2, missile.y - offsetY + canvas.height / 2, missile.size, 0, Math.PI * 2);
        ctx.fill();
    });
}

function updateObstacles() {
    obstacles.forEach(obstacle => {
        obstacle.x += obstacle.dx;
        obstacle.y += obstacle.dy;
    });
}

function updateRewards() {
    rewards.forEach(reward => {
        reward.x += reward.dx;
        reward.y += reward.dy;
    });
}

function updateMissiles() {
    missiles.forEach((missile, index) => {
        const angle = Math.atan2(player.y - (missile.y - offsetY + canvas.height / 2), player.x - (missile.x - offsetX + canvas.width / 2));
        missile.x += missileSpeed * Math.cos(angle);
        missile.y += missileSpeed * Math.sin(angle);
        missile.timer--;

        if (missile.timer <= 0) {
            missiles.splice(index, 1);
        }
    });
}

function drawGrid() {
    ctx.strokeStyle = 'gray';
    ctx.lineWidth = 0.5;

    const gridSize = 20;
    const startX = offsetX % gridSize;
    const startY = offsetY % gridSize;

    for (let i = startX; i < canvas.width; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, canvas.height);
        ctx.stroke();
    }

    for (let i = startY; i < canvas.height; i += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(canvas.width, i);
        ctx.stroke();
    }
}

function checkCollision() {
    obstacles.forEach(obstacle => {
        const relativeX = obstacle.x - offsetX + canvas.width / 2;
        const relativeY = obstacle.y - offsetY + canvas.height / 2;

        if (player.x < relativeX + obstacle.size &&
            player.x + player.width > relativeX &&
            player.y < relativeY + obstacle.size &&
            player.y + player.height > relativeY) {
            gameOver = true;
        }
    });

    rewards.forEach((reward, index) => {
        const relativeX = reward.x - offsetX + canvas.width / 2;
        const relativeY = reward.y - offsetY + canvas.height / 2;

        if (player.x < relativeX + reward.size &&
            player.x + player.width > relativeX &&
            player.y < relativeY + reward.size &&
            player.y + player.height > relativeY) {
            rewards.splice(index, 1);
            score += 500;
            showBonusText = true;
            bonusTextTimer = 100; // 1 second at 100 frames per second
        }
    });

    missiles.forEach(missile => {
        const relativeX = missile.x - offsetX + canvas.width / 2;
        const relativeY = missile.y - offsetY + canvas.height / 2;

        if (player.x < relativeX + missile.size &&
            player.x + player.width > relativeX &&
            player.y < relativeY + missile.size &&
            player.y + player.height > relativeY) {
            gameOver = true;
        }
    });
}

function updatePlayer() {
    offsetX += player.dx;
    offsetY += player.dy;
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);

    if (showBonusText) {
        ctx.fillStyle = 'yellow';
        ctx.fillText('+500', 10, 60);
        bonusTextTimer--;
        if (bonusTextTimer <= 0) {
            showBonusText = false;
        }
    }
}

function update() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawPlayer();
    drawObstacles();
    drawRewards();
    drawMissiles();
    drawScore();
    updatePlayer();
    updateObstacles();
    updateRewards();
    updateMissiles();
    checkCollision();

    if (!gameOver) {
        requestAnimationFrame(update);
    } else {
        clearInterval(scoreInterval);
        ctx.fillStyle = 'white';
        ctx.font = '40px Arial';
        ctx.fillText('Game Over', canvas.width / 2 - 100, canvas.height / 2);
        ctx.font = '20px Arial';
        ctx.fillText('Press R to Restart', canvas.width / 2 - 70, canvas.height / 2 + 30);
    }
}

function restartGame() {
    offsetX = 0;
    offsetY = 0;
    player.x = canvas.width / 2;
    player.y = canvas.height / 2;
    obstacles.length = 0;
    rewards.length = 0;
    missiles.length = 0;
    gameOver = false;
    score = 0;
    showBonusText = false;
    createObstacle();
    scoreInterval = setInterval(() => { score++; }, 10);
    update();
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') {
        player.dy = -player.speed;
    } else if (e.key === 'ArrowDown' || e.key === 's') {
        player.dy = player.speed;
    } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        player.dx = -player.speed;
    } else if (e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = player.speed;
    } else if (e.key === 'r' || e.key === 'R') {
        restartGame();
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'ArrowDown' || e.key === 's') {
        player.dy = 0;
    }
    if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'ArrowRight' || e.key === 'd') {
        player.dx = 0;
    }
});

setInterval(createObstacle, obstacleInterval);
setInterval(createReward, rewardInterval);
setInterval(createMissile, 30000); // Create a missile every 30 seconds

restartGame();