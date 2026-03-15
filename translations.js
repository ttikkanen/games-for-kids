// Translations for English and Finnish
const translations = {
    en: {
        appTitle: "Kids Games",
        gameRocket: "🚀 Rocket Scientist",
        gamePath: "🍎 Shortest Path",
        gameDraw: "🎨 Drawing",
        gameTower: "🏗️ Tower Builder",
        gamePokepath: "⚾ Pokemon Path",
        numProblems: "Number of Problems:",
        numberRange: "Number Range:",
        operators: "Operators:",
        start: "Start",
        submit: "Submit",
        question: "Question",
        steps: "Steps:",
        newGame: "New Game",
        color: "Color:",
        brushSize: "Brush Size:",
        tool: "Tool:",
        brush: "Brush",
        eraser: "Eraser",
        clear: "Clear",
        cube: "Cube",
        circle: "Circle",
        triangle: "Triangle",
        reset: "Reset",
        height: "Height:",
        units: "units",
        correct: "Correct! 🎉",
        wrong: "Try again! 🤔",
        great: "Great job! 🌟",
        rocketLaunching: "Rocket is launching! 🚀",
        wellDone: "Well done!",
        stars: "stars",
        collectFruit: "Collect the fruit! 🍎",
        useArrows: "Use arrow keys to move",
        gameOver: "Game Over!",
        controls: "Controls:",
        thrust: "Thrust (use fuel)",
        rotateLeft: "Rotate Left",
        rotateRight: "Rotate Right",
        objective: "Objective: Orbit the Moon and land on it! Bonus points for orbits! 🌍 → 🌙",
        startFlight: "Start Flight",
        landed: "Safe Landing!",
        crashed: "Crashed!",
        orbits: "Orbits:",
        speed: "Speed:",
        angle: "Angle:",
        fuel: "FUEL",
        completedOrbits: "Completed",
        orbitsText: "orbits",
        score: "Score:",
        noFuelBeforeStart: "NO FUEL, Please try again",
        noFuelBeforeStartSubtext: "Please try again!",
        fuelOutDuringFlight: "Fuel has run out!",
        retry: "Retry",
        goToStart: "Go to start",
        numProblems: "Number of Problems:",
        numberRange: "Number Range:",
        operators: "Operators:",
        question: "Question",
        submit: "Submit",
        correct: "Correct! 🎉",
        wrong: "Try again! 🤔"
    },
    fi: {
        appTitle: "Lasten Pelit",
        gameRocket: "🚀 Kuulento",
        gamePath: "🍎 Lyhin Reitti",
        gameDraw: "🎨 Piirtäminen",
        gameTower: "🏗️ Tornin Rakentaja",
        gamePokepath: "⚾ Pokemon Polku",
        numProblems: "Tehtävien Määrä:",
        numberRange: "Numeroiden Väli:",
        operators: "Laskutoimitukset:",
        start: "Aloita",
        submit: "Lähetä",
        question: "Kysymys",
        steps: "Askeleet:",
        newGame: "Uusi Peli",
        color: "Väri:",
        brushSize: "Sivellin Koko:",
        tool: "Työkalu:",
        brush: "Sivellin",
        eraser: "Pyyhekumi",
        clear: "Tyhjennä",
        cube: "Kuutio",
        circle: "Ympyrä",
        triangle: "Kolmio",
        reset: "Nollaa",
        height: "Korkeus:",
        units: "yksikköä",
        correct: "Oikein! 🎉",
        wrong: "Yritä uudelleen! 🤔",
        great: "Hienoa! 🌟",
        rocketLaunching: "Raketti lähtee! 🚀",
        wellDone: "Hyvin tehty!",
        stars: "tähteä",
        collectFruit: "Kerää hedelmä! 🍎",
        useArrows: "Käytä nuolinäppäimiä liikkumiseen",
        gameOver: "Peli Ohi!",
        controls: "Ohjaus:",
        thrust: "Työntövoima (käyttää polttoainetta)",
        rotateLeft: "Käänny vasemmalle",
        rotateRight: "Käänny oikealle",
        objective: "Tavoite: Kierrä kuuta ja laskeudu siihen! Bonuspisteitä kierroksista! 🌍 → 🌙",
        startFlight: "Aloita lento",
        landed: "Turvallinen laskeutuminen!",
        crashed: "Törmäys!",
        orbits: "Kierrokset:",
        speed: "Nopeus:",
        angle: "Kulma:",
        fuel: "POLTTOAINE",
        completedOrbits: "Suoritettu",
        orbitsText: "kierrosta",
        score: "Pisteet:",
        noFuelBeforeStart: "EI POLTTOAINETTA, Yritä uudelleen",
        noFuelBeforeStartSubtext: "Yritä uudelleen!",
        fuelOutDuringFlight: "Polttoaine loppui!",
        retry: "Yritä uudelleen",
        goToStart: "Alkuun",
        numProblems: "Tehtävien Määrä:",
        numberRange: "Numeroiden Väli:",
        operators: "Laskutoimitukset:",
        question: "Kysymys",
        submit: "Lähetä",
        correct: "Oikein! 🎉",
        wrong: "Yritä uudelleen! 🤔"
    }
};

// Current language
let currentLang = 'en';

// Function to update all translatable elements
function updateLanguage(lang) {
    currentLang = lang;
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'BUTTON' || el.tagName === 'OPTION') {
                if (el.hasAttribute('placeholder')) {
                    el.placeholder = translations[lang][key];
                } else {
                    // For buttons and options, update text content but preserve emoji if present
                    const emoji = el.textContent.match(/[\u{1F300}-\u{1F9FF}]/u);
                    el.textContent = translations[lang][key];
                }
            } else {
                el.textContent = translations[lang][key];
            }
        }
    });

    // Update active language button
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
    });

    // Store preference
    localStorage.setItem('preferredLanguage', lang);
}

// Get translated text
function t(key) {
    return translations[currentLang][key] || key;
}

