// ============================================================
// ART OF FARCASTER - VIEWER v23.0
// EXACT pipeline match with sketch.js
// Only animation added AFTER field computation
// ============================================================

(function() {
    "use strict";
    
    // ============================================================
    // SIGNATURE SYSTEM FUNCTIONS (IDENTICAL to sketch)
    // ============================================================
    
    function signatureColor(t, time) {
        const base = t * 30 + time;
        const r = Math.sin(base) * 0.5 + 0.5;
        const g = Math.sin(base + 2.094) * 0.5 + 0.5;
        const b = Math.sin(base + 4.188) * 0.5 + 0.5;
        return { r, g, b };
    }
    
    function signatureContrast(t) {
        const k = 6.0;
        let result = 1.0 / (1.0 + Math.exp(-k * (t - 0.5)));
        const ridge = Math.abs(Math.sin(t * Math.PI));
        result = result * 0.9 + ridge * 0.1;
        return Math.max(0.02, Math.min(0.98, result));
    }
    
    // ============================================================
    // CONFIG (IDENTICAL to sketch)
    // ============================================================
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
    // ENGINE TYPES (IDENTICAL to sketch)
    // ============================================================
    const ENGINE_TYPES = ["Canonical", "Echo", "Rupture"];
    const PRIMARY_DRIVERS = ["Fractal", "Pattern", "Color", "Composition"];
    const STRUCTURE_TYPES = ["Nova", "Lattice", "Field", "Wave", "Grid", "Drift"];
    const SPATIAL_BEHAVIORS = ["Radial", "Spiral", "FlowField", "Kaleido", "Vortex", "Asymmetrical"];
    
    function weightedPick(items, weights, rng) {
        const r = rng();
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            sum += weights[i];
            if (r < sum) return items[i];
        }
        return items[items.length - 1];
    }
    
    // ============================================================
    // ANOMALY CLASS (IDENTICAL to sketch)
    // ============================================================
    const ANOMALY_CLASSES = ["Interference", "Collapse", "EchoLoop", "SpectralSplit"];
    
    // ============================================================
    // ENGINE CONFIGURATION (IDENTICAL to sketch)
    // ============================================================
    function getEngineConfig(engineType) {
        switch (engineType) {
            case "Canonical":
                return { fractalWeight: 0.7, patternWeight: 0.3, allowedCompositions: ["Radial", "Spiral", "Kaleido"], name: "Canonical" };
            case "Echo":
                return { fractalWeight: 0.35, patternWeight: 0.65, allowedCompositions: ["FlowField", "Vortex", "Asymmetrical"], name: "Echo" };
            case "Rupture":
                return { fractalWeight: 0.5, patternWeight: 0.5, allowedCompositions: ["Asymmetrical", "Vortex", "Radial"], name: "Rupture" };
            default:
                return { fractalWeight: 0.5, patternWeight: 0.5, allowedCompositions: ["Radial"], name: "Canonical" };
        }
    }
    
    // ============================================================
    // LIVE INTENSITY API (Viewer only)
    // ============================================================
    let liveIntensity = 0.5;
    let awakenedLevel = "base";
    
    function fetchIntensity() {
        var url = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
        fetch(url + "?t=" + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(data) {
                liveIntensity = data.intensity || 0.5;
                if (liveIntensity > 0.8) awakenedLevel = "ascended";
                else if (liveIntensity > 0.55) awakenedLevel = "awakened";
                else awakenedLevel = "base";
            })
            .catch(function(e) {});
    }
    
    // ============================================================
    // DETERMINISTIC HELPERS (IDENTICAL to sketch)
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
    // TRAIT GENERATION (IDENTICAL to sketch)
    // ============================================================
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
    
    function generateCollectionTraits(rng, tokenNum) {
        const rarityClass = rollRarityClass(rng);
        const archetype = rollArchetype(rarityClass, rng);
        const anchorForm = rollAnchorForm(archetype, rng);
        const engineType = weightedPick(ENGINE_TYPES, rarityClass === "Grail" ? [0.10, 0.20, 0.70] : [0.78, 0.19, 0.03], rng);
        const primaryDriver = weightedPick(PRIMARY_DRIVERS, [0.35, 0.25, 0.25, 0.15], rng);
        const engineConfig = getEngineConfig(engineType);
        
        const spatialBehavior = engineConfig.allowedCompositions[Math.floor(rng() * engineConfig.allowedCompositions.length)];
        const colors = ["Ethereal", "Volcanic", "StellarDrift", "Nebula", "SolarFlare", "DeepVoid", "PrismCore", "AuroraBorealis"];
        const colorMood = colors[Math.floor(rng() * colors.length)];
        const structureType = STRUCTURE_TYPES[Math.floor(rng() * STRUCTURE_TYPES.length)];
        
        const traits = {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Engine Type": engineType,
            "Primary Driver": primaryDriver,
            "Color Mood": colorMood,
            "Spatial Behavior": spatialBehavior,
            "Structure Type": structureType,
            "Engine Config": engineConfig
        };
        
        if (rarityClass === "Grail") {
            traits["Anomaly Class"] = weightedPick(ANOMALY_CLASSES, [0.25, 0.25, 0.25, 0.25], rng);
        }
        
        return traits;
    }
    
    function generateBaseTraits(seed, tokenId) {
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) streamRNGs[i] = splitSeed(seed, i);
        
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) if(streamRNGs[s]) streamRNGs[s]();
        }
        
        const traitsRNG = streamRNGs[1];
        const varietyRNG = streamRNGs[2];
        
        const zoomVariety = 0.5 + varietyRNG() * 1.3;
        const offsetVarietyX = (varietyRNG() - 0.5) * 2.0;
        const offsetVarietyY = (varietyRNG() - 0.5) * 2.0;
        const iterVariety = 40 + Math.floor(varietyRNG() * 200);
        
        const densityIndex = Math.floor(varietyRNG() * 4);
        let iterMult = 1.0, layers = 3;
        if (densityIndex === 0) { iterMult = 0.6; layers = 2; }
        else if (densityIndex === 2) { iterMult = 1.2; layers = 3; }
        else if (densityIndex === 3) { iterMult = 1.3; layers = 3; }
        
        return {
            zoom: (0.5 + traitsRNG() * 0.8) * zoomVariety,
            offsetX: (traitsRNG() - 0.5) * 1.0 + offsetVarietyX,
            offsetY: (traitsRNG() - 0.5) * 1.0 + offsetVarietyY,
            baseMaxIter: 60 + Math.floor(traitsRNG() * 140) + iterVariety,
            iterMult: iterMult,
            layers: layers
        };
    }
    
    // ============================================================
    // RENDER HELPERS (IDENTICAL to sketch)
    // ============================================================
    function applyArchetypeGeometry(archetype, x, y) {
        switch(archetype) {
            case "Signal": x *= 0.8; y *= 0.8; break;
            case "Drift": x += Math.sin(y * 2) * 0.4; break;
            case "Rift": x *= 1.6; break;
            case "Core": y *= 0.5; break;
            case "Prism": x = Math.abs(x); y = Math.abs(y); break;
            case "Void": x *= -1; y *= -1; break;
        }
        return { x: x, y: y };
    }
    
    // ============================================================
    // FRACTAL ENGINES (IDENTICAL to sketch)
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
    
    function getDepthFractalValue(x, y, maxIter, layers, iterMult) {
        let depth = 0;
        for (let i = 0; i < layers; i++) {
            const scale = 1 + i * 0.15;
            depth += novaFractalCalc(x * scale, y * scale, Math.floor(maxIter * iterMult * 0.7));
        }
        return depth / layers;
    }
    
    function getPatternValue(x, y, time, engineConfig) {
        const r = Math.sqrt(x * x + y * y);
        const a = Math.atan2(y, x);
        
        if (engineConfig.name === "Echo") {
            let val = Math.sin(a * 3 - r * 12 + time) * 0.4;
            val += Math.sin(a * 6 + r * 6 - time * 0.3) * 0.2;
            return Math.max(0.02, Math.min(0.98, (val + 0.5)));
        } else if (engineConfig.name === "Rupture") {
            let val = Math.sin(a * 8 - r * 25 + time * 2) * 0.3;
            val += Math.sin(a * 16 + r * 15 - time * 1.5) * 0.2;
            val += Math.sin(r * 30) * 0.15;
            return Math.max(0.02, Math.min(0.98, (val + 0.5)));
        } else {
            let val = Math.sin(a * 5 - r * 18 + time) * 0.35;
            val += Math.sin(a * 10 + r * 9 - time * 0.5) * 0.15;
            return Math.max(0.02, Math.min(0.98, (val + 0.5)));
        }
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
            case "Kaleido":
                let angleK = Math.atan2(y, x);
                let radiusK = Math.sqrt(x*x + y*y);
                let segments = 6;
                angleK = (angleK % (Math.PI * 2 / segments));
                if (angleK > Math.PI / segments) angleK = (Math.PI * 2 / segments) - angleK;
                x = Math.cos(angleK) * radiusK;
                y = Math.sin(angleK) * radiusK;
                break;
            case "Vortex":
                let vr = Math.sqrt(x*x + y*y);
                let va = Math.atan2(y, x);
                va += vr * 2.0;
                x = Math.cos(va) * vr;
                y = Math.sin(va) * vr;
                break;
            case "Asymmetrical":
                x *= 1.3;
                y *= 0.6;
                break;
            default: break;
        }
        return { x, y };
    }
    
    function getRichColor(t, colorMood, time, primaryDriver) {
        let r, g, b;
        
        if (primaryDriver === "Color") {
            r = Math.sin(t * 40 + time) * 0.5 + 0.5;
            g = Math.sin(t * 40 + 2.094 + time) * 0.5 + 0.5;
            b = Math.sin(t * 40 + 4.188 + time) * 0.5 + 0.5;
            return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
        }
        
        switch(colorMood) {
            case "Volcanic":
                r = 1.0;
                g = 0.1 + 0.7 * Math.sin(t * 12 + time);
                b = 0.0;
                break;
            case "SolarFlare":
                r = 1.0;
                g = 0.5 + 0.5 * Math.sin(t * 14 + time);
                b = 0.0;
                break;
            default:
                r = Math.sin(t * 25 + time) * 0.7 + 0.5;
                g = Math.sin(t * 25 + 2.094 + time * 1.3) * 0.7 + 0.5;
                b = Math.sin(t * 25 + 4.188 + time * 0.7) * 0.7 + 0.5;
                break;
        }
        return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
    }
    
    // ============================================================
    // COMPLEMENTARY TRAITS UI (Viewer only)
    // ============================================================
    function getComplementaryTraits(rarityClass, awakenedLevel, intensity, tokenNum, primaryDriver, engineType) {
        let mood = intensity > 0.8 ? "Intense" : (intensity > 0.6 ? "Energetic" : (intensity > 0.4 ? "Balanced" : (intensity > 0.2 ? "Calm" : "Dormant")));
        const elements = ["Fire", "Water", "Earth", "Air", "Light", "Shadow", "Crystal", "Void"];
        const element = elements[tokenNum % elements.length];
        return { mood, element, primaryDriver, engineType };
    }
    
    function updateComplementaryUI(complementary) {
        const infoEl = document.getElementById('complementaryInfo');
        if (infoEl) {
            infoEl.innerHTML = `${complementary.engineType} · ${complementary.mood} · ${complementary.element} · Driver: ${complementary.primaryDriver}`;
        }
    }
    
    // ============================================================
    // INTENSITY EFFECTS (Lightweight animation only)
    // ============================================================
    let frameCount = 0;
    
    function applyIntensityEffects(ctx, w, h, intensity, now) {
        frameCount++;
        if (frameCount % 4 !== 0) return;
        
        if (intensity > 0.2) {
            const noiseAmount = 0.008 + intensity * 0.02;
            for (var i = 0; i < 60; i++) {
                if (Math.random() < noiseAmount) {
                    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.12})`;
                    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
                }
            }
        }
        
        if (Math.random() < 0.002 * intensity) {
            const shiftX = (Math.random() - 0.5) * 2;
            ctx.drawImage(ctx.canvas, shiftX, 0);
        }
        
        if (intensity > 0.3) {
            const vignetteStrength = intensity * 0.08;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.7, `rgba(0,0,0,${vignetteStrength * 0.3})`);
            gradient.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(10, 670, 100, 4);
        ctx.fillStyle = `hsl(${intensity * 120}, 100%, 50%)`;
        ctx.fillRect(10, 670, intensity * 100, 4);
    }
    
    // ============================================================
    // RENDER ENGINE (EXACT pipeline as sketch)
    // ============================================================
    let canvas, ctx;
    let offscreen, offCtx;
    let w = 320, h = 320;
    let currentTraits = null;
    let masterSeed = null;
    let baseTraits = null;
    let deterministicPhase = 0;
    let canonicalTimeValue = 0;
    let tokenId = null;
    let startTime = null;
    let animationId = null;
    
    // Animation ONLY applied after field computation
    let animatedPulse = 0.96;
    let timeOffset = 0;
    
    function updateOffscreen() {
        const newW = 320;
        const newH = 320;
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
        
        // Gentle animation applied AFTER field computation
        timeOffset = now;
        animatedPulse = 0.96 + Math.sin(now * 0.0005) * 0.02;
        
        try {
            updateOffscreen();
            const imgData = offCtx.createImageData(w, h);
            const data = imgData.data;
            
            // FROZEN time for core field computation (matches mint)
            const frozenTime = canonicalTimeValue;  // NOT animated
            
            const zoom = baseTraits?.zoom || 1.0;
            let offsetX = baseTraits?.offsetX || 0;
            let offsetY = baseTraits?.offsetY || 0;
            const maxIter = baseTraits?.baseMaxIter || 120;
            const layers = baseTraits?.layers || 3;
            const iterMult = baseTraits?.iterMult || 1.0;
            
            const tokenNum = parseInt(tokenId) || 1;
            const engineConfig = currentTraits["Engine Config"];
            const primaryDriver = currentTraits["Primary Driver"];
            const isRupture = engineConfig.name === "Rupture";
            const isEcho = engineConfig.name === "Echo";
            const isGrailFlag = currentTraits["Rarity Class"] === RARITY_CLASSES.GRAIL;
            const anomalyClass = currentTraits["Anomaly Class"];
            
            const complementary = getComplementaryTraits(currentTraits["Rarity Class"], awakenedLevel, liveIntensity, tokenNum, primaryDriver, engineConfig.name);
            updateComplementaryUI(complementary);
            
            const fw = engineConfig.fractalWeight;
            const pw = engineConfig.patternWeight;
            
            const goldenOffsetX = (w / 1.618 - w/2) / w * 0.3;
            const goldenOffsetY = (h / 1.618 - h/2) / h * 0.3;
            const adjustedOffsetX = offsetX + goldenOffsetX;
            const adjustedOffsetY = offsetY + goldenOffsetY;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    // ============================================================
                    // EXACT PIPELINE FROM sketch.js
                    // ============================================================
                    
                    let ux = (x / w) * 4.0 - 2.5;
                    let uy = (y / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits["Spatial Behavior"], zoom, adjustedOffsetX, adjustedOffsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let geo = applyArchetypeGeometry(currentTraits["Archetype"], rx, ry);
                    rx = geo.x;
                    ry = geo.y;
                    
                    // Coordinate scaling
                    rx *= 1.2;
                    ry *= 1.2;
                    
                    // Composition divergence
                    if (currentTraits["Spatial Behavior"] === "Asymmetrical") {
                        rx += 0.4;
                        ry -= 0.2;
                    }
                    if (currentTraits["Spatial Behavior"] === "FlowField") {
                        rx += Math.sin(ry * 2.5) * 0.3;
                        ry += Math.cos(rx * 2.5) * 0.3;
                    }
                    if (currentTraits["Spatial Behavior"] === "Vortex") {
                        let vr = Math.sqrt(rx*rx + ry*ry);
                        let va = Math.atan2(ry, rx);
                        va += vr * 3.0;
                        rx = Math.cos(va) * vr * 0.8;
                        ry = Math.sin(va) * vr * 0.8;
                    }
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, layers, iterMult);
                    let patternVal = getPatternValue(rx, ry, frozenTime, engineConfig);
                    
                    // Frequency Tiers
                    const frequencyTypes = ["low", "medium", "high", "extreme"];
                    const freqIndex = tokenNum % 4;
                    let freqMultiplier;
                    switch(frequencyTypes[freqIndex]) {
                        case "low": freqMultiplier = 4; break;
                        case "medium": freqMultiplier = 8; break;
                        case "high": freqMultiplier = 14; break;
                        case "extreme": freqMultiplier = 22; break;
                        default: freqMultiplier = 8;
                    }
                    let t = Math.sin((fractalVal + patternVal) * Math.PI * freqMultiplier / 8);
                    t = (t + 1) / 2;
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    // Boost structure contrast
                    t = Math.pow(t, 0.6);
                    
                    // GRAIL ANOMALY OVERRIDES
                    if (isGrailFlag && anomalyClass) {
                        if (anomalyClass === "Interference") {
                            let t2 = Math.sin((fractalVal + patternVal) * Math.PI * 18 / 8);
                            t2 = (t2 + 1) / 2;
                            t = (t + t2) / 2;
                        } else if (anomalyClass === "Collapse") {
                            let r_center = Math.sqrt((rx-0.5)*(rx-0.5) + (ry-0.5)*(ry-0.5));
                            let collapse = Math.max(0, 1 - r_center * 2);
                            t = t * (1 - collapse * 0.7);
                        } else if (anomalyClass === "EchoLoop") {
                            let r_ring = Math.sqrt(rx*rx + ry*ry);
                            let ring = Math.sin(r_ring * 15) * 0.3;
                            t = t * 0.7 + ring * 0.3;
                        }
                        t = Math.max(0.03, Math.min(0.97, t));
                        t = Math.pow(t, 0.3);
                    }
                    
                    // Variation guard
                    let variation = Math.abs(fractalVal - patternVal);
                    if (variation < 0.02) {
                        t += (Math.sin(rx * 12.3 + ry * 7.1) * 0.5 + 0.5) * 0.15;
                    }
                    if (variation < 0.01) {
                        const fallback = Math.sin(rx * 8 + ry * 8) * 0.5 + 0.5;
                        if (isGrailFlag) {
                            t = t * 0.82 + fallback * 0.18;
                        } else {
                            t = t * 0.7 + fallback * 0.3;
                        }
                    }
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    t = signatureContrast(t);
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", frozenTime, primaryDriver);
                    
                    const sigColor = signatureColor(t, frozenTime);
                    
                    // Reduced color dominance
                    r = r * 0.8 + sigColor.r * 0.2;
                    g = g * 0.8 + sigColor.g * 0.2;
                    b = b * 0.8 + sigColor.b * 0.2;
                    
                    // SpectralSplit Grail: break color harmony
                    if (isGrailFlag && anomalyClass === "SpectralSplit") {
                        r = r * 1.3;
                        g = g * 0.7;
                        b = b * 1.1;
                    }
                    
                    // ============================================================
                    // ANIMATION ONLY ADDED HERE (AFTER field computation)
                    // ============================================================
                    r = r * animatedPulse;
                    g = g * animatedPulse;
                    b = b * animatedPulse;
                    
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
            
            applyIntensityEffects(ctx, 700, 700, liveIntensity, now);
            
        } catch(e) {
            console.error("Render error:", e);
        }
    }
    
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        const elapsed = timestamp - startTime;
        renderFrame(elapsed);
        animationId = requestAnimationFrame(animate);
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
        
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) streamRNGs[i] = splitSeed(masterSeed, i);
        
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) if(streamRNGs[s]) streamRNGs[s]();
        }
        
        const traitsRNG = streamRNGs[1];
        const tokenNum = parseInt(tokenId) || 1;
        
        currentTraits = generateCollectionTraits(traitsRNG, tokenNum);
        baseTraits = generateBaseTraits(masterSeed, tokenId);
        
        const intensityRand = makeSeededRand(masterSeed);
        const deterministicIntensity = 0.2 + intensityRand() * 0.7;
        deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
        canonicalTimeValue = deterministicTime(tokenId, masterSeed, deterministicIntensity);
        
        fetchIntensity();
        setInterval(fetchIntensity, 30000);
        
        startTime = null;
        animationId = requestAnimationFrame(animate);
        
        console.log("Viewer ready - Token:", tokenId);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();