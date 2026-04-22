// ============================================================
// ART OF FARCASTER - ANIMATED VIEWER
// Full animation + Live Intensity + Awakened Engine
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
    // ANIMATION VALUES
    // ============================================================
    let animatedPulse = 0.7;
    let animatedHueShift = 0;
    let animatedGlitchX = 0;
    let animatedGlitchY = 0;
    let animatedWavePhase = 0;
    
    function updateAnimation(now) {
        const speed = awakenedLevel === "ascended" ? 1.5 : (awakenedLevel === "awakened" ? 1.2 : 1.0);
        
        // Pulse brightness
        animatedPulse = 0.5 + Math.sin(now * 0.003 * speed) * 0.4;
        
        // Hue drift
        animatedHueShift = Math.sin(now * 0.0008 * speed) * 360 * 0.3;
        
        // Glitch offset
        animatedGlitchX = Math.sin(now * 0.015) * 5;
        animatedGlitchY = Math.cos(now * 0.012) * 4;
        
        // Wave phase
        animatedWavePhase = (animatedWavePhase + 0.03 * speed) % (Math.PI * 2);
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
        
        // Apply pulse
        r = Math.min(0.95, Math.max(0.05, r * pulse));
        g = Math.min(0.95, Math.max(0.05, g * pulse));
        b = Math.min(0.95, Math.max(0.05, b * pulse));
        
        // Apply intensity boost
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
            // Glow effect
            ctx.shadowBlur = 20;
            ctx.shadowColor = "rgba(255,100,255,0.5)";
            
            // Pulsing energy rings
            for (var i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(w/2, h/2, 100 + i * 40 + Math.sin(now * 0.003) * 10, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${now * 0.05 % 360}, 100%, 60%, 0.3)`;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            
            // Floating particles
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
    // RENDER ENGINE (Animated)
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
    
    function generateTraits(seed, tokenId) {
        const traits = {};
        const rarityRand = deterministicRandom(seed, 0);
        if (rarityRand < 0.60) traits["Rarity Class"] = "Common";
        else if (rarityRand < 0.85) traits["Rarity Class"] = "Uncommon";
        else if (rarityRand < 0.95) traits["Rarity Class"] = "Rare";
        else if (rarityRand < 0.99) traits["Rarity Class"] = "Mythic";
        else traits["Rarity Class"] = "Grail";
        
        const colorRand = deterministicRandom(seed, 1);
        const colors = ["Neon", "Rainbow", "Fire", "Aurora", "Ice", "Magma"];
        traits["Color Mood"] = colors[Math.floor(colorRand * colors.length)];
        
        const compRand = deterministicRandom(seed, 2);
        const compositions = ["Centered", "Radial", "Spiral", "FlowField"];
        traits.Composition = compositions[Math.floor(compRand * compositions.length)];
        
        return traits;
    }
    
    function generateBaseParams(seed, tokenId) {
        const rng = function() {
            let state = (seed + parseInt(tokenId)) >>> 0;
            state ^= state << 13;
            state ^= state >>> 17;
            state ^= state << 5;
            return ((state ^ (state >>> 11)) >>> 0) / 0xffffffff;
        };
        return {
            zoom: 0.7 + rng() * 1.2,
            offsetX: (rng() - 0.5) * 1.0,
            offsetY: (rng() - 0.5) * 1.0,
            baseMaxIter: 80 + Math.floor(rng() * 160)
        };
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
                    // Apply glitch offset
                    let offsetXpx = animatedGlitchX * (Math.random() - 0.5);
                    let offsetYpx = animatedGlitchY * (Math.random() - 0.5);
                    
                    let ux = ((x + offsetXpx) / w) * 4.0 - 2.5;
                    let uy = ((y + offsetYpx) / h) * 4.0 - 2.0;
                    ux *= w / h;
                    
                    let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, offsetX, offsetY);
                    let rx = transformed.x;
                    let ry = transformed.y;
                    
                    let fractalVal = getDepthFractalValue(rx, ry, maxIter);
                    let patternVal = getPatternValue(rx, ry, time);
                    
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
            
            // Apply Awakened visual effects
            applyAwakenedEffects(ctx, 700, 700, awakenedLevel, liveIntensity, now);
            
            // Grail particles
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
        baseTraits = generateBaseParams(masterSeed, tokenId);
        
        const intensityRand = deterministicRandom(masterSeed, 10);
        const deterministicIntensity = 0.2 + intensityRand * 0.7;
        deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
        canonicalTimeValue = deterministicTime(tokenId, masterSeed, deterministicIntensity);
        
        // Start fetching intensity
        fetchIntensity();
        setInterval(fetchIntensity, 30000);
        
        // Start animation
        startTime = null;
        requestAnimationFrame(animate);
        
        console.log("✅ Animated viewer ready - Token:", tokenId);
    }
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();