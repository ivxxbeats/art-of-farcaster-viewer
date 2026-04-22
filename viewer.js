// ============================================================
// ART OF FARCASTER - COMPLETE VIEWER
// Dust/Noise effect + Subtle Glitches + Live Intensity
// ============================================================

(function() {
    "use strict";
    
    // ============================================================
    // CONFIG
    // ============================================================
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
    // COMPLEMENTARY TRAITS
    // ============================================================
    
    function getComplementaryTraits(rarityClass, awakenedLevel, intensity, tokenNum) {
        let mood = "Serene";
        if (intensity > 0.8) mood = "Intense";
        else if (intensity > 0.6) mood = "Energetic";
        else if (intensity > 0.4) mood = "Balanced";
        else if (intensity > 0.2) mood = "Calm";
        else mood = "Dormant";
        
        let phase = awakenedLevel.charAt(0).toUpperCase() + awakenedLevel.slice(1);
        
        const elements = ["Fire", "Water", "Earth", "Air", "Light", "Shadow", "Crystal", "Void"];
        const element = elements[tokenNum % elements.length];
        
        let density = "Moderate";
        if (rarityClass === "Grail") density = "Overflowing";
        else if (rarityClass === "Mythic") density = "Dense";
        else if (rarityClass === "Rare") density = "Abundant";
        else if (rarityClass === "Uncommon") density = "Moderate";
        else density = "Sparse";
        
        let harmony = "Balanced";
        if (intensity > 0.7 && rarityClass === "Grail") harmony = "Perfect";
        else if (intensity > 0.5) harmony = "Flowing";
        else harmony = "Still";
        
        let flowState = "Gentle";
        if (awakenedLevel === "ascended") flowState = "Rapid";
        else if (awakenedLevel === "awakened") flowState = "Moving";
        else if (intensity > 0.7) flowState = "Surging";
        else if (intensity > 0.4) flowState = "Flowing";
        else flowState = "Gentle";
        
        let flowColor = "#88aaff";
        if (flowState === "Rapid") flowColor = "#ff6688";
        else if (flowState === "Surging") flowColor = "#ffaa44";
        else if (flowState === "Flowing") flowColor = "#44ffaa";
        else flowColor = "#88aaff";
        
        return { mood, phase, element, density, harmony, flowState, flowColor };
    }
    
    function updateComplementaryUI(complementary) {
        const infoEl = document.getElementById('complementaryInfo');
        if (infoEl) {
            infoEl.innerHTML = `${complementary.mood} · ${complementary.element} · ${complementary.harmony} · ${complementary.flowState}`;
            infoEl.style.borderLeft = `3px solid ${complementary.flowColor}`;
        }
    }
    
    // ============================================================
    // LIVE INTENSITY API
    // ============================================================
    let liveIntensity = 0.5;
    let awakenedLevel = "base";
    let lastIntensity = 0.5;
    
    function fetchIntensity() {
        var url = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
        fetch(url + "?t=" + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(data) {
                liveIntensity = data.intensity || 0.5;
                if (liveIntensity > 0.8) awakenedLevel = "ascended";
                else if (liveIntensity > 0.55) awakenedLevel = "awakened";
                else awakenedLevel = "base";
                console.log("Intensity:", liveIntensity, "Level:", awakenedLevel);
            })
            .catch(function(e) { console.log("Intensity fetch failed"); });
    }
    
    // ============================================================
    // DETERMINISTIC HELPERS
    // ============================================================
    
    function getSeed(tokenId, txHash) {
        let hash = 2166136261;
        const str = `${txHash}_${tokenId}`;
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
    
    function splitSeed(seed, streamId) { 
        let state = (seed ^ (streamId * 0x9e3779b9)) >>> 0; 
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
    // TRAIT GENERATION
    // ============================================================
    
    function weightedPick(items, weights, rng) {
        const r = rng();
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            sum += weights[i];
            if (r < sum) return items[i];
        }
        return items[items.length - 1];
    }
    
    function rollRarityClass(rng) {
        return weightedPick(
            [RARITY_CLASSES.COMMON, RARITY_CLASSES.UNCOMMON, RARITY_CLASSES.RARE, RARITY_CLASSES.MYTHIC, RARITY_CLASSES.GRAIL],
            [0.60, 0.25, 0.10, 0.04, 0.01],
            rng
        );
    }
    
    function rollArchetype(rarityClass, rng) {
        if (rarityClass === RARITY_CLASSES.GRAIL) {
            return weightedPick(ARCHETYPES, [0.12, 0.14, 0.18, 0.12, 0.28, 0.16], rng);
        }
        switch (rarityClass) {
            case RARITY_CLASSES.COMMON: return weightedPick(ARCHETYPES, [0.20, 0.18, 0.15, 0.17, 0.18, 0.12], rng);
            case RARITY_CLASSES.UNCOMMON: return weightedPick(ARCHETYPES, [0.17, 0.17, 0.17, 0.17, 0.18, 0.14], rng);
            case RARITY_CLASSES.RARE: return weightedPick(ARCHETYPES, [0.14, 0.16, 0.20, 0.16, 0.18, 0.16], rng);
            case RARITY_CLASSES.MYTHIC: return weightedPick(ARCHETYPES, [0.10, 0.14, 0.22, 0.14, 0.20, 0.20], rng);
            default: return "Signal";
        }
    }
    
    function rollAnchorForm(archetype, rng) {
        switch (archetype) {
            case "Signal": return weightedPick(ANCHOR_FORMS, [0.10, 0.28, 0.08, 0.30, 0.18, 0.06], rng);
            case "Drift": return weightedPick(ANCHOR_FORMS, [0.18, 0.22, 0.06, 0.08, 0.32, 0.14], rng);
            case "Rift": return weightedPick(ANCHOR_FORMS, [0.06, 0.08, 0.46, 0.12, 0.10, 0.18], rng);
            case "Core": return weightedPick(ANCHOR_FORMS, [0.32, 0.26, 0.06, 0.16, 0.10, 0.10], rng);
            case "Prism": return weightedPick(ANCHOR_FORMS, [0.12, 0.30, 0.10, 0.20, 0.16, 0.12], rng);
            case "Void": return weightedPick(ANCHOR_FORMS, [0.28, 0.16, 0.18, 0.14, 0.08, 0.16], rng);
            default: return "Aether";
        }
    }
    
    function generateCollectionTraits(seed, tokenId) {
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) {
            streamRNGs[i] = splitSeed(seed, i);
        }
        
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) {
                if(streamRNGs[s]) streamRNGs[s]();
            }
        }
        
        const traitsRNG = streamRNGs[1];
        const colorRNG = streamRNGs[2];
        const compRNG = streamRNGs[3];
        
        const rarityClass = rollRarityClass(traitsRNG);
        const archetype = rollArchetype(rarityClass, traitsRNG);
        const anchorForm = rollAnchorForm(archetype, traitsRNG);
        
        const colors = ["Ethereal", "ChromaticShift", "Volcanic", "StellarDrift", "Mystic", "QuantumWave", "Serene", "PhantomGlow", "Nebula", "CrimsonDawn", "ArcticFrost", "SolarFlare", "DeepVoid", "PrismCore", "GhostLight", "AuroraBorealis"];
        const colorMood = colors[Math.floor(colorRNG() * colors.length)];
        
        const compositions = ["Spiral", "Radial", "Kaleido", "FlowField", "Rotated", "Warp", "Mosaic", "Tunnel", "FractalNest", "Vortex"];
        const composition = compositions[Math.floor(compRNG() * compositions.length)];
        
        const fractals = ["Nova", "Julia", "Mandelbrot", "Barnsley", "Dragon", "Magnet", "Phoenix", "BurningShip", "Tricorn", "Celtic", "Perpendicular", "Mandelbar"];
        const fractalType = fractals[Math.floor(compRNG() * fractals.length)];
        
        return {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Color Mood": colorMood,
            "Composition": composition,
            "Fractal Type": fractalType,
            "Motion": "Flowing"
        };
    }
    
    function generateBaseTraits(seed, tokenId) {
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) {
            streamRNGs[i] = splitSeed(seed, i);
        }
        
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) {
                if(streamRNGs[s]) streamRNGs[s]();
            }
        }
        
        const traitsRNG = streamRNGs[1];
        const varietyRNG = streamRNGs[2];
        
        const zoomVariety = 0.3 + varietyRNG() * 2.2;
        const offsetVarietyX = (varietyRNG() - 0.5) * 3.0;
        const offsetVarietyY = (varietyRNG() - 0.5) * 3.0;
        const iterVariety = 40 + Math.floor(varietyRNG() * 260);
        
        return {
            zoom: (0.7 + traitsRNG() * 1.2) * zoomVariety,
            offsetX: (traitsRNG() - 0.5) * 1.0 + offsetVarietyX,
            offsetY: (traitsRNG() - 0.5) * 1.0 + offsetVarietyY,
            baseMaxIter: 80 + Math.floor(traitsRNG() * 160) + iterVariety
        };
    }
    
    // ============================================================
    // ANIMATION VALUES (Gentle, always moving)
    // ============================================================
    let animatedPulse = 0.92;
    let animatedHueShift = 0;
    let animatedGlitchX = 0;
    let animatedGlitchY = 0;
    let startTime = null;
    
    function updateAnimation(now) {
        // Gentle breathing (always present)
        animatedPulse = 0.92 + Math.sin(now * 0.0008) * 0.04;
        // Subtle hue drift
        animatedHueShift = Math.sin(now * 0.0003) * 360 * 0.05;
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
        return smooth < 0.02 ? 0.02 : smooth > 0.98 ? 0.98 : smooth;
    }
    
    function getFractalTypeMultiplier(fractalType) {
        switch(fractalType) {
            case "Nova": return { xScale: 1.0, yScale: 1.0 };
            case "Julia": return { xScale: 1.2, yScale: 1.2 };
            case "Mandelbrot": return { xScale: 0.8, yScale: 0.8 };
            case "Barnsley": return { xScale: 1.5, yScale: 0.5 };
            case "Dragon": return { xScale: 1.1, yScale: 1.1 };
            case "Magnet": return { xScale: 0.9, yScale: 0.9 };
            default: return { xScale: 1.0, yScale: 1.0 };
        }
    }
    
    function getDepthFractalValue(x, y, maxIter, fractalType) {
        const multi = getFractalTypeMultiplier(fractalType);
        let depth = 0;
        for (let i = 0; i < 3; i++) {
            const scale = (1 + i * 0.15) * multi.xScale;
            const yScale = (1 + i * 0.12) * multi.yScale;
            depth += novaFractalCalc(x * scale, y * yScale, Math.floor(maxIter * 0.7));
        }
        return depth / 3;
    }
    
    function getPatternValue(x, y, time) {
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
    
    function getRichColor(t, colorMood, time) {
        let r, g, b;
        const pulse = animatedPulse;
        const hueShift = animatedHueShift * 0.017;
        
        switch(colorMood) {
            case "Ethereal":
                r = 0.6 + 0.4 * Math.sin(t * 8 + time);
                g = 0.3 + 0.5 * Math.sin(t * 10 + time * 1.1);
                b = 0.9 + 0.1 * Math.sin(t * 12 + time * 0.9);
                break;
            case "ChromaticShift":
                r = Math.sin(t * 25 + time + hueShift) * 0.7 + 0.5;
                g = Math.sin(t * 25 + 2.094 + time * 1.3 + hueShift) * 0.7 + 0.5;
                b = Math.sin(t * 25 + 4.188 + time * 0.7 + hueShift) * 0.7 + 0.5;
                break;
            case "Volcanic":
                r = 1.0;
                g = 0.1 + 0.7 * Math.sin(t * 12 + time * 1.5);
                b = 0.0;
                break;
            case "StellarDrift":
                r = 0.2 + 0.6 * Math.sin(t * 6 + time * 0.8);
                g = 0.1 + 0.5 * Math.sin(t * 8 + time);
                b = 0.8 + 0.2 * Math.sin(t * 10 + time * 1.2);
                break;
            case "Mystic":
                r = 0.7 + 0.3 * Math.sin(t * 9 + time * 0.7);
                g = 0.2 + 0.6 * Math.sin(t * 11 + time * 1.1);
                b = 0.9 + 0.1 * Math.sin(t * 13 + time * 0.5);
                break;
            case "QuantumWave":
                r = Math.sin(t * 30 + time * 2) * 0.5 + 0.5;
                g = Math.sin(t * 30 + 2.094 + time * 1.8) * 0.5 + 0.5;
                b = Math.sin(t * 30 + 4.188 + time * 2.2) * 0.5 + 0.5;
                break;
            case "Serene":
                r = 0.1 + 0.4 * Math.sin(t * 5 + time * 0.5);
                g = 0.4 + 0.4 * Math.sin(t * 7 + time * 0.7);
                b = 0.8 + 0.2 * Math.sin(t * 9 + time * 0.9);
                break;
            case "PhantomGlow":
                r = 0.9 + 0.1 * Math.sin(t * 15 + time * 1.2);
                g = 0.3 + 0.5 * Math.sin(t * 18 + time * 1.5);
                b = 0.7 + 0.3 * Math.sin(t * 20 + time * 0.8);
                break;
            default:
                r = 0.0 + 1.0 * Math.sin(t * 8 + time);
                g = 0.0 + 1.0 * Math.cos(t * 10 + time * 1.2);
                b = 0.2 + 0.8 * Math.sin(t * 12 + time * 0.8);
                break;
        }
        
        r = Math.min(0.85, Math.max(0.15, r * pulse * 0.7));
        g = Math.min(0.85, Math.max(0.15, g * pulse * 0.7));
        b = Math.min(0.85, Math.max(0.15, b * pulse * 0.7));
        
        return { r, g, b };
    }
    
    // ============================================================
    // LIVE INTENSITY EFFECTS (Dramatic, changes with API)
    // ============================================================
    
    function applyIntensityEffects(ctx, w, h, intensity, awakenedLevel, now) {
        // 1. DUST / NOISE EFFECT (replaces scanlines)
        if (intensity > 0.2) {
            const noiseAmount = 0.015 + intensity * 0.04;
            for (var i = 0; i < 300; i++) {
                if (Math.random() < noiseAmount) {
                    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
                    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
                }
            }
        }
        
        // 2. SUBTLE GLITCH EFFECTS
        
        // Micro-shift glitch
        if (Math.random() < 0.003 * intensity) {
            const shiftX = (Math.random() - 0.5) * 2;
            const shiftY = (Math.random() - 0.5) * 1;
            ctx.drawImage(ctx.canvas, shiftX, shiftY);
        }
        
        // Color fringing (subtle RGB split)
        if (Math.random() < 0.0065 * intensity) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            for (var i = 0; i < data.length; i += 4) {
                if (Math.random() < 0.05) {
                    const temp = data[i];
                    data[i] = data[i+2];
                    data[i+2] = temp;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
        
        // Single pixel flicker
        if (Math.random() < 0.003 * intensity) {
            for (var i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
                ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
            }
        }
        
        // Horizontal tear (rare)
        if (Math.random() < 0.0013 * intensity) {
            const tearY = Math.floor(Math.random() * h);
            const tearHeight = 2;
            const tearWidth = w * 0.3;
            const tearX = (Math.random() - 0.5) * 20;
            ctx.drawImage(ctx.canvas, 0, tearY, w, tearHeight, tearX, tearY, tearWidth, tearHeight);
        }
        
        // 3. VIGNETTE PULSE (subtle darkening at edges)
        if (intensity > 0.3) {
            const vignetteStrength = intensity * 0.16;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.6, `rgba(0,0,0,${vignetteStrength * 0.2})`);
            gradient.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        
        // 4. INTENSITY METER
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(10, 670, 100, 6);
        ctx.fillStyle = `hsl(${intensity * 120}, 100%, 50%)`;
        ctx.fillRect(10, 670, intensity * 100, 6);
        
        // 5. COLOR WASH (subtle overlay based on intensity)
        const hue = (now * 0.02 + intensity * 360) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${intensity * 0.032})`;
        ctx.fillRect(0, 0, w, h);
    }
    
    // ============================================================
    // AWAKENED VISUAL EFFECTS (Subtle)
    // ============================================================
    function applyAwakenedEffects(ctx, w, h, level, intensity, now) {
        if (level === "ascended") {
            ctx.shadowBlur = 5;
            ctx.shadowColor = "rgba(255,150,255,0.15)";
            
            for (var i = 0; i < 12; i++) {
                ctx.beginPath();
                ctx.arc(w/2, h/2, 100 + i * 30 + Math.sin(now * 0.002) * 5, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${now * 0.02 % 360}, 100%, 60%, 0.1)`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            
            for (var i = 0; i < 15; i++) {
                ctx.fillStyle = `rgba(255,150,255,${Math.random() * 0.12})`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        } else if (level === "awakened") {
            ctx.shadowBlur = 3;
            ctx.shadowColor = "rgba(100,150,255,0.1)";
            
            for (var i = 0; i < 8; i++) {
                ctx.fillStyle = `rgba(100,150,255,${Math.random() * 0.08})`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5);
            }
        }
        ctx.shadowBlur = 0;
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
    let canonicalTimeValue = 0;
    let tokenId = null;
    
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
        if (!currentTraits || !ctx) return;
        
        try {
            updateAnimation(now);
            updateOffscreen();
            
            const imgData = offCtx.createImageData(w, h);
            const data = imgData.data;
            const isGrail = (currentTraits["Rarity Class"] === RARITY_CLASSES.GRAIL);
            const intensity = liveIntensity;
            const time = canonicalTimeValue + now * 0.0015;
            const zoom = baseTraits?.zoom || 1.0;
            const offsetX = baseTraits?.offsetX || 0;
            const offsetY = baseTraits?.offsetY || 0;
                // Golden ratio offset (matches sketch.js)
                
                const phi = 1.618;
                const goldenX = w / phi;
                const goldenY = h / phi;
                const goldenOffsetX = (goldenX - w/2) / w * 0.3;
                const goldenOffsetY = (goldenY - h/2) / h * 0.3;
                const adjustedOffsetX = offsetX + goldenOffsetX;
                const adjustedOffsetY = offsetY + goldenOffsetY;
            const maxIter = baseTraits?.baseMaxIter || 120;
            
            const tokenNum = parseInt(tokenId) || 1;
            const complementary = getComplementaryTraits(currentTraits["Rarity Class"], awakenedLevel, liveIntensity, tokenNum);
            updateComplementaryUI(complementary);
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let ux = (x / w) * 4.0 - 2.5;
                    let uy = (y / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, adjustedOffsetX, adjustedOffsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, currentTraits["Fractal Type"]);
                    let patternVal = getPatternValue(rx, ry, time);
                    
                    let t = (fractalVal + patternVal) * 0.5;
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", time);
                    
                    const idx = (y * w + x) * 4;
                    data[idx] = Math.min(255, Math.max(0, Math.floor(r * 255)));
                    data[idx+1] = Math.min(255, Math.max(0, Math.floor(g * 255)));
                    data[idx+2] = Math.min(255, Math.max(0, Math.floor(b * 255)));
                    data[idx+3] = 255;
                }
            }
            
            offCtx.putImageData(imgData, 0, 0);
            ctx.clearRect(0, 0, 700, 700);
            ctx.drawImage(offscreen, 0, 0, w, h, 0, 0, 700, 700);
            
            applyAwakenedEffects(ctx, 700, 700, awakenedLevel, liveIntensity, now);
            applyIntensityEffects(ctx, 700, 700, liveIntensity, awakenedLevel, now);
            
            if (isGrail) {
                for (var i = 0; i < 15; i++) {
                    ctx.fillStyle = `hsla(${now * 0.03 % 360}, 100%, 60%, 0.15)`;
                    ctx.fillRect(Math.random() * 700, Math.random() * 700, 3, 3);
                }
            }
            
        } catch(e) {
            console.error("Render error:", e);
        }
    }
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        renderFrame(elapsed);
        requestAnimationFrame(animate);
    }
    
    function init() {
        canvas = document.getElementById('artCanvas');
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext('2d');
        
        const params = new URLSearchParams(window.location.search);
        tokenId = params.get('tokenId') || params.get('tid') || '1';
        const txHash = params.get('txHash') || params.get('h') || '0x0';
        
        console.log("Token:", tokenId);
        
        masterSeed = getSeed(tokenId, txHash);
        currentTraits = generateCollectionTraits(masterSeed, tokenId);
        baseTraits = generateBaseTraits(masterSeed, tokenId);
        
        const intensityRand = makeSeededRand(masterSeed);
        const deterministicIntensity = 0.2 + intensityRand() * 0.7;
        deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
        canonicalTimeValue = deterministicTime(tokenId, masterSeed, deterministicIntensity);
        
        fetchIntensity();
        setInterval(fetchIntensity, 30000);
        
        startTime = null;
        requestAnimationFrame(animate);
        
        console.log("Viewer ready - Token:", tokenId);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();