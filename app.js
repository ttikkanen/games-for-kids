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
    initPokepathGame();
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
    fuelOut: false,
    noFuelBeforeStart: false,
    orbits: 0,
    lastAngleToMoon: 0,
    angleCrossings: 0,
    numProblems: 5,
    currentProblem: 0,
    correctAnswers: 0,
    problems: [],
    numberRange: 10,
    operators: ['+'],
    fuelOutTime: null,
    fuelOutTimer: null
};

// Store last game configuration for retry
let lastGameConfig = {
    numProblems: 5,
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
    const retryBtn = document.getElementById('retry-rocket');
    const goToStartBtn = document.getElementById('go-to-start-rocket');
    const submitBtn = document.getElementById('submit-answer');
    const answerInput = document.getElementById('answer-input');
    
    startBtn.addEventListener('click', startMathProblems);
    submitBtn.addEventListener('click', submitAnswer);
    
    retryBtn.addEventListener('click', retryRocketGame);
    goToStartBtn.addEventListener('click', goToStartRocket);
    
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            submitAnswer();
        }
    });

    // Arrow key listeners
    document.addEventListener('keydown', handleRocketKeyDown);
    document.addEventListener('keyup', handleRocketKeyUp);
}

function applyGameConfig(config) {
    // Apply saved configuration to UI
    document.getElementById('num-problems').value = config.numProblems;
    document.getElementById('number-range').value = config.numberRange;
    
    // Reset operator checkboxes
    document.getElementById('op-add').checked = false;
    document.getElementById('op-sub').checked = false;
    document.getElementById('op-mul').checked = false;
    
    // Apply saved operators
    config.operators.forEach(op => {
        if (op === '+') document.getElementById('op-add').checked = true;
        if (op === '-') document.getElementById('op-sub').checked = true;
        if (op === '×') document.getElementById('op-mul').checked = true;
    });
}

function retryRocketGame() {
    // Hide game end buttons and gameplay if showing
    document.getElementById('game-end-buttons').style.display = 'none';
    
    // Reset no fuel state if it was set
    if (rocketGameState.noFuelBeforeStart) {
        document.getElementById('rocket-gameplay').style.display = 'none';
        document.querySelector('.game-settings').style.display = 'block';
        rocketGameState.noFuelBeforeStart = false;
    }
    
    // Apply saved configuration
    applyGameConfig(lastGameConfig);
    
    // Start game with same configuration
    startMathProblems();
}

function goToStartRocket() {
    // Hide game end buttons and gameplay
    document.getElementById('game-end-buttons').style.display = 'none';
    document.getElementById('rocket-gameplay').style.display = 'none';
    
    // Reset no fuel state if it was set
    if (rocketGameState.noFuelBeforeStart) {
        rocketGameState.noFuelBeforeStart = false;
    }
    
    // Show settings
    document.querySelector('.game-settings').style.display = 'block';
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
    
    // Save configuration for retry
    lastGameConfig = {
        numProblems: rocketGameState.numProblems,
        numberRange: rocketGameState.numberRange,
        operators: [...rocketGameState.operators]
    };
    
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
        startCountdown();
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

function startCountdown() {
    // Hide math overlay
    document.getElementById('math-overlay').style.display = 'none';
    
    // Show countdown overlay
    const canvas = document.getElementById('rocket-canvas');
    const ctx = canvas.getContext('2d');
    
    let count = 3;
    
    function showCount() {
        // Redraw the scene
        drawMathScene();
        
        // Draw countdown text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(canvas.width / 2 - 300, canvas.height / 2 - 200, 600, 400);
        ctx.strokeStyle = '#667eea';
        ctx.lineWidth = 8;
        ctx.strokeRect(canvas.width / 2 - 300, canvas.height / 2 - 200, 600, 400);
        
        if (count > 0) {
            ctx.fillStyle = '#667eea';
            ctx.font = 'bold 200px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(count, canvas.width / 2, canvas.height / 2 + 60);
        } else {
            ctx.fillStyle = '#4caf50';
            ctx.font = 'bold 120px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('LAUNCH! 🚀', canvas.width / 2, canvas.height / 2 + 40);
        }
        
        count--;
        
        if (count >= 0) {
            setTimeout(showCount, 1000);
        } else {
            setTimeout(startRocketGame, 500);
        }
    }
    
    showCount();
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
    // Calculate fuel based on correct answers BEFORE resetting
    const percentage = rocketGameState.correctAnswers / rocketGameState.numProblems;
    const earnedFuel = percentage * 100;
    
    // Check if fuel is zero before starting
    if (earnedFuel <= 0) {
        // Hide math overlay
        document.getElementById('math-overlay').style.display = 'none';
        
        // Show gameplay area to display the message on canvas
        document.getElementById('rocket-gameplay').style.display = 'block';
        
        // Set no fuel state
        rocketGameState.noFuelBeforeStart = true;
        rocketGameState.gameActive = false;
        
        // Draw the scene with the no fuel message
        const canvas = document.getElementById('rocket-canvas');
        const ctx = canvas.getContext('2d');
        
        // Load assets if needed
        if (!spaceAssets.loaded) {
            loadSpaceAssets().then(() => {
                drawMathScene();
                drawNoFuelBeforeStartMessage(ctx, canvas);
                // Show game end buttons
                document.getElementById('game-end-buttons').style.display = 'block';
            });
        } else {
            drawMathScene();
            drawNoFuelBeforeStartMessage(ctx, canvas);
            // Show game end buttons
            document.getElementById('game-end-buttons').style.display = 'block';
        }
        
        return;
    }
    
    // Reset rocket state
    resetRocketGame();
    
    // Preserve the earned fuel
    rocketGameState.fuel = earnedFuel;
    
    // Clear the canvas to remove LAUNCH text immediately
    const canvas = document.getElementById('rocket-canvas');
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
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

function resetRocketGame() {
    // Clear fuel out timer if it exists
    if (rocketGameState.fuelOutTimer) {
        clearTimeout(rocketGameState.fuelOutTimer);
    }
    
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
        fuelOut: false,
        onGround: true,
        orbits: 0,
        lastAngleToMoon: 0,
        angleCrossings: 0,
        fuelOutTime: null,
        fuelOutTimer: null,
        // Preserve game settings
        numProblems: rocketGameState.numProblems,
        numberRange: rocketGameState.numberRange,
        operators: rocketGameState.operators
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
    // Allow drawing even when gameActive is false but fuelOut is true (to show message)
    const shouldUpdatePhysics = rocketGameState.gameActive && !rocketGameState.fuelOut;
    
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
    
    // Only update physics if game is active and fuel hasn't run out
    if (shouldUpdatePhysics) {
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
    } else {
        rocketGameState.thrust = false;
    }
    
    // Check if fuel has run out during flight
    if (rocketGameState.fuel <= 0 && rocketGameState.fuelOutTime === null && !rocketGameState.landed && !rocketGameState.crashed && !rocketGameState.fuelOut && shouldUpdatePhysics) {
        // Record when fuel ran out and start 10-second timer
        rocketGameState.fuelOutTime = Date.now();
        rocketGameState.fuelOutTimer = setTimeout(() => {
            // End game after 10 seconds
            rocketGameState.gameActive = false;
            rocketGameState.fuelOut = true;
            // Show game end buttons
            document.getElementById('game-end-buttons').style.display = 'block';
        }, 10000);
    }
    
    // Only update physics if game is active and fuel hasn't run out
    if (shouldUpdatePhysics) {
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
    }
    
    // Draw everything (always draw, even when fuel is out or game ended)
    drawRocketGameScene(ctx, canvas, moonX, moonY, moonRadius, earthX, earthY, earthRadius);
    
    // Continue loop - keep drawing if fuel is out to show the message
    if (rocketGameState.gameActive && !rocketGameState.landed && !rocketGameState.crashed) {
        requestAnimationFrame(updateRocketGame);
    } else if (rocketGameState.fuelOut && !rocketGameState.landed && !rocketGameState.crashed) {
        // Continue drawing when fuel is out to show the message (one frame is enough)
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
            rocketGameState.fuelOut = false; // Override fuel out if crashed
            // Clear fuel out timer if running
            if (rocketGameState.fuelOutTimer) {
                clearTimeout(rocketGameState.fuelOutTimer);
                rocketGameState.fuelOutTimer = null;
            }
            // Delay showing game end buttons for 3 seconds to see explosion
            setTimeout(() => {
                document.getElementById('game-end-buttons').style.display = 'block';
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
            rocketGameState.fuelOut = false; // Override fuel out if crashed
            // Clear fuel out timer if running
            if (rocketGameState.fuelOutTimer) {
                clearTimeout(rocketGameState.fuelOutTimer);
                rocketGameState.fuelOutTimer = null;
            }
            // Delay showing game end buttons for 3 seconds to see explosion
            setTimeout(() => {
                document.getElementById('game-end-buttons').style.display = 'block';
            }, 3000);
        } else {
            // Successful landing on Moon!
            rocketGameState.landed = true;
            rocketGameState.gameActive = false;
            rocketGameState.fuelOut = false; // Override fuel out if landed
            rocketGameState.vx = 0;
            rocketGameState.vy = 0;
            // Clear fuel out timer if running
            if (rocketGameState.fuelOutTimer) {
                clearTimeout(rocketGameState.fuelOutTimer);
                rocketGameState.fuelOutTimer = null;
            }
            // Delay showing game end buttons for 1 second
            setTimeout(() => {
                document.getElementById('game-end-buttons').style.display = 'block';
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
    } else if (rocketGameState.fuelOut) {
        // Fuel out message
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        ctx.strokeStyle = '#ffa500';
        ctx.lineWidth = 8;
        ctx.strokeRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
        
        ctx.fillStyle = '#ffa500';
        ctx.font = 'bold 96px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛽ ' + t('fuelOutDuringFlight'), canvas.width / 2, canvas.height / 2 - 40);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 48px Arial';
        ctx.fillText(`${t('completedOrbits')} ${rocketGameState.orbits} ${t('orbitsText')}`, canvas.width / 2, canvas.height / 2 + 60);
    }
    
    // Draw no fuel before start message if applicable
    if (rocketGameState.noFuelBeforeStart) {
        drawNoFuelBeforeStartMessage(ctx, canvas);
    }
    
    ctx.textAlign = 'left';
}

function drawNoFuelBeforeStartMessage(ctx, canvas) {
    // No fuel before start message
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.fillRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
    ctx.strokeStyle = '#ff6666';
    ctx.lineWidth = 8;
    ctx.strokeRect(canvas.width / 2 - 600, canvas.height / 2 - 200, 1200, 400);
    
    ctx.fillStyle = '#ff6666';
    ctx.font = 'bold 96px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⛽ ' + t('noFuelBeforeStart'), canvas.width / 2, canvas.height / 2 - 40);
    
    ctx.fillStyle = 'white';
    ctx.font = 'bold 48px Arial';
    ctx.fillText(t('noFuelBeforeStartSubtext'), canvas.width / 2, canvas.height / 2 + 60);
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


// ============================
// GAME 5: POKEMON PATH
// ============================

const pokemonNames = [
    'Bulbasaur', 'Ivysaur', 'Venusaur', 'Charmander', 'Charmeleon', 'Charizard',
    'Squirtle', 'Wartortle', 'Blastoise', 'Caterpie', 'Metapod', 'Butterfree',
    'Weedle', 'Kakuna', 'Beedrill', 'Pidgey', 'Pidgeotto', 'Pidgeot',
    'Rattata', 'Raticate', 'Spearow', 'Fearow', 'Ekans', 'Arbok',
    'Pikachu', 'Raichu', 'Sandshrew', 'Sandslash', 'Nidoran♀', 'Nidorina',
    'Nidoqueen', 'Nidoran♂', 'Nidorino', 'Nidoking', 'Clefairy', 'Clefable',
    'Vulpix', 'Ninetales', 'Jigglypuff', 'Wigglytuff', 'Zubat', 'Golbat',
    'Oddish', 'Gloom', 'Vileplume', 'Paras', 'Parasect', 'Venonat', 'Venomoth',
    'Diglett', 'Dugtrio', 'Meowth', 'Persian', 'Psyduck', 'Golduck',
    'Mankey', 'Primeape', 'Growlithe', 'Arcanine', 'Poliwag', 'Poliwhirl',
    'Poliwrath', 'Abra', 'Kadabra', 'Alakazam', 'Machop', 'Machoke', 'Machamp',
    'Bellsprout', 'Weepinbell', 'Victreebel', 'Tentacool', 'Tentacruel',
    'Geodude', 'Graveler', 'Golem', 'Ponyta', 'Rapidash', 'Slowpoke', 'Slowbro',
    'Magnemite', 'Magneton', "Farfetch'd", 'Doduo', 'Dodrio', 'Seel', 'Dewgong',
    'Grimer', 'Muk', 'Shellder', 'Cloyster', 'Gastly', 'Haunter', 'Gengar',
    'Onix', 'Drowzee', 'Hypno', 'Krabby', 'Kingler', 'Voltorb', 'Electrode',
    'Exeggcute', 'Exeggutor', 'Cubone', 'Marowak', 'Hitmonlee', 'Hitmonchan',
    'Lickitung', 'Koffing', 'Weezing', 'Rhyhorn', 'Rhydon', 'Chansey', 'Tangela',
    'Kangaskhan', 'Horsea', 'Seadra', 'Goldeen', 'Seaking', 'Staryu', 'Starmie',
    'Mr. Mime', 'Scyther', 'Jynx', 'Electabuzz', 'Magmar', 'Pinsir', 'Tauros',
    'Magikarp', 'Gyarados', 'Lapras', 'Ditto', 'Eevee', 'Vaporeon', 'Jolteon',
    'Flareon', 'Porygon', 'Omanyte', 'Omastar', 'Kabuto', 'Kabutops',
    'Aerodactyl', 'Snorlax', 'Articuno', 'Zapdos', 'Moltres', 'Dratini',
    'Dragonair', 'Dragonite', 'Mewtwo', 'Mew'
];

// ===== Pokemon Portrait Generator =====

function hashString(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) h = (Math.imul(h, 33) ^ str.charCodeAt(i)) >>> 0;
    return h;
}

function makeRng(seed) {
    let s = seed >>> 0;
    return {
        next()      { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 0x100000000; },
        range(a, b) { return a + this.next() * (b - a); },
        int(a, b)   { return Math.floor(this.range(a, b)); },
        bool(p=0.5) { return this.next() < p; }
    };
}

const _portraitCache = {};

function getPokemonPortraitDataURL(name, size) {
    const key = `${name}@${size}`;
    if (!_portraitCache[key]) {
        const c = document.createElement('canvas');
        c.width = size; c.height = size;
        drawPokemonPortrait(c.getContext('2d'), name, 0, 0, size);
        _portraitCache[key] = c.toDataURL();
    }
    return _portraitCache[key];
}

function drawPokemonPortrait(ctx, name, x, y, size) {
    const rng = makeRng(hashString(name));

    // === Generate ALL params in fixed order (order determines determinism) ===
    const hue         = rng.range(0, 360);
    const sat         = rng.range(55, 85);
    const aHueOff     = rng.range(40, 320);
    const aSat        = rng.range(55, 80);
    const bodyType    = rng.int(0, 5);   // 0=round,1=tall,2=wide,3=pear,4=squat
    const earType     = rng.int(0, 6);   // 0=none,1=round,2=pointed,3=long,4=cat,5=floppy
    const hornType    = rng.int(0, 5);   // 0=none,1=single,2=double,3=antennae,4=crown
    const tailType    = rng.int(0, 6);   // 0=none,1=curl,2=zigzag,3=fan,4=ball-tip,5=curve
    const markType    = rng.int(0, 4);   // 0=none,1=belly,2=stripes,3=spots
    const eyeStyle    = rng.int(0, 4);   // 0=round,1=oval,2=half-closed,3=X
    const eyeSpF      = rng.range(0.45, 0.70);
    const eyeYOff     = rng.range(-0.18, 0.08);
    const eyeRF       = rng.range(0.22, 0.36);
    const mouthType   = rng.int(0, 4);
    const hasNose     = rng.bool(0.5);
    const noseType    = rng.int(0, 3);
    const hasBlush    = rng.bool(0.42);
    const hasWings    = rng.bool(0.18);
    const hasMane     = rng.bool(0.20);
    const stripeCount = rng.int(2, 5);
    const stripeAngle = rng.range(-0.3, 0.3);
    const spotCount   = rng.int(3, 7);
    const spots       = Array.from({length: 7}, () => ({
        fx: rng.range(-0.7, 0.7), fy: rng.range(-0.7, 0.7), fr: rng.range(0.055, 0.12)
    }));

    // === Colors ===
    const aHue = (hue + aHueOff) % 360;
    const C = {
        body:     `hsl(${hue},${sat}%,62%)`,
        bodyDk:   `hsl(${hue},${sat - 5}%,35%)`,
        bodyLt:   `hsl(${hue},${sat - 20}%,84%)`,
        belly:    `hsl(${hue},${sat - 25}%,90%)`,
        accent:   `hsl(${aHue},${aSat}%,56%)`,
        accentDk: `hsl(${aHue},${aSat}%,30%)`,
        bg:       `hsl(${hue},${Math.max(sat - 35, 20)}%,94%)`,
    };

    // === Layout ===
    const cx  = x + size * 0.5;
    const cy  = y + size * 0.62;
    const r   = size * 0.22;
    const [bw, bh] = [[r,r],[r*0.8,r*1.22],[r*1.2,r*0.82],[r*0.9,r*1.12],[r*1.1,r*0.8]][bodyType];
    const headR = r * 0.65;
    const headY = cy - bh * 0.82 - headR * 0.5;

    // --- Background circle ---
    ctx.fillStyle = C.bg;
    ctx.beginPath();
    ctx.arc(cx, y + size * 0.5, size * 0.46, 0, Math.PI * 2);
    ctx.fill();

    // --- Wings (behind body) ---
    if (hasWings) {
        [-1, 1].forEach(s => {
            ctx.fillStyle = C.accent; ctx.strokeStyle = C.accentDk; ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(cx + s * bw * 0.7, cy - bh * 0.2);
            ctx.bezierCurveTo(cx + s * bw * 1.6, cy - bh * 0.7, cx + s * bw * 1.7, cy + bh * 0.2, cx + s * bw * 0.8, cy + bh * 0.25);
            ctx.closePath(); ctx.fill(); ctx.stroke();
        });
    }

    // --- Mane (behind head) ---
    if (hasMane) {
        ctx.fillStyle = C.accent;
        for (let m = 0; m < 6; m++) {
            const ang = (m / 6) * Math.PI * 2;
            ctx.beginPath();
            ctx.arc(cx + Math.cos(ang) * headR * 0.92, headY + Math.sin(ang) * headR * 0.72, headR * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    // --- Tail ---
    if (tailType > 0) {
        const tx = cx + bw * 0.88, ty = cy + bh * 0.22;
        ctx.lineWidth = size * 0.048; ctx.lineCap = 'round';
        switch (tailType) {
            case 1: ctx.strokeStyle = C.body; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.bezierCurveTo(tx+size*0.26, ty+size*0.02, tx+size*0.30, ty-size*0.28, tx+size*0.14, ty-size*0.34); ctx.stroke(); break;
            case 2: ctx.strokeStyle = C.accent; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.lineTo(tx+size*0.10,ty-size*0.14); ctx.lineTo(tx+size*0.20,ty-size*0.06); ctx.lineTo(tx+size*0.13,ty-size*0.28); ctx.lineTo(tx+size*0.23,ty-size*0.22); ctx.stroke(); break;
            case 3: ctx.fillStyle = C.accent; ctx.beginPath(); ctx.moveTo(tx,ty); [[size*0.09,-size*0.22],[size*0.19,-size*0.10],[size*0.16,-size*0.32],[size*0.28,-size*0.18]].forEach(([dx,dy])=>ctx.lineTo(tx+dx,ty+dy)); ctx.closePath(); ctx.fill(); break;
            case 4: ctx.strokeStyle = C.body; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+size*0.20,ty-size*0.12,tx+size*0.15,ty-size*0.28); ctx.stroke(); ctx.fillStyle = C.accent; ctx.beginPath(); ctx.arc(tx+size*0.15,ty-size*0.31,size*0.065,0,Math.PI*2); ctx.fill(); break;
            case 5: ctx.strokeStyle = C.body; ctx.beginPath(); ctx.moveTo(tx,ty); ctx.quadraticCurveTo(tx+size*0.18,ty-size*0.18,tx+size*0.10,ty-size*0.36); ctx.stroke(); break;
        }
    }

    // --- Body ---
    ctx.fillStyle = C.body; ctx.strokeStyle = C.bodyDk; ctx.lineWidth = size * 0.025;
    ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // --- Body markings ---
    if (markType === 1) {
        ctx.fillStyle = C.belly; ctx.beginPath(); ctx.ellipse(cx, cy + bh * 0.1, bw * 0.55, bh * 0.62, 0, 0, Math.PI * 2); ctx.fill();
    } else if (markType === 2) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = C.bodyDk; ctx.lineWidth = size * 0.022;
        for (let s = 0; s < stripeCount; s++) {
            const sy = cy - bh + bh * 2 / (stripeCount - 1) * s;
            ctx.beginPath(); ctx.moveTo(cx - bw * 1.5, sy - Math.tan(stripeAngle) * bw * 1.5); ctx.lineTo(cx + bw * 1.5, sy + Math.tan(stripeAngle) * bw * 1.5); ctx.stroke();
        }
        ctx.restore();
    } else if (markType === 3) {
        ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cy, bw, bh, 0, 0, Math.PI * 2); ctx.clip();
        ctx.fillStyle = C.accent;
        spots.slice(0, spotCount).forEach(sp => { ctx.beginPath(); ctx.arc(cx + sp.fx * bw, cy + sp.fy * bh, sp.fr * size, 0, Math.PI * 2); ctx.fill(); });
        ctx.restore();
    }

    // --- Head ---
    ctx.fillStyle = C.body; ctx.strokeStyle = C.bodyDk; ctx.lineWidth = size * 0.022;
    ctx.beginPath(); ctx.arc(cx, headY, headR, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // --- Eyes ---
    const eyeSp = headR * eyeSpF;
    const eyeY  = headY + eyeYOff * headR;
    const eyeR  = headR * eyeRF;
    [-1, 1].forEach(s => {
        const ex = cx + s * eyeSp;
        if (eyeStyle === 3) {
            ctx.strokeStyle = '#222'; ctx.lineWidth = Math.max(1.5, size * 0.018); ctx.lineCap = 'round';
            ctx.beginPath(); ctx.moveTo(ex - eyeR*0.55, eyeY - eyeR*0.55); ctx.lineTo(ex + eyeR*0.55, eyeY + eyeR*0.55);
            ctx.moveTo(ex + eyeR*0.55, eyeY - eyeR*0.55); ctx.lineTo(ex - eyeR*0.55, eyeY + eyeR*0.55); ctx.stroke();
        } else {
            ctx.fillStyle = 'white'; ctx.beginPath();
            eyeStyle === 2 ? ctx.arc(ex, eyeY + eyeR * 0.35, eyeR, Math.PI, 0) : ctx.arc(ex, eyeY, eyeR, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#111827'; ctx.beginPath(); ctx.arc(ex + s * eyeR * 0.15, eyeY + eyeR * 0.08, eyeR * 0.58, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(ex + s * eyeR * 0.05 - eyeR * 0.2, eyeY - eyeR * 0.22, eyeR * 0.22, 0, Math.PI * 2); ctx.fill();
        }
    });

    // --- Blush ---
    if (hasBlush) {
        ctx.fillStyle = `hsl(${hue + 30},80%,72%)`; ctx.globalAlpha = 0.45;
        [-1, 1].forEach(s => { ctx.beginPath(); ctx.ellipse(cx + s * eyeSp * 1.15, eyeY + eyeR * 1.3, eyeR * 0.72, eyeR * 0.42, 0, 0, Math.PI * 2); ctx.fill(); });
        ctx.globalAlpha = 1;
    }

    // --- Nose ---
    if (hasNose) {
        const ny = (eyeY + headY + headR * 0.62) * 0.5;
        ctx.fillStyle = C.bodyDk;
        if (noseType < 2) { ctx.beginPath(); ctx.arc(cx, ny, headR * 0.055, 0, Math.PI * 2); ctx.fill(); }
        else { [-1,1].forEach(s => { ctx.beginPath(); ctx.arc(cx + s * headR * 0.09, ny, headR * 0.04, 0, Math.PI * 2); ctx.fill(); }); }
    }

    // --- Mouth ---
    const my = headY + headR * 0.44;
    ctx.strokeStyle = C.bodyDk; ctx.lineWidth = Math.max(1.2, size * 0.02); ctx.lineCap = 'round';
    switch (mouthType) {
        case 0: ctx.beginPath(); ctx.arc(cx, my, headR * 0.18, 0.15, Math.PI - 0.15); ctx.stroke(); break;
        case 1: ctx.fillStyle = C.bodyDk; ctx.beginPath(); ctx.arc(cx, my, headR * 0.07, 0, Math.PI * 2); ctx.fill(); break;
        case 2: ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(cx, my, headR * 0.17, 0.1, Math.PI - 0.1); ctx.fill(); ctx.strokeStyle = C.bodyDk; ctx.beginPath(); ctx.arc(cx, my, headR * 0.17, 0.1, Math.PI - 0.1); ctx.stroke(); break;
        case 3: ctx.beginPath(); ctx.moveTo(cx - headR * 0.15, my); ctx.lineTo(cx + headR * 0.15, my); ctx.stroke(); break;
    }

    // --- Ears ---
    const earBaseY = headY - headR * 0.55;
    if (earType > 0) {
        switch (earType) {
            case 1: [-1,1].forEach(s => { ctx.fillStyle=C.body; ctx.strokeStyle=C.bodyDk; ctx.lineWidth=size*0.02; ctx.beginPath(); ctx.arc(cx+s*headR*0.65,earBaseY,headR*0.3,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle=C.accent; ctx.beginPath(); ctx.arc(cx+s*headR*0.65,earBaseY,headR*0.18,0,Math.PI*2); ctx.fill(); }); break;
            case 2: [-1,1].forEach(s => { ctx.fillStyle=C.body; ctx.strokeStyle=C.bodyDk; ctx.lineWidth=size*0.02; ctx.beginPath(); ctx.moveTo(cx+s*headR*0.50,earBaseY+headR*0.12); ctx.lineTo(cx+s*headR*0.85,earBaseY-headR*0.58); ctx.lineTo(cx+s*headR*0.25,earBaseY-headR*0.08); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle=C.accent; ctx.beginPath(); ctx.moveTo(cx+s*headR*0.50,earBaseY+headR*0.05); ctx.lineTo(cx+s*headR*0.78,earBaseY-headR*0.46); ctx.lineTo(cx+s*headR*0.32,earBaseY-headR*0.02); ctx.closePath(); ctx.fill(); }); break;
            case 3: [-1,1].forEach(s => { ctx.fillStyle=C.body; ctx.strokeStyle=C.bodyDk; ctx.lineWidth=size*0.02; ctx.beginPath(); ctx.ellipse(cx+s*headR*0.42,earBaseY-headR*0.55,headR*0.2,headR*0.52,s*0.18,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle=C.accent; ctx.beginPath(); ctx.ellipse(cx+s*headR*0.42,earBaseY-headR*0.55,headR*0.1,headR*0.36,s*0.18,0,Math.PI*2); ctx.fill(); }); break;
            case 4: [-1,1].forEach(s => { ctx.fillStyle=C.body; ctx.strokeStyle=C.bodyDk; ctx.lineWidth=size*0.02; ctx.beginPath(); ctx.moveTo(cx+s*headR*0.35,earBaseY+headR*0.05); ctx.lineTo(cx+s*headR*0.72,earBaseY-headR*0.52); ctx.lineTo(cx+s*headR*0.75,earBaseY+headR*0.05); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle=C.accent; ctx.beginPath(); ctx.moveTo(cx+s*headR*0.42,earBaseY); ctx.lineTo(cx+s*headR*0.67,earBaseY-headR*0.4); ctx.lineTo(cx+s*headR*0.68,earBaseY); ctx.closePath(); ctx.fill(); }); break;
            case 5: [-1,1].forEach(s => { ctx.fillStyle=C.body; ctx.strokeStyle=C.bodyDk; ctx.lineWidth=size*0.02; ctx.beginPath(); ctx.moveTo(cx+s*headR*0.50,earBaseY+headR*0.10); ctx.bezierCurveTo(cx+s*headR*0.90,earBaseY,cx+s*headR*0.92,earBaseY+headR*0.65,cx+s*headR*0.62,earBaseY+headR*0.62); ctx.bezierCurveTo(cx+s*headR*0.40,earBaseY+headR*0.60,cx+s*headR*0.38,earBaseY+headR*0.22,cx+s*headR*0.50,earBaseY+headR*0.10); ctx.closePath(); ctx.fill(); ctx.stroke(); }); break;
        }
    }

    // --- Horns / crown ---
    if (hornType > 0) {
        ctx.fillStyle = C.accent; ctx.strokeStyle = C.accentDk; ctx.lineWidth = size * 0.018; ctx.lineCap = 'round';
        switch (hornType) {
            case 1: ctx.beginPath(); ctx.moveTo(cx-headR*0.11,headY-headR*0.68); ctx.lineTo(cx+headR*0.11,headY-headR*0.68); ctx.lineTo(cx,headY-headR*1.22); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            case 2: [-1,1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx+s*headR*0.22-headR*0.09,headY-headR*0.65); ctx.lineTo(cx+s*headR*0.22+headR*0.09,headY-headR*0.65); ctx.lineTo(cx+s*headR*0.30,headY-headR*1.10); ctx.closePath(); ctx.fill(); ctx.stroke(); }); break;
            case 3: ctx.strokeStyle=C.body; ctx.lineWidth=size*0.03; [-1,1].forEach(s => { ctx.beginPath(); ctx.moveTo(cx+s*headR*0.25,headY-headR*0.72); ctx.quadraticCurveTo(cx+s*headR*0.55,headY-headR*1.15,cx+s*headR*0.48,headY-headR*1.34); ctx.stroke(); ctx.fillStyle=C.accent; ctx.beginPath(); ctx.arc(cx+s*headR*0.48,headY-headR*1.36,headR*0.10,0,Math.PI*2); ctx.fill(); }); break;
            case 4: {
                const pts = [-0.38,-0.14,0,0.14,0.38], hts = [0.58,0.42,0.72,0.42,0.58];
                ctx.beginPath(); ctx.moveTo(cx-headR*0.44,headY-headR*0.68);
                pts.forEach((xf,i) => { ctx.lineTo(cx+xf*headR,headY-headR*(0.68+hts[i])); if(i<pts.length-1) ctx.lineTo(cx+(xf+pts[i+1])*headR*0.5,headY-headR*0.68); });
                ctx.lineTo(cx+headR*0.44,headY-headR*0.68); ctx.closePath(); ctx.fill(); ctx.stroke(); break;
            }
        }
    }
}

let pokepathState = {
    gridSize: 15,
    cellSize: 40,
    playerPos: { x: 0, y: 0 },
    pokeballPos: { x: 0, y: 0 },
    obstacles: [],
    steps: 0,
    optimalSteps: 0,
    collectedCount: 0,
    caughtPokemon: [],
    currentPokemon: null,
    isAnimating: false
};

function initPokepathGame() {
    document.getElementById('new-pokepath-game').addEventListener('click', startPokepathGame);

    document.addEventListener('keydown', (e) => {
        if (currentGame === 'pokepath' && !pokepathState.isAnimating &&
            ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
             'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
            e.preventDefault();
            const keyMap = { w: 'ArrowUp', W: 'ArrowUp', s: 'ArrowDown', S: 'ArrowDown',
                             a: 'ArrowLeft', A: 'ArrowLeft', d: 'ArrowRight', D: 'ArrowRight' };
            movePokepathPlayer(keyMap[e.key] || e.key);
        }
    });

    // Touch/swipe support
    const canvas = document.getElementById('pokepath-canvas');
    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        e.preventDefault();
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
        if (pokepathState.isAnimating) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        if (Math.abs(dx) < 15 && Math.abs(dy) < 15) return;
        if (Math.abs(dx) > Math.abs(dy)) {
            movePokepathPlayer(dx > 0 ? 'ArrowRight' : 'ArrowLeft');
        } else {
            movePokepathPlayer(dy > 0 ? 'ArrowDown' : 'ArrowUp');
        }
        e.preventDefault();
    }, { passive: false });

    startPokepathGame();
}

function startPokepathGame() {
    pokepathState.steps = 0;
    pokepathState.playerPos = { x: 0, y: 0 };
    pokepathState.collectedCount = 0;
    pokepathState.caughtPokemon = [];
    pokepathState.isAnimating = false;

    document.getElementById('pokepath-reveal').style.display = 'none';

    // Generate obstacles (avoid starting position)
    pokepathState.obstacles = [];
    for (let i = 0; i < 30; i++) {
        const x = Math.floor(Math.random() * pokepathState.gridSize);
        const y = Math.floor(Math.random() * pokepathState.gridSize);
        if ((x !== 0 || y !== 0) &&
            !pokepathState.obstacles.some(obs => obs.x === x && obs.y === y)) {
            pokepathState.obstacles.push({ x, y, type: Math.random() > 0.5 ? 'tree' : 'bush' });
        }
    }

    placePokePathBall();
    pokepathState.optimalSteps = calculatePokePathOptimal();
    updatePokepathUI();
    drawPokepathGame();
}

function placePokePathBall() {
    pokepathState.currentPokemon = pokemonNames[Math.floor(Math.random() * pokemonNames.length)];
    do {
        pokepathState.pokeballPos = {
            x: Math.floor(Math.random() * pokepathState.gridSize),
            y: Math.floor(Math.random() * pokepathState.gridSize)
        };
    } while (
        (pokepathState.pokeballPos.x === pokepathState.playerPos.x &&
         pokepathState.pokeballPos.y === pokepathState.playerPos.y) ||
        pokepathState.obstacles.some(obs =>
            obs.x === pokepathState.pokeballPos.x && obs.y === pokepathState.pokeballPos.y)
    );
}

function calculatePokePathOptimal() {
    const { playerPos, pokeballPos, obstacles, gridSize } = pokepathState;
    const queue = [{ x: playerPos.x, y: playerPos.y, dist: 0 }];
    const visited = new Set();
    visited.add(`${playerPos.x},${playerPos.y}`);

    while (queue.length > 0) {
        const current = queue.shift();
        if (current.x === pokeballPos.x && current.y === pokeballPos.y) {
            return current.dist;
        }
        const dirs = [{ dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: -1, dy: 0 }, { dx: 1, dy: 0 }];
        for (const dir of dirs) {
            const nx = current.x + dir.dx;
            const ny = current.y + dir.dy;
            const key = `${nx},${ny}`;
            if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize &&
                !visited.has(key) &&
                !obstacles.some(obs => obs.x === nx && obs.y === ny)) {
                visited.add(key);
                queue.push({ x: nx, y: ny, dist: current.dist + 1 });
            }
        }
    }
    return 0;
}

function movePokepathPlayer(direction) {
    if (pokepathState.isAnimating) return;

    let { x, y } = pokepathState.playerPos;
    switch (direction) {
        case 'ArrowUp':    y--; break;
        case 'ArrowDown':  y++; break;
        case 'ArrowLeft':  x--; break;
        case 'ArrowRight': x++; break;
    }

    if (x < 0 || x >= pokepathState.gridSize || y < 0 || y >= pokepathState.gridSize) return;
    if (pokepathState.obstacles.some(obs => obs.x === x && obs.y === y)) return;

    pokepathState.playerPos = { x, y };
    pokepathState.steps++;

    if (x === pokepathState.pokeballPos.x && y === pokepathState.pokeballPos.y) {
        collectPokePathBall();
    }

    updatePokepathUI();
    drawPokepathGame();
}

function collectPokePathBall() {
    pokepathState.collectedCount++;
    pokepathState.isAnimating = true;

    const pokemon = pokepathState.currentPokemon;
    pokepathState.caughtPokemon.push(pokemon);

    const performance = pokepathState.steps / pokepathState.optimalSteps;
    let stars = 0;
    if (performance <= 1.0) stars = 3;
    else if (performance <= 1.2) stars = 2;
    else if (performance <= 1.4) stars = 1;

    // Update reveal panel elements
    document.getElementById('pokepath-reveal-stars').textContent = '⭐'.repeat(stars);
    document.getElementById('pokepath-reveal-name').textContent = pokemon;

    const pCanvas = document.getElementById('pokepath-portrait');
    const pCtx = pCanvas.getContext('2d');
    pCtx.clearRect(0, 0, 150, 150);
    drawPokemonPortrait(pCtx, pokemon, 0, 0, 150);

    const reveal = document.getElementById('pokepath-reveal');
    reveal.style.display = 'block';

    function dismissReveal() {
        clearTimeout(revealTimer);
        reveal.removeEventListener('click', dismissReveal);
        document.removeEventListener('keydown', onKeyDismiss);
        reveal.style.display = 'none';
        pokepathState.steps = 0;
        placePokePathBall();
        pokepathState.optimalSteps = calculatePokePathOptimal();
        pokepathState.isAnimating = false;
        updatePokepathUI();
        drawPokepathGame();
    }

    function onKeyDismiss(e) {
        if (e.key === ' ' || e.key === 'Enter') {
            e.preventDefault();
            dismissReveal();
        }
    }

    reveal.addEventListener('click', dismissReveal);
    document.addEventListener('keydown', onKeyDismiss);
    const revealTimer = setTimeout(dismissReveal, 30000);
}

function updatePokepathUI() {
    document.getElementById('pokepath-steps').textContent = pokepathState.steps;
    document.getElementById('pokepath-count').textContent = `⚾ ×${pokepathState.collectedCount}`;

    const pokedex = document.getElementById('pokepath-pokedex');
    if (pokepathState.caughtPokemon.length === 0) {
        pokedex.style.display = 'none';
        return;
    }
    pokedex.style.display = 'block';
    pokedex.innerHTML = '';

    const counts = {};
    pokepathState.caughtPokemon.forEach(p => counts[p] = (counts[p] || 0) + 1);

    const title = document.createElement('div');
    title.className = 'pokedex-title';
    title.textContent = `📖 Pokédex (${pokepathState.caughtPokemon.length} caught)`;
    pokedex.appendChild(title);

    const grid = document.createElement('div');
    grid.className = 'pokedex-grid';
    Object.entries(counts).forEach(([name, count]) => {
        const badge = document.createElement('div');
        badge.className = 'pokemon-badge';
        const img = document.createElement('img');
        img.src = getPokemonPortraitDataURL(name, 56);
        img.width = 56; img.height = 56;
        const label = document.createElement('span');
        label.textContent = name + (count > 1 ? ` ×${count}` : '');
        badge.appendChild(img);
        badge.appendChild(label);
        grid.appendChild(badge);
    });
    pokedex.appendChild(grid);
}

function drawPokepathGame() {
    const canvas = document.getElementById('pokepath-canvas');
    const ctx = canvas.getContext('2d');
    const { gridSize, cellSize, playerPos, pokeballPos, obstacles } = pokepathState;

    // Pokemon-style grass background (checkerboard)
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            ctx.fillStyle = (row + col) % 2 === 0 ? '#78c850' : '#68b840';
            ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }

    // Draw obstacles
    obstacles.forEach(obs => {
        if (obs.type === 'tree') {
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(obs.x * cellSize + 15, obs.y * cellSize + 22, 10, 14);
            ctx.fillStyle = '#228b22';
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 20, obs.y * cellSize + 16, 12, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillStyle = '#2d5016';
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 20, obs.y * cellSize + 22, 13, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#3a6b1e';
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 14, obs.y * cellSize + 18, 9, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(obs.x * cellSize + 26, obs.y * cellSize + 18, 9, 0, Math.PI * 2);
            ctx.fill();
        }
    });

    // Draw pokeball
    drawPokepathBall(ctx, pokeballPos.x * cellSize + 20, pokeballPos.y * cellSize + 20, 14);

    // Draw trainer player
    drawPokepathTrainer(ctx, playerPos.x * cellSize + 20, playerPos.y * cellSize + 20);
}

function drawPokepathBall(ctx, cx, cy, r) {
    // Red top half
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.arc(cx, cy, r, Math.PI, 0);
    ctx.fill();

    // White bottom half
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI);
    ctx.fill();

    // Outer ring
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    // Dividing line
    ctx.beginPath();
    ctx.moveTo(cx - r, cy);
    ctx.lineTo(cx + r, cy);
    ctx.stroke();

    // Center button outer ring
    ctx.fillStyle = '#ecf0f1';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Center button inner
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.16, 0, Math.PI * 2);
    ctx.fill();
}

function drawPokepathTrainer(ctx, cx, cy) {
    // Body (blue shirt)
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(cx - 7, cy + 5, 14, 13);

    // Head (skin tone)
    ctx.fillStyle = '#f5cba7';
    ctx.beginPath();
    ctx.arc(cx, cy - 1, 8, 0, Math.PI * 2);
    ctx.fill();

    // Cap (red, upper half)
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 9, Math.PI, 0);
    ctx.fill();

    // Cap brim
    ctx.fillRect(cx - 11, cy - 3, 22, 4);

    // Eyes
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(cx - 3, cy + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 3, cy + 1, 1.5, 0, Math.PI * 2);
    ctx.fill();
}
