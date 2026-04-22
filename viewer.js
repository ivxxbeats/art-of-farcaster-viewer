
// ============================================================
// TOKEN-SPECIFIC VISUAL SIGNATURE
// ============================================================

function getTokenVisualSignature(seed, tokenId) {
    const tokenNum = parseInt(tokenId) || 1;
    let hash = tokenNum;
    for (let i = 0; i < 5; i++) {
        hash = (hash * 9301 + 49297) % 233280;
    }
    return {
        colorBias: { r: (hash % 100) / 100, g: ((hash * 7) % 100) / 100, b: ((hash * 13) % 100) / 100 },
        contrast: 0.6 + ((hash * 3) % 120) / 100,
        brightness: 0.5 + ((hash * 5) % 70) / 100,
        saturation: 0.5 + ((hash * 11) % 100) / 100,
        distortion: ((hash * 17) % 30) / 100,
        glitchIntensity: ((hash * 29) % 50) / 100,
        zoomLevel: 0.85 + ((hash * 43) % 45) / 100,
        waveFreq: 0.7 + ((hash * 53) % 130) / 100
    };
}

function applyTokenColorSignature(r, g, b, sig) {
    let nr = r * (0.5 + sig.colorBias.r * 0.8);
    let ng = g * (0.5 + sig.colorBias.g * 0.8);
    let nb = b * (0.5 + sig.colorBias.b * 0.8);
    nr = 0.5 + (nr - 0.5) * sig.contrast;
    ng = 0.5 + (ng - 0.5) * sig.contrast;
    nb = 0.5 + (nb - 0.5) * sig.contrast;
    nr = nr * sig.brightness;
    ng = ng * sig.brightness;
    nb = nb * sig.brightness;
    const gray = (nr + ng + nb) / 3;
    nr = gray + (nr - gray) * sig.saturation;
    ng = gray + (ng - gray) * sig.saturation;
    nb = gray + (nb - gray) * sig.saturation;
    return { r: Math.min(0.95, Math.max(0.05, nr)), g: Math.min(0.95, Math.max(0.05, ng)), b: Math.min(0.95, Math.max(0.05, nb)) };
}

function applyTokenDistortion(x, y, sig, time) {
    let rx = x, ry = y;
    const amount = sig.distortion * 0.5;
    rx += Math.sin(ry * 15 * sig.waveFreq + time * 2) * amount;
    ry += Math.cos(rx * 15 * sig.waveFreq + time * 1.5) * amount;
    return { x: rx, y: ry };
}
// ============================================================
// ART OF FARCASTER - AWAKENED ENGINE v3.0
// Full integration with Farcaster Intensity API
// No text displays - pure visual effects
// ============================================================

(function() {
    // ============================================================
    // CONFIGURATION
    // ============================================================
    const ANIMATION_CONFIG = {
        BREATHING_SPEED: 0.002,
        HUE_DRIFT_SPEED: 0.0008,
        GLITCH_SPEED: 0.01,
        WAVE_SPEED: 0.003,
        
        PULSE_STRENGTH: 0.5,
        HUE_DRIFT_STRENGTH: 0.4,
        GLITCH_STRENGTH: 0.3,
        DISTORTION_STRENGTH: 0.6,
        ZOOM_STRENGTH: 0.08,
        
        ENABLE_BREATHING: true,
        ENABLE_HUE_DRIFT: true,
        ENABLE_GLITCH: true,
        ENABLE_DISTORTION: true,
        ENABLE_ZOOM_BREATHING: true,
        ENABLE_PARTICLES: true,
        ENABLE_SCANLINES: true,
        
        PARTICLE_COUNT: 40,
        SCANLINE_OPACITY: 0.1,
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
    // FARCASTER INTENSITY API - AWAKENED ENGINE
    // ============================================================
    
    const INTENSITY_API_URL = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
    
    let farcasterData = {
        intensity: 0.5,
        awakenedEngine: {
            enabled: true,
            progression: "base",
            awakenedThreshold: 0.55,
            ascendedThreshold: 0.82,
            distortionMultiplier: 1.0,
            particleMultiplier: 1.0,
            colorIntensity: 1.0,
            glitchFrequency: 0.05,
            energyRings: false
        }
    };
    
    let lastFetchTime = 0;
    
    async function fetchFarcasterIntensity() {
        const now = Date.now();
        if (now - lastFetchTime < 60000) return farcasterData;
        
        try {
            const response = await fetch(INTENSITY_API_URL + '?t=' + now);
            if (response.ok) {
                const data = await response.json();
                farcasterData.intensity = data.intensity || 0.5;
                if (data.awakenedEngine) {
                    farcasterData.awakenedEngine = { ...farcasterData.awakenedEngine, ...data.awakenedEngine };
                }
                lastFetchTime = now;
            }
        } catch (e) {}
        return farcasterData;
    }
    
    function getCurrentIntensity() {
        return farcasterData.intensity;
    }
    
    const PROGRESSION_STATES = {
        BASE: "base",
        AWAKENED: "awakened",
        ASCENDED: "ascended"
    };
    
    function getProgressionState(rarityClass) {
        const intensity = farcasterData.intensity;
        let awakenedThreshold = farcasterData.awakenedEngine.awakenedThreshold || 0.55;
        let ascendedThreshold = farcasterData.awakenedEngine.ascendedThreshold || 0.82;
        
        switch(rarityClass) {
            case "Grail":
                awakenedThreshold *= 0.7;
                ascendedThreshold *= 0.8;
                break;
            case "Mythic":
                awakenedThreshold *= 0.85;
                ascendedThreshold *= 0.9;
                break;
            case "Rare":
                awakenedThreshold *= 0.9;
                ascendedThreshold *= 0.95;
                break;
        }
        
        if (intensity >= ascendedThreshold) return PROGRESSION_STATES.ASCENDED;
        if (intensity >= awakenedThreshold) return PROGRESSION_STATES.AWAKENED;
        return PROGRESSION_STATES.BASE;
    }
    
    function getProgressionParams(progression) {
        const config = farcasterData.awakenedEngine;
        
        switch(progression) {
            case PROGRESSION_STATES.ASCENDED:
                return {
                    distortionMultiplier: (config.distortionMultiplier || 1.0) * 1.5,
                    particleMultiplier: (config.particleMultiplier || 1.0) * 1.5,
                    colorIntensity: (config.colorIntensity || 1.0) * 1.3,
                    glitchFrequency: (config.glitchFrequency || 0.05) * 2,
                    energyRings: config.energyRings || true,
                    speedMultiplier: 1.5
                };
            case PROGRESSION_STATES.AWAKENED:
                return {
                    distortionMultiplier: (config.distortionMultiplier || 1.0) * 1.2,
                    particleMultiplier: (config.particleMultiplier || 1.0) * 1.2,
                    colorIntensity: (config.colorIntensity || 1.0) * 1.15,
                    glitchFrequency: config.glitchFrequency || 0.05,
                    energyRings: false,
                    speedMultiplier: 1.2
                };
            default:
                return {
                    distortionMultiplier: 1.0,
                    particleMultiplier: 1.0,
                    colorIntensity: 1.0,
                    glitchFrequency: (config.glitchFrequency || 0.05) * 0.5,
                    energyRings: false,
                    speedMultiplier: 1.0
                };
        }
    }
    
    async function initIntensityListener() {
        await fetchFarcasterIntensity();
        setInterval(fetchFarcasterIntensity, 60 * 60 * 1000);
    }

    // ============================================================
    // PARTICLE SYSTEM
    // ============================================================
    let particles = [];
    let grailParticles = [];
    
    function initParticles(isGrail, particleMultiplier = 1.0) {
        const baseCount = isGrail ? 150 : ANIMATION_CONFIG.PARTICLE_COUNT;
        const count = Math.floor(baseCount * particleMultiplier);
        particles = [];
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random(),
                y: Math.random(),
                size: isGrail ? 2 + Math.random() * 5 : 1 + Math.random() * 3,
                speedX: (Math.random() - 0.5) * (isGrail ? 0.004 : 0.002),
                speedY: (Math.random() - 0.5) * (isGrail ? 0.004 : 0.002),
                alpha: 0.3 + Math.random() * 0.5,
                color: isGrail ? `hsl(${Math.random() * 360}, 100%, 60%)` : null
            });
        }
        
        if (isGrail) {
            grailParticles = [];
            for (let i = 0; i < 50; i++) {
                grailParticles.push({
                    x: Math.random(),
                    y: Math.random(),
                    size: 3 + Math.random() * 6,
                    speedX: (Math.random() - 0.5) * 0.006,
                    speedY: (Math.random() - 0.5) * 0.006,
                    alpha: 0.5 + Math.random() * 0.5,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }
        }
    }
    
    function updateParticles(isGrail, now) {
        for (let p of particles) {
            p.x += p.speedX;
            p.y += p.speedY;
            if (p.x < 0) p.x = 1;
            if (p.x > 1) p.x = 0;
            if (p.y < 0) p.y = 1;
            if (p.y > 1) p.y = 0;
        }
        
        if (isGrail && grailParticles) {
            for (let p of grailParticles) {
                p.x += p.speedX;
                p.y += p.speedY;
                if (p.x < 0) p.x = 1;
                if (p.x > 1) p.x = 0;
                if (p.y < 0) p.y = 1;
                if (p.y > 1) p.y = 0;
            }
        }
    }
    
    function drawParticles(ctx, w, h, isGrail, now) {
        for (let p of particles) {
            const alpha = p.alpha * (0.5 + animatedPulse * 0.5);
            if (p.color) {
                ctx.fillStyle = p.color;
            } else {
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            }
            ctx.beginPath();
            ctx.arc(p.x * w, p.y * h, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (isGrail && grailParticles) {
            for (let p of grailParticles) {
                const pulse = 0.5 + Math.sin(now * 0.005 + p.pulseOffset) * 0.5;
                const alpha = p.alpha * pulse;
                const hue = (now * 0.002 * 100 + p.x * 360) % 360;
                ctx.fillStyle = `hsla(${hue}, 100%, 60%, ${alpha})`;
                ctx.beginPath();
                ctx.arc(p.x * w, p.y * h, p.size * pulse, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    // ============================================================
    // AWAKENED ENGINE VISUAL EFFECTS
    // ============================================================
    let grailGlowIntensity = 0;
    let grailSpinAngle = 0;
    let grailRays = [];
    
    function initGrailEffects() {
        for (let i = 0; i < 12; i++) {
            grailRays.push({
                angle: (i / 12) * Math.PI * 2,
                length: 0.3 + Math.random() * 0.3
            });
        }
    }
    
    function updateGrailEffects(now) {
        grailGlowIntensity = 0.5 + Math.sin(now * 0.003) * 0.5;
        grailSpinAngle = now * 0.001;
    }
    
    function drawEnergyRings(ctx, w, h, now, intensity) {
        const centerX = w / 2;
        const centerY = h / 2;
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = 100 + i * 40 + Math.sin(now * 0.003) * 10;
            const alpha = 0.2 + Math.sin(now * 0.005 + i) * 0.1;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = `hsla(${animatedHueShift + i * 30}, 100%, 60%, ${alpha * intensity})`;
            ctx.lineWidth = 2;
            ctx.stroke();
            
            if (i === ringCount - 1) {
                ctx.setLineDash([5, 15]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }
    }
    
    function drawGrailEffects(ctx, w, h, now, intensity) {
        const centerX = w / 2;
        const centerY = h / 2;
        const maxRadius = Math.min(w, h) / 2;
        
        ctx.save();
        ctx.shadowBlur = 30 * grailGlowIntensity;
        ctx.shadowColor = `hsl(${animatedHueShift}, 100%, 60%)`;
        
        for (let ray of grailRays) {
            const angle = ray.angle + grailSpinAngle;
            const x1 = centerX + Math.cos(angle) * maxRadius * 0.3;
            const y1 = centerY + Math.sin(angle) * maxRadius * 0.3;
            const x2 = centerX + Math.cos(angle) * maxRadius * ray.length;
            const y2 = centerY + Math.sin(angle) * maxRadius * ray.length;
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `hsla(${animatedHueShift}, 100%, 60%, 0)`);
            gradient.addColorStop(1, `hsla(${animatedHueShift}, 100%, 60%, ${0.3 * intensity})`);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 4;
            ctx.strokeStyle = gradient;
            ctx.stroke();
        }
        
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, maxRadius * 0.8);
        gradient.addColorStop(0, `hsla(${animatedHueShift}, 100%, 60%, 0)`);
        gradient.addColorStop(0.5, `hsla(${animatedHueShift}, 100%, 60%, ${0.1 * intensity})`);
        gradient.addColorStop(1, `hsla(${animatedHueShift}, 100%, 60%, 0)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        ctx.restore();
    }
    
    function applyGrailGlitch(ctx, w, h, intensity) {
        if (Math.random() < 0.03 * intensity) {
            ctx.fillStyle = `rgba(255, 255, 255, ${0.2 * intensity})`;
            ctx.fillRect(0, 0, w, h);
            
            const sliceY = Math.random() * h;
            const sliceHeight = 10 + Math.random() * 30;
            const sliceWidth = w * (0.5 + Math.random() * 0.5);
            const offsetX = (Math.random() - 0.5) * 50;
            
            ctx.drawImage(ctx.canvas, 0, sliceY, w, sliceHeight, offsetX, sliceY, sliceWidth, sliceHeight);
        }
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

    function deterministicRandom(seed, index) {
        let state = (seed + index) >>> 0;
        state = (state + 0x9e3779b9) >>> 0;
        state ^= state >>> 15;
        state = (state * 0x85ebca6b) >>> 0;
        state ^= state >>> 13;
        state = (state * 0xc2b2ae35) >>> 0;
        state ^= state >>> 16;
        return state / 0xffffffff;
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
    function generateTraits(seed, tokenId) {
        const traits = {};
        const rarityRand = deterministicRandom(seed, 0);
        if (rarityRand < 0.60) traits["Rarity Class"] = "Common";
        else if (rarityRand < 0.85) traits["Rarity Class"] = "Uncommon";
        else if (rarityRand < 0.95) traits["Rarity Class"] = "Rare";
        else if (rarityRand < 0.99) traits["Rarity Class"] = "Mythic";
        else traits["Rarity Class"] = "Grail";
        
        const archetypeRand = deterministicRandom(seed, 1);
        traits.Archetype = ARCHETYPES[Math.floor(archetypeRand * ARCHETYPES.length)];
        
        const formRand = deterministicRandom(seed, 2);
        traits["Anchor Form"] = ANCHOR_FORMS[Math.floor(formRand * ANCHOR_FORMS.length)];
        
        const colorRand = deterministicRandom(seed, 3);
        const colors = ["Neon", "Rainbow", "Fire", "Aurora", "Ice", "Magma"];
        traits["Color Mood"] = colors[Math.floor(colorRand * colors.length)];
        
        const compRand = deterministicRandom(seed, 4);
        const compositions = ["Centered", "Radial", "Spiral", "FlowField"];
        traits.Composition = compositions[Math.floor(compRand * compositions.length)];
        
        traits.Motion = "Flowing";
        traits.intensity = 0.2 + deterministicRandom(seed, 5) * 0.75;
        
        return traits;
    }

    function generateBaseParams(seed, tokenId) {
    const rng = makeSeededRand(seed);
    const tokenNum = parseInt(tokenId) || 1;
    const tokenOffset = (tokenNum * 997) % 1000;
    for (let i = 0; i < tokenOffset; i++) rng();
    const zoomVariation = 0.5 + (tokenNum % 100) / 50;
    return {
        zoom: (0.7 + rng() * 1.2) * zoomVariation,
        offsetX: (rng() - 0.5) * 2.0 + ((tokenNum % 20) - 10) / 20,
        offsetY: (rng() - 0.5) * 2.0 + ((tokenNum % 20) - 10) / 20,
        maxIter: 60 + Math.floor(rng() * 200) + (tokenNum % 100)
    };
};
    }

    // ============================================================
    // ANIMATION VALUES
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

    function updateAnimatedValues(now, isGrail, speedMultiplier = 1.0) {
        const multiplier = isGrail ? 1.5 * speedMultiplier : speedMultiplier;
        
        animatedPulse = 0.5 + Math.sin(now * ANIMATION_CONFIG.BREATHING_SPEED * multiplier) * ANIMATION_CONFIG.PULSE_STRENGTH;
        animatedHueShift = Math.sin(now * ANIMATION_CONFIG.HUE_DRIFT_SPEED * multiplier) * 360 * ANIMATION_CONFIG.HUE_DRIFT_STRENGTH;
        animatedGlitchX = Math.sin(now * ANIMATION_CONFIG.GLITCH_SPEED * multiplier) * ANIMATION_CONFIG.GLITCH_STRENGTH * 6;
        animatedGlitchY = Math.cos(now * ANIMATION_CONFIG.GLITCH_SPEED * 1.3 * multiplier) * ANIMATION_CONFIG.GLITCH_STRENGTH * 4;
        animatedZoom = 1.0 + Math.sin(now * 0.0008 * multiplier) * ANIMATION_CONFIG.ZOOM_STRENGTH;
        animatedWavePhase = (animatedWavePhase + ANIMATION_CONFIG.WAVE_SPEED * multiplier) % (Math.PI * 2);
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

    function getDepthFractalValue(x, y, maxIter) {
        let depth = 0;
        for (let i = 0; i < 3; i++) {
            const scale = 1 + i * 0.15;
            depth += novaFractalCalc(x * scale, y * scale, Math.floor(maxIter * 0.8));
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

    function applyDistortion(x, y, isGrail, distortionMultiplier = 1.0) {
        let rx = x, ry = y;
        if (!ANIMATION_CONFIG.ENABLE_DISTORTION) return { x: rx, y: ry };
        
        let strength = ANIMATION_CONFIG.DISTORTION_STRENGTH * distortionMultiplier * (0.5 + animatedPulse * 0.5);
        if (isGrail) strength *= 1.2;
        
        rx += Math.sin(ry * 8 + animatedWavePhase) * 0.03 * strength;
        ry += Math.cos(rx * 8 + animatedWavePhase) * 0.03 * strength;
        return { x: rx, y: ry };
    }

    function getRichColor(t, colorMood, time, isGrail, colorIntensity = 1.0) {
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
        
        // Apply color intensity from Awakened Engine
        r = Math.min(0.95, Math.max(0.05, r * colorIntensity));
        g = Math.min(0.95, Math.max(0.05, g * colorIntensity));
        b = Math.min(0.95, Math.max(0.05, b * colorIntensity));
        
        if (isGrail) {
            r = Math.min(0.95, r * 1.2);
            g = Math.min(0.95, g * 1.1);
            b = Math.min(0.95, b * 1.3);
        }
        
        return { r, g, b };
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

    function drawScanlines(ctx, w, h) {
        if (!ANIMATION_CONFIG.ENABLE_SCANLINES) return;
        const lineHeight = 2;
        for (let y = 0; y < h; y += lineHeight * 2) {
            ctx.fillStyle = `rgba(0, 0, 0, ${ANIMATION_CONFIG.SCANLINE_OPACITY + animatedPulse * 0.05})`;
            ctx.fillRect(0, y, w, lineHeight);
        }
    }

    // ============================================================
    // MAIN RENDER ENGINE
    // ============================================================
    let canvas, ctx;
    let offscreen, offCtx;
    let w = 420, h = 420;
    let currentTraits = null;
    let masterSeed = null;
    let baseTraits = null;
    let deterministicPhase = 0;
    let canonicalTimeValue = 0;
    let animationId = null;
    let isGrail = false;
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
        if (!currentTraits || masterSeed === null) {
            if (ctx) {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, 700, 700);
            }
            return;
        }
        
        try {
            // Get Awakened Engine progression based on Farcaster intensity
            const rarityClass = currentTraits["Rarity Class"];
            const progression = getProgressionState(rarityClass);
            const progParams = getProgressionParams(progression);
            
            // Update animation with Awakened speed multiplier
            updateAnimatedValues(now, isGrail, progParams.speedMultiplier);
            updateOffscreen();
            
            const imgData = offCtx.createImageData(w, h);
            const data = imgData.data;
            
            const time = canonicalTimeValue + timeOffset * 0.002;
            
            let zoom = baseTraits.zoom;
            if (ANIMATION_CONFIG.ENABLE_ZOOM_BREATHING) {
                zoom *= animatedZoom;
            }
            const offsetX = baseTraits.offsetX;
            const offsetY = baseTraits.offsetY;
            const maxIter = baseTraits.maxIter;
            
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
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
                    
                    let distorted = applyDistortion(rx, ry, isGrail, progParams.distortionMultiplier);
                    rx = distorted.x;
                    ry = distorted.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter);
                    let patternVal = getPatternValue(rx, ry, time);
                    
                    let t = (fractalVal + patternVal) * 0.5;
                    t = Math.max(0.03, Math.min(0.97, t));
                    
                    let { r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", time, isGrail, progParams.colorIntensity);
                    
                    // Apply Awakened glitch frequency
                    if (Math.random() < progParams.glitchFrequency) {
                        r = Math.min(0.95, r * (1 + Math.random() * 0.3));
                        g = Math.min(0.95, g * (1 + Math.random() * 0.3));
                        b = Math.min(0.95, b * (1 + Math.random() * 0.3));
                    }
                    
                    let { r: nr, g: ng, b: nb } = applyNoise(r, g, b, x / w, y / h);
                    
                    const idx = (y * w + x) * 4;
                    data[idx] = Math.min(255, Math.max(0, Math.floor(nr * 255)));
                    data[idx+1] = Math.min(255, Math.max(0, Math.floor(ng * 255)));
                    data[idx+2] = Math.min(255, Math.max(0, Math.floor(nb * 255)));
                    data[idx+3] = 255;
                }
            }
            
            offCtx.putImageData(imgData, 0, 0);
            ctx.clearRect(0, 0, 700, 700);
            ctx.drawImage(offscreen, 0, 0, w, h, 0, 0, 700, 700);
            
            // Draw particles with Awakened multiplier
            if (ANIMATION_CONFIG.ENABLE_PARTICLES) {
                updateParticles(isGrail, now);
                drawParticles(ctx, 700, 700, isGrail, now);
            }
            
            drawScanlines(ctx, 700, 700);
            
            // GRAIL-ONLY EFFECTS
            if (isGrail) {
                updateGrailEffects(now);
                drawGrailEffects(ctx, 700, 700, now, farcasterData.intensity);
                applyGrailGlitch(ctx, 700, 700, farcasterData.intensity);
                
                ctx.fillStyle = `rgba(255, 215, 0, ${0.03 + grailGlowIntensity * 0.03})`;
                ctx.fillRect(0, 0, 700, 700);
            }
            
            // AWAKENED ENGINE ENERGY RINGS (for ascended state)
            if (progParams.energyRings) {
                drawEnergyRings(ctx, 700, 700, now, farcasterData.intensity);
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
        
        ctx.fillStyle = '#111';
        ctx.fillRect(0, 0, 700, 700);
        
        const tokenData = (function() {
            const params = new URLSearchParams(window.location.search);
            return {
                tokenId: params.get('tokenId') || params.get('tid') || '1',
                txHash: params.get('txHash') || params.get('h') || '0x0'
            };
        })();
        
        tokenId = tokenData.tokenId;
        console.log("Token:", tokenId);
        
        masterSeed = getSeed(tokenData.tokenId, tokenData.txHash);
        currentTraits = generateTraits(masterSeed, tokenData.tokenId);
        baseTraits = generateBaseParams(masterSeed, tokenData.tokenId);
        
        isGrail = currentTraits["Rarity Class"] === RARITY_CLASSES.GRAIL;
        
        const mintIntensity = currentTraits.intensity;
        deterministicPhase = getDeterministicPhase(masterSeed, mintIntensity);
        canonicalTimeValue = deterministicTime(tokenData.tokenId, masterSeed, mintIntensity);
        
        // Initialize Awakened Engine listener
        await initIntensityListener();
        
        // Initialize particles with Awakened multiplier (will be updated in render)
        const progression = getProgressionState(currentTraits["Rarity Class"]);
        const progParams = getProgressionParams(progression);
        initParticles(isGrail, progParams.particleMultiplier);
        
        if (isGrail) {
            initGrailEffects();
        }
        
        startTime = null;
        animationId = requestAnimationFrame(animate);
        
        console.log("âœ… Awakened Engine Ready - Token:", tokenId, "Grail:", isGrail);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();