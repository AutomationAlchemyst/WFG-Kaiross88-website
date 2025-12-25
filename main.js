// --- Global Variables for Inter-component sync ---
let scrollVelocity = 0;
let mouseX = 0, mouseY = 0;
let lenis;
let audioContext, oscillator, gainNode;
let highDrone, highGain;
let isAudioStarted = false;

// --- Setup Core ---
document.addEventListener('DOMContentLoaded', () => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    initPreloader();
    initLenis();
    initBlueprint();
    initGlitch();
    initHeroReveal();
    initScrollAnimations();
    initHolographicTilt();
    initCustomCursor();
    initMobileGravity();
    initAudio();
    initVibeDemo();
    initWorkshopStack();
    initVisualAssetUX();
    initMagneticButtons();
    initNarrativeMotion();
    initMobileMenu();
});

// --- Dynamic Blueprint Theme Switcher ---
function setBlueprintTheme(color) {
    if (window.updateBlueprintColor) {
        window.updateBlueprintColor(color);
    }
}

// --- Lenis Smooth Scroll ---
function initLenis() {
    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false,
    });

    lenis.on('scroll', ({ velocity }) => {
        scrollVelocity = velocity;
    });

    function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);
}

// --- Living Blueprint (3D Grid) ---
function initBlueprint() {
    const canvas = document.getElementById('blueprint-canvas');
    if (!canvas) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Grid System
    const size = 100;
    const divisions = 50;
    const gridColor = 0x333333; // Initial grid color

    const floor = new THREE.GridHelper(100, 50, gridColor, gridColor);
    floor.position.y = -5;
    floor.material.transparent = true;
    floor.material.opacity = 0.2;
    scene.add(floor);

    // Expose color update function
    window.updateBlueprintColor = (newColor) => {
        gsap.to(floor.material.color, {
            r: new THREE.Color(newColor).r,
            g: new THREE.Color(newColor).g,
            b: new THREE.Color(newColor).b,
            duration: 1
        });
    };

    camera.position.z = 5;
    camera.position.y = 1;

    // Animation Loop
    let targetX = 0, targetY = 0;
    let gridTilt = 0;
    let gyroX = 0, gyroY = 0;

    window.addEventListener('mousemove', (e) => {
        if (window.matchMedia("(pointer: fine)").matches) {
            targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
            targetY = (e.clientY / window.innerHeight - 0.5) * 0.5;
        }
    });

    // Mobile Gravity (Gyroscope)
    window.addEventListener('deviceorientation', (e) => {
        if (!e.beta || !e.gamma) return;
        gyroX = e.gamma * 0.01; // Left/Right tilt
        gyroY = (e.beta - 45) * 0.01; // Top/Bottom tilt (centered around 45deg)
    });

    function animate() {
        requestAnimationFrame(animate);

        // Smooth camera movement
        // Merge Mouse + Gyro
        const finalTargetX = targetX + gyroX * 2; // Increased sensitivity
        const finalTargetY = targetY + gyroY * 2;

        camera.position.x += (finalTargetX - camera.position.x) * 0.05;
        camera.position.y += (finalTargetY * -1 - camera.position.y + 1) * 0.05;

        // --- AWWWWards Polish: Grid Warping ---
        // Modulate grid tilt/rotation based on scroll velocity
        const velocityEffect = Math.min(Math.abs(scrollVelocity) * 0.01, 0.2);
        floor.rotation.x = -Math.PI / 2 + (scrollVelocity * 0.005);

        // Scale grid slightly on fast scroll
        const scaleEffect = 1 + velocityEffect;
        floor.scale.set(scaleEffect, scaleEffect, scaleEffect);

        // Apply gyro to cards globally if on mobile
        if (Math.abs(gyroX) > 0.1 || Math.abs(gyroY) > 0.1) {
            // Apply only to cards NOT in the workshop, as they are controlled by GSAP
            const cards = document.querySelectorAll('.holographic-card:not(.workshop-track .holographic-card)');
            cards.forEach(card => {
                const rotateX = gyroY * 20;
                const rotateY = gyroX * -20;
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
            });
        }

        camera.lookAt(0, 0, 0);

        // Suble grid pulse + velocity intensity
        floor.material.opacity = (0.2 + velocityEffect) + Math.sin(Date.now() * 0.001) * 0.1;
        floor.material.transparent = true;

        renderer.render(scene, camera);
    }

    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Theme Switcher Logic (Dual Core Atmosphere)
    window.setBlueprintTheme = (colorHex) => {
        gsap.to(floor.material.color, {
            r: new THREE.Color(colorHex).r,
            g: new THREE.Color(colorHex).g,
            b: new THREE.Color(colorHex).b,
            duration: 1.5,
            ease: "power2.inOut"
        });
    };
}

// --- Custom Cursor ---
function initCustomCursor() {
    const cursor = document.getElementById('custom-cursor');
    const dot = cursor.querySelector('.cursor-dot');
    const inner = cursor.querySelector('.cursor-inner');
    const reveal = cursor.querySelector('.cursor-reveal');
    const revealLayer = document.querySelector('.code-reveal-layer'); // Keep for glitch effect

    let mouseX = 0, mouseY = 0;
    let cursorX = 0, cursorY = 0;
    let innerX = 0, innerY = 0;

    document.addEventListener('mousemove', (e) => {
        if (!window.matchMedia("(pointer: fine)").matches) return;
        mouseX = e.clientX;
        mouseY = e.clientY;
        // Update mask constant for CSS
        document.documentElement.style.setProperty('--cursor-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--cursor-y', `${e.clientY}px`);
    });

    gsap.ticker.add(() => {
        const dt = 1.0 - Math.pow(1.0 - 0.2, gsap.ticker.deltaRatio());
        const dtInner = 1.0 - Math.pow(1.0 - 0.1, gsap.ticker.deltaRatio());

        cursorX += (mouseX - cursorX) * dt;
        cursorY += (mouseY - cursorY) * dt;
        innerX += (mouseX - innerX) * dtInner;
        innerY += (mouseY - innerY) * dtInner;

        cursor.style.transform = `translate3d(${cursorX - 16}px, ${cursorY - 16}px, 0)`; // Adjust for cursor size
        inner.style.transform = `translate3d(${innerX - cursorX}px, ${innerY - cursorY}px, 0)`;
    });

    // Unified Hover Logic
    const interactiveElements = document.querySelectorAll('a, button, .holographic-card, .frenzy-glitch, .reveal-trigger, .glowing-border-container, .workshop-horizontal-container');

    interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', () => {
            cursor.classList.add('hovering');
            playHapticClick(); // Retain haptic feedback

            // Contextual labeling
            if (el.classList.contains('workshop-horizontal-container') || el.closest('.workshop-horizontal-container')) {
                cursor.classList.add('hovering-drag');
                reveal.innerText = 'DRAG';
            } else if (el.classList.contains('frenzy-glitch') || el.classList.contains('reveal-trigger')) {
                cursor.classList.add('hovering-glitch'); // Keep glitch specific class
                reveal.innerText = '<view_source />'; // Specific text for glitch/reveal
                // Find associated reveal layer
                const container = el.closest('section') || el.parentElement;
                const sectionLayer = container.querySelector('.code-reveal-layer');
                if (sectionLayer) {
                    sectionLayer.style.opacity = '1';
                    sectionLayer.classList.remove('pointer-events-none');
                    playGlitchSound();
                }
            } else if (el.tagName === 'IMG' || el.querySelector('img')) {
                reveal.innerText = '<magic />';
                playSuccessChime(); // Use a very soft version or a pulse
            } else {
                // Default tags for other interactive elements
                const tag = el.getAttribute('data-cursor-tag') || (el.tagName === 'A' ? 'LINK' : 'ACTION');
                reveal.innerText = `<${tag} />`;
            }

            gsap.to(reveal, { opacity: 1, y: 30, duration: 0.3 });
        });

        el.addEventListener('mouseleave', () => {
            cursor.classList.remove('hovering', 'hovering-drag', 'hovering-view', 'hovering-glitch'); // Remove all hover classes
            gsap.to(reveal, { opacity: 0, y: 10, duration: 0.2 });

            // Hide all reveal layers in the container
            const container = el.closest('section') || el.parentElement;
            const sectionLayers = container.querySelectorAll('.code-reveal-layer');
            sectionLayers.forEach(layer => {
                layer.style.opacity = '0';
                layer.classList.add('pointer-events-none');
            });
        });
    });

    document.addEventListener('mousedown', () => {
        cursor.classList.add('clicking');
        playHapticClick(true); // Retain deep haptic click
    });
    document.addEventListener('mouseup', () => cursor.classList.remove('clicking'));
}

// --- Ambient Soundscape ---
function initAudio() {
    const toggle = document.getElementById('audio-toggle');
    const visualizer = document.querySelector('.fixed.bottom-8.right-8');

    toggle.addEventListener('click', () => {
        if (!isAudioStarted) {
            startAudio();
            toggle.innerText = '[ SOUND ON ]';
            visualizer.classList.add('playing');
        } else {
            stopAudio();
            toggle.innerText = '[ SOUND OFF ]';
            visualizer.classList.remove('playing');
        }
        isAudioStarted = !isAudioStarted;
    });
}

function startAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();

    // Low drone
    oscillator = audioContext.createOscillator();
    gainNode = audioContext.createGain();

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(40, audioContext.currentTime); // 40Hz drone

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.05, audioContext.currentTime + 2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();

    // High crystalline drone
    highDrone = audioContext.createOscillator();
    highGain = audioContext.createGain();

    highDrone.type = 'sine';
    highDrone.frequency.setValueAtTime(880, audioContext.currentTime); // 880Hz high layer

    highGain.gain.setValueAtTime(0, audioContext.currentTime);
    highGain.gain.linearRampToValueAtTime(0.01, audioContext.currentTime + 5); // Very subtle

    highDrone.connect(highGain);
    highGain.connect(audioContext.destination);

    highDrone.start();

    // Scroll Whoosh Listener
    if (lenis) {
        let lastWhooshTime = 0;
        lenis.on('scroll', (e) => {
            const now = Date.now();
            if (Math.abs(e.velocity) > 5 && now - lastWhooshTime > 500) {
                playScrollWhoosh(e.velocity);
                lastWhooshTime = now;
            }
        });
    }
}

function playScrollWhoosh(velocity) {
    if (!isAudioStarted || !audioContext) return;

    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'brown'; // Brown noise for deep whoosh
    // brown noise is not native to AudioContext, we use white noise and filter it or just use an oscillator
    // Let's use a low-pass white noise approximation with a triangle oscillator
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(100, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(400, audioContext.currentTime + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioContext.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.3);

    g.gain.setValueAtTime(0, audioContext.currentTime);
    g.gain.linearRampToValueAtTime(0.03, audioContext.currentTime + 0.1);
    g.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.5);

    osc.connect(filter);
    filter.connect(g);
    g.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.5);
}

function stopAudio() {
    if (gainNode) {
        gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
        setTimeout(() => oscillator.stop(), 1000);
    }
    if (highGain) {
        highGain.gain.linearRampToValueAtTime(0, audioContext.currentTime + 1);
        setTimeout(() => highDrone.stop(), 1000);
    }
}

function playHapticClick(isDeep = false) {
    if (!isAudioStarted || !audioContext) return;

    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(isDeep ? 150 : 800, audioContext.currentTime);
    osc.frequency.exponentialRampToValueAtTime(isDeep ? 40 : 100, audioContext.currentTime + 0.1);

    g.gain.setValueAtTime(0.02, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.1);

    osc.connect(g);
    g.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.1);
}

function playSuccessChime() {
    if (!isAudioStarted || !audioContext) return;

    const t = audioContext.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

    notes.forEach((freq, i) => {
        const osc = audioContext.createOscillator();
        const g = audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + i * 0.05);

        g.gain.setValueAtTime(0, t + i * 0.05);
        g.gain.linearRampToValueAtTime(0.01, t + i * 0.05 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.05 + 0.3);

        osc.connect(g);
        g.connect(audioContext.destination);

        osc.start(t + i * 0.05);
        osc.stop(t + i * 0.05 + 0.3);
    });
}

function playGlitchSound() {
    if (!isAudioStarted || !audioContext) return;

    const osc = audioContext.createOscillator();
    const g = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    osc.type = 'square';
    osc.frequency.setValueAtTime(Math.random() * 200 + 100, audioContext.currentTime);
    osc.frequency.linearRampToValueAtTime(Math.random() * 1000 + 500, audioContext.currentTime + 0.1);

    filter.type = 'bandpass';
    filter.frequency.value = 800;
    filter.Q.value = 10;

    g.gain.setValueAtTime(0.01, audioContext.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.15);

    osc.connect(filter);
    filter.connect(g);
    g.connect(audioContext.destination);

    osc.start();
    osc.stop(audioContext.currentTime + 0.15);
}

// --- Mobile Gravity (Gyroscope) Init ---
function initMobileGravity() {
    // Request permission for iOS 13+
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const btn = document.createElement('button');
        btn.innerText = 'Enable Gyroscope';
        btn.className = 'fixed top-4 right-4 z-[10001] bg-white text-black px-4 py-2 text-xs md:hidden';
        btn.onclick = () => {
            DeviceOrientationEvent.requestPermission()
                .then(response => {
                    if (response == 'granted') {
                        btn.remove();
                    }
                })
                .catch(console.error);
        };
        document.body.appendChild(btn);
    }
}

// --- Frenzy Glitch ---
function initGlitch() {
    const glitches = document.querySelectorAll('.frenzy-glitch');
    glitches.forEach(el => {
        el.setAttribute('data-text', el.innerText);
    });
}

// --- Scroll Animations ---
function initScrollAnimations() {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.config({ ignoreMobileResize: true });

    // Kinetic Marquee
    const marquee = document.getElementById('kinetic-marquee');
    if (marquee) {
        gsap.to(marquee.querySelectorAll('span'), {
            xPercent: -100,
            repeat: -1,
            duration: 20,
            ease: "none",
        });
    }

    // Typography Physics (Velocity Skew with Spring Effect)
    if (lenis) {
        let skewSetter = gsap.quickSetter(".kinetic-text span", "skewX", "deg");
        let proxy = { skew: 0 };

        lenis.on('scroll', (e) => {
            let skew = Math.min(Math.abs(e.velocity) * 2, 20);
            let dir = e.velocity > 0 ? -1 : 1;

            gsap.to(proxy, {
                skew: skew * dir,
                duration: 0.5,
                ease: "power2.out",
                overwrite: true,
                onUpdate: () => skewSetter(proxy.skew)
            });

            // Return to 0
            if (Math.abs(e.velocity) < 0.1) {
                gsap.to(proxy, {
                    skew: 0,
                    duration: 0.8,
                    ease: "elastic.out(1, 0.3)",
                    overwrite: true,
                    onUpdate: () => skewSetter(proxy.skew)
                });
            }
        });
    }

    // Fade in sections
    gsap.utils.toArray('section').forEach(section => {
        gsap.from(section, {
            opacity: 0,
            y: 50,
            duration: 1,
            scrollTrigger: {
                trigger: section,
                start: "top 80%",
                toggleActions: "play none none reverse"
            }
        });
    });
}

// --- Horizontal Scroll & Storytelling for Workshop ---
function initHorizontalWorkshop() {
    const track = document.querySelector('.workshop-track');
    const container = document.querySelector('.workshop-horizontal-container');
    const workshopSection = document.querySelector('#workshop');
    if (!track || !container || !workshopSection) return;

    if (window.innerWidth < 1024) {
        initMobileWorkshopTimeline();
        return;
    }

    const scrollWidth = track.scrollWidth - container.offsetWidth;

    // Main horizontal scroll timeline
    const mainTl = gsap.timeline({
        scrollTrigger: {
            trigger: workshopSection,
            start: "top top",
            end: () => `+=${scrollWidth + 2000}`, // Longer for layered effects
            scrub: 1,
            pin: true,
            anticipatePin: 1,
            invalidateOnRefresh: true,
        }
    });

    // 1. Horizontal Move
    mainTl.to(track, {
        x: () => -scrollWidth,
        ease: "none"
    });

    // 2. Layered "Zoom" Transitions for individual cards
    const cards = track.querySelectorAll('.holographic-card');
    cards.forEach((card, i) => {
        // As each card passes the center, add a scale/3D effect
        mainTl.to(card, {
            scale: 1.1,
            z: 50,
            duration: 0.1,
            ease: "power2.inOut"
        }, (i / cards.length) * 0.8) // Simplified stagger over the total duration
            .to(card, {
                scale: 1,
                z: 0,
                duration: 0.1,
                ease: "power2.inOut"
            }, ((i + 1) / cards.length) * 0.8);
    });

    // 3. Background Storytelling Shift
    mainTl.to(workshopSection, {
        backgroundColor: "#0a0a0a",
        duration: 1,
        ease: "none"
    }, 0);
}





// --- Vibe Coding Interactive Demo ---

// --- Workshop Stack (Vertical Pin) ---
// --- Workshop Vertical Timeline (Clean & Reliable) ---
function initWorkshopStack() {
    const cards = gsap.utils.toArray('.workshop-track .holographic-card');

    if (cards.length === 0) return;

    // Dynamic "Roll In" Animation (User Requested)
    ScrollTrigger.batch(cards, {
        onEnter: (batch) => {
            gsap.fromTo(batch,
                { opacity: 0, x: -60, rotationY: 30, scale: 0.9 },
                {
                    opacity: 1,
                    x: 0,
                    rotationY: 0,
                    scale: 1,
                    stagger: 0.2,
                    duration: 1.2,
                    ease: "power3.out",
                    overwrite: true
                }
            );
        },
        start: "top 85%",
        once: true
    });

    // Ensure initial state is hidden slightly
    gsap.set(cards, {
        opacity: 0,
        y: 50
    });
}

function initVibeDemo() {
    const input = document.getElementById('vibe-input');
    const card = document.getElementById('vibe-preview-card');
    const asset = document.getElementById('vibe-asset');
    const title = document.getElementById('vibe-title');
    const desc = document.getElementById('vibe-desc');
    const glow = document.getElementById('vibe-glow');

    if (!input) return;

    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.toLowerCase();
            processVibeCommand(cmd);
            input.value = '';
            playHapticClick(true);
        }
    });

    function processVibeCommand(cmd) {
        // Simulated terminal logs
        const logs = [
            `> Analyzing intent: "${cmd}"...`,
            `> Mapping structural tokens...`,
            `> Injecting aesthetic parameters...`,
            `> Syncing atmosphere...`
        ];

        let logIndex = 0;
        const logLine = document.createElement('div');
        logLine.className = 'text-accent-blue/30 italic mb-1';
        desc.parentElement.insertBefore(logLine, desc);

        const interval = setInterval(() => {
            logLine.innerText = logs[logIndex];
            logIndex++;
            if (logIndex >= logs.length) {
                clearInterval(interval);
                applyVisualChanges(cmd);
                setTimeout(() => logLine.remove(), 2000);
            }
        }, 150);
    }

    function applyVisualChanges(cmd) {
        const tl = gsap.timeline({
            defaults: { duration: 0.8, ease: "power2.inOut" }
        });

        // Initial pop/shake for feedback
        tl.to(card, { scale: 0.98, duration: 0.1 })
            .to(card, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.3)" });

        // Fade out current asset
        tl.to(asset, { y: -20, opacity: 0, duration: 0.3 }, 0);

        // Background / Glow Shift
        let newGlow = 'transparent';
        let newAsset = asset.innerText;
        let newTitle = title.innerText;
        let newDesc = desc.innerText;

        if (cmd.includes('orange') || cmd.includes('sunset')) {
            newGlow = 'rgba(255, 107, 0, 0.4)';
            newAsset = '🔥';
            newTitle = 'Sunset Vibe';
            newDesc = 'SYSTEM: Atmospheric synchronization complete. Orange spectrum active.';
        } else if (cmd.includes('blue') || cmd.includes('cyan') || cmd.includes('cyber')) {
            newGlow = 'rgba(0, 240, 255, 0.4)';
            newAsset = '💎';
            newTitle = 'Deep Cyber Vibe';
            newDesc = 'SYSTEM: Cooling protocols initiated. Cyan luminance at 80%.';
        } else if (cmd.includes('neon') || cmd.includes('glow') || cmd.includes('green')) {
            newGlow = 'rgba(0, 255, 127, 0.4)';
            newAsset = '🟢';
            newTitle = 'Neon Surge';
            newDesc = 'SYSTEM: Overclocking visual buffers. Maximum neon output.';
        } else if (cmd.includes('retro') || cmd.includes('80s')) {
            newGlow = 'rgba(255, 0, 255, 0.3)';
            newAsset = '🕹️';
            newTitle = 'Synthwave Era';
            newDesc = 'SYSTEM: Legacy aesthetic restored. VHS grain simulated.';
        } else if (cmd.includes('future') || cmd.includes('clean') || cmd.includes('minimal')) {
            newAsset = '▫️';
            newTitle = 'Architectural Zen';
            newDesc = 'SYSTEM: Stripping redundant layers. Pure form achieved.';
            tl.to(card, { backgroundColor: 'rgba(255,255,255,0.02)' }, 0);
        }

        tl.to(glow, { backgroundColor: newGlow }, 0.2);

        // Update content and fade in
        tl.add(() => {
            asset.innerText = newAsset;
            title.innerText = newTitle;
            desc.innerText = newDesc;
        });

        tl.fromTo(asset, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "back.out(1.7)" });

        // Layout shifts
        if (cmd.includes('left')) {
            tl.add(() => {
                card.classList.remove('items-center', 'text-center', 'items-end', 'text-right');
                card.classList.add('items-start', 'text-left');
            });
        } else if (cmd.includes('right')) {
            tl.add(() => {
                card.classList.remove('items-center', 'text-center', 'items-start', 'text-left');
                card.classList.add('items-end', 'text-right');
            });
        } else if (cmd.includes('center')) {
            tl.add(() => {
                card.classList.add('items-center', 'text-center');
                card.classList.remove('items-start', 'text-left', 'items-end', 'text-right');
            });
        }

        // Scale shifts
        if (cmd.includes('big') || cmd.includes('large')) {
            tl.to(asset, { scale: 1.5 }, "-=0.3");
        } else if (cmd.includes('small') || cmd.includes('tiny')) {
            tl.to(asset, { scale: 0.5 }, "-=0.3");
        } else {
            tl.to(asset, { scale: 1 }, "-=0.3");
        }

        playSuccessChime();
    }
}

// --- Holographic Tilt ---
function initHolographicTilt() {
    const cards = document.querySelectorAll('.holographic-card');

    cards.forEach(card => {
        card.addEventListener('mousemove', (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const centerX = rect.width / 2;
            const centerY = rect.height / 2;

            const rotateX = (y - centerY) / 10;
            const rotateY = (centerX - x) / 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;

            // --- Glassmorphism 2.0: Directional Shine (Awwwards Polish) ---
            const angle = Math.atan2(y - centerY, x - centerX) * (180 / Math.PI) + 90;
            card.style.setProperty('--angle', `${angle}deg`);
            card.style.setProperty('--shine-opacity', '1');

            // Glare update
            const glare = card.querySelector('.card-glare');
            if (glare) {
                glare.style.setProperty('--x', `${x}px`);
                glare.style.setProperty('--y', `${y}px`);
            }
        });

        card.addEventListener('mouseleave', () => {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
            card.style.setProperty('--shine-opacity', '0');
        });
    });
}
// --- Visual Asset UX Effects ---
function initVisualAssetUX() {
    // 1. Hero Focus Reveal
    const heroVisual = document.getElementById('hero-visual');
    if (heroVisual) {
        ScrollTrigger.create({
            trigger: "#hero",
            start: "top 20%",
            onEnter: () => heroVisual.classList.add('focused'),
            once: true
        });
    }

    // 2. Parallax Glow & Mouse Tracking for Borders
    window.addEventListener('mousemove', (e) => {
        if (!window.matchMedia("(pointer: fine)").matches) return;
        const xPercent = (e.clientX / window.innerWidth - 0.5) * 2;
        const yPercent = (e.clientY / window.innerHeight - 0.5) * 2;

        // Hero Parallax
        const glow1 = document.getElementById('hero-glow-1');
        const glow2 = document.getElementById('hero-glow-2');
        if (glow1) {
            gsap.to(glow1, {
                x: xPercent * 50,
                y: yPercent * 50,
                duration: 1,
                ease: "power2.out"
            });
        }
        if (glow2) {
            gsap.to(glow2, {
                x: xPercent * -30,
                y: yPercent * -30,
                duration: 1.2,
                ease: "power2.out"
            });
        }

        // Glowing Border Tracking
        const containers = document.querySelectorAll('.glowing-border-container');
        containers.forEach(container => {
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            container.style.setProperty('--mouse-x', `${x}px`);
            container.style.setProperty('--mouse-y', `${y}px`);
        });
    });
}

// --- Hero Reveal Logic (Custom SplitText implementation) ---
function initHeroReveal() {
    const heroTitle = document.querySelector('#hero h1');
    if (!heroTitle) return;

    // Preserve the glitch spans but split their text content
    const splitContent = (el) => {
        const text = el.innerText;
        el.innerHTML = text.split('').map(char =>
            char === ' ' ? '&nbsp;' : `<span class="char inline-block translate-y-full opacity-0">${char}</span>`
        ).join('');
    };

    // Target the specific spans for splitting to keep the layout
    const glitchSpans = heroTitle.querySelectorAll('.frenzy-glitch');
    glitchSpans.forEach(span => splitContent(span));

    // Also wrap the entire lines in overflow-hidden containers for the "mask" effect
    const h1Lines = heroTitle.innerHTML.split('<br>');
    heroTitle.innerHTML = h1Lines.map(line => `<div class="overflow-hidden mb-2">${line}</div>`).join('');
}

function animateHero() {
    const tl = gsap.timeline({
        defaults: { ease: "expo.out", duration: 1.2 }
    });

    tl.to("#hero h1 .char", {
        y: 0,
        opacity: 1,
        stagger: 0.02,
        duration: 0.8,
        ease: "back.out(1.7)"
    }, "+=0.2")
        .from("#hero p", {
            y: 30,
            opacity: 0,
            duration: 1
        }, "-=0.6")
        .from("#hero .flex.flex-wrap", {
            y: 20,
            opacity: 0,
            stagger: 0.2
        }, "-=0.8");
}

// Update initPreloader to trigger hero animation
function initPreloader() {
    const preloader = document.getElementById('preloader');
    const counter = document.getElementById('preloader-counter');
    const logs = [
        document.getElementById('preloader-log-1'),
        document.getElementById('preloader-log-2'),
        document.getElementById('preloader-log-3')
    ];

    if (!preloader || !counter) return;

    let count = 0;
    const duration = 2000; // 2 seconds
    const interval = 20;
    const increment = (88 / (duration / interval));

    const updateCounter = setInterval(() => {
        count += increment;
        if (count >= 88) {
            count = 88;
            clearInterval(updateCounter);

            // Log reveal sequence
            setTimeout(() => gsap.to(logs[1], { opacity: 1, duration: 0.1 }), 200);
            setTimeout(() => gsap.to(logs[2], { opacity: 1, duration: 0.1 }), 400);

            // Exit preloader
            setTimeout(() => {
                gsap.to(preloader, {
                    yPercent: -100,
                    duration: 1.5,
                    ease: "power4.inOut",
                    onComplete: () => {
                        preloader.style.display = 'none';
                        // Force hero focus reveal if needed
                        const heroVisual = document.getElementById('hero-visual');
                        if (heroVisual) heroVisual.classList.add('focused');

                        // TRIGGER HERO ANIMATION
                        animateHero();
                    }
                });
            }, 800);
        }
        counter.innerText = Math.floor(count).toString().padStart(2, '0');
    }, interval);
}


// --- Magnetic Buttons ---
function initMagneticButtons() {
    // 3-Layer Hero Parallax
    gsap.to('#hero-visual', {
        yPercent: 20,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            start: 'top top',
            end: 'bottom top',
            scrub: true
        }
    });

    gsap.to('#hero-glow-1', {
        yPercent: -30,
        xPercent: 10,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            scrub: 1
        }
    });

    gsap.to('#hero-glow-2', {
        yPercent: -50,
        xPercent: -20,
        ease: 'none',
        scrollTrigger: {
            trigger: '#hero',
            scrub: 2
        }
    });

    // Kinetic Distortion REMOVED (User request) & Warp Speed logic
    ScrollTrigger.create({
        onUpdate: (self) => {
            // Sync with three.js background for "Warp" effect
            const velocity = Math.abs(self.getVelocity());
            if (window.backgroundParticles) {
                // Accelerate rotation based on velocity
                window.backgroundParticles.rotation.z += velocity * 0.00005;

                // Shift colors based on warp intensity
                const colorFactor = gsap.utils.clamp(0, 1, velocity / 2000);
                window.backgroundParticles.material.color.lerpColors(
                    new THREE.Color(0x00F0FF),
                    new THREE.Color(0xFF6B00),
                    colorFactor
                );
            }
        }
    });
    // Select major interactive elements, explicitly excluding workshop cards which are controlled by GSAP
    const buttons = document.querySelectorAll('a, button, .glowing-border-container, .holographic-card:not(.workshop-track .holographic-card)');

    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const cursorInner = document.querySelector('.cursor-inner'); // Fix ReferenceError
            const rect = btn.getBoundingClientRect();

            // Calculate distance from center
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;

            const dx = e.clientX - centerX;
            const dy = e.clientY - centerY;

            // Determine distance
            const distance = Math.sqrt(dx * dx + dy * dy);
            const radius = Math.max(rect.width, rect.height) * 1.5;

            if (distance < radius) {
                // Pull strength increases closer to center
                const strength = 0.35;
                const pullX = dx * strength;
                const pullY = dy * strength;

                // Tactile tilt: Tilt towards the cursor
                const rotateX = -dy * 0.15;
                const rotateY = dx * 0.15;

                gsap.to(btn, {
                    x: pullX,
                    y: pullY,
                    rotateX: rotateX,
                    rotateY: rotateY,
                    duration: 0.6,
                    ease: "power2.out"
                });

                // Elastic pulse on the cursor inner when entering button
                if (cursorInner && !btn.hasAttribute('data-hovered')) {
                    btn.setAttribute('data-hovered', 'true');
                    gsap.fromTo(cursorInner,
                        { scale: 1 },
                        { scale: 1.5, duration: 0.4, ease: "elastic.out(1.2, 0.4)" }
                    );
                }
            }
        });

        btn.addEventListener('mouseleave', () => {
            btn.removeAttribute('data-hovered');
            gsap.to(btn, {
                x: 0,
                y: 0,
                rotateX: 0,
                rotateY: 0,
                duration: 1, // Reduced duration for snap
                ease: "elastic.out(1.2, 0.4)" // PHYSICS JIGGLE
            });

            const cursorInner = document.querySelector('.cursor-inner');
            if (cursorInner) {
                gsap.to(cursorInner, {
                    x: 0,
                    y: 0,
                    scale: 1,
                    duration: 0.6,
                    ease: "elastic.out(1, 0.3)"
                });
            }
        });
    });
}

// --- Narrative Motion ---
function initNarrativeMotion() {
    // 1. Image Clip-Path Reveals
    const clipImages = document.querySelectorAll('.glowing-border-container img, .hero-image-wrap img, .holographic-card img');
    clipImages.forEach(img => {
        img.classList.add('clip-reveal');

        // Add active class immediately if already in view
        if (img.getBoundingClientRect().top < window.innerHeight) {
            img.classList.add('active');
        }

        ScrollTrigger.create({
            trigger: img,
            start: "top 85%",
            onEnter: () => {
                gsap.to(img, {
                    clipPath: 'polygon(0 0, 100% 0, 100% 100%, 0 100%)',
                    duration: 1.5,
                    ease: "expo.inOut"
                });
                gsap.from(img, {
                    scale: 1.2,
                    duration: 2,
                    ease: "expo.out"
                });
            },
            once: true
        });
    });

    // 2. Staggered Text Reveals (Preserving Children like Glitch spans)
    const headings = document.querySelectorAll('h1, h2, .text-3xl:not(.frenzy-glitch)');
    headings.forEach(h => {
        // Skip if already processed or has complex children we don't want to break
        if (h.classList.contains('motion-init')) return;

        const contents = Array.from(h.childNodes);
        h.innerHTML = '';
        h.classList.add('motion-init');

        contents.forEach(node => {
            if (node.nodeType === Node.TEXT_NODE && node.textContent.trim().length > 0) {
                const words = node.textContent.trim().split(/\s+/);
                words.forEach(word => {
                    const wordSpan = document.createElement('span');
                    wordSpan.className = 'char-reveal';

                    const innerSpan = document.createElement('span');
                    innerSpan.style.display = 'inline-block';
                    innerSpan.innerText = word + '\u00A0';

                    wordSpan.appendChild(innerSpan);
                    h.appendChild(wordSpan);

                    gsap.from(innerSpan, {
                        yPercent: 100,
                        duration: 1.2,
                        ease: "power4.out",
                        scrollTrigger: {
                            trigger: h,
                            start: "top 95%",
                        },
                        delay: Math.random() * 0.3
                    });
                });
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                // Wrap existing elements in char-reveal if they are inline
                const wrap = document.createElement('span');
                wrap.className = 'char-reveal';
                wrap.appendChild(node.cloneNode(true));
                h.appendChild(wrap);

                // Keep spacing
                h.appendChild(document.createTextNode('\u00A0'));

                gsap.from(wrap.firstChild, {
                    yPercent: 100,
                    duration: 1.2,
                    ease: "power4.out",
                    scrollTrigger: {
                        trigger: h,
                        start: "top 95%",
                    }
                });
            }
        });
    });
}

// --- Mobile Menu Logic ---
function initMobileMenu() {
    const btn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('mobile-menu-overlay');
    const closeBtn = document.getElementById('mobile-menu-close');
    const links = document.querySelectorAll('.mobile-link');

    if (!btn || !overlay || !closeBtn) return;

    const toggleMenu = (show) => {
        if (show) {
            overlay.classList.remove('translate-x-full');
            if (lenis) lenis.stop(); // Stop scroll
        } else {
            overlay.classList.add('translate-x-full');
            if (lenis) lenis.start(); // Resume scroll
        }
    };

    btn.addEventListener('click', () => toggleMenu(true));
    closeBtn.addEventListener('click', () => toggleMenu(false));

    links.forEach(link => {
        link.addEventListener('click', () => toggleMenu(false));
    });
}
