// ============================================================
// ART OF FARCASTER - VIEWER SCRIPT v1.0
// Full animation + live intensity for iframe display
// ============================================================

(function() {
    // ============================================================
    // ANIMATION CONFIG - Adjust these values
    // ============================================================
    const ANIMATION_CONFIG = {
        // Speed controls
        BREATHING_SPEED: 0.002,      // How fast the pulse moves
        HUE_DRIFT_SPEED: 0.0008,     // How fast colors shift
        GLITCH_SPEED: 0.01,          // Glitch frequency
        WAVE_SPEED: 0.003,           // Distortion wave speed
        
        // Strength controls (0 = off, 1 = max)
        PULSE_STRENGTH: 0.5,         // Breathing brightness effect
        HUE_DRIFT_STRENGTH: 0.4,     // Color shifting intensity
        GLITCH_STRENGTH: 0.3,        // Glitch intensity
        DISTORTION_STRENGTH: 0.6,    // Wave/ripple intensity
        ZOOM_STRENGTH: 0.08,         // Subtle zoom breathing
        
        // Toggle effects
        ENABLE_BREATHING: true,
        ENABLE_HUE_DRIFT: true,
        ENABLE_GLITCH: true,
        ENABLE_DISTORTION: true,
        ENABLE_ZOOM_BREATHING: true,
        ENABLE_NOISE: true,
        
        // Noise strength (film grain)
        NOISE_STRENGTH: 0.05
    };

    const PHASES = { CALM: 0, BUILDUP: 1, CHAOS: 2, DECAY: 3 };
    const LOG2 = Math.log(2);
    
    const RARITY_CLASSES = {
        COMMON: "Common",
        UNCOMMON: "Uncommon",
        RARE: "Rare",
        MYTHIC: "Mythic",
        GRAIL: "Grail"
    };
    
    const ARCHETYPES = ["Signal", "Drift", "Rift", "Core", "Prism", "Void"];
    const ANCHOR_FORMS = ["Aether", "PrismHeart", "Faultline", "Gate", "Nexus", "Bloom"];

    // ============================================================
    // LIVE INTENSITY API
    // ============================================================
    let liveIntensity = 0.5;
    
    async function fetchLiveIntensity() {
        try {
            const response = await fetch('intensity.json?t=' + Date.now());
            if (response.ok) {
                const data = await response.json();
                if (typeof data.intensity === 'number' && !isNaN(data.intensity)) {
                    liveIntensity = Math.max(0.05, Math.min(0.95, data.intensity));
                    console.log('🎨 Live intensity:', liveIntensity);
                }
            }
        } catch (e) {
            // Silent fail - use default
        }
    }

    // ============================================================
    // GET TOKEN DATA FROM URL
    // ============================================================
    function getTokenData() {
        const params = new URLSearchParams(window.location.search);
        return {
            tokenId: params.get('tokenId') || params.get('tid') || '1',
            txHash: params.get('txHash') || params.get('h') || '0x0'
        };
    }

    // ============================================================
    // DETERMINISTIC HELPERS
    // ============================================================
    function getSeed(tokenId, txHash) {
        let hash = 2166136261;
        const str = txHash + '_' + tokenId;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        return hash >>> 0;
    }

    function makeSeededRand(seed) {
        let state = seed >>> 0;
        return function() {
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            state = (state ^ (state >>> 11)) >>> 0;
            return (state >>> 0) / 0xffffffff;
        };
    }

    function deterministicTime(tokenId, masterSeed, intensity) {
        const tokenNum = parseInt(tokenId, 10) || 0;
        return ((tokenNum * 0.0123456789) + (masterSeed * 0.0000001) + (intensity * 0.1)) % 1.0;
    }

    function getDeterministicPhase(masterSeed, intensity) {
        return Math.floor((masterSeed + intensity * 10000)) % 4;
    }

    // ============================================================
    // ANIMATION VALUES (updated each frame)
    // ============================================================
    let timeOffset = 0;
    let startTime = null;
    let animatedPulse = 0.7;
    let animatedHueShift = 0;
    let animatedGlitchX = 0;
    let animatedGlitchY = 0;
    let animatedZoom = 1.0;
    let animatedWavePhase = 0;
    let noiseSeed = 0;

    function updateAnimatedValues(now) {
        // Breathing pulse
        if (ANIMATION_CONFIG.ENABLE_BREATHING) {
            animatedPulse = 0.6 + Math.sin(now * ANIMATION_CONFIG.BREATHING_SPEED) * ANIMATION_CONFIG.PULSE_STRENGTH;
        } else {
            animatedPulse = 1.0;
        }
        
        // Hue drift
        if (ANIMATION_CONFIG.ENABLE_HUE_DRIFT) {
            animatedHueShift = Math.sin(now * ANIMATION_CONFIG.HUE_DRIFT_SPEED) * 360 * ANIMATION_CONFIG.HUE_DRIFT_STRENGTH;
        }
        
        // Glitch offset
        if (ANIMATION_CONFIG.ENABLE_GLITCH) {
            animatedGlitchX = Math.sin(now * ANIMATION_CONFIG.GLITCH_SPEED) * ANIMATION_CONFIG.GLITCH_STRENGTH * 6;
            animatedGlitchY = Math.cos(now * ANIMATION_CONFIG.GLITCH_SPEED * 1.3) * ANIMATION_CONFIG.GLITCH_STRENGTH * 4;
        }
        
        // Zoom breathing
        if (ANIMATION_CONFIG.ENABLE_ZOOM_BREATHING) {
            animatedZoom = 1.0 + Math.sin(now * 0.0008) * ANIMATION_CONFIG.ZOOM_STRENGTH;
        }
        
        // Wave phase
        animatedWavePhase = (animatedWavePhase + ANIMATION_CONFIG.WAVE_SPEED) % (Math.PI * 2);
        
        // Noise seed
        noiseSeed = (noiseSeed + 0.02) % 1000;
    }

    // ============================================================
    // FRACTAL ENGINES
    // ============================================================
    function novaFractalCalc(x0, y0, maxIter) {
        let x = x0, y = y0;
        let iter = 0;
        for (iter = 0; iter < maxIter; iter++) {
            const x2 = x * x, y2 = y * y;
            if (x2 + y2 > 4.0) break;
            const xt = x2 - y2 + x0;
            y = 2.0 * x * y + y0;
            x = xt;
        }
        let smooth;
        if (iter < maxIter) {
            const mag2 = x * x + y * y;
            const safeMag2 = Math.max(mag2, 1e-10);
            const logZn = Math.log(safeMag2) * 0.5;
            const nu = Math.log(logZn / LOG2) / LOG2;
            smooth = (iter + 1 - nu) / maxIter;
        } else {
            smooth = 1.0;
        }
        return Math.max(0.02, Math.min(0.98, smooth));
    }

    function getDepthFractalValue(x, y, maxIter, phase, progression) {
        let depth = 0;
        for (let i = 0; i < 3; i++) {
            const scale = 1 + i * 0.15;
            depth += novaFractalCalc(x * scale, y * scale, Math.floor(maxIter * 0.8));
        }
        return depth / 3;
    }

    function getPatternValue(x, y, time, progression) {
        const r = Math.sqrt(x * x + y * y);
        const a = Math.atan2(y, x);
        let val = Math.sin(a * 5 - r * 18 + time) * 0.35;
        val += Math.sin(a * 10 + r * 9 - time * 0.5) * 0.15;
        return Math.max(0.02, Math.min(0.98, (val + 0.5)));
    }

    function applyCompositionTransform(ux, uy, composition, zoom, offsetX, offsetY) {
        let x = ux / zoom + offsetX;
        let y = uy / zoom + offsetY;
        switch(composition) {
            case "Radial": 
                const r = Math.sqrt(x*x+y*y); 
                const a = Math.atan2(y,x); 
                x = a; y = r; 
                break;
            case "Spiral": 
                const sr = Math.sqrt(x*x+y*y); 
                const sa = Math.atan2(y,x); 
                const spiralR = Math.pow(sr,0.7)*1.5; 
                x = Math.cos(sa+spiralR*4)*spiralR; 
                y = Math.sin(sa+spiralR*4)*spiralR; 
                break;
            case "FlowField": 
                const angle = Math.sin(x*3)*Math.cos(y*3); 
                const cosA = Math.cos(angle); 
                const sinA = Math.sin(angle); 
                const nx = x*cosA - y*sinA; 
                const ny = x*sinA + y*cosA; 
                x = nx; y = ny; 
                break;
            default: break;
        }
        return { x, y };
    }

    function applyDistortion(x, y, progression) {
        let rx = x, ry = y;
        if (!ANIMATION_CONFIG.ENABLE_DISTORTION) return { x: rx, y: ry };
        
        const strength = ANIMATION_CONFIG.DISTORTION_STRENGTH * (0.5 + animatedPulse * 0.5);
        rx += Math.sin(ry * 8 + animatedWavePhase) * 0.03 * strength;
        ry += Math.cos(rx * 8 + animatedWavePhase) * 0.03 * strength;
        return { x: rx, y: ry };
    }

    function getRichColor(t, colorMood, time) {
        let r, g, b;
        const hueShift = ANIMATION_CONFIG.ENABLE_HUE_DRIFT ? animatedHueShift * 0.017 : 0;
        
        switch(colorMood) {
            case "Rainbow":
                r = Math.sin(t * 20 + time + hueShift) * 0.8 + 0.8;
                g = Math.sin(t * 20 + 2.094 + time * 1.2 + hueShift) * 0.8 + 0.8;
                b = Math.sin(t * 20 + 4.188 + time * 0.8 + hueShift) * 0.8 + 0.8;
                break;
            case "Fire":
                r = 1.0;
                g = 0.2 + 0.6 * Math.sin(t * 12 + time);
                b = 0.0;
                break;
            case "Aurora":
                r = 0.1 + 0.3 * Math.sin(t * 5 + time);
                g = 0.3 + 0.7 * Math.sin(t * 8 + time * 1.1);
                b = 0.6 + 0.4 * Math.sin(t * 10 + time * 0.9);
                break;
            case "Ice":
                r = 0.1 + 0.2 * Math.sin(t * 6 + time);
                g = 0.4 + 0.4 * Math.sin(t * 8 + time);
                b = 0.9 + 0.1 * Math.sin(t * 10 + time * 1.2);
                break;
            case "Neon":
            default:
                r = 0.0 + 1.0 * Math.sin(t * 8 + time);
                g = 0.0 + 1.0 * Math.cos(t * 10 + time * 1.2);
                b = 0.2 + 0.8 * Math.sin(t * 12 + time * 0.8);
                break;
        }
        
        // Apply pulse
        r = Math.min(0.95, r * animatedPulse);
        g = Math.min(0.95, g * animatedPulse);
        b = Math.min(0.95, b * animatedPulse);
        
        return { r: Math.max(0.05, r), g: Math.max(0.05, g), b: Math.max(0.05, b) };
    }

    function applyNoise(r, g, b, x, y) {
        if (!ANIMATION_CONFIG.ENABLE_NOISE) return { r, g, b };
        const noise = (Math.sin(x * 100 + noiseSeed) * Math.cos(y * 100 + noiseSeed * 1.3)) * ANIMATION_CONFIG.NOISE_STRENGTH;
        return {
            r: Math.min(0.95, Math.max(0.05, r + noise * 0.5)),
            g: Math.min(0.95, Math.max(0.05, g + noise)),
            b: Math.min(0.95, Math.max(0.05, b + noise * 0.8))
        };
    }

    // ============================================================
    // RENDER ENGINE
    // ============================================================
    let canvas, ctx;
    let offscreen, offCtx;
    let w = 420, h = 420;
    let currentTraits = null;
    let masterSeed = null;
    let baseTraits = null;
    let deterministicPhase = 0;
    let deterministicIntensity = 0.5;
    let canonicalTimeValue = 0;
    let animationId = null;

    function generateBaseTraitsFromSeed(seed, tokenId) {
        const rng = makeSeededRand(seed);
        // Offset by tokenId for uniqueness
        for (let i = 0; i < (parseInt(tokenId) % 100); i++) rng();
        
        return {
            layout: {
                zoom: 0.7 + rng() * 1.2,
                offsetX: (rng() - 0.5) * 1.0,
                offsetY: (rng() - 0.5) * 1.0
            },
            baseMaxIter: 80 + Math.floor(rng() * 160)
        };
    }

    function generateTraitsFromSeed(seed, tokenId) {
        const rng = makeSeededRand(seed);
        // Offset by tokenId
        for (let i = 0; i < (parseInt(tokenId) % 100); i++) rng();
        
        // Simple trait generation based on seed
        const rarityRoll = rng();
        let rarityClass;
        if (rarityRoll < 0.60) rarityClass = RARITY_CLASSES.COMMON;
        else if (rarityRoll < 0.85) rarityClass = RARITY_CLASSES.UNCOMMON;
        else if (rarityRoll < 0.95) rarityClass = RARITY_CLASSES.RARE;
        else if (rarityRoll < 0.99) rarityClass = RARITY_CLASSES.MYTHIC;
        else rarityClass = RARITY_CLASSES.GRAIL;
        
        const archetypeIndex = Math.floor(rng() * ARCHETYPES.length);
        const archetype = ARCHETYPES[archetypeIndex];
        
        const formIndex = Math.floor(rng() * ANCHOR_FORMS.length);
        const anchorForm = ANCHOR_FORMS[formIndex];
        
        const colorMoods = ["Neon", "Rainbow", "Fire", "Aurora", "Ice"];
        const colorIndex = Math.floor(rng() * colorMoods.length);
        const colorMood = colorMoods[colorIndex];
        
        const compositions = ["Centered", "Radial", "Spiral", "FlowField"];
        const compIndex = Math.floor(rng() * compositions.length);
        const composition = compositions[compIndex];
        
        return {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Color Mood": colorMood,
            "Composition": composition,
            "Motion": "Flowing",
            "Fractal Type": "Nova",
            "Pattern": "Galaxy",
            "Glitch Type": "Wave",
            "Distortion": "ripple",
            "Color Mode": "smooth",
            "Mask": "None",
            "Style": "Hybrid"
        };
    }

    function getProgressionState(intensity, isGrail) {
        if (isGrail) {
            if (intensity > 0.85) return "ascended";
            if (intensity > 0.65) return "awakened";
            return "dormant";
        } else {
            if (intensity > 0.82) return "ascended";
            if (intensity > 0.55) return "awakened";
            return "base";
        }
    }

    function updateOffscreen() {
        const newW = 420;
        const newH = 420;
        if (!offscreen || offscreen.width !== newW || offscreen.height !== newH) {
            offscreen = document.createElement('canvas');
            offscreen.width = newW;
            offscreen.height = newH;
            offCtx = offscreen.getContext('2d');
        }
        w = offscreen.width;
        h = offscreen.height;
    }

    function renderFrame(now) {
        if (!currentTraits || masterSeed === null) {
            if (ctx) {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, 700, 700);
            }
            return;
        }
        
        try {
            updateAnimatedValues(now);
            updateOffscreen();
            
            const imgData = offCtx.createImageData(w, h);
            const data = imgData.data;
            
            const isGrail = (currentTraits["Rarity Class"] === RARITY_CLASSES.GRAIL);
            const intensity = liveIntensity;
            const progression = getProgressionState(intensity, isGrail);
            const time = canonicalTimeValue + timeOffset * 0.002;
            const phase = deterministicPhase;
            
            let zoom = baseTraits.layout.zoom;
            if (ANIMATION_CONFIG.ENABLE_ZOOM_BREATHING) {
                zoom *= animatedZoom;
            }
            const offsetX = baseTraits.layout.offsetX;
            const offsetY = baseTraits.layout.offsetY;
            const maxIter = baseTraits.baseMaxIter;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    // Apply glitch offset
                    let offsetXpx = 0, offsetYpx = 0;
                    if (ANIMATION_CONFIG.ENABLE_GLITCH && Math.abs(animatedGlitchX) > 0.5) {
                        offsetXpx = animatedGlitchX * (Math.random() - 0.5);
                        offsetYpx = animatedGlitchY * (Math.random() - 0.5);
                    }
                    
                    let ux = ((x + offsetXpx) / w) * 4.0 - 2.5;
                    let uy = ((y + offsetYpx) / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, offsetX, offsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let distorted = applyDistortion(rx, ry, progression);
                    rx = distorted.x;
                    ry = distorted.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, phase, progression);
                    let patternVal = getPatternValue(rx, ry, time, progression);
                    
                    let t = (fractalVal + patternVal) * 0.5;
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", time);
                    
                    let { r: nr, g: ng, b: nb } = applyNoise(r, g, b, x / w, y / h);
                    
                    const idx = (y * w + x) * 4;
                    data[idx] = Math.min(255, Math.max(0, Math.floor(nr * 255)));
                    data[idx+1] = Math.min(255, Math.max(0, Math.floor(ng * 255)));
                    data[idx+2] = Math.min(255, Math.max(0, Math.floor(nb * 255)));
                    data[idx+3] = 255;
                }
            }
            
            offCtx.putImageData(imgData, 0, 0);
            ctx.drawImage(offscreen, 0, 0, w, h, 0, 0, 700, 700);
            
            // Update token info display
            const infoEl = document.getElementById('tokenInfo');
            if (infoEl) {
                infoEl.innerHTML = `Intensity: ${Math.round(intensity * 100)}%`;
            }
        } catch(e) {
            console.error("Render error:", e);
        }
    }

    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        timeOffset = elapsed;
        
        renderFrame(elapsed);
        animationId = requestAnimationFrame(animate);
    }

    // ============================================================
    // INITIALIZATION
    // ============================================================
    async function init() {
        canvas = document.getElementById('artCanvas');
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        ctx = canvas.getContext('2d');
        
        // Show loading
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 700, 700);
        ctx.fillStyle = '#fff';
        ctx.font = '14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('Loading Art...', 350, 350);
        
        // Get token data
        const tokenData = getTokenData();
        console.log("Token:", tokenData);
        
        // Update info display
        const infoEl = document.getElementById('tokenInfo');
        if (infoEl) {
            infoEl.innerHTML = `Token #${tokenData.tokenId} | Loading...`;
        }
        
        // Generate deterministic art from seed
        masterSeed = getSeed(tokenData.tokenId, tokenData.txHash);
        currentTraits = generateTraitsFromSeed(masterSeed, tokenData.tokenId);
        baseTraits = generateBaseTraitsFromSeed(masterSeed, tokenData.tokenId);
        
        // Calculate deterministic values
        const intensityRand = makeSeededRand(masterSeed);
        deterministicIntensity = 0.2 + intensityRand() * 0.7;
        deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
        canonicalTimeValue = deterministicTime(tokenData.tokenId, masterSeed, deterministicIntensity);
        
        // Set initial intensity
        liveIntensity = deterministicIntensity;
        
        // Fetch live intensity
        await fetchLiveIntensity();
        
        // Start polling for intensity updates (every 30 seconds)
        setInterval(fetchLiveIntensity, 30000);
        
        // Update info with token
        if (infoEl) {
            infoEl.innerHTML = `Token #${tokenData.tokenId} | Intensity: ${Math.round(liveIntensity * 100)}%`;
        }
        
        // Start animation
        startTime = null;
        animationId = requestAnimationFrame(animate);
        
        console.log("✅ Viewer ready - Token:", tokenData.tokenId, "Traits:", currentTraits);
    }
    
    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();