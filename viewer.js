// ============================================================
// ART OF FARCASTER - VIEWER (Matching mint script RNG)
// Uses identical deterministic RNG as sketch.js
// ============================================================

(function() {
    "use strict";
    
    // ============================================================
    // CONFIG (matching sketch.js)
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
    // LIVE INTENSITY API
    // ============================================================
    let liveIntensity = 0.5;
    let awakenedLevel = "base";
    let animationTime = 0;
    
    function fetchIntensity() {
        var url = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
        fetch(url + "?t=" + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(data) {
                liveIntensity = data.intensity || 0.5;
                if (liveIntensity > 0.8) awakenedLevel = "ascended";
                else if (liveIntensity > 0.55) awakenedLevel = "awakened";
                else awakenedLevel = "base";
                console.log("💪 Intensity:", liveIntensity, "| Level:", awakenedLevel);
            })
            .catch(function(e) { console.log("Intensity fetch failed"); });
    }
    
    // ============================================================
    // DETERMINISTIC HELPERS (IDENTICAL to sketch.js)
    // ============================================================
    
    // Same getSeed function as sketch.js
    function getSeed(tokenId, txHash) {
        let hash = 2166136261;
        const str = `${txHash}_${tokenId}`;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        return hash >>> 0;
    }
    
    // Same makeSeededRand as sketch.js
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
    
    // Same splitSeed as sketch.js
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
    
    // Same deterministicTime as sketch.js
    function deterministicTime(tokenId, masterSeed, intensity) {
        const tokenNum = parseInt(tokenId, 10) || 0;
        return ((tokenNum * 0.0123456789) + (masterSeed * 0.0000001) + (intensity * 0.1)) % 1.0;
    }
    
    // Same getDeterministicPhase as sketch.js
    function getDeterministicPhase(masterSeed, intensity) {
        return Math.floor((masterSeed + intensity * 10000)) % 4;
    }
    
    // ============================================================
    // TRAIT GENERATION (IDENTICAL to sketch.js)
    // ============================================================
    
    // Same weightedPick as sketch.js
    function weightedPick(items, weights, rng) {
        const r = rng();
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            sum += weights[i];
            if (r < sum) return items[i];
        }
        return items[items.length - 1];
    }
    
    // Same rollRarityClass as sketch.js
    function rollRarityClass(rng) {
        return weightedPick(
            [RARITY_CLASSES.COMMON, RARITY_CLASSES.UNCOMMON, RARITY_CLASSES.RARE, RARITY_CLASSES.MYTHIC, RARITY_CLASSES.GRAIL],
            [0.60, 0.25, 0.10, 0.04, 0.01],
            rng
        );
    }
    
    // Same rollArchetype as sketch.js
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
    
    // Same rollAnchorForm as sketch.js
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
    
    // Simplified trait generation for viewer (enough for visual consistency)
    function generateTraits(seed, tokenId) {
        // Create RNG streams matching sketch.js
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) {
            streamRNGs[i] = splitSeed(seed, i);
        }
        
        // Apply token offset (matching sketch.js)
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) {
                if(streamRNGs[s]) streamRNGs[s]();
            }
        }
        
        const traitsRNG = streamRNGs[1];
        
        // Generate traits using same logic as sketch.js
        const rarityClass = rollRarityClass(traitsRNG);
        const archetype = rollArchetype(rarityClass, traitsRNG);
        const anchorForm = rollAnchorForm(archetype, traitsRNG);
        
        // Color pools matching sketch.js
        const colors = ["Neon", "Electric", "Cyberpunk", "Aurora", "Ice", "Magma", "Cyanide", "Laser"];
        const colorMood = colors[Math.floor(traitsRNG() * colors.length)];
        
        // Composition pools matching sketch.js
        const compositions = ["Spiral", "Radial", "Kaleido", "FlowField", "Rotated"];
        const composition = compositions[Math.floor(traitsRNG() * compositions.length)];
        
        return {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Color Mood": colorMood,
            "Composition": composition,
            "Motion": "Flowing"
        };
    }
    
    // Same generateBaseTraits as sketch.js
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
        return {
            zoom: 0.7 + traitsRNG() * 1.2,
            offsetX: (traitsRNG() - 0.5) * 1.0,
            offsetY: (traitsRNG() - 0.5) * 1.0,
            baseMaxIter: 80 + Math.floor(traitsRNG() * 160)
        };
    }
    
    // ============================================================
    // ANIMATION VALUES
    // ============================================================
    let animatedPulse = 0.7;
    let animatedHueShift = 0;
    let animatedGlitchX = 0;
    let animatedGlitchY = 0;
    let animatedWavePhase = 0;
    
    function updateAnimation(now) {
        const speed = awakenedLevel === "ascended" ? 1.5 : (awakenedLevel === "awakened" ? 1.2 : 1.0);
        
        animatedPulse = 0.5 + Math.sin(now * 0.003 * speed) * 0.4;
        animatedHueShift = Math.sin(now * 0.0008 * speed) * 360 * 0.3;
        animatedGlitchX = Math.sin(now * 0.015) * 5;
        animatedGlitchY = Math.cos(now * 0.012) * 4;
        animatedWavePhase = (animatedWavePhase + 0.03 * speed) % (Math.PI * 2);
    }
    
    // ============================================================
    // FRACTAL ENGINES (matching sketch.js)
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
    
    function getRichColor(t, colorMood, time, intensity) {
        let r, g, b;
        const hueShift = animatedHueShift * 0.017;
        const pulse = animatedPulse;
        
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
        
        r = Math.min(0.95, Math.max(0.05, r * pulse));
        g = Math.min(0.95, Math.max(0.05, g * pulse));
        b = Math.min(0.95, Math.max(0.05, b * pulse));
        
        const boost = awakenedLevel === "ascended" ? 1.3 : (awakenedLevel === "awakened" ? 1.15 : 1.0);
        
        return { 
            r: Math.min(0.95, r * boost), 
            g: Math.min(0.95, g * boost), 
            b: Math.min(0.95, b * boost) 
        };
    }
    
    // ============================================================
    // AWAKENED VISUAL EFFECTS
    // ============================================================
    function applyAwakenedEffects(ctx, w, h, level, intensity, now) {
        if (level === "ascended") {
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255,100,255,0.5)";
            
            for (var i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(w/2, h/2, 100 + i * 40 + Math.sin(now * 0.003) * 10, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${now * 0.05 % 360}, 100%, 60%, 0.3)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            for (var i = 0; i < 60; i++) {
                ctx.fillStyle = `rgba(255,100,255,${Math.random() * 0.3})`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
            }
        } else if (level === "awakened") {
            ctx.shadowBlur = 10;
            ctx.shadowColor = "rgba(100,200,255,0.3)";
            
            for (var i = 0; i < 30; i++) {
                ctx.fillStyle = `rgba(100,200,255,${Math.random() * 0.2})`;
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
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
    let startTime = null;
    
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
            const time = canonicalTimeValue + now * 0.002;
            const zoom = baseTraits?.zoom || 1.0;
            const offsetX = baseTraits?.offsetX || 0;
            const offsetY = baseTraits?.offsetY || 0;
            const maxIter = baseTraits?.baseMaxIter || 120;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let offsetXpx = animatedGlitchX * (Math.random() - 0.5);
                    let offsetYpx = animatedGlitchY * (Math.random() - 0.5);
                    
                    let ux = ((x + offsetXpx) / w) * 4.0 - 2.5;
                    let uy = ((y + offsetYpx) / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, offsetX, offsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, deterministicPhase, "base");
                    let patternVal = getPatternValue(rx, ry, time, "base");
                    
                    let t = (fractalVal + patternVal) * 0.5;
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", time, liveIntensity);
                    
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
            
            if (isGrail) {
                for (var i = 0; i < 50; i++) {
                    ctx.fillStyle = `hsla(${now * 0.05 % 360}, 100%, 60%, 0.25)`;
                    ctx.fillRect(Math.random() * 700, Math.random() * 700, 4, 4);
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
        
        console.log("🎨 Token:", tokenId);
        
        masterSeed = getSeed(tokenId, txHash);
        currentTraits = generateTraits(masterSeed, tokenId);
        baseTraits = generateBaseTraits(masterSeed, tokenId);
        
        const intensityRand = makeSeededRand(masterSeed);
        const deterministicIntensity = 0.2 + intensityRand() * 0.7;
        deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
        canonicalTimeValue = deterministicTime(tokenId, masterSeed, deterministicIntensity);
        
        fetchIntensity();
        setInterval(fetchIntensity, 30000);
        
        startTime = null;
        requestAnimationFrame(animate);
        
        console.log("✅ Viewer ready - Token:", tokenId, "Traits:", currentTraits);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();