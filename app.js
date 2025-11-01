// Main application logic
let currentGame = 'rocket';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Load saved language preference
    const savedLang = localStorage.getItem('preferredLanguage') || 'en';
    updateLanguage(savedLang);

    // Setup language switcher
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateLanguage(btn.getAttribute('data-lang'));
        });
    });

    // Setup game navigation
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            switchGame(btn.getAttribute('data-game'));
        });
    });

    // Initialize games
    initRocketGame();
    initPathGame();
    initDrawGame();
    initTowerGame();
});

function switchGame(gameName) {
    currentGame = gameName;
    
    // Update active button
    document.querySelectorAll('.game-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-game') === gameName);
    });
    
    // Update active game container
    document.querySelectorAll('.game-container').forEach(container => {
        container.classList.remove('active');
    });
    document.getElementById(`${gameName}-game`).classList.add('active');
}

// ============================
// GAME 1: ROCKET SCIENTIST
// ============================

let rocketGameState = {
    x: 400,
    y: 1900,
    vx: 0,
    vy: 0,
    angle: Math.PI / 6, // 30 degrees clockwise from up
    fuel: 100,
    thrust: false,
    rotateLeft: false,
    rotateRight: false,
    gameActive: false,
    landed: false,
    crashed: false,
    orbits: 0,
    lastAngleToMoon: 0,
    angleCrossings: 0,
    numProblems: 5,
    currentProblem: 0,
    correctAnswers: 0,
    problems: [],
    numberRange: 10,
    operators: ['+']
};

const rocketKeys = {
    ArrowUp: false,
    ArrowLeft: false,
    ArrowRight: false
};

function initRocketGame() {
    const startBtn = document.getElementById('start-rocket');
    const restartBtn = document.getElementById('restart-rocket');
    const submitBtn = document.getElementById('submit-answer');
    const answerInput = document.getElementById('answer-input');
    
    startBtn.addEventListener('click', startMathProblems);
    submitBtn.addEventListener('click', submitAnswer);
    restartBtn.addEventListener('click', () => {
        restartBtn.style.display = 'none';
        document.getElementById('rocket-gameplay').style.display = 'none';
        document.querySelector('.game-settings').style.display = 'block';
    });
    
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });

    // Arrow key listeners
    document.addEventListener('keydown', handleRocketKeyDown);
    document.addEventListener('keyup', handleRocketKeyUp);
}

function startMathProblems() {
    // Get settings
    rocketGameState.numProblems = parseInt(document.getElementById('num-problems').value);
    rocketGameState.numberRange = parseInt(document.getElementById('number-range').value);
    rocketGameState.currentProblem = 0;
    rocketGameState.correctAnswers = 0;
    rocketGameState.fuel = 0; // Start with no fuel
    
    // Get selected operators
    const operators = [];
    if (document.getElementById('op-add').checked) operators.push('+');
    if (document.getElementById('op-sub').checked) operators.push('-');
    if (document.getElementById('op-mul').checked) operators.push('×');
    
    if (operators.length === 0) {
        alert('Please select at least one operator!');
        return;
    }
    
    rocketGameState.operators = operators;
    
    // Generate problems
    generateProblems();
    
    // Show gameplay area and math overlay
    document.querySelector('.game-settings').style.display = 'none';
    document.getElementById('rocket-gameplay').style.display = 'block';
    document.getElementById('math-overlay').style.display = 'flex';
    
    // Load assets and start showing the grayed-out scene
    if (!spaceAssets.loaded) {
        loadSpaceAssets().then(() => {
            drawMathScene();
        });
    } else {
        drawMathScene();
    }
    
    // Show first problem
    showNextProblem();
}

function generateProblems() {
    rocketGameState.problems = [];
    for (let i = 0; i < rocketGameState.numProblems; i++) {
        const operator = rocketGameState.operators[Math.floor(Math.random() * rocketGameState.operators.length)];
        let num1, num2, answer;
        
        if (operator === '+') {
            num1 = Math.floor(Math.random() * rocketGameState.numberRange);
            num2 = Math.floor(Math.random() * rocketGameState.numberRange);
            answer = num1 + num2;
        } else if (operator === '-') {
            num1 = Math.floor(Math.random() * rocketGameState.numberRange);
            num2 = Math.floor(Math.random() * (num1 + 1));
            answer = num1 - num2;
        } else if (operator === '×') {
            const maxNum = Math.min(rocketGameState.numberRange, 10);
            num1 = Math.floor(Math.random() * maxNum);
            num2 = Math.floor(Math.random() * maxNum);
            answer = num1 * num2;
        }
        
        rocketGameState.problems.push({ num1, num2, operator, answer });
    }
}

function showNextProblem() {
    if (rocketGameState.currentProblem >= rocketGameState.numProblems) {
        startRocketGame();
        return;
    }
    
    const problem = rocketGameState.problems[rocketGameState.currentProblem];
    document.getElementById('problem-text').textContent = 
        `${problem.num1} ${problem.operator} ${problem.num2} = ?`;
    document.getElementById('answer-input').value = '';
    document.getElementById('feedback').textContent = '';
    document.getElementById('current-question').textContent = rocketGameState.currentProblem + 1;
    document.getElementById('total-questions').textContent = rocketGameState.numProblems;
    
    document.getElementById('answer-input').focus();
}

function submitAnswer() {
    const userAnswer = parseInt(document.getElementById('answer-input').value);
    const problem = rocketGameState.problems[rocketGameState.currentProblem];
    const feedback = document.getElementById('feedback');
    
    if (isNaN(userAnswer)) {
        return;
    }
    
    if (userAnswer === problem.answer) {
        feedback.textContent = t('correct');
        feedback.className = 'feedback correct';
        rocketGameState.correctAnswers++;
        
        // Fill up fuel tank
        rocketGameState.fuel = (rocketGameState.correctAnswers / rocketGameState.numProblems) * 100;
        drawMathScene(); // Redraw to show fuel increase
    } else {
        feedback.textContent = t('wrong');
        feedback.className = 'feedback wrong';
    }
    
    setTimeout(() => {
        rocketGameState.currentProblem++;
        showNextProblem();
    }, 1000);
}

function startRocketGame() {
    // Calculate fuel based on correct answers
    const percentage = rocketGameState.correctAnswers / rocketGameState.numProblems;
    rocketGameState.fuel = percentage * 100;
    
    // Hide math overlay
    document.getElementById('math-overlay').style.display = 'none';
    
    // Reset rocket state
    resetRocketGame();
    
    // Preserve the earned fuel
    rocketGameState.fuel = percentage * 100;
    
    // Load assets if needed
    if (!spaceAssets.loaded) {
        loadSpaceAssets().then(() => {
            startGameLoop();
        });
    } else {
        startGameLoop();
    }
}

function drawMathScene() {
    const canvas = document.getElementById('rocket-canvas');
    const ctx = canvas.getContext('2d');
    
    // Celestial body positions (4K resolution)
    const moonX = canvas.width / 2;
    const moonY = canvas.height / 2;
    const earthX = 300;
    const earthY = 1800;
    const moonRadius = 150;
    const earthRadius = 200;
    
    // Clear canvas with space background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw static starry background
    const starSeed = 12345;
    for (let i = 0; i < 600; i++) {
        const sx = ((i * 137 + starSeed) % canvas.width);
        const sy = ((i * 239 + starSeed) % canvas.height);
        const brightness = 0.5 + (i % 5) * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness * 0.3})`; // Dimmer stars
        const size = 2 + (i % 4);
        ctx.fillRect(sx, sy, size, size);
    }
    
    // Apply gray filter
    ctx.fillStyle = 'rgba(128, 128, 128, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw Moon (center) - grayed out
    if (spaceAssets.loaded && spaceAssets.moon) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(spaceAssets.moon, moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);
        ctx.restore();
    }
    
    // Draw Earth (lower left) - grayed out
    if (spaceAssets.loaded && spaceAssets.earth) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.drawImage(spaceAssets.earth, earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);
        ctx.restore();
    }
    
    // Draw rocket on Earth surface
    if (spaceAssets.loaded && spaceAssets.rocket) {
        ctx.save();
        ctx.globalAlpha = 0.5;
        ctx.translate(400, 1900);
        ctx.rotate(Math.PI / 6);
        ctx.drawImage(spaceAssets.rocket, -50, -75, 100, 125);
        ctx.restore();
    }
    
    // Draw large vertical fuel tank on right side
    const tankX = canvas.width - 180;
    const tankY = 100;
    const tankWidth = 120;
    const tankHeight = 800;
    const fuelLevel = rocketGameState.fuel / 100;
    
    // Tank background (transparent)
    ctx.globalAlpha = 1;
    ctx.fillStyle = `rgba(100, 100, 100, 0.3)`;
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankWidth, tankHeight, 20);
    ctx.fill();
    ctx.stroke();
    
    // Fuel fill (yellow with opacity based on level)
    const fuelFillHeight = tankHeight * fuelLevel;
    ctx.fillStyle = `rgba(255, 235, 59, ${0.3 + fuelLevel * 0.7})`;
    ctx.beginPath();
    ctx.roundRect(tankX + 4, tankY + tankHeight - fuelFillHeight, tankWidth - 8, fuelFillHeight - 4, 16);
    ctx.fill();
    
    // Fuel percentage text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(rocketGameState.fuel)}%`, tankX + tankWidth / 2, tankY + tankHeight + 60);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(t('fuel'), tankX + tankWidth / 2, tankY - 30);
}

function handleRocketKeyDown(e) {
    if (!rocketGameState.gameActive) return;
    
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        rocketKeys[e.key] = true;
    }
}

function handleRocketKeyUp(e) {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();
        rocketKeys[e.key] = false;
    }
}

function startRocketGame() {
    // Reset rocket state
    resetRocketGame();
    
    // Show gameplay area
    document.querySelector('.game-instructions').style.display = 'none';
    document.getElementById('rocket-gameplay').style.display = 'block';
    
    // Load assets if needed
    if (!spaceAssets.loaded) {
        loadSpaceAssets().then(() => {
            startGameLoop();
        });
    } else {
        startGameLoop();
    }
}

function resetRocketGame() {
    rocketGameState = {
        x: 300,
        y: 1600, // On Earth's surface (lower left)
        vx: 0,
        vy: 0,
        angle: Math.PI / 6, // 30 degrees clockwise from up
        fuel: 100,
        thrust: false,
        rotateLeft: false,
        rotateRight: false,
        gameActive: true,
        landed: false,
        crashed: false,
        onGround: true,
        orbits: 0,
        lastAngleToMoon: 0,
        angleCrossings: 0
    };
    
    rocketKeys.ArrowUp = false;
    rocketKeys.ArrowLeft = false;
    rocketKeys.ArrowRight = false;
}

function startGameLoop() {
    rocketGameState.gameActive = true;
    updateRocketGame();
}

function updateRocketGame() {
    if (!rocketGameState.gameActive) return;
    
    const canvas = document.getElementById('rocket-canvas');
    const ctx = canvas.getContext('2d');
    
    // Physics constants
    const MOON_GRAVITY = 0.05;
    const EARTH_GRAVITY = 0.1; // 4x moon gravity
    const THRUST_POWER = 0.5;
    const ROTATION_SPEED = 0.04;
    const FUEL_CONSUMPTION = 0.3;
    
    // Celestial body positions (4K resolution)
    const moonX = canvas.width / 2;  // Center
    const moonY = canvas.height / 2;
    const earthX = 300;  // Lower left
    const earthY = 1800;
    const moonRadius = 150;
    const earthRadius = 200;
    
    // Handle rotation
    if (rocketKeys.ArrowLeft) {
        rocketGameState.angle -= ROTATION_SPEED;
    }
    if (rocketKeys.ArrowRight) {
        rocketGameState.angle += ROTATION_SPEED;
    }
    
    // Handle thrust
    if (rocketKeys.ArrowUp && rocketGameState.fuel > 0) {
        rocketGameState.thrust = true;
        rocketGameState.fuel = Math.max(0, rocketGameState.fuel - FUEL_CONSUMPTION);
        
        // Apply thrust in direction rocket is pointing
        rocketGameState.vx += Math.sin(rocketGameState.angle) * THRUST_POWER;
        rocketGameState.vy -= Math.cos(rocketGameState.angle) * THRUST_POWER;
    } else {
        rocketGameState.thrust = false;
    }
    
    // Apply gravity from Moon (with minimum distance to prevent extreme forces)
    const dx_moon = moonX - rocketGameState.x;
    const dy_moon = moonY - rocketGameState.y;
    const dist_moon = Math.sqrt(dx_moon * dx_moon + dy_moon * dy_moon);
    const minDist_moon = moonRadius + 50; // Minimum effective distance
    const effectiveDist_moon = Math.max(dist_moon, minDist_moon);
    
    if (dist_moon > 0) {
        const forceMoon = MOON_GRAVITY * (moonRadius * moonRadius) / (effectiveDist_moon * effectiveDist_moon);
        rocketGameState.vx += (dx_moon / dist_moon) * forceMoon;
        rocketGameState.vy += (dy_moon / dist_moon) * forceMoon;
    }
    
    // Apply gravity from Earth (with minimum distance to prevent extreme forces)
    const dx_earth = earthX - rocketGameState.x;
    const dy_earth = earthY - rocketGameState.y;
    const dist_earth = Math.sqrt(dx_earth * dx_earth + dy_earth * dy_earth);
    
    if (dist_earth > 0) {
        let forceEarth = EARTH_GRAVITY / ((dist_earth * dist_earth) + 0.1);
        
        // Cap the maximum force to ensure thrust can overcome it
        const maxForce = THRUST_POWER * 0.6;
        forceEarth = Math.min(forceEarth, maxForce);
        
        rocketGameState.vx += (dx_earth / dist_earth) * forceEarth;
        rocketGameState.vy += (dy_earth / dist_earth) * forceEarth;
    }
    
    // Track orbits around moon
    const angleToMoon = Math.atan2(rocketGameState.y - moonY, rocketGameState.x - moonX);
    const angleDiff = angleToMoon - rocketGameState.lastAngleToMoon;
    
    // Detect full orbit (crossing from -π to π or vice versa)
    if (angleDiff > Math.PI) {
        rocketGameState.angleCrossings--;
    } else if (angleDiff < -Math.PI) {
        rocketGameState.angleCrossings++;
    }
    
    // Complete orbit every 360 degrees of crossing
    if (Math.abs(rocketGameState.angleCrossings) >= 1) {
        rocketGameState.orbits += Math.floor(Math.abs(rocketGameState.angleCrossings));
        rocketGameState.angleCrossings = rocketGameState.angleCrossings % 1;
    }
    
    rocketGameState.lastAngleToMoon = angleToMoon;
    
    // Update position
    rocketGameState.x += rocketGameState.vx;
    rocketGameState.y += rocketGameState.vy;
    
    // Check boundaries
    if (rocketGameState.x < 0) {
        rocketGameState.x = 0;
        rocketGameState.vx *= -0.5;
    }
    if (rocketGameState.x > canvas.width) {
        rocketGameState.x = canvas.width;
        rocketGameState.vx *= -0.5;
    }
    if (rocketGameState.y < 0) {
        rocketGameState.y = 0;
        rocketGameState.vy *= -0.5;
    }
    if (rocketGameState.y > canvas.height) {
        rocketGameState.y = canvas.height;
        rocketGameState.vy *= -0.5;
    }
    
    // Check collisions
    checkCollisions(canvas, moonX, moonY, moonRadius, earthX, earthY, earthRadius);
    
    // Draw everything
    drawRocketGameScene(ctx, canvas, moonX, moonY, moonRadius, earthX, earthY, earthRadius);
    
    // Continue loop
    if (rocketGameState.gameActive && !rocketGameState.landed && !rocketGameState.crashed) {
        requestAnimationFrame(updateRocketGame);
    }
}

function checkCollisions(canvas, moonX, moonY, moonRadius, earthX, earthY, earthRadius) {
    const speed = Math.sqrt(rocketGameState.vx ** 2 + rocketGameState.vy ** 2);
    const CRASH_SPEED = 125 / 60; // px per frame (125 px/second at 60fps)
    
    // Earth collision
    const dx_earth = rocketGameState.x - earthX;
    const dy_earth = rocketGameState.y - earthY;
    const dist_earth = Math.sqrt(dx_earth * dx_earth + dy_earth * dy_earth);
    
    if (dist_earth < earthRadius + 40) {
        // Check if moving towards Earth center (dot product)
        const dotProduct = rocketGameState.vx * (-dx_earth) + rocketGameState.vy * (-dy_earth);
        const isMovingTowards = dotProduct > 0;
        
        if (isMovingTowards && speed > CRASH_SPEED) {
            // Crash if moving towards Earth AND going too fast
            rocketGameState.crashed = true;
            rocketGameState.gameActive = false;
            // Delay showing restart button for 3 seconds to see explosion
            setTimeout(() => {
                document.getElementById('restart-rocket').style.display = 'block';
            }, 3000);
        } else {
            // Stop on surface (resting)
            rocketGameState.vx = 0;
            rocketGameState.vy = 0;
        }
    }
    
    // Moon collision - can land safely if slow enough
    const dx_moon = rocketGameState.x - moonX;
    const dy_moon = rocketGameState.y - moonY;
    const dist_moon = Math.sqrt(dx_moon * dx_moon + dy_moon * dy_moon);
    
    if (dist_moon < moonRadius + 40) {
        // Check if moving towards Moon center
        const dotProduct = rocketGameState.vx * (-dx_moon) + rocketGameState.vy * (-dy_moon);
        const isMovingTowards = dotProduct > 0;
        
        if (isMovingTowards && speed > CRASH_SPEED) {
            // Crash if moving towards Moon AND going too fast
            rocketGameState.crashed = true;
            rocketGameState.gameActive = false;
            // Delay showing restart button for 3 seconds to see explosion
            setTimeout(() => {
                document.getElementById('restart-rocket').style.display = 'block';
            }, 3000);
        } else {
            // Successful landing on Moon!
            rocketGameState.landed = true;
            rocketGameState.gameActive = false;
            rocketGameState.vx = 0;
            rocketGameState.vy = 0;
            // Delay showing restart button for 1 second
            setTimeout(() => {
                document.getElementById('restart-rocket').style.display = 'block';
            }, 1000);
        }
    }
}

// Load images for space assets
const spaceAssets = {
    rocket: null,
    earth: null,
    moon: null,
    loaded: false
};

function loadSpaceAssets() {
    return new Promise((resolve) => {
        let loadedCount = 0;
        const totalAssets = 3;
        
        const checkComplete = () => {
            loadedCount++;
            if (loadedCount === totalAssets) {
                spaceAssets.loaded = true;
                resolve();
            }
        };
        
        // Create base64 data URLs for the assets
        spaceAssets.rocket = new Image();
        spaceAssets.rocket.onload = checkComplete;
        spaceAssets.rocket.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 250"><defs><radialGradient id="glow"><stop offset="50%" stop-color="#ff9999"/><stop offset="100%" stop-color="#ff000000"/></radialGradient></defs><ellipse cx="100" cy="230" rx="60" ry="30" fill="url(#glow)"/><path d="M60 180 L50 240 L70 240 Z" fill="#4dd2ff"/><path d="M140 180 L130 240 L150 240 Z" fill="#4dd2ff"/><rect x="70" y="80" width="60" height="120" rx="5" fill="white" stroke="black" stroke-width="4"/><path d="M100 230 L95 240 L105 240 Z" fill="#444"/><circle cx="100" cy="130" r="15" fill="black"/><circle cx="92" cy="125" r="4" fill="white"/><path d="M85 145 Q100 155 115 145" fill="none" stroke="black" stroke-width="3" stroke-linecap="round"/><path d="M100 80 L60 50 L75 80 Z" fill="#ff6b6b" stroke="black" stroke-width="4"/><path d="M100 80 L140 50 L125 80 Z" fill="#ff6b6b" stroke="black" stroke-width="4"/><path d="M100 80 L100 20 L75 80 Z" fill="#ff6b6b" stroke="black" stroke-width="4"/><path d="M100 80 L100 20 L125 80 Z" fill="#ff6b6b" stroke="black" stroke-width="4"/><circle cx="100" cy="30" r="8" fill="white" opacity="0.7"/><path d="M75 80 L78 83 L85 73 L92 82 L95 78" fill="none" stroke="black" stroke-width="2"/><path d="M125 80 L122 83 L115 73 L108 82 L105 78" fill="none" stroke="black" stroke-width="2"/></svg>');
        
        spaceAssets.earth = new Image();
        spaceAssets.earth.onload = checkComplete;
        spaceAssets.earth.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="earthGrad"><stop offset="20%" stop-color="#87ceeb"/><stop offset="80%" stop-color="#4a90e2"/><stop offset="100%" stop-color="#1e3a5f"/></radialGradient></defs><circle cx="100" cy="100" r="95" fill="url(#earthGrad)" stroke="#333" stroke-width="3"/><path d="M40 60 Q50 50 70 55 L85 50 Q95 48 100 55 L110 50 Q125 45 140 55 L155 60" fill="#90ee90" opacity="0.9"/><path d="M20 110 Q35 95 55 100 L75 95 Q90 92 95 100 L110 105" fill="#90ee90" opacity="0.9"/><path d="M140 120 Q155 110 170 115 L180 125" fill="#90ee90" opacity="0.9"/><path d="M30 150 Q45 140 60 145 L80 150" fill="#90ee90" opacity="0.9"/><ellipse cx="60" cy="80" rx="8" ry="12" fill="white" opacity="0.3"/><ellipse cx="130" cy="90" rx="10" ry="15" fill="white" opacity="0.3"/><ellipse cx="70" cy="140" rx="6" ry="10" fill="white" opacity="0.3"/><path d="M170 80 Q175 78 178 82" fill="none" stroke="white" opacity="0.4" stroke-width="2"/><path d="M25 90 Q28 88 32 90" fill="none" stroke="white" opacity="0.4" stroke-width="2"/><circle cx="80" cy="75" r="2" fill="#228b22"/><circle cx="95" cy="70" r="2" fill="#228b22"/><circle cx="50" cy="110" r="2" fill="#228b22"/></svg>');
        
        spaceAssets.moon = new Image();
        spaceAssets.moon.onload = checkComplete;
        spaceAssets.moon.src = 'data:image/svg+xml;base64,' + btoa('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="moonGrad"><stop offset="30%" stop-color="#f5f5dc"/><stop offset="100%" stop-color="#d3d3d3"/></radialGradient></defs><circle cx="100" cy="100" r="95" fill="url(#moonGrad)" stroke="#999" stroke-width="3"/><ellipse cx="65" cy="70" rx="18" ry="22" fill="#c0c0c0" opacity="0.6"/><ellipse cx="62" cy="68" rx="14" ry="18" fill="#d3d3d3"/><ellipse cx="140" cy="90" rx="22" ry="28" fill="#c0c0c0" opacity="0.6"/><ellipse cx="137" cy="87" rx="18" ry="24" fill="#d3d3d3"/><ellipse cx="110" cy="140" rx="15" ry="18" fill="#c0c0c0" opacity="0.6"/><ellipse cx="108" cy="138" rx="12" ry="15" fill="#d3d3d3"/><circle cx="50" cy="120" r="8" fill="#c0c0c0" opacity="0.5"/><circle cx="170" cy="110" r="6" fill="#c0c0c0" opacity="0.5"/><circle cx="85" cy="160" r="7" fill="#c0c0c0" opacity="0.5"/><circle cx="145" cy="50" r="5" fill="#c0c0c0" opacity="0.5"/><path d="M90 95 Q95 98 98 95" fill="none" stroke="#b0b0b0" stroke-width="1.5" opacity="0.4"/><path d="M130 120 Q135 123 138 120" fill="none" stroke="#b0b0b0" stroke-width="1.5" opacity="0.4"/></svg>');
    });
}

function drawRocketGameScene(ctx, canvas, moonX, moonY, moonRadius, earthX, earthY, earthRadius) {
    // Clear canvas with space background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw static starry background (more stars for 4K)
    const starSeed = 12345;
    for (let i = 0; i < 600; i++) {
        const sx = ((i * 137 + starSeed) % canvas.width);
        const sy = ((i * 239 + starSeed) % canvas.height);
        const brightness = 0.5 + (i % 5) * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        const size = 2 + (i % 4);
        ctx.fillRect(sx, sy, size, size);
    }
    
    // Draw Moon (center)
    if (spaceAssets.loaded && spaceAssets.moon) {
        ctx.drawImage(spaceAssets.moon, moonX - moonRadius, moonY - moonRadius, moonRadius * 2, moonRadius * 2);
    }
    
    // Draw Earth (lower left)
    if (spaceAssets.loaded && spaceAssets.earth) {
        ctx.drawImage(spaceAssets.earth, earthX - earthRadius, earthY - earthRadius, earthRadius * 2, earthRadius * 2);
    }
    
    // Draw flame particles (only if thrust active)
    if (rocketGameState.thrust && rocketGameState.fuel > 0) {
        ctx.save();
        ctx.translate(rocketGameState.x, rocketGameState.y);
        ctx.rotate(rocketGameState.angle);
        
        for (let i = 0; i < 12; i++) {
            const gradient = ctx.createRadialGradient(0, 60, 0, 0, 60, 40);
            gradient.addColorStop(0, `rgba(255, ${150 + Math.random() * 100}, 0, ${0.8 + Math.random() * 0.2})`);
            gradient.addColorStop(0.5, `rgba(255, ${100 + Math.random() * 50}, 0, ${0.4 + Math.random() * 0.3})`);
            gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(
                (Math.random() - 0.5) * 40,
                60 + Math.random() * 30,
                Math.random() * 15 + 10,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
    }
    
    // Draw rocket with rotation
    if (spaceAssets.loaded && spaceAssets.rocket) {
        ctx.save();
        ctx.translate(rocketGameState.x, rocketGameState.y);
        ctx.rotate(rocketGameState.angle);
        ctx.drawImage(spaceAssets.rocket, -50, -75, 100, 125);
        ctx.restore();
    }
    
    // Draw large vertical fuel tank on right side
    const tankX = canvas.width - 180;
    const tankY = 100;
    const tankWidth = 120;
    const tankHeight = 800;
    const fuelLevel = rocketGameState.fuel / 100;
    
    // Tank background (transparent)
    ctx.fillStyle = `rgba(100, 100, 100, 0.3)`;
    ctx.strokeStyle = '#ffeb3b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(tankX, tankY, tankWidth, tankHeight, 20);
    ctx.fill();
    ctx.stroke();
    
    // Fuel fill (yellow with opacity based on level)
    const fuelFillHeight = tankHeight * fuelLevel;
    ctx.fillStyle = `rgba(255, 235, 59, ${0.3 + fuelLevel * 0.7})`;
    ctx.beginPath();
    ctx.roundRect(tankX + 4, tankY + tankHeight - fuelFillHeight, tankWidth - 8, fuelFillHeight - 4, 16);
    ctx.fill();
    
    // Fuel percentage text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${Math.round(rocketGameState.fuel)}%`, tankX + tankWidth / 2, tankY + tankHeight + 60);
    ctx.font = 'bold 32px Arial';
    ctx.fillText(t('fuel'), tankX + tankWidth / 2, tankY - 30);
    
    // Draw UI overlay (top left)
    ctx.textAlign = 'left';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(20, 20, 450, 250);
    ctx.strokeStyle = '#667eea';
    ctx.lineWidth = 4;
    ctx.strokeRect(20, 20, 450, 250);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 36px Arial';
    
    // Orbits
    ctx.fillStyle = '#4caf50';
    ctx.fillText(`🌙 ${t('orbits')} ${rocketGameState.orbits}`, 40, 70);
    
    // Speed (red if > 125 px/s)
    const speed = Math.sqrt(rocketGameState.vx ** 2 + rocketGameState.vy ** 2) * 60; // px/second
    const SPEED_THRESHOLD = 125;
    if (speed > SPEED_THRESHOLD) {
        ctx.fillStyle = '#ff3333'; // Red
    } else {
        ctx.fillStyle = 'white';
    }
    ctx.fillText(`🚀 ${t('speed')} ${speed.toFixed(1)} px/s`, 40, 130);
    
    // Angle
    ctx.fillStyle = 'white';
    const angleDeg = Math.round((rocketGameState.angle * 180 / Math.PI) % 360);
    ctx.fillText(`↻ ${t('angle')} ${angleDeg}°`, 40, 190);
    
    // Crash/explosion effect
    if (rocketGameState.crashed) {
        // Draw explosion flames
        ctx.save();
        ctx.translate(rocketGameState.x, rocketGameState.y);
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            const dist = 30 + Math.random() * 60;
            ctx.fillStyle = `rgba(255, ${100 + Math.random() * 100}, 0, ${0.6 + Math.random() * 0.4})`;
            ctx.beginPath();
            ctx.arc(
                Math.cos(angle) * dist,
                Math.sin(angle) * dist,
                10 + Math.random() * 20,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
        ctx.restore();
        
        // Message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        ctx.strokeStyle = '#ff6666';
        ctx.lineWidth = 8;
        ctx.strokeRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        
        ctx.fillStyle = '#ff6666';
        ctx.font = 'bold 96px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💥 ' + t('crashed') + ' 💥', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`${t('completedOrbits')} ${rocketGameState.orbits} ${t('orbitsText')}`, canvas.width / 2, canvas.height / 2 + 60);
    } else if (rocketGameState.landed) {
        // Success message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        ctx.strokeStyle = '#4caf50';
        ctx.lineWidth = 8;
        ctx.strokeRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        
        ctx.fillStyle = '#4caf50';
        ctx.font = 'bold 96px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🎉 ' + t('landed') + ' 🎉', canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`${t('completedOrbits')} ${rocketGameState.orbits} ${t('orbitsText')}!`, canvas.width / 2, canvas.height / 2 + 60);
        
        // Calculate score
        ctx.font = 'bold 60px Arial';
        ctx.fillStyle = '#ffeb3b';
        const score = 100 + (rocketGameState.orbits * 50);
        ctx.fillText(`${t('score')} ${score}`, canvas.width / 2, canvas.height / 2 + 150);
    }
    
    ctx.textAlign = 'left';
}

// ============================
// GAME 2: SHORTEST PATH
// ============================

let pathGameState = {
    gridSize: 15,
    cellSize: 40,
    playerPos: { x: 0, y: 0 },
    fruitPos: { x: 0, y: 0 },
    obstacles: [],
    steps: 0,
    optimalSteps: 0,
    collectedFruits: { apple: 0, orange: 0, banana: 0 },
    currentFruit: 'apple'
};

const fruitEmojis = { apple: '🍎', orange: '🍊', banana: '🍌' };

function initPathGame() {
    document.getElementById('new-path-game').addEventListener('click', startPathGame);
    
    document.addEventListener('keydown', (e) => {
        if (currentGame === 'path' && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
            e.preventDefault();
            movePlayer(e.key);
        }
    });
    
    startPathGame();
}

function startPathGame() {
    // Reset state
    pathGameState.steps = 0;
    pathGameState.playerPos = { x: 0, y: 0 };
    
    // Generate random obstacles
    pathGameState.obstacles = [];
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * pathGameState.gridSize);
        const y = Math.floor(Math.random() * pathGameState.gridSize);
        if ((x !== 0 || y !== 0) && !pathGameState.obstacles.some(obs => obs.x === x && obs.y === y)) {
            pathGameState.obstacles.push({ x, y, type: Math.random() > 0.5 ? 'tree' : 'bush' });
        }
    }
    
    // Place fruit
    placeFruit();
    
    // Calculate optimal path
    pathGameState.optimalSteps = calculateOptimalPath();
    
    // Update UI
    updatePathUI();
    drawPathGame();
}

function placeFruit() {
    const fruitTypes = ['apple', 'orange', 'banana'];
    pathGameState.currentFruit = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];
    
    do {
        pathGameState.fruitPos = {
            x: Math.floor(Math.random() * pathGameState.gridSize),
            y: Math.floor(Math.random() * pathGameState.gridSize)
        };
    } while (
        (pathGameState.fruitPos.x === pathGameState.playerPos.x && 
         pathGameState.fruitPos.y === pathGameState.playerPos.y) ||
        pathGameState.obstacles.some(obs => 
            obs.x === pathGameState.fruitPos.x && obs.y === pathGameState.fruitPos.y)
    );
}

function calculateOptimalPath() {
    // Simple BFS pathfinding
    const queue = [{ x: pathGameState.playerPos.x, y: pathGameState.playerPos.y, dist: 0 }];
    const visited = new Set();
    visited.add(`${pathGameState.playerPos.x},${pathGameState.playerPos.y}`);
    
    while (queue.length > 0) {
        const current = queue.shift();
        
        if (current.x === pathGameState.fruitPos.x && current.y === pathGameState.fruitPos.y) {
            return current.dist;
        }
        
        const directions = [
            { dx: 0, dy: -1 }, { dx: 0, dy: 1 },
            { dx: -1, dy: 0 }, { dx: 1, dy: 0 }
        ];
        
        for (const dir of directions) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const key = `${nx},${ny}`;
            
            if (nx >= 0 && nx < pathGameState.gridSize && 
                ny >= 0 && ny < pathGameState.gridSize &&
                !visited.has(key) &&
                !pathGameState.obstacles.some(obs => obs.x === nx && obs.y === ny)) {
                visited.add(key);
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }
    }
    
    return 0;
}

function movePlayer(direction) {
    let newX = pathGameState.playerPos.x;
    let newY = pathGameState.playerPos.y;
    
    switch (direction) {
        case 'ArrowUp': newY--; break;
        case 'ArrowDown': newY++; break;
        case 'ArrowLeft': newX--; break;
        case 'ArrowRight': newX++; break;
    }
    
    // Check bounds
    if (newX < 0 || newX >= pathGameState.gridSize || 
        newY < 0 || newY >= pathGameState.gridSize) {
        return;
    }
    
    // Check obstacles
    if (pathGameState.obstacles.some(obs => obs.x === newX && obs.y === newY)) {
        return;
    }
    
    // Move player
    pathGameState.playerPos = { x: newX, y: newY };
    pathGameState.steps++;
    
    // Check if reached fruit
    if (newX === pathGameState.fruitPos.x && newY === pathGameState.fruitPos.y) {
        collectFruit();
    }
    
    updatePathUI();
    drawPathGame();
}

function collectFruit() {
    pathGameState.collectedFruits[pathGameState.currentFruit]++;
    
    // Calculate stars
    const performance = pathGameState.steps / pathGameState.optimalSteps;
    let stars = 0;
    if (performance <= 1.0) stars = 3;
    else if (performance <= 1.2) stars = 2;
    else if (performance <= 1.4) stars = 1;
    
    // Show stars
    const starsDisplay = document.getElementById('stars-display');
    starsDisplay.textContent = '⭐'.repeat(stars);
    
    setTimeout(() => {
        starsDisplay.textContent = '';
        pathGameState.steps = 0;
        placeFruit();
        pathGameState.optimalSteps = calculateOptimalPath();
        updatePathUI();
        drawPathGame();
    }, 1500);
}

function updatePathUI() {
    document.getElementById('steps-count').textContent = pathGameState.steps;
    
    const basket = document.getElementById('fruit-basket');
    basket.innerHTML = '';
    for (const [fruit, count] of Object.entries(pathGameState.collectedFruits)) {
        if (count > 0) {
            const item = document.createElement('div');
            item.className = 'fruit-item';
            item.textContent = `${fruitEmojis[fruit]} ${count}`;
            basket.appendChild(item);
        }
    }
}

function drawPathGame() {
    const canvas = document.getElementById('path-canvas');
    const ctx = canvas.getContext('2d');
    const cellSize = pathGameState.cellSize;
    
    // Clear canvas
    ctx.fillStyle = '#90ee90';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw grid
    ctx.strokeStyle = '#7cb37c';
    ctx.lineWidth = 1;
    for (let x = 0; x <= pathGameState.gridSize; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellSize, 0);
        ctx.lineTo(x * cellSize, pathGameState.gridSize * cellSize);
        ctx.stroke();
    }
    for (let y = 0; y <= pathGameState.gridSize; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellSize);
        ctx.lineTo(pathGameState.gridSize * cellSize, y * cellSize);
        ctx.stroke();
    }
    
    // Draw obstacles
    pathGameState.obstacles.forEach(obs => {
        if (obs.type === 'tree') {
            // Tree
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(obs.x * cellSize + 15, obs.y * cellSize + 20, 10, 15);
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 20, obs.y * cellSize + 15, 12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Bush
            ctx.fillStyle = '#2d5016';
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 20, obs.y * cellSize + 20, 15, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw fruit
    ctx.font = '30px Arial';
    ctx.fillText(
        fruitEmojis[pathGameState.currentFruit],
        pathGameState.fruitPos.x * cellSize + 5,
        pathGameState.fruitPos.y * cellSize + 30
    );
    
    // Draw player
    ctx.fillStyle = '#4a90e2';
    ctx.beginPath();
    ctx.arc(
        pathGameState.playerPos.x * cellSize + 20,
        pathGameState.playerPos.y * cellSize + 20,
        15,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Player face
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(pathGameState.playerPos.x * cellSize + 15, pathGameState.playerPos.y * cellSize + 17, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(pathGameState.playerPos.x * cellSize + 25, pathGameState.playerPos.y * cellSize + 17, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'white';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(pathGameState.playerPos.x * cellSize + 20, pathGameState.playerPos.y * cellSize + 22, 5, 0, Math.PI);
    ctx.stroke();
}

// ============================
// GAME 3: DRAWING
// ============================

let drawState = {
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    color: '#000000',
    brushSize: 5,
    tool: 'brush'
};

function initDrawGame() {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    
    // Initialize white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Setup controls
    document.getElementById('draw-color').addEventListener('change', (e) => {
        drawState.color = e.target.value;
    });
    
    document.getElementById('brush-size').addEventListener('input', (e) => {
        drawState.brushSize = e.target.value;
        document.getElementById('brush-size-display').textContent = e.target.value;
    });
    
    document.getElementById('draw-tool').addEventListener('change', (e) => {
        drawState.tool = e.target.value;
    });
    
    document.getElementById('clear-canvas').addEventListener('click', () => {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    });
    
    // Drawing events
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mouseout', stopDrawing);
    
    // Touch events for mobile
    canvas.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        drawState.lastX = touch.clientX - rect.left;
        drawState.lastY = touch.clientY - rect.top;
        drawState.isDrawing = true;
    });
    
    canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (!drawState.isDrawing) return;
        const touch = e.touches[0];
        const rect = canvas.getBoundingClientRect();
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        drawLine(x, y);
    });
    
    canvas.addEventListener('touchend', () => {
        drawState.isDrawing = false;
    });
}

function startDrawing(e) {
    drawState.isDrawing = true;
    const rect = e.target.getBoundingClientRect();
    drawState.lastX = e.clientX - rect.left;
    drawState.lastY = e.clientY - rect.top;
}

function draw(e) {
    if (!drawState.isDrawing) return;
    
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawLine(x, y);
}

function drawLine(x, y) {
    const canvas = document.getElementById('draw-canvas');
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(drawState.lastX, drawState.lastY);
    ctx.lineTo(x, y);
    
    if (drawState.tool === 'brush') {
        ctx.strokeStyle = drawState.color;
    } else {
        ctx.strokeStyle = 'white';
    }
    
    ctx.lineWidth = drawState.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
    
    drawState.lastX = x;
    drawState.lastY = y;
}

function stopDrawing() {
    drawState.isDrawing = false;
}

// ============================
// GAME 4: TOWER BUILDER
// ============================

let towerEngine = null;
let towerWorld = null;
let towerRender = null;
let maxTowerHeight = 0;

function initTowerGame() {
    const canvas = document.getElementById('tower-canvas');
    
    // Setup Matter.js
    const Engine = Matter.Engine;
    const Render = Matter.Render;
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    const Events = Matter.Events;
    
    towerEngine = Engine.create({
        gravity: { x: 0, y: 1 }
    });
    
    towerWorld = towerEngine.world;
    
    towerRender = Render.create({
        canvas: canvas,
        engine: towerEngine,
        options: {
            width: 800,
            height: 600,
            wireframes: false,
            background: 'transparent'
        }
    });
    
    // Create ground
    const ground = Bodies.rectangle(400, 590, 800, 20, {
        isStatic: true,
        render: { fillStyle: '#8b4513' }
    });
    
    World.add(towerWorld, ground);
    
    // Start engine
    Engine.run(towerEngine);
    Render.run(towerRender);
    
    // Update height continuously
    Events.on(towerEngine, 'afterUpdate', updateTowerHeight);
    
    // Shape buttons
    document.querySelectorAll('.shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            addShape(btn.getAttribute('data-shape'));
        });
    });
    
    document.getElementById('reset-tower').addEventListener('click', resetTower);
}

function addShape(shapeType) {
    const Bodies = Matter.Bodies;
    const World = Matter.World;
    
    let body;
    const x = 400;
    const y = 100;
    
    if (shapeType === 'box') {
        body = Bodies.rectangle(x, y, 50, 50, {
            restitution: 0.3,
            friction: 0.8,
            render: { fillStyle: '#ff6b6b' }
        });
    } else if (shapeType === 'circle') {
        body = Bodies.circle(x, y, 25, {
            restitution: 0.5,
            friction: 0.5,
            render: { fillStyle: '#4ecdc4' }
        });
    } else if (shapeType === 'triangle') {
        body = Bodies.polygon(x, y, 3, 30, {
            restitution: 0.3,
            friction: 0.8,
            render: { fillStyle: '#ffe66d' }
        });
    }
    
    World.add(towerWorld, body);
}

function updateTowerHeight() {
    const World = Matter.World;
    const bodies = World.allBodies(towerWorld);
    
    let highest = 600;
    bodies.forEach(body => {
        if (!body.isStatic && body.position.y < highest) {
            highest = body.position.y;
        }
    });
    
    const height = Math.max(0, Math.round((600 - highest) / 10));
    if (height > maxTowerHeight) {
        maxTowerHeight = height;
    }
    
    document.getElementById('tower-height').textContent = maxTowerHeight;
}

function resetTower() {
    const World = Matter.World;
    const Bodies = Matter.Bodies;
    
    // Clear all non-static bodies
    const bodies = World.allBodies(towerWorld);
    bodies.forEach(body => {
        if (!body.isStatic) {
            World.remove(towerWorld, body);
        }
    });
    
    maxTowerHeight = 0;
    document.getElementById('tower-height').textContent = '0';
}

