// ============================================================
// ART OF FARCASTER - VIEWER v28.2
// Full deterministic engine + Debug Mode + Canonical Mode
// ============================================================

(function() {
    "use strict";
    
    // ============================================================
    // DEBUG CONFIGURATION (must match mint script)
    // ============================================================
    const DEBUG_MODE = true;                    // Enable debug overrides
    const FORCE_GRAIL_PERCENT = 80;             // 80% chance to roll Grail when DEBUG_MODE = true
    const ONLY_MYTHIC_RARE_UNCOMMON = true;     // If true, Common is replaced by Uncommon
    const BALANCE_NON_CANONICAL_ENGINES = true; // Echo and Rupture get equal 35% each (Canonical 30%)
    const CANONICAL_MODE = false;               // Set true to disable live intensity & animation (match mint exactly)
    
    // ============================================================
    // SIGNATURE FUNCTIONS
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
    // ENGINE-SPECIFIC SHAPING FUNCTIONS
    // ============================================================
    function engineFrequencyShape(t, engineName, freqMultiplier) {
        let out;
        if (engineName === "Canonical") {
            out = Math.sin(t * Math.PI * freqMultiplier * 0.8);
            out = (out + 1) / 2;
        } else if (engineName === "Echo") {
            const a = Math.sin(t * Math.PI * freqMultiplier * 0.55);
            const b = Math.cos(t * Math.PI * 2.0);
            out = (a * 0.65 + b * 0.35 + 1) / 2;
        } else {
            out = Math.sin(t * Math.PI * freqMultiplier * 1.35);
            out = (out + 1) / 2;
        }
        return Math.max(0.03, Math.min(0.97, out));
    }
    
    function engineContrastShape(t, engineName) {
        const s = signatureContrast(t);
        if (engineName === "Canonical") return Math.pow(s, 0.92);
        if (engineName === "Echo") return Math.pow(s, 1.12);
        return Math.pow(s, 0.68);
    }
    
    function engineColorDiscipline(r, g, b, engineName, t, time) {
        if (engineName === "Canonical") {
            return { r: r * 0.96, g: g * 0.96, b: b * 0.96 };
        }
        if (engineName === "Echo") {
            return {
                r: r * 0.92 + (Math.sin(time + t * 4) * 0.5 + 0.5) * 0.08,
                g: g * 0.92 + (Math.sin(time + 2.094 + t * 4) * 0.5 + 0.5) * 0.08,
                b: b * 0.92 + (Math.sin(time + 4.188 + t * 4) * 0.5 + 0.5) * 0.08
            };
        }
        return {
            r: Math.min(1, r * 1.06),
            g: g * 0.88,
            b: Math.min(1, b * 1.03)
        };
    }
    
    // ============================================================
    // CONFIG
    // ============================================================
    const LOG2 = Math.log(2);
    const RARITY_CLASSES = { COMMON: "Common", UNCOMMON: "Uncommon", RARE: "Rare", MYTHIC: "Mythic", GRAIL: "Grail" };
    const ARCHETYPES = ["Signal", "Drift", "Rift", "Core", "Prism", "Void"];
    const ANCHOR_FORMS = ["Aether", "PrismHeart", "Faultline", "Gate", "Nexus", "Bloom"];
    const ENGINE_TYPES = ["Canonical", "Echo", "Rupture"];
    const PRIMARY_DRIVERS = ["Fractal", "Pattern", "Color", "Composition"];
    const STRUCTURE_TYPES = ["Nova", "Lattice", "Field", "Wave", "Grid", "Drift"];
    const SPATIAL_BEHAVIORS = ["Radial", "Spiral", "FlowField", "Kaleido", "Vortex", "Asymmetrical"];
    const ANOMALY_CLASSES = ["Interference", "Collapse", "EchoLoop", "SpectralSplit"];
    const FAILURE_MODES = ["Recovering", "Residual", "VoidBloom", "Fracture"];
    
    // ============================================================
    // HELPER FUNCTIONS
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
    
    // ============================================================
    // RARITY ROLL (with debug override)
    // ============================================================
    function rollRarityClass(rng) {
        if (DEBUG_MODE && FORCE_GRAIL_PERCENT > 0) {
            const r = rng();
            if (r * 100 < FORCE_GRAIL_PERCENT) return RARITY_CLASSES.GRAIL;
        }
        const r = rng();
        if (r < 0.60) return RARITY_CLASSES.COMMON;
        if (r < 0.85) return RARITY_CLASSES.UNCOMMON;
        if (r < 0.95) return RARITY_CLASSES.RARE;
        if (r < 0.99) return RARITY_CLASSES.MYTHIC;
        return RARITY_CLASSES.GRAIL;
    }
    
    // ============================================================
    // ARCHETYPE & ANCHOR FORM
    // ============================================================
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
    
    // ============================================================
    // ENGINE TYPE ROLL (with debug balancing)
    // ============================================================
    function rollEngineType(rng, rarityClass) {
        if (DEBUG_MODE && BALANCE_NON_CANONICAL_ENGINES) {
            const r = rng();
            if (r < 0.30) return "Canonical";
            if (r < 0.65) return "Echo";
            return "Rupture";
        }
        if (rarityClass === RARITY_CLASSES.GRAIL) {
            return weightedPick(ENGINE_TYPES, [0.10, 0.20, 0.70], rng);
        }
        return weightedPick(ENGINE_TYPES, [0.78, 0.19, 0.03], rng);
    }
    
    // ============================================================
    // ENGINE CONFIGURATION
    // ============================================================
    function getEngineConfig(engineType) {
        switch (engineType) {
            case "Canonical":
                return { fractalWeight: 0.7, patternWeight: 0.3, allowedCompositions: ["Radial", "Spiral", "Kaleido"], name: "Canonical" };
            case "Echo":
                return { fractalWeight: 0.35, patternWeight: 0.65, allowedCompositions: ["FlowField", "Vortex", "Asymmetrical"], name: "Echo" };
            default:
                return { fractalWeight: 0.5, patternWeight: 0.5, allowedCompositions: ["Asymmetrical", "Vortex", "Radial"], name: "Rupture" };
        }
    }
    
    // ============================================================
    // PRIMARY DRIVER, STRUCTURE TYPE, COLOR MOOD
    // ============================================================
    function rollPrimaryDriver(rng) {
        return weightedPick(PRIMARY_DRIVERS, [0.35, 0.25, 0.25, 0.15], rng);
    }
    
    function rollStructureType(rng) {
        return STRUCTURE_TYPES[Math.floor(rng() * STRUCTURE_TYPES.length)];
    }
    
    function rollColorMood(rng) {
        const colors = ["Ethereal", "Volcanic", "StellarDrift", "Nebula", "SolarFlare", "DeepVoid", "PrismCore", "AuroraBorealis"];
        return colors[Math.floor(rng() * colors.length)];
    }
    
    // ============================================================
    // FAILURE MODE & ANOMALY
    // ============================================================
    function rollFailureMode(rng, engineType, rarityClass) {
        if (rarityClass === "Grail") {
            if (engineType === "Rupture") {
                return weightedPick(FAILURE_MODES, [0.05, 0.10, 0.15, 0.70], rng);
            }
            if (engineType === "Echo") {
                return weightedPick(FAILURE_MODES, [0.10, 0.45, 0.30, 0.15], rng);
            }
            return weightedPick(FAILURE_MODES, [0.30, 0.35, 0.25, 0.10], rng);
        }
        if (engineType === "Canonical") {
            return weightedPick(FAILURE_MODES, [0.70, 0.20, 0.08, 0.02], rng);
        }
        if (engineType === "Echo") {
            return weightedPick(FAILURE_MODES, [0.30, 0.45, 0.20, 0.05], rng);
        }
        return weightedPick(FAILURE_MODES, [0.15, 0.20, 0.15, 0.50], rng);
    }
    
    function rollAnomalyClass(rng) {
        return weightedPick(ANOMALY_CLASSES, [0.25, 0.25, 0.25, 0.25], rng);
    }
    
    // ============================================================
    // TRAIT GENERATION
    // ============================================================
    function generateCollectionTraits(rng, tokenNum) {
        let rarityClass = rollRarityClass(rng);
        if (DEBUG_MODE && ONLY_MYTHIC_RARE_UNCOMMON && rarityClass === RARITY_CLASSES.COMMON) {
            rarityClass = RARITY_CLASSES.UNCOMMON;
        }
        const archetype = rollArchetype(rarityClass, rng);
        const anchorForm = rollAnchorForm(archetype, rng);
        const engineType = rollEngineType(rng, rarityClass);
        const primaryDriver = rollPrimaryDriver(rng);
        const engineConfig = getEngineConfig(engineType);
        const spatialBehavior = engineConfig.allowedCompositions[Math.floor(rng() * engineConfig.allowedCompositions.length)];
        const colorMood = rollColorMood(rng);
        const structureType = rollStructureType(rng);
        const failureMode = rollFailureMode(rng, engineType, rarityClass);
        
        const traits = {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Engine Type": engineType,
            "Primary Driver": primaryDriver,
            "Color Mood": colorMood,
            "Spatial Behavior": spatialBehavior,
            "Structure Type": structureType,
            "Engine Config": engineConfig,
            "Failure Mode": failureMode
        };
        
        if (rarityClass === RARITY_CLASSES.GRAIL) {
            traits["Anomaly Class"] = rollAnomalyClass(rng);
        }
        
        return traits;
    }
    
    // ============================================================
    // LIVE INTENSITY API (Viewer only - skipped in CANONICAL_MODE)
    // ============================================================
    let liveIntensity = 0.5;
    let awakenedLevel = "base";
    
    function fetchIntensity() {
        if (CANONICAL_MODE) return;
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
    // BASE TRAITS GENERATION
    // ============================================================
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
    // RENDER HELPERS
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
            case "Radial": const r = Math.sqrt(x*x+y*y); const a = Math.atan2(y,x); x = a; y = r; break;
            case "Spiral": const sr = Math.sqrt(x*x+y*y); const sa = Math.atan2(y,x); const spiralR = Math.pow(sr,0.7)*1.5; x = Math.cos(sa+spiralR*4)*spiralR; y = Math.sin(sa+spiralR*4)*spiralR; break;
            case "FlowField": const angle = Math.sin(x*3)*Math.cos(y*3); const cosA = Math.cos(angle); const sinA = Math.sin(angle); const nx = x*cosA - y*sinA; const ny = x*sinA + y*cosA; x = nx; y = ny; break;
            case "Kaleido": let angleK = Math.atan2(y, x); let radiusK = Math.sqrt(x*x + y*y); let segments = 6; angleK = (angleK % (Math.PI * 2 / segments)); if (angleK > Math.PI / segments) angleK = (Math.PI * 2 / segments) - angleK; x = Math.cos(angleK) * radiusK; y = Math.sin(angleK) * radiusK; break;
            case "Vortex": let vr = Math.sqrt(x*x + y*y); let va = Math.atan2(y, x); va += vr * 2.0; x = Math.cos(va) * vr; y = Math.sin(va) * vr; break;
            case "Asymmetrical": x *= 1.3; y *= 0.6; break;
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
            case "Volcanic": r = 1.0; g = 0.1 + 0.7 * Math.sin(t * 12 + time); b = 0.0; break;
            case "SolarFlare": r = 1.0; g = 0.5 + 0.5 * Math.sin(t * 14 + time); b = 0.0; break;
            default: r = Math.sin(t * 25 + time) * 0.7 + 0.5; g = Math.sin(t * 25 + 2.094 + time * 1.3) * 0.7 + 0.5; b = Math.sin(t * 25 + 4.188 + time * 0.7) * 0.7 + 0.5; break;
        }
        return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
    }
    
    // ============================================================
    // COMPLEMENTARY TRAITS UI
    // ============================================================
    function getComplementaryTraits(rarityClass, awakenedLevel, intensity, tokenNum, primaryDriver, engineType, failureMode) {
        let mood = intensity > 0.8 ? "Intense" : (intensity > 0.6 ? "Energetic" : (intensity > 0.4 ? "Balanced" : (intensity > 0.2 ? "Calm" : "Dormant")));
        const elements = ["Fire", "Water", "Earth", "Air", "Light", "Shadow", "Crystal", "Void"];
        const element = elements[tokenNum % elements.length];
        return { mood, element, primaryDriver, engineType, failureMode };
    }
    
    function updateComplementaryUI(complementary) {
        const infoEl = document.getElementById('complementaryInfo');
        if (infoEl) {
            infoEl.innerHTML = `${complementary.engineType} · ${complementary.failureMode} · ${complementary.mood} · ${complementary.element} · Driver: ${complementary.primaryDriver}`;
        }
    }
    
    // ============================================================
    // INTENSITY EFFECTS (Viewer only - skipped in CANONICAL_MODE)
    // ============================================================
    let frameCount = 0;
    let animatedPulse = 0.94;
    
    function applyIntensityEffects(ctx, w, h, intensity, now) {
        if (CANONICAL_MODE) return;
        
        frameCount++;
        if (frameCount % 3 !== 0) return;
        
        animatedPulse = 0.88 + Math.sin(now * 0.0012) * 0.1;
        
        if (intensity > 0.15) {
            const noiseAmount = 0.02 + intensity * 0.06;
            for (var i = 0; i < 120; i++) {
                if (Math.random() < noiseAmount) {
                    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.25})`;
                    ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
                }
            }
        }
        
        if (Math.random() < 0.008 * intensity) {
            const shiftX = (Math.random() - 0.5) * 4;
            ctx.drawImage(ctx.canvas, shiftX, 0);
        }
        
        if (Math.random() < 0.015 * intensity) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            for (var i = 0; i < data.length; i += 4) {
                if (Math.random() < 0.08) {
                    const temp = data[i];
                    data[i] = data[i+2];
                    data[i+2] = temp;
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
        
        if (intensity > 0.25) {
            const vignetteStrength = intensity * 0.2;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.6, `rgba(0,0,0,${vignetteStrength * 0.25})`);
            gradient.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10, 670, 100, 5);
        ctx.fillStyle = `hsl(${intensity * 120}, 100%, 55%)`;
        ctx.fillRect(10, 670, intensity * 100, 5);
        
        const hue = (now * 0.03 + intensity * 360) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${intensity * 0.08})`;
        ctx.fillRect(0, 0, w, h);
    }
    
    // ============================================================
    // RENDER ENGINE
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
        
        try {
            updateOffscreen();
            const imgData = offCtx.createImageData(w, h);
            const data = imgData.data;
            const intensity = liveIntensity;
            const frozenTime = canonicalTimeValue;
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
            const failureMode = currentTraits["Failure Mode"] || "Recovering";
            
            const complementary = getComplementaryTraits(currentTraits["Rarity Class"], awakenedLevel, liveIntensity, tokenNum, primaryDriver, engineConfig.name, failureMode);
            updateComplementaryUI(complementary);
            
            // Frequency index from seed (better distribution)
            const freqSeed = makeSeededRand(masterSeed)();
            const freqIndex = Math.floor(freqSeed * 4);
            
            const goldenOffsetX = (w / 1.618 - w/2) / w * 0.3;
            const goldenOffsetY = (h / 1.618 - h/2) / h * 0.3;
            const adjustedOffsetX = offsetX + goldenOffsetX;
            const adjustedOffsetY = offsetY + goldenOffsetY;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let ux = (x / w) * 4.0 - 2.5;
                    let uy = (y / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits["Spatial Behavior"], zoom, adjustedOffsetX, adjustedOffsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let geo = applyArchetypeGeometry(currentTraits["Archetype"], rx, ry);
                    rx = geo.x;
                    ry = geo.y;
                    
                    rx *= 1.2;
                    ry *= 1.2;
                    
                    if (currentTraits["Spatial Behavior"] === "Asymmetrical") { rx += 0.4; ry -= 0.2; }
                    if (currentTraits["Spatial Behavior"] === "FlowField") { rx += Math.sin(ry * 2.5) * 0.3; ry += Math.cos(rx * 2.5) * 0.3; }
                    if (currentTraits["Spatial Behavior"] === "Vortex") {
                        let vr = Math.sqrt(rx*rx + ry*ry);
                        let va = Math.atan2(ry, rx);
                        va += vr * 3.0;
                        rx = Math.cos(va) * vr * 0.8;
                        ry = Math.sin(va) * vr * 0.8;
                    }
                    
                    if (isRupture) {
                        let t_temp = canonicalTimeValue;
                        rx += Math.sin(ry * 6 + t_temp * 4) * 0.15;
                        ry += Math.cos(rx * 6 - t_temp * 4) * 0.15;
                    }
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, layers, iterMult);
                    let patternVal = getPatternValue(rx, ry, frozenTime, engineConfig);
                    
                    let t;
                    if (isRupture) {
                        t = Math.abs(fractalVal - patternVal) + Math.sin(rx * ry * 2.5) * 0.2;
                    } else if (isEcho) {
                        t = fractalVal * 0.35 + patternVal * 0.65;
                        t = t * 0.8 + Math.sin(t * Math.PI * 2) * 0.2;
                        t = t * 0.8 + Math.sin(t * Math.PI * 2 + Math.sin(t * 6)) * 0.2;
                    } else {
                        t = fractalVal * 0.75 + patternVal * 0.25;
                    }
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    // GRAIL FIRST (before frequency)
                    if (isGrailFlag && anomalyClass) {
                        if (anomalyClass === "Interference") {
                            if (engineConfig.name === "Canonical") {
                                const t2 = Math.sin((fractalVal + patternVal) * Math.PI * 12 / 8);
                                t = (t + ((t2 + 1) / 2)) * 0.5;
                            } else if (engineConfig.name === "Echo") {
                                const echoMix = Math.cos((fractalVal * 0.6 + patternVal * 1.4) * Math.PI * 2.5);
                                t = t * 0.65 + ((echoMix + 1) / 2) * 0.35;
                            } else {
                                const t2 = Math.sin((fractalVal - patternVal) * Math.PI * 20);
                                t = Math.abs(t - ((t2 + 1) / 2));
                            }
                        } else if (anomalyClass === "Collapse") {
                            const rc = Math.sqrt((rx - 0.5) * (rx - 0.5) + (ry - 0.5) * (ry - 0.5));
                            const collapse = Math.max(0, 1 - rc * 2);
                            if (engineConfig.name === "Canonical") {
                                t = t * (1 - collapse * 0.55);
                            } else if (engineConfig.name === "Echo") {
                                t = t * (1 - collapse * 0.35) + collapse * 0.15;
                            } else {
                                t = t * (1 - collapse * 0.85);
                            }
                        } else if (anomalyClass === "EchoLoop") {
                            const rr = Math.sqrt(rx * rx + ry * ry);
                            const ring = Math.sin(rr * 15) * 0.3;
                            if (engineConfig.name === "Canonical") {
                                t = t * 0.78 + ring * 0.22;
                            } else if (engineConfig.name === "Echo") {
                                const loop = Math.sin(rr * 9 + t * Math.PI * 4) * 0.5 + 0.5;
                                t = t * 0.5 + loop * 0.5;
                            } else {
                                t = t * 0.6 + Math.abs(ring) * 0.4;
                            }
                        } else if (anomalyClass === "SpectralSplit") {
                            t = Math.pow(t, engineConfig.name === "Rupture" ? 0.45 : 0.6);
                        }
                        t = Math.max(0.03, Math.min(0.97, t));
                        t = Math.pow(t, engineConfig.name === "Rupture" ? 0.18 : 0.25);
                    }
                    
                    // Frequency AFTER Grail
                    let freqMultiplier;
                    switch (freqIndex) {
                        case 0: freqMultiplier = 3; break;
                        case 1: freqMultiplier = 6; break;
                        case 2: freqMultiplier = 10; break;
                        default: freqMultiplier = 16; break;
                    }
                    t = engineFrequencyShape(t, engineConfig.name, freqMultiplier);
                    t = Math.pow(t, 0.6);
                    
                    // FAILURE MODE RESPONSE
                    let variation = Math.abs(fractalVal - patternVal);
                    if (variation < 0.02) {
                        t += (Math.sin(rx * 12.3 + ry * 7.1) * 0.5 + 0.5) * 0.12;
                    }
                    if (variation < 0.01) {
                        const fallback = Math.sin(rx * 8 + ry * 8) * 0.5 + 0.5;
                        if (failureMode === "Recovering") {
                            if (engineConfig.name === "Canonical") {
                                t = t * 0.65 + fallback * 0.35;
                            } else if (engineConfig.name === "Echo") {
                                t = t * 0.75 + fallback * 0.25;
                            } else {
                                t = t * 0.90 + fallback * 0.10;
                            }
                        } else if (failureMode === "Residual") {
                            t = t * 0.88 + fallback * 0.12;
                        } else if (failureMode === "VoidBloom") {
                            const bloom = Math.exp(-(rx * rx + ry * ry) * 1.8);
                            t = t * 0.7 + bloom * 0.3;
                        } else if (failureMode === "Fracture") {
                            const crack = Math.abs(Math.sin(rx * 18 - ry * 11));
                            t = t * 0.6 + crack * 0.4;
                        }
                    }
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    t = engineContrastShape(t, engineConfig.name);
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", frozenTime, primaryDriver);
                    
                    let colorDisciplined = engineColorDiscipline(r, g, b, engineConfig.name, t, frozenTime);
                    r = colorDisciplined.r;
                    g = colorDisciplined.g;
                    b = colorDisciplined.b;
                    
                    const sigColor = signatureColor(t, frozenTime);
                    r = r * 0.65 + sigColor.r * 0.35;
                    g = g * 0.65 + sigColor.g * 0.35;
                    b = b * 0.65 + sigColor.b * 0.35;
                    
                    if (isGrailFlag && anomalyClass === "SpectralSplit") {
                        if (engineConfig.name === "Canonical") {
                            r = Math.min(1, r * 1.18);
                            g = g * 0.78;
                            b = Math.min(1, b * 1.08);
                        } else if (engineConfig.name === "Echo") {
                            r = r * 0.82 + (Math.sin(frozenTime + t * 10) * 0.5 + 0.5) * 0.28;
                            g = g * 0.7;
                            b = b * 0.82 + (Math.cos(frozenTime + t * 10) * 0.5 + 0.5) * 0.28;
                        } else {
                            r = Math.min(1, r * 1.35);
                            g = g * 0.58;
                            b = Math.min(1, b * 1.18);
                        }
                    }
                    
                    // Animation applied only in live mode
                    if (!CANONICAL_MODE) {
                        r = r * animatedPulse;
                        g = g * animatedPulse;
                        b = b * animatedPulse;
                    }
                    
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
            
            // Intensity effects only in live mode
            if (!CANONICAL_MODE) {
                applyIntensityEffects(ctx, 700, 700, liveIntensity, now);
            }
            
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
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
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
        let txHash = params.get('txHash') || params.get('h');
        
        // Validate txHash - hard fail if missing
        if (!txHash || txHash === "0x0") {
            console.error("❌ Missing txHash - cannot render canonical token");
            ctx.fillStyle = '#ff4444';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Error: Missing txHash', 350, 350);
            return;
        }
        
        console.log("Token:", tokenId, "TX:", txHash);
        
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
        
        // Only fetch live intensity in non-canonical mode
        if (!CANONICAL_MODE) {
            fetchIntensity();
            setInterval(fetchIntensity, 15000);
        }
        
        startTime = null;
        animationId = requestAnimationFrame(animate);
        
        console.log("Viewer ready - Token:", tokenId, "Canonical Mode:", CANONICAL_MODE);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();