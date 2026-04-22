// ============================================================
// ART OF FARCASTER - VIEWER v15.0
// 3-ENGINE SYSTEM: Canonical (78%) | Echo (19%) | Rupture (3%)
// + Engine-based rendering + Grail overrides + Awakening integration
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
    // ENGINE TYPES (Top-level trait)
    // ============================================================
    const ENGINE_TYPES = ["Canonical", "Echo", "Rupture"];
    
    function weightedPick(items, weights, rng) {
        const r = rng();
        let sum = 0;
        for (let i = 0; i < items.length; i++) {
            sum += weights[i];
            if (r < sum) return items[i];
        }
        return items[items.length - 1];
    }
    
    function rollEngineType(rng, rarityClass) {
        if (rarityClass === "Grail") {
            return weightedPick(
                ["Canonical", "Echo", "Rupture"],
                [0.10, 0.20, 0.70],
                rng
            );
        }
        return weightedPick(
            ["Canonical", "Echo", "Rupture"],
            [0.78, 0.19, 0.03],
            rng
        );
    }
    
    // ============================================================
    // GRAIL DRIVER
    // ============================================================
    const GRAIL_DRIVERS = ["Interference", "Collapse", "EchoLoop", "SpectralSplit"];
    
    function rollGrailDriver(rng) {
        return weightedPick(GRAIL_DRIVERS, [0.25, 0.25, 0.25, 0.25], rng);
    }
    
    // ============================================================
    // ENGINE CONFIGURATION
    // ============================================================
    function getEngineConfig(engineType) {
        switch (engineType) {
            case "Canonical":
                return {
                    fractalWeight: 0.7,
                    patternWeight: 0.3,
                    allowedCompositions: ["Centered", "Radial", "Spiral", "Kaleido"],
                    paletteMode: "disciplined",
                    distortionStrength: 0.12,
                    hasExtraGlow: false,
                    name: "Canonical"
                };
            case "Echo":
                return {
                    fractalWeight: 0.35,
                    patternWeight: 0.65,
                    allowedCompositions: ["FlowField", "Tunnel", "Vortex", "Warp"],
                    paletteMode: "atmospheric",
                    distortionStrength: 0.28,
                    hasExtraGlow: false,
                    name: "Echo"
                };
            case "Rupture":
                return {
                    fractalWeight: 0.5,
                    patternWeight: 0.5,
                    allowedCompositions: ["Asymmetrical", "Diagonal", "Mosaic", "Offset"],
                    paletteMode: "forbidden",
                    distortionStrength: 0.45,
                    hasExtraGlow: true,
                    name: "Rupture"
                };
            default:
                return {
                    fractalWeight: 0.5,
                    patternWeight: 0.5,
                    allowedCompositions: ["Centered"],
                    paletteMode: "disciplined",
                    distortionStrength: 0.2,
                    hasExtraGlow: false,
                    name: "Canonical"
                };
        }
    }
    
    // ============================================================
    // PRIMARY VISUAL DRIVER
    // ============================================================
    const PRIMARY_DRIVERS = ["Fractal", "Pattern", "Color", "Composition"];
    
    // ============================================================
    // LIVE INTENSITY API
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
        const engineType = rollEngineType(rng, rarityClass);
        const primaryDriver = weightedPick(PRIMARY_DRIVERS, [0.35, 0.25, 0.25, 0.15], rng);
        const engineConfig = getEngineConfig(engineType);
        
        const composition = engineConfig.allowedCompositions[Math.floor(rng() * engineConfig.allowedCompositions.length)];
        
        const colors = engineConfig.paletteMode === "disciplined" 
            ? ["Ethereal", "PrismCore", "AuroraBorealis", "StellarDrift"]
            : engineConfig.paletteMode === "atmospheric"
            ? ["Nebula", "DeepVoid", "StellarDrift", "AuroraBorealis"]
            : ["Volcanic", "SolarFlare", "CrimsonDawn", "DeepVoid", "Chromatic"];
        const colorMood = colors[Math.floor(rng() * colors.length)];
        
        const fractals = ["Nova", "Julia", "Mandelbrot", "Barnsley", "Dragon", "Magnet"];
        const fractalType = fractals[Math.floor(rng() * fractals.length)];
        
        const densities = ["Sparse", "Medium", "Dense", "HyperDense"];
        const density = densities[Math.floor(rng() * densities.length)];
        
        const traits = {
            "Rarity Class": rarityClass,
            "Archetype": archetype,
            "Anchor Form": anchorForm,
            "Engine Type": engineType,
            "Primary Driver": primaryDriver,
            "Color Mood": colorMood,
            "Composition": composition,
            "Fractal Type": fractalType,
            "Density": density,
            "Engine Config": engineConfig
        };
        
        if (rarityClass === "Grail") {
            traits["Grail Driver"] = rollGrailDriver(rng);
        }
        
        return traits;
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
        
        const zoomVariety = 0.5 + varietyRNG() * 1.3;
        const offsetVarietyX = (varietyRNG() - 0.5) * 2.0;
        const offsetVarietyY = (varietyRNG() - 0.5) * 2.0;
        const iterVariety = 40 + Math.floor(varietyRNG() * 200);
        
        return {
            zoom: (0.5 + traitsRNG() * 0.8) * zoomVariety,
            offsetX: (traitsRNG() - 0.5) * 1.0 + offsetVarietyX,
            offsetY: (traitsRNG() - 0.5) * 1.0 + offsetVarietyY,
            baseMaxIter: 60 + Math.floor(traitsRNG() * 140) + iterVariety
        };
    }

    // ============================================================
    // RENDER HELPERS
    // ============================================================
    function getDensityMultiplier(density) {
        switch(density) {
            case "Sparse": return { iterMult: 0.6, layers: 2 };
            case "Medium": return { iterMult: 1.0, layers: 3 };
            case "Dense": return { iterMult: 1.3, layers: 4 };
            case "HyperDense": return { iterMult: 1.6, layers: 5 };
            default: return { iterMult: 1.0, layers: 3 };
        }
    }

    // ============================================================
    // AWAKENING INTEGRATION (Engine evolution)
    // ============================================================
    function applyAwakeningToEngine(rx, ry, engineConfig, awakeningLevel, time) {
        let result = { x: rx, y: ry };
        
        if (awakeningLevel === "awakened") {
            if (engineConfig.name === "Echo") {
                result.x += Math.sin(time + ry * 2) * 0.2;
            } else if (engineConfig.name === "Canonical") {
                result.x *= 1.1;
                result.y *= 1.1;
            }
        } else if (awakeningLevel === "ascended") {
            if (engineConfig.name === "Rupture") {
                result.x = Math.sin(rx * ry);
                result.y = Math.cos(rx * ry);
            } else if (engineConfig.name === "Echo") {
                let r = Math.sqrt(rx*rx + ry*ry);
                let a = Math.atan2(ry, rx);
                a += Math.sin(r * 5 + time);
                result.x = Math.cos(a) * r;
                result.y = Math.sin(a) * r;
            } else {
                result.x *= 1.2;
                result.y *= 1.2;
            }
        }
        
        return result;
    }

    // ============================================================
    // ARCHETYPE GEOMETRY
    // ============================================================
    function applyArchetypeGeometry(archetype, x, y, engineConfig) {
        let result = { x: x, y: y };
        
        if (engineConfig.name === "Echo") {
            result.x += Math.sin(result.y * 2) * 0.3;
        } else if (engineConfig.name === "Rupture") {
            result.x = Math.sin(result.x * result.y);
            result.y = Math.cos(result.x * result.y);
        }
        
        switch(archetype) {
            case "Signal":
                result.x *= 0.8;
                result.y *= 0.8;
                break;
            case "Drift":
                result.x += Math.sin(result.y * 2) * 0.4;
                break;
            case "Rift":
                result.x *= 1.6;
                break;
            case "Core":
                result.y *= 0.5;
                break;
            case "Prism":
                result.x = Math.abs(result.x);
                result.y = Math.abs(result.y);
                break;
            case "Void":
                result.x *= -1;
                result.y *= -1;
                break;
        }
        return result;
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

    function getFractalTypeMultiplier(fractalType) {
        const multipliers = {
            "Nova": { xScale: 1.0, yScale: 1.0 },
            "Julia": { xScale: 1.2, yScale: 1.2 },
            "Mandelbrot": { xScale: 0.8, yScale: 0.8 },
            "Barnsley": { xScale: 1.5, yScale: 0.5 },
            "Dragon": { xScale: 1.1, yScale: 1.1 },
            "Magnet": { xScale: 0.9, yScale: 0.9 }
        };
        return multipliers[fractalType] || { xScale: 1.0, yScale: 1.0 };
    }

    function getDepthFractalValue(x, y, maxIter, fractalType, densityConfig) {
        const multi = getFractalTypeMultiplier(fractalType);
        const layers = densityConfig.layers;
        let depth = 0;
        for (let i = 0; i < layers; i++) {
            const scale = (1 + i * 0.12) * multi.xScale;
            const yScale = (1 + i * 0.1) * multi.yScale;
            depth += novaFractalCalc(x * scale, y * yScale, Math.floor(maxIter * densityConfig.iterMult * 0.7));
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

    // ============================================================
    // COMPOSITION TRANSFORM
    // ============================================================
    function applyCompositionTransform(ux, uy, composition, zoom, offsetX, offsetY, engineConfig) {
        let x = ux / zoom + offsetX;
        let y = uy / zoom + offsetY;
        
        if (engineConfig.name === "Echo") {
            x += Math.sin(y * 2) * 0.2;
            y += Math.cos(x * 2) * 0.2;
        } else if (engineConfig.name === "Rupture") {
            x = Math.sin(x * Math.PI);
            y = Math.cos(y * Math.PI);
        }
        
        switch(composition) {
            case "Centered":
                x *= 0.7;
                y *= 0.7;
                break;
            case "Offset":
                x += 0.3;
                y -= 0.2;
                break;
            case "Diagonal":
                let d = (x + y) * 0.5;
                x = d;
                y = d * 0.8;
                break;
            case "Asymmetrical":
                x *= 1.3;
                y *= 0.6;
                break;
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
            case "Kaleido":
                let angle = Math.atan2(y, x);
                let radius = Math.sqrt(x*x + y*y);
                let segments = 6;
                angle = (angle % (Math.PI * 2 / segments));
                if (angle > Math.PI / segments) angle = (Math.PI * 2 / segments) - angle;
                x = Math.cos(angle) * radius;
                y = Math.sin(angle) * radius;
                break;
            case "FlowField":
                const flowAngle = Math.sin(x*3)*Math.cos(y*3); 
                const cosA = Math.cos(flowAngle); 
                const sinA = Math.sin(flowAngle); 
                const nx = x*cosA - y*sinA; 
                const ny = x*sinA + y*cosA; 
                x = nx; y = ny; 
                break;
            case "Tunnel":
                let tunnelR = Math.sqrt(x*x + y*y);
                let tunnelTheta = Math.atan2(y, x);
                x = tunnelTheta;
                y = Math.log(tunnelR + 1.0);
                break;
            case "Vortex":
                let vr = Math.sqrt(x*x + y*y);
                let va = Math.atan2(y, x);
                va += vr * 2.0;
                x = Math.cos(va) * vr;
                y = Math.sin(va) * vr;
                break;
            case "Warp":
                x += Math.sin(y * 4) * 0.3;
                y += Math.cos(x * 4) * 0.3;
                break;
            case "Mosaic":
                x = Math.floor(x * 3) / 3;
                y = Math.floor(y * 3) / 3;
                break;
            default: break;
        }
        return { x, y };
    }

    // ============================================================
    // COLOR (Engine-specific)
    // ============================================================
    function getRichColor(t, colorMood, time, tokenNum, primaryDriver, engineConfig, isGrail, grailDriver) {
        let r, g, b;
        const tokenVar = tokenNum % 13;
        
        if (engineConfig.name === "Rupture") {
            r = Math.sin(t * 45 + time) * 0.8 + 0.5;
            g = Math.sin(t * 45 + 2.094 + time * 1.4) * 0.8 + 0.5;
            b = Math.sin(t * 45 + 4.188 + time * 0.6) * 0.8 + 0.5;
            if (isGrail && grailDriver === "SpectralSplit") {
                r *= 1.3;
                b *= 0.7;
            }
            return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
        }
        
        if (engineConfig.name === "Echo") {
            r = 0.3 + 0.5 * Math.sin(t * 6 + time * 0.7);
            g = 0.4 + 0.4 * Math.sin(t * 8 + time * 0.9);
            b = 0.7 + 0.2 * Math.sin(t * 10 + time * 1.1);
            return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
        }
        
        if (primaryDriver === "Color") {
            r = Math.sin(t * 40 + time) * 0.5 + 0.5;
            g = Math.sin(t * 40 + 2.094 + time) * 0.5 + 0.5;
            b = Math.sin(t * 40 + 4.188 + time) * 0.5 + 0.5;
            return { r: Math.min(0.85, Math.max(0.15, r)), g: Math.min(0.85, Math.max(0.15, g)), b: Math.min(0.85, Math.max(0.15, b)) };
        }
        
        switch(colorMood) {
            case "Ethereal":
                r = 0.4 + 0.6 * Math.sin(t * (4 + tokenVar) + time);
                g = 0.3 + 0.7 * Math.sin(t * (6 + tokenVar) + time * 1.2);
                b = 0.5 + 0.5 * Math.sin(t * (8 + tokenVar) + time * 0.8);
                break;
            case "Volcanic":
                r = 1.0;
                g = 0.1 + 0.7 * Math.sin(t * 12 + time * 1.5);
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
    // ANIMATION VALUES
    // ============================================================
    let animatedPulse = 0.96;
    let animatedHueShift = 0;
    let startTime = null;
    
    function updateAnimation(now) {
        animatedPulse = 0.96 + Math.sin(now * 0.0004) * 0.02;
        animatedHueShift = Math.sin(now * 0.00015) * 360 * 0.02;
    }

    // ============================================================
    // INTENSITY EFFECTS
    // ============================================================
    function applyIntensityEffects(ctx, w, h, intensity, now) {
        if (intensity > 0.2) {
            const noiseAmount = 0.015 + intensity * 0.04;
            for (var i = 0; i < 300; i++) {
                if (Math.random() < noiseAmount) {
                    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.15})`;
                    ctx.fillRect(Math.random() * w, Math.random() * h, 1, 1);
                }
            }
        }
        
        if (Math.random() < 0.005 * intensity) {
            const shiftX = (Math.random() - 0.5) * 2;
            const shiftY = (Math.random() - 0.5) * 1;
            ctx.drawImage(ctx.canvas, shiftX, shiftY);
        }
        
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
        
        if (Math.random() < 0.003 * intensity) {
            for (var i = 0; i < 20; i++) {
                ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.3})`;
                ctx.fillRect(Math.floor(Math.random() * w), Math.floor(Math.random() * h), 1, 1);
            }
        }
        
        if (Math.random() < 0.0013 * intensity) {
            const tearY = Math.floor(Math.random() * h);
            const tearHeight = 2;
            const tearWidth = w * 0.3;
            const tearX = (Math.random() - 0.5) * 20;
            ctx.drawImage(ctx.canvas, 0, tearY, w, tearHeight, tearX, tearY, tearWidth, tearHeight);
        }
        
        if (intensity > 0.3) {
            const vignetteStrength = intensity * 0.16;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.6, `rgba(0,0,0,${vignetteStrength * 0.2})`);
            gradient.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(10, 670, 100, 6);
        ctx.fillStyle = `hsl(${intensity * 120}, 100%, 50%)`;
        ctx.fillRect(10, 670, intensity * 100, 6);
        
        const hue = (now * 0.02 + intensity * 360) % 360;
        ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${intensity * 0.032})`;
        ctx.fillRect(0, 0, w, h);
    }

    // ============================================================
    // COMPLEMENTARY TRAITS UI
    // ============================================================
    function getComplementaryTraits(rarityClass, awakenedLevel, intensity, tokenNum, primaryDriver, engineType) {
        let mood = intensity > 0.8 ? "Intense" : (intensity > 0.6 ? "Energetic" : (intensity > 0.4 ? "Balanced" : (intensity > 0.2 ? "Calm" : "Dormant")));
        const elements = ["Fire", "Water", "Earth", "Air", "Light", "Shadow", "Crystal", "Void"];
        const element = elements[tokenNum % elements.length];
        let flowState = awakenedLevel === "ascended" ? "Rapid" : (awakenedLevel === "awakened" ? "Moving" : (intensity > 0.7 ? "Surging" : (intensity > 0.4 ? "Flowing" : "Gentle")));
        return { mood, element, flowState, primaryDriver, engineType };
    }
    
    function updateComplementaryUI(complementary) {
        const infoEl = document.getElementById('complementaryInfo');
        if (infoEl) {
            infoEl.innerHTML = `${complementary.engineType} Â· ${complementary.mood} Â· ${complementary.element} Â· ${complementary.flowState} Â· Driver: ${complementary.primaryDriver}`;
        }
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
            let offsetX = baseTraits?.offsetX || 0;
            let offsetY = baseTraits?.offsetY || 0;
            const maxIter = baseTraits?.baseMaxIter || 120;
            
            const tokenNum = parseInt(tokenId) || 1;
            const densityConfig = getDensityMultiplier(currentTraits["Density"]);
            const primaryDriver = currentTraits["Primary Driver"];
            const archetype = currentTraits["Archetype"];
            const engineConfig = currentTraits["Engine Config"];
            const grailDriver = currentTraits["Grail Driver"];
            
            const complementary = getComplementaryTraits(currentTraits["Rarity Class"], awakenedLevel, liveIntensity, tokenNum, primaryDriver, engineConfig.name);
            updateComplementaryUI(complementary);
            
            const phi = 1.618;
            const goldenX = w / phi;
            const goldenY = h / phi;
            const goldenOffsetX = (goldenX - w/2) / w * 0.3;
            const goldenOffsetY = (goldenY - h/2) / h * 0.3;
            const adjustedOffsetX = offsetX + goldenOffsetX;
            const adjustedOffsetY = offsetY + goldenOffsetY;
            
            let fractalWeight = engineConfig.fractalWeight;
            let patternWeight = engineConfig.patternWeight;
            
            // Awakening modifies weights
            if (awakenedLevel === "awakened") {
                fractalWeight *= 1.2;
                patternWeight *= 0.8;
            } else if (awakenedLevel === "ascended") {
                fractalWeight *= 1.4;
                patternWeight *= 0.6;
            }
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    let ux = (x / w) * 4.0 - 2.5;
                    let uy = (y / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, adjustedOffsetX, adjustedOffsetY, engineConfig);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    // Apply awakening to engine
                    let awakened = applyAwakeningToEngine(rx, ry, engineConfig, awakenedLevel, time);
                    rx = awakened.x;
                    ry = awakened.y;
                    
                    let geo = applyArchetypeGeometry(archetype, rx, ry, engineConfig);
                    rx = geo.x;
                    ry = geo.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter, currentTraits["Fractal Type"], densityConfig);
                    let patternVal = getPatternValue(rx, ry, time, engineConfig);
                    
                    let t;
                    if (engineConfig.name === "Rupture") {
                        t = Math.abs(fractalVal - patternVal) + Math.sin(rx * ry * 2.5 + time) * 0.2;
                    } else if (engineConfig.name === "Echo") {
                        t = fractalVal * fractalWeight + patternVal * patternWeight;
                    } else {
                        if (primaryDriver === "Fractal") {
                            t = fractalVal;
                        } else if (primaryDriver === "Pattern") {
                            t = patternVal;
                        } else {
                            t = fractalVal * fractalWeight + patternVal * patternWeight;
                        }
                    }
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    if (isGrail) {
                        if (grailDriver === "Interference") {
                            t = Math.abs(fractalVal - patternVal);
                        } else if (grailDriver === "Collapse") {
                            t = Math.min(fractalVal, patternVal);
                        } else if (grailDriver === "EchoLoop") {
                            t += Math.sin(t * 10 + time) * 0.3;
                        }
                        t = Math.max(0.03, Math.min(0.97, t));
                        t = Math.pow(t, 0.3);
                    }
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", time, tokenNum, primaryDriver, engineConfig, isGrail, grailDriver);
                    
                    // Apply gentle pulse animation
                    const pulse = animatedPulse;
                    r = r * pulse;
                    g = g * pulse;
                    b = b * pulse;
                    
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
            
            if (engineConfig.hasExtraGlow || isGrail) {
                ctx.globalCompositeOperation = "lighter";
                ctx.globalAlpha = 0.25;
                ctx.drawImage(offscreen, 0, 0);
                ctx.globalAlpha = 1.0;
                ctx.globalCompositeOperation = "source-over";
            }
            
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = 0.15;
            ctx.drawImage(offscreen, 0, 0);
            ctx.globalAlpha = 1.0;
            ctx.globalCompositeOperation = 'source-over';
            
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
        
        const streamRNGs = {};
        for(let i = 1; i <= 7; i++) {
            streamRNGs[i] = splitSeed(masterSeed, i);
        }
        
        const tokenOffset = parseInt(tokenId, 10) || 0;
        const steps = (tokenOffset * 997) % 1000;
        for (let i = 0; i < steps; i++) {
            for(let s = 1; s <= 7; s++) {
                if(streamRNGs[s]) streamRNGs[s]();
            }
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
        requestAnimationFrame(animate);
        
        console.log("Viewer ready - Token:", tokenId, "Engine:", currentTraits["Engine Type"], "Driver:", currentTraits["Primary Driver"]);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();