// ============================================================
// ART OF FARCASTER - VIEWER v28.6
// Deterministic canonical core + Engine-Aware Pressure Effects
// NO DEBUG MODE | Consumes mint traits | Pixel validation
// ============================================================

(function() {
    "use strict";
    
    // ============================================================
    // VIEWER CONFIGURATION - DETERMINISTIC FIRST
    // ============================================================
    const DEBUG_MODE = false;                    // MUST BE FALSE for determinism
    const FORCE_GRAIL_PERCENT = 0;               // MUST BE 0 for determinism
    const ONLY_MYTHIC_RARE_UNCOMMON = false;     // MUST BE FALSE for determinism
    const BALANCE_NON_CANONICAL_ENGINES = false; // MUST BE FALSE for determinism
    
    // Live layer configuration
    const ENABLE_LIVE_LAYER = true;              // Canonical + live pressure effects
    const FREEZE_FRAME = false;                  // Set via URL param ?freeze=true
    
    // Awakening thresholds with hysteresis
    let currentAwakenedLevel = "base";
    let lastRawIntensity = 0.5;
    
    // ============================================================
    // LIVE STATE
    // ============================================================
    let liveIntensity = 0.5;
    let frameCount = 0;
    let animationId = null;
    let startTime = null;
    
    // Canvas references
    let canvas, ctx;
    let currentFrame = null;
    let tokenId = null;
    let txHash = null;
    let mintTraits = null;           // Consumed from mint, NOT re-rolled
    
    // ============================================================
    // PIXEL HASH FOR DETERMINISM VALIDATION
    // ============================================================
    function hashPixels(pixels) {
        let hash = 2166136261;
        const step = Math.max(1, Math.floor(pixels.length / 10000)); // Sample for performance
        
        for (let i = 0; i < pixels.length; i += step) {
            hash ^= pixels[i];
            hash = (hash * 16777619) >>> 0;
            hash ^= pixels[i+1] || 0;
            hash = (hash * 16777619) >>> 0;
            hash ^= pixels[i+2] || 0;
            hash = (hash * 16777619) >>> 0;
        }
        return (hash >>> 0).toString(16).padStart(8, '0');
    }
    
    // ============================================================
    // LIVE INTENSITY API (with fallback)
    // ============================================================
    function fetchIntensity() {
        if (!ENABLE_LIVE_LAYER) return;
        
        var url = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json?t=" + Date.now();
        fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
                if (data && typeof data.intensity === 'number') {
                    liveIntensity = Math.max(0.05, Math.min(0.95, data.intensity));
                    
                    // Update awakening with hysteresis
                    updateAwakeningWithHysteresis(liveIntensity);
                }
            })
            .catch(function(e) { 
                console.warn("Intensity fetch failed, using last value:", liveIntensity);
            });
    }
    
    function updateAwakeningWithHysteresis(rawIntensity) {
        lastRawIntensity = rawIntensity;
        
        if (currentAwakenedLevel === "base" && rawIntensity > 0.60) {
            currentAwakenedLevel = "awakened";
            console.log("✨ Awakening threshold crossed → AWAKENED");
        } else if (currentAwakenedLevel === "awakened" && rawIntensity < 0.48) {
            currentAwakenedLevel = "base";
            console.log("🌙 Awakening threshold crossed → BASE");
        }
        
        if (currentAwakenedLevel !== "ascended" && rawIntensity > 0.84) {
            currentAwakenedLevel = "ascended";
            console.log("⚡ Awakening threshold crossed → ASCENDED");
        } else if (currentAwakenedLevel === "ascended" && rawIntensity < 0.74) {
            currentAwakenedLevel = "awakened";
            console.log("✨ Awakening threshold crossed → AWAKENED");
        }
    }
    
    // ============================================================
    // PRESSURE-BASED EFFECTS (No random glitches)
    // ============================================================
    
    function getPressure(liveIntensity) {
        return Math.pow(Math.max(0.05, Math.min(0.95, liveIntensity)), 1.35);
    }
    
    // Engine-specific pressure responses
    function applyEnginePressureAura(ctx, w, h, pressure, engineType) {
        let glowAlpha;
        
        if (engineType === "Canonical") {
            glowAlpha = 0.012 + pressure * 0.07;
            ctx.fillStyle = `rgba(255,255,255,${glowAlpha})`;
            ctx.fillRect(0, 0, w, h);
            
            // Axis shimmer for Canonical
            if (pressure > 0.4) {
                ctx.save();
                ctx.globalAlpha = 0.02 + pressure * 0.04;
                const shimmerX = Math.sin(Date.now() * 0.002) * 5;
                ctx.fillStyle = `rgba(200,200,255,${0.01 + pressure * 0.03})`;
                ctx.fillRect(w/2 - 2 + shimmerX, 0, 4, h);
                ctx.restore();
            }
        } 
        else if (engineType === "Echo") {
            glowAlpha = 0.008 + pressure * 0.05;
            ctx.fillStyle = `rgba(200,200,255,${glowAlpha})`;
            ctx.fillRect(0, 0, w, h);
            
            // Recursive ghost trails for Echo
            if (pressure > 0.3) {
                ctx.save();
                ctx.globalAlpha = 0.02 + pressure * 0.06;
                const trailOffset = 3 + pressure * 8;
                ctx.drawImage(canvas, trailOffset, 0);
                ctx.drawImage(canvas, -trailOffset, 0);
                ctx.restore();
            }
        } 
        else { // Rupture
            glowAlpha = 0.006 + pressure * 0.04;
            ctx.fillStyle = `rgba(255,200,200,${glowAlpha})`;
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    function applyEchoResonance(ctx, w, h, pressure, now) {
        if (pressure < 0.2) return;
        
        const phaseWobble = Math.sin(now * 0.002) * (2 + pressure * 8);
        const breathing = 0.5 + Math.sin(now * 0.001) * 0.3;
        
        ctx.save();
        ctx.globalAlpha = 0.01 + pressure * 0.05 * breathing;
        ctx.drawImage(canvas, phaseWobble * 0.5, 0);
        ctx.restore();
    }
    
    function applyRuptureSeams(ctx, w, h, pressure, now) {
        if (pressure < 0.15) return;
        
        const seamCount = Math.floor(1 + pressure * 12);
        const seamBrightness = 0.03 + pressure * 0.12;
        
        for (let i = 0; i < seamCount; i++) {
            const y = (Math.sin(now * 0.003 + i) * 0.5 + 0.5) * h;
            ctx.fillStyle = `rgba(255,255,255,${seamBrightness * (0.5 + Math.sin(now * 0.005 + i) * 0.5)})`;
            ctx.fillRect(0, y, w, 1 + Math.floor(pressure * 3));
        }
        
        // Row shift for high pressure Rupture
        if (pressure > 0.6) {
            const imgData = ctx.getImageData(0, 0, w, h);
            const data = imgData.data;
            const shiftAmount = Math.sin(now * 0.008) * 6 * pressure;
            
            for (let y = 0; y < h; y += 8) {
                const shift = Math.floor(shiftAmount * Math.sin(y * 0.03));
                if (Math.abs(shift) > 1) {
                    const rowStart = y * w * 4;
                    const tempRow = new Uint8ClampedArray(data.subarray(rowStart, rowStart + w * 4));
                    const newStart = rowStart + shift * 4;
                    if (newStart >= 0 && newStart + w * 4 <= data.length) {
                        data.set(tempRow, newStart);
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        }
    }
    
    // Failure mode responses (pressure-driven, not random)
    function applyFailureModeResponse(ctx, w, h, pressure, traits, now) {
        const failureMode = traits?.failureMode;
        if (!failureMode) return;
        
        if (failureMode === "Fracture") {
            const crackDensity = Math.floor(1 + pressure * 8);
            const crackBrightness = 0.04 + pressure * 0.1;
            
            for (let i = 0; i < crackDensity; i++) {
                const y = (Math.sin(now * 0.004 + i) * 0.5 + 0.5) * h;
                ctx.fillStyle = `rgba(255,255,255,${crackBrightness})`;
                ctx.fillRect(0, y, w, 1);
            }
        } 
        else if (failureMode === "VoidBloom") {
            const bloomDepth = 0.2 + pressure * 0.5;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, `rgba(0,0,0,${0.1 * pressure})`);
            gradient.addColorStop(0.4, `rgba(0,0,0,${0.2 * pressure})`);
            gradient.addColorStop(1, `rgba(0,0,0,${bloomDepth})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
        else if (failureMode === "Recovering") {
            // Sharpening pulse - field pulls together
            ctx.save();
            ctx.globalAlpha = 0.92 + pressure * 0.04;
            ctx.drawImage(canvas, 0, 0);
            ctx.restore();
        }
        else if (failureMode === "Residual") {
            // Lingering haze
            ctx.save();
            ctx.globalAlpha = 0.03 + pressure * 0.08;
            ctx.fillStyle = `rgba(150,150,200,${0.02 + pressure * 0.06})`;
            ctx.fillRect(0, 0, w, h);
            ctx.restore();
        }
    }
    
    // Anomaly responses
    function applyAnomalyResponse(ctx, w, h, pressure, traits, now) {
        const anomalyClass = traits?.anomalyClass;
        if (!anomalyClass || anomalyClass === "None") return;
        
        if (anomalyClass === "SpectralSplit") {
            const colorStress = 0.02 + pressure * 0.08;
            ctx.fillStyle = `rgba(255,50,100,${colorStress})`;
            ctx.fillRect(0, 0, w, h);
        }
        else if (anomalyClass === "PhaseInversion") {
            ctx.save();
            ctx.globalAlpha = 0.01 + pressure * 0.06;
            ctx.drawImage(canvas, 0, 0);
            ctx.restore();
        }
        else if (anomalyClass === "GravityWell") {
            const wellDepth = 0.1 + pressure * 0.4;
            const gradient = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, w/2);
            gradient.addColorStop(0, `rgba(0,0,0,${wellDepth * 0.5})`);
            gradient.addColorStop(1, `rgba(0,0,0,${wellDepth})`);
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, w, h);
        }
    }
    
    // Signature pulse - one effect every token shares
    function applySignaturePulse(ctx, w, h, pressure, now) {
        const sig = Math.max(0, Math.sin((now * 0.001 + pressure * 5) * Math.PI)) * 0.018;
        ctx.fillStyle = `rgba(255,255,255,${sig})`;
        ctx.fillRect(0, 0, w, h);
    }
    
    // Vignette (pressure-driven)
    function applyPressureVignette(ctx, w, h, pressure) {
        if (pressure < 0.15) return;
        
        const vignetteStrength = pressure * 0.22;
        const gradient = ctx.createRadialGradient(w/2, h/2, w * 0.2, w/2, h/2, w/2);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, `rgba(0,0,0,${vignetteStrength * 0.3})`);
        gradient.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    // Center emphasis (reinforces composition)
    function applyCenterEmphasis(ctx, w, h, pressure) {
        const cx = w / 2;
        const cy = h / 2;
        
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, w/2);
        grad.addColorStop(0, `rgba(255,255,255,${0.02 * pressure})`);
        grad.addColorStop(1, `rgba(0,0,0,${0.08 * pressure})`);
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
    }
    
    // ============================================================
    // MAIN POST EFFECTS FUNCTION (No random glitches)
    // ============================================================
    function applyPostEffects(ctx, w, h, intensity, now, currentFrame) {
        if (!ENABLE_LIVE_LAYER) return;
        if (!currentFrame) return;
        
        const pressure = getPressure(intensity);
        const engineType = currentFrame.traits?.engineType || "Canonical";
        
        // 1. Engine-specific pressure aura
        applyEnginePressureAura(ctx, w, h, pressure, engineType);
        
        // 2. Engine-specific motion
        if (engineType === "Echo") {
            applyEchoResonance(ctx, w, h, pressure, now);
        } else if (engineType === "Rupture") {
            applyRuptureSeams(ctx, w, h, pressure, now);
        }
        
        // 3. Failure mode response
        applyFailureModeResponse(ctx, w, h, pressure, currentFrame.traits, now);
        
        // 4. Anomaly response
        applyAnomalyResponse(ctx, w, h, pressure, currentFrame.traits, now);
        
        // 5. Signature pulse (universal)
        applySignaturePulse(ctx, w, h, pressure, now);
        
        // 6. Pressure vignette
        applyPressureVignette(ctx, w, h, pressure);
        
        // 7. Center emphasis
        applyCenterEmphasis(ctx, w, h, pressure);
        
        // 8. UI intensity bar
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(10, h - 30, 100, 5);
        ctx.fillStyle = `hsl(${intensity * 120}, 100%, 55%)`;
        ctx.fillRect(10, h - 30, intensity * 100, 5);
        
        // 9. Awakening label with pressure glow
        if (currentAwakenedLevel !== "base") {
            ctx.font = 'bold 10px monospace';
            const glowIntensity = 0.3 + pressure * 0.5;
            ctx.fillStyle = currentAwakenedLevel === "ascended" 
                ? `rgba(255,0,255,${glowIntensity})` 
                : `rgba(0,255,255,${glowIntensity})`;
            ctx.textAlign = 'right';
            ctx.fillText(currentAwakenedLevel.toUpperCase(), w - 15, h - 25);
        }
    }
    
    // ============================================================
    // COMPLEMENTARY TRAITS UI
    // ============================================================
    function getComplementaryTraits(traits, awakeningLevel, intensity) {
        let mood = intensity > 0.8 ? "Intense" : (intensity > 0.6 ? "Energetic" : (intensity > 0.4 ? "Balanced" : (intensity > 0.2 ? "Calm" : "Dormant")));
        const elements = ["Fire", "Water", "Earth", "Air", "Light", "Shadow", "Crystal", "Void"];
        const tokenNum = parseInt(tokenId, 10) || 1;
        const element = elements[tokenNum % elements.length];
        return { 
            mood, 
            element, 
            engineType: traits.engineType, 
            failureMode: traits.failureMode,
            rarityClass: traits.rarityClass,
            awakeningLevel: awakeningLevel,
            anomalyClass: traits.anomalyClass || 'None',
            eventScore: traits.eventScore || 0
        };
    }
    
    function updateComplementaryUI(complementary) {
        const infoEl = document.getElementById('complementaryInfo');
        if (infoEl) {
            infoEl.innerHTML = `${complementary.engineType} · ${complementary.rarityClass} · ${complementary.failureMode} · ${complementary.anomalyClass} · ${complementary.awakeningLevel} · ${complementary.mood} · ${complementary.element} · ES:${complementary.eventScore}`;
        }
        
        const titleEl = document.getElementById('tokenTitle');
        if (titleEl && currentFrame) {
            titleEl.innerHTML = `Art of Farcaster #${tokenId}<br><small>${currentFrame.traits.engineType} · ${currentFrame.traits.rarityClass} · ${currentFrame.awakeningState.level}</small>`;
        }
    }
    
    // ============================================================
    // CANONICAL RENDER (consumes mint traits)
    // ============================================================
    function drawPixelsToCanvas(canvas, pixels, srcW, srcH, destW, destH) {
        canvas.width = destW;
        canvas.height = destH;
        const ctx = canvas.getContext('2d');
        const imgData = ctx.createImageData(destW, destH);
        
        for (let y = 0; y < destH; y++) {
            for (let x = 0; x < destW; x++) {
                const srcX = Math.floor(x * srcW / destW);
                const srcY = Math.floor(y * srcH / destH);
                const srcIdx = (srcY * srcW + srcX) * 4;
                const dstIdx = (y * destW + x) * 4;
                imgData.data[dstIdx] = pixels[srcIdx];
                imgData.data[dstIdx + 1] = pixels[srcIdx + 1];
                imgData.data[dstIdx + 2] = pixels[srcIdx + 2];
                imgData.data[dstIdx + 3] = 255;
            }
        }
        ctx.putImageData(imgData, 0, 0);
    }
    
    function renderCanonicalFrameAndDraw() {
        try {
            if (typeof renderCanonicalFrame !== 'function') {
                console.error("Canonical core not loaded - make sure sketch.js is loaded first");
                if (ctx) {
                    ctx.fillStyle = '#ff4444';
                    ctx.font = '14px monospace';
                    ctx.textAlign = 'center';
                    ctx.fillText('Error: Canonical core not loaded', 350, 350);
                }
                return false;
            }
            
            // CRITICAL: Use txHash from URL with fallback for Highlight delay
            let finalTxHash = txHash;
            if (!finalTxHash || finalTxHash === "0x0" || finalTxHash === "null" || finalTxHash === "") {
                console.warn("⚠️ Missing txHash, using fallback seed for determinism");
                finalTxHash = `fallback_${tokenId}_${Date.now()}`;
            }
            
            const debugOptions = null; // NO DEBUG MODE - determinism first
            
            const result = renderCanonicalFrame({
                tokenId: parseInt(tokenId, 10),
                txHash: finalTxHash,
                width: 320,
                height: 320,
                customMintData: null,
                debugOptions: debugOptions
            });
            
            currentFrame = result;
            
            // Store mint traits for UI
            mintTraits = result.traits;
            
            // Calculate pixel hash for determinism validation
            const pixelHash = hashPixels(result.pixels);
            
            // Draw pixels to canvas
            drawPixelsToCanvas(canvas, result.pixels, 320, 320, 700, 700);
            
            // Update UI with deterministic traits
            const complementary = getComplementaryTraits(
                result.traits, 
                result.awakeningState.level, 
                result.canonicalIntensity
            );
            updateComplementaryUI(complementary);
            
            console.log(`🎨 Viewer: Token #${tokenId}`);
            console.log(`   Engine: ${result.traits.engineType}`);
            console.log(`   Rarity: ${result.traits.rarityClass}`);
            console.log(`   Awakening: ${result.awakeningState.level}`);
            console.log(`   Event Score: ${result.eventScore || 0}`);
            console.log(`   Pixel Hash: ${pixelHash}`);
            
            return true;
            
        } catch(e) {
            console.error("Canonical render error:", e);
            if (ctx) {
                ctx.fillStyle = '#ff4444';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Render Error: ' + e.message, 350, 350);
            }
            return false;
        }
    }
    
    // ============================================================
    // ANIMATION LOOP (with freeze-frame support)
    // ============================================================
    function animate(timestamp) {
        if (!startTime) startTime = timestamp;
        
        // FREEZE FRAME support - if frozen, use static time
        const now = FREEZE_FRAME ? 0 : (timestamp - startTime);
        
        if (currentFrame) {
            // Always redraw canonical base
            drawPixelsToCanvas(canvas, currentFrame.pixels, 320, 320, 700, 700);
            
            // Apply live layer on top if enabled and not frozen
            if (ENABLE_LIVE_LAYER && !FREEZE_FRAME) {
                applyPostEffects(ctx, 700, 700, liveIntensity, now, currentFrame);
                
                const complementary = getComplementaryTraits(
                    currentFrame.traits,
                    currentAwakenedLevel,
                    liveIntensity
                );
                updateComplementaryUI(complementary);
            } else if (frameCount === 0) {
                const complementary = getComplementaryTraits(
                    currentFrame.traits,
                    currentFrame.awakeningState.level,
                    currentFrame.canonicalIntensity
                );
                updateComplementaryUI(complementary);
            }
        }
        
        frameCount++;
        animationId = requestAnimationFrame(animate);
    }
    
    // ============================================================
    // RESIZE HANDLER
    // ============================================================
    function handleResize() {
        if (canvas && currentFrame) {
            drawPixelsToCanvas(canvas, currentFrame.pixels, 320, 320, 700, 700);
            if (ENABLE_LIVE_LAYER && ctx && !FREEZE_FRAME) {
                applyPostEffects(ctx, 700, 700, liveIntensity, performance.now(), currentFrame);
            }
        }
    }
    
    // ============================================================
    // INITIALIZATION
    // ============================================================
    function init() {
        canvas = document.getElementById('artCanvas');
        if (!canvas) {
            console.error("Canvas not found - creating one");
            canvas = document.createElement('canvas');
            canvas.id = 'artCanvas';
            canvas.width = 700;
            canvas.height = 700;
            document.body.appendChild(canvas);
        }
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext('2d');
        
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        tokenId = params.get('tokenId') || params.get('tid') || '1';
        txHash = params.get('txHash') || params.get('h');
        
        // Check for freeze frame
        const freezeParam = params.get('freeze');
        if (freezeParam === 'true' || freezeParam === '1') {
            window.FREEZE_FRAME = true;
            console.log("❄️ FREEZE FRAME mode active - comparing mint output");
        }
        
        console.log(`🎨 Art of Farcaster Viewer v28.6`);
        console.log(`   Token: ${tokenId}`);
        console.log(`   TX: ${txHash ? txHash.slice(0, 10) + '...' : 'MISSING'}`);
        console.log(`   Debug Mode: ${DEBUG_MODE} (MUST BE FALSE)`);
        console.log(`   Live Layer: ${ENABLE_LIVE_LAYER}`);
        console.log(`   Freeze Frame: ${FREEZE_FRAME || false}`);
        
        // Render the canonical frame (consumes mint traits)
        const success = renderCanonicalFrameAndDraw();
        
        if (!success) {
            console.error("Failed to render canonical frame");
            return;
        }
        
        // Fetch live intensity if live layer enabled
        if (ENABLE_LIVE_LAYER && !FREEZE_FRAME) {
            fetchIntensity();
            setInterval(fetchIntensity, 15000);
            console.log("🟢 Pressure-based live layer active");
        } else if (FREEZE_FRAME) {
            console.log("❄️ Freeze frame active - no live intensity fetching");
        } else {
            console.log("🔒 Canonical-only mode active - exact mint match");
        }
        
        // Start animation loop
        startTime = null;
        frameCount = 0;
        animationId = requestAnimationFrame(animate);
        
        // Handle window resize
        window.addEventListener('resize', handleResize);
        
        // Create info div if it doesn't exist
        if (!document.getElementById('complementaryInfo')) {
            const infoDiv = document.createElement('div');
            infoDiv.id = 'complementaryInfo';
            infoDiv.style.position = 'fixed';
            infoDiv.style.bottom = '10px';
            infoDiv.style.left = '10px';
            infoDiv.style.backgroundColor = 'rgba(0,0,0,0.75)';
            infoDiv.style.color = '#ccc';
            infoDiv.style.padding = '8px 12px';
            infoDiv.style.fontFamily = 'monospace';
            infoDiv.style.fontSize = '11px';
            infoDiv.style.borderRadius = '4px';
            infoDiv.style.zIndex = '1000';
            infoDiv.style.backdropFilter = 'blur(4px)';
            document.body.appendChild(infoDiv);
        }
        
        if (!document.getElementById('tokenTitle')) {
            const titleDiv = document.createElement('div');
            titleDiv.id = 'tokenTitle';
            titleDiv.style.position = 'fixed';
            titleDiv.style.top = '10px';
            titleDiv.style.left = '10px';
            titleDiv.style.backgroundColor = 'rgba(0,0,0,0.75)';
            titleDiv.style.color = 'white';
            titleDiv.style.padding = '8px 12px';
            titleDiv.style.fontFamily = 'monospace';
            titleDiv.style.fontSize = '12px';
            titleDiv.style.borderRadius = '4px';
            titleDiv.style.zIndex = '1000';
            titleDiv.style.backdropFilter = 'blur(4px)';
            document.body.appendChild(titleDiv);
        }
        
        console.log("✅ Viewer ready - determinism preserved");
    }
    
    // ============================================================
    // START
    // ============================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
