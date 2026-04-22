// ============================================================
// ART OF FARCASTER - PRODUCTION v6.5
// Stable metadata + animated viewer
// ============================================================

(function() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runScript);
    } else {
        runScript();
    }
    
    function runScript() {
        // ============================================================
        // CONFIG
        // ============================================================
        const DEBUG_MODE = false;
        const EXPERIMENTAL_ANIMATION = true;
        const DEFAULT_INTENSITY = 0.5;  // Stable intensity for metadata

        const ANIMATION_CONFIG = {
            TIME_SPEED: 0.0015,
            GLITCH_STRENGTH: 0.25,
            PULSE_STRENGTH: 0.3,
            DISTORTION_STRENGTH: 1.0,
            COLOR_CYCLE_SPEED: 1.0,
            MOTION_BLUR_ENABLED: false,
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
        // EXPORT TRAITS - 6 traits (PASSES Arweave)
        // ============================================================
        function getExportTraits(currentTraits) {
            return {
                "Rarity": currentTraits["Rarity Class"] || "Common",
                "Archetype": currentTraits["Archetype"] || "Signal",
                "Form": currentTraits["Anchor Form"] || "Aether",
                "Color": currentTraits["Color Mood"] || "Neon",
                "Motion": currentTraits["Motion"] || "Flowing",
                "Composition": currentTraits["Composition"] || "Centered"
            };
        }

        // ============================================================
        // UNIFIED HL ACCESS (supports both hl and $hl)
        // ============================================================
        let HL = null;
        let currentTraits = null;
        let masterSeed = null;
        let streamRNGs = {};
        let baseTraits = null;
        let animationFrameId = null;
        let timeOffset = 0;
        let liveIntensity = DEFAULT_INTENSITY;

        // Animation-safe values (these can change during animation)
        let animatedPulse = 0;
        let animatedHueShift = 0;
        let animatedGlitchOffset = 0;
        let animatedPhase = 0;

        function getHL() {
            if (typeof hl !== 'undefined' && hl) return hl;
            if (typeof $hl !== 'undefined' && $hl) return $hl;
            return null;
        }

        // ============================================================
        // HIGHLIGHT RNG WRAPPERS
        // ============================================================
        function weightedPick(items, weights) {
            const r = HL.random();
            let sum = 0;
            for (let i = 0; i < items.length; i++) {
                sum += weights[i];
                if (r < sum) return items[i];
            }
            return items[items.length - 1];
        }

        // ============================================================
        // RARITY DISTRIBUTION
        // ============================================================
        function rollRarityClass() {
            return weightedPick(
                [RARITY_CLASSES.COMMON, RARITY_CLASSES.UNCOMMON, RARITY_CLASSES.RARE, RARITY_CLASSES.MYTHIC, RARITY_CLASSES.GRAIL],
                [0.60, 0.25, 0.10, 0.04, 0.01]
            );
        }

        function rollArchetype(rarityClass) {
            if (rarityClass === RARITY_CLASSES.GRAIL) {
                return weightedPick(ARCHETYPES, [0.12, 0.14, 0.18, 0.12, 0.28, 0.16]);
            }
            switch (rarityClass) {
                case RARITY_CLASSES.COMMON: return weightedPick(ARCHETYPES, [0.20, 0.18, 0.15, 0.17, 0.18, 0.12]);
                case RARITY_CLASSES.UNCOMMON: return weightedPick(ARCHETYPES, [0.17, 0.17, 0.17, 0.17, 0.18, 0.14]);
                case RARITY_CLASSES.RARE: return weightedPick(ARCHETYPES, [0.14, 0.16, 0.20, 0.16, 0.18, 0.16]);
                case RARITY_CLASSES.MYTHIC: return weightedPick(ARCHETYPES, [0.10, 0.14, 0.22, 0.14, 0.20, 0.20]);
                default: return "Signal";
            }
        }

        function rollAnchorForm(archetype) {
            switch (archetype) {
                case "Signal": return weightedPick(ANCHOR_FORMS, [0.10, 0.28, 0.08, 0.30, 0.18, 0.06]);
                case "Drift": return weightedPick(ANCHOR_FORMS, [0.18, 0.22, 0.06, 0.08, 0.32, 0.14]);
                case "Rift": return weightedPick(ANCHOR_FORMS, [0.06, 0.08, 0.46, 0.12, 0.10, 0.18]);
                case "Core": return weightedPick(ANCHOR_FORMS, [0.32, 0.26, 0.06, 0.16, 0.10, 0.10]);
                case "Prism": return weightedPick(ANCHOR_FORMS, [0.12, 0.30, 0.10, 0.20, 0.16, 0.12]);
                case "Void": return weightedPick(ANCHOR_FORMS, [0.28, 0.16, 0.18, 0.14, 0.08, 0.16]);
                default: return "Aether";
            }
        }

        function buildArchetypePools(archetype, rarityClass) {
            const pools = {};
            pools.patterns = ["Galaxy", "SpiralGalaxy", "Ripple", "Kaleidoscope", "Orbital", "Plasma", "Voronoi"];
            pools.compositions = ["Spiral", "Radial", "Kaleido", "FlowField", "Rotated"];
            pools.colors = ["Neon", "Electric", "Cyberpunk", "Aurora", "Ice", "Magma", "Cyanide", "Laser"];
            pools.glitches = ["Ghost Frame", "Neon Bleed", "Wave"];
            pools.styles = ["NeonNebula", "EtherealFlow", "PsychedelicStorm"];
            pools.masks = ["None", "Radial", "Iris"];
            pools.colorModes = ["smooth", "quantize", "posterize"];
            pools.distortions = ["swirl", "twirl", "ripple"];
            pools.fractals = ["Nova", "Julia", "Mandelbrot", "Barnsley", "Dragon", "Magnet"];
            pools.motions = ["Spiral", "Flowing", "Pulsing"];
            pools.density = ["Medium", "Dense"];
            if (rarityClass === RARITY_CLASSES.GRAIL) {
                pools.density = ["HyperDense", "Dense"];
                pools.styles = Array.from(new Set([...(pools.styles || []), "FractalOnly", "PsychedelicStorm", "NeonNebula", "ChaosWeave"]));
                pools.masks = Array.from(new Set([...(pools.masks || []), "Diamond", "Vignette", "Radial", "Iris"]));
                pools.distortions = Array.from(new Set([...(pools.distortions || []), "swirl", "twirl", "ripple"]));
                pools.colors = Array.from(new Set([...(pools.colors || []), "Chromatic", "Iridescent", "Nebula", "Spectrum"]));
            }
            return pools;
        }

        function pickFromPool(pool, fallback) {
            if (!pool || !pool.length) return fallback;
            return pool[HL.randomInt(0, pool.length - 1)];
        }

        function applyAnchorFormOverrides(traits, anchorForm) {
            switch (anchorForm) {
                case "Aether": 
                    traits.Composition = HL.random() < 0.7 ? "FlowField" : "Spiral";
                    traits.ColorMode = "smooth";
                    traits["Color Mood"] = "Spectrum";
                    traits.Distortion = "ripple";
                    break;
                case "PrismHeart": 
                    traits.Composition = HL.random() < 0.7 ? "Radial" : "Centered"; 
                    traits.ColorMode = "quantize"; 
                    traits["Color Mood"] = "Rainbow"; 
                    break;
                case "Faultline": 
                    traits.Composition = HL.random() < 0.7 ? "Diagonal" : "Asymmetrical"; 
                    break;
                case "Gate": 
                    traits.Composition = "Kaleido"; 
                    break;
                case "Nexus": 
                    traits.Composition = "Spiral"; 
                    traits.Distortion = "swirl"; 
                    break;
                case "Bloom": 
                    traits.Composition = HL.random() < 0.5 ? "Centered" : "Offset"; 
                    break;
            }
        }

        function applyRarityOverrides(traits, rarityClass, archetype) {
            traits.Special = "none";
            if (rarityClass === RARITY_CLASSES.MYTHIC) {
                if (HL.random() < 0.18) traits.Special = "pureFractal";
                if (!traits["Hidden Effect"] && HL.random() < 0.35) traits["Hidden Effect"] = HL.random() < 0.5 ? "Infinite Fractal" : "Time Dilation";
            }
            if (rarityClass === RARITY_CLASSES.GRAIL) {
                const grailRoll = HL.random();
                if (grailRoll < 0.20) { 
                    traits.GrailType = "Nova";
                    traits.Special = "nova"; 
                    traits["Color Mood"] = "Fire"; 
                    traits.Mask = "Radial"; 
                    traits.Style = "PsychedelicStorm"; 
                    traits["Hidden Effect"] = "Explosive Energy"; 
                } else if (grailRoll < 0.40) { 
                    traits.GrailType = "Eclipse"; 
                    traits.Special = "eclipse"; 
                    traits["Color Mood"] = "Shadow"; 
                    traits.Style = "EtherealFlow"; 
                    traits["Hidden Effect"] = "Dark Resonance"; 
                } else if (grailRoll < 0.60) { 
                    traits.GrailType = "Cathedral"; 
                    traits.Composition = "Kaleido"; 
                    traits.Mask = "Diamond"; 
                    traits.Style = "FractalOnly"; 
                    traits["Color Mood"] = "Aurora"; 
                    traits["Hidden Effect"] = "Infinite Fractal"; 
                } else if (grailRoll < 0.80) { 
                    traits.GrailType = "Chromatic"; 
                    traits.Special = "chromatic"; 
                    traits["Color Mood"] = "Spectrum"; 
                    traits.Style = "PsychedelicStorm"; 
                    traits["Hidden Effect"] = "Prism Shift"; 
                } else { 
                    traits.GrailType = "Aether"; 
                    traits.Special = "aether"; 
                    traits.Composition = "FlowField"; 
                    traits.Mask = "Radial"; 
                    traits["Color Mood"] = "Iridescent"; 
                    traits["Hidden Effect"] = "Eternal Flow"; 
                }
                if (HL.random() < 0.35) {
                    const hiddenMutations = ["Phase Bleed", "Mirror Collapse", "Void Echo", "Signal Ghost", "Gravity Well"];
                    traits.GrailMutation = hiddenMutations[HL.randomInt(0, hiddenMutations.length - 1)];
                    traits.MutationSeed = Math.floor(HL.random() * 1e9);
                    traits.Anomaly = "Present";
                }
            }
        }

        function applyHarmonyRules(traits, archetype) {
            if (traits.GlitchType && !traits["Glitch Type"]) traits["Glitch Type"] = traits.GlitchType;
            if (traits.ColorMode && !traits["Color Mode"]) traits["Color Mode"] = traits.ColorMode;
        }

        function generateCollectionTraits() {
            const rarityClass = rollRarityClass();
            const archetype = rollArchetype(rarityClass);
            const anchorForm = rollAnchorForm(archetype);
            const pools = buildArchetypePools(archetype, rarityClass);
            const traits = {
                "Rarity Class": rarityClass,
                "Archetype": archetype,
                "Anchor Form": anchorForm,
                "Fractal Type": pickFromPool(pools.fractals, "Nova"),
                "Pattern": pickFromPool(pools.patterns, "Galaxy"),
                "Density": pickFromPool(pools.density, "Medium"),
                "Edge Style": pickFromPool(["Sharp", "Soft", "Glowing", "Crisp", "Pixelated"], "Sharp"),
                "Motion": pickFromPool(pools.motions, "Flowing"),
                "Color Mood": pickFromPool(pools.colors, "Neon"),
                "Glitch Type": pickFromPool(pools.glitches, "Wave"),
                "Distortion": pickFromPool(pools.distortions, "none"),
                "Color Mode": pickFromPool(pools.colorModes, "smooth"),
                "Mask": pickFromPool(pools.masks, "None"),
                "Style": pickFromPool(pools.styles, "Hybrid"),
                "Composition": pickFromPool(pools.compositions, "Centered")
            };
            applyAnchorFormOverrides(traits, anchorForm);
            applyRarityOverrides(traits, rarityClass, archetype);
            applyHarmonyRules(traits, archetype);
            return traits;
        }

        // ============================================================
        // DETERMINISTIC HELPERS
        // ============================================================
        function getDeterministicPhase(masterSeed, intensity) {
            return Math.floor((masterSeed + intensity * 10000)) % 4;
        }

        function deterministicTime(tokenId, masterSeed, intensity) {
            const tokenNum = parseInt(tokenId, 10) || 0;
            return ((tokenNum * 0.0123456789) + (masterSeed * 0.0000001) + (intensity * 0.1)) % 1.0;
        }

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

        // ============================================================
        // SAFE ANIMATION EFFECTS (no metadata changes)
        // ============================================================
        function updateAnimatedValues() {
            if (!EXPERIMENTAL_ANIMATION) return;
            
            // Pulse brightness - oscillates smoothly
            animatedPulse = 0.7 + Math.sin(timeOffset * 0.003) * 0.3;
            
            // Hue shift - drifts within palette
            animatedHueShift = Math.sin(timeOffset * 0.001) * 20;
            
            // Glitch offset - subtle oscillation
            animatedGlitchOffset = Math.sin(timeOffset * 0.01) * 5;
            
            // Flowing phase - for distortion
            animatedPhase = (animatedPhase + 0.02) % (Math.PI * 2);
        }

        // ============================================================
        // FRACTAL ENGINES (with animation-safe parameters)
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

        function getFractalValue(x, y, fractalType, maxIter, phase, progression, archetype) {
            const chaosPhase = phase === PHASES.CHAOS;
            let iterMod = chaosPhase ? 1.4 : 1.0;
            if (progression === "ascended") iterMod *= 1.3;
            else if (progression === "awakened") iterMod *= 1.15;
            let actualIter = Math.floor(maxIter * iterMod);
            return novaFractalCalc(x, y, Math.floor(actualIter * 0.8));
        }

        function getDepthFractalValue(x, y, fractalType, maxIter, phase, progression, archetype) {
            let depth = 0;
            for (let i = 0; i < 3; i++) {
                const scale = 1 + i * 0.15;
                depth += getFractalValue(x * scale, y * scale, fractalType, maxIter, phase, progression, archetype);
            }
            return depth / 3;
        }

        function getPatternValue(x, y, pattern, intensity, time, phase, progression, archetype) {
            const chaosBoost = phase === PHASES.CHAOS ? 1.5 : 1.0;
            let progressionBoost = 1.0;
            if (progression === "ascended") progressionBoost = 1.4;
            else if (progression === "awakened") progressionBoost = 1.2;
            const r = Math.sqrt(x * x + y * y);
            const a = Math.atan2(y, x);
            let val = Math.sin(a * 5 * progressionBoost - r * 18 * progressionBoost + time) * 0.35;
            val += Math.sin(a * 10 * progressionBoost + r * 9 * progressionBoost - time * 0.5) * 0.15;
            let result = (val + 0.5);
            return result < 0.02 ? 0.02 : result > 0.98 ? 0.98 : result;
        }

        function applyCompositionTransform(ux, uy, composition, zoom, offsetX, offsetY) {
            let x = ux / zoom + offsetX;
            let y = uy / zoom + offsetY;
            switch(composition) {
                case "Radial": { const r = Math.sqrt(x*x+y*y); const a = Math.atan2(y,x); x = a; y = r; break; }
                case "Kaleido": { const segments = 6; let a = Math.atan2(y,x); let r = Math.sqrt(x*x+y*y); a = a % (Math.PI*2/segments); if(a > Math.PI/segments) a = (Math.PI*2/segments)-a; x = Math.cos(a)*r; y = Math.sin(a)*r; break; }
                case "Spiral": { const r = Math.sqrt(x*x+y*y); const a = Math.atan2(y,x); const spiralR = Math.pow(r,0.7)*1.5; x = Math.cos(a+spiralR*4)*spiralR; y = Math.sin(a+spiralR*4)*spiralR; break; }
                case "FlowField": { const angle = Math.sin(x*3)*Math.cos(y*3); const cosA = Math.cos(angle); const sinA = Math.sin(angle); const nx = x*cosA - y*sinA; const ny = x*sinA + y*cosA; x = nx; y = ny; break; }
                case "Centered": break;
                case "Diagonal": { const temp = x; x = x + y; y = temp - y; break; }
                case "Asymmetrical": x = x * 1.4; y = y * 0.8; break;
                case "Rotated": { const angle = Math.PI / 4; const cos = Math.cos(angle); const sin = Math.sin(angle); const temp = x * cos - y * sin; y = x * sin + y * cos; x = temp; break; }
            }
            return { x, y };
        }

        function applyAnchorFormTransform(x, y, anchorForm, time, intensity, progression) {
            let rx = x, ry = y;
            let effectStrength = progression === "ascended" ? 1.5 : progression === "awakened" ? 1.25 : 1.0;
            switch (anchorForm) {
                case "Aether": 
                    { const rad = Math.sqrt(rx*rx+ry*ry); const angle = Math.atan2(ry,rx); const flow = angle + time * 0.5 * effectStrength; rx = Math.cos(flow) * rad * (1 + Math.sin(rad*5)*0.1); ry = Math.sin(flow) * rad * (1 + Math.cos(rad*5)*0.1); break; }
                case "Nexus": 
                    { const rad = Math.sqrt(rx*rx+ry*ry); const angle = Math.atan2(ry,rx); const spiral = angle + rad*4*effectStrength; rx = Math.cos(spiral)*rad*(1+rad*0.3); ry = Math.sin(spiral)*rad*(1+rad*0.3); break; }
                case "PrismHeart": 
                    { const angle = Math.atan2(ry, rx); const heartX = 16 * Math.pow(Math.sin(angle), 3); const heartY = 13 * Math.cos(angle) - 5 * Math.cos(2*angle) - 2*Math.cos(3*angle) - Math.cos(4*angle); rx = rx * 0.8 + heartX * 0.05 * effectStrength; ry = ry * 0.8 + heartY * 0.05 * effectStrength; break; }
                case "Gate": 
                    rx = Math.abs(rx); 
                    break;
                case "Bloom": 
                    { const r = Math.sqrt(rx*rx+ry*ry); const bloom = 1 + Math.exp(-r*3) * 0.2 * effectStrength; rx *= bloom; ry *= bloom; break; }
                case "Faultline": 
                    { const line = rx + ry; const threshold = 0.12 / effectStrength; if (Math.abs(line) < threshold) { rx += 0.1 * effectStrength * (rx === 0 ? 1 : (rx > 0 ? 1 : -1)); ry -= 0.1 * effectStrength * (ry === 0 ? 1 : (ry > 0 ? 1 : -1)); } break; }
            }
            return { x: rx, y: ry };
        }

        function applyDistortion(rx, ry, distortionType, progression) {
            let x = rx, y = ry;
            let strength = ANIMATION_CONFIG.DISTORTION_STRENGTH;
            if (progression === "ascended") strength *= 1.3;
            else if (progression === "awakened") strength *= 1.15;
            
            // Add animated distortion for breathing effect
            const animatedStrength = strength * (0.8 + animatedPulse * 0.4);
            
            switch(distortionType) {
                case "swirl": { const r = Math.sqrt(x*x+y*y); const a = Math.atan2(y,x)+r*2.0*animatedStrength; x = Math.cos(a)*r; y = Math.sin(a)*r; break; }
                case "twirl": { const r = Math.sqrt(x*x+y*y); const a = Math.atan2(y,x)+1.5*animatedStrength*(1-r); x = Math.cos(a)*r; y = Math.sin(a)*r; break; }
                case "ripple": x += Math.sin(y*8*animatedStrength + animatedPhase)*0.05*animatedStrength; y += Math.cos(x*8*animatedStrength + animatedPhase)*0.05*animatedStrength; break;
                case "pinch": { const r = Math.sqrt(x*x+y*y); const pinch = 1/(1+r*1.5*animatedStrength); x *= pinch; y *= pinch; break; }
            }
            return { x, y };
        }

        function applyMask(t, x, y, maskType, progression) {
            let result = t;
            const r = Math.sqrt(x*x+y*y);
            let maskStrength = progression === "ascended" ? 0.7 : progression === "awakened" ? 0.85 : 1.0;
            switch(maskType) {
                case "Radial": result *= Math.exp(-r*1.5*maskStrength); break;
                case "Vignette": result *= Math.max(0.3, 1 - r*1.2*maskStrength); break;
                case "Diamond": result *= Math.max(0, 1 - Math.abs(x) - Math.abs(y)); break;
                case "Iris": result *= 0.6 + 0.4 * Math.sin(r*20); break;
                case "None": break;
            }
            return result < 0.05 ? 0.05 : result > 0.98 ? 0.98 : result;
        }

        function applyColorMode(t, colorMode, progression) {
            switch(colorMode) {
                case "posterize": return Math.floor(t * (progression === "ascended" ? 8 : 5)) / (progression === "ascended" ? 8 : 5);
                case "quantize": return Math.floor(t * (progression === "ascended" ? 10 : 6)) / (progression === "ascended" ? 10 : 6);
                case "invert": return 1 - t;
                case "smooth": return t;
                default: return t;
            }
        }

        function blendFractalAndPattern(fractalVal, patternVal, style, traits, progression, archetype) {
            let baseValue = fractalVal * 0.6 + patternVal * 0.4;
            if (archetype === "Prism" && progression === "ascended") baseValue = Math.min(0.98, baseValue * 1.1);
            else if (archetype === "Void" && progression === "ascended") baseValue = 1 - baseValue;
            else if (archetype === "Drift" && progression === "ascended") baseValue = Math.pow(baseValue, 0.7);
            return baseValue < 0.02 ? 0.02 : baseValue > 0.98 ? 0.98 : baseValue;
        }

        function getRichColor(t, colorMood, intensity, time, phase, progression, archetype) {
            let r, g, b;
            const speed = ANIMATION_CONFIG.COLOR_CYCLE_SPEED;
            const chaosPhase = phase === PHASES.CHAOS;
            const actualSpeed = chaosPhase ? speed * 1.5 : speed;
            
            // Add animated pulse to brightness
            const brightnessBoost = animatedPulse;
            
            switch(colorMood) {
                case "Rainbow":
                    // Animated hue shift
                    const hueOffset = animatedHueShift * 0.01;
                    r = Math.sin(t * 20 + time * actualSpeed + hueOffset) * 0.8 + 0.8;
                    g = Math.sin(t * 20 + 2.094 + time * actualSpeed * 1.2 + hueOffset) * 0.8 + 0.8;
                    b = Math.sin(t * 20 + 4.188 + time * actualSpeed * 0.8 + hueOffset) * 0.8 + 0.8;
                    break;
                case "Fire":
                    r = 1.0;
                    g = 0.2 + 0.6 * Math.sin(t * 12 + time * 1.8) * brightnessBoost;
                    b = 0.0;
                    break;
                case "Aurora":
                    r = 0.1 + 0.3 * Math.sin(t * 5 + time) * brightnessBoost;
                    g = 0.3 + 0.7 * Math.sin(t * 8 + time * 1.1) * brightnessBoost;
                    b = 0.6 + 0.4 * Math.sin(t * 10 + time * 0.9) * brightnessBoost;
                    break;
                case "Ice":
                    r = 0.1 + 0.2 * Math.sin(t * 6 + time) * brightnessBoost;
                    g = 0.4 + 0.4 * Math.sin(t * 8 + time) * brightnessBoost;
                    b = 0.9 + 0.1 * Math.sin(t * 10 + time * 1.2) * brightnessBoost;
                    break;
                case "Spectrum":
                    r = Math.sin(t * 25 + time) * 0.9 + 0.9;
                    g = Math.sin(t * 25 + 2.094 + time * 1.3) * 0.9 + 0.9;
                    b = Math.sin(t * 25 + 4.188 + time * 0.7) * 0.9 + 0.9;
                    break;
                case "Neon":
                    r = 0.0 + 1.0 * Math.sin(t * 8 + time) * brightnessBoost;
                    g = 0.0 + 1.0 * Math.cos(t * 10 + time * 1.2) * brightnessBoost;
                    b = 0.2 + 0.8 * Math.sin(t * 12 + time * 0.8) * brightnessBoost;
                    break;
                default:
                    r = Math.sin(t * 15 + time) * 0.6 + 0.6;
                    g = Math.sin(t * 15 + 2.094 + time) * 0.6 + 0.6;
                    b = Math.sin(t * 15 + 4.188 + time) * 0.6 + 0.6;
            }
            
            // Apply pulse to all colors
            r = Math.min(0.95, r * brightnessBoost);
            g = Math.min(0.95, g * brightnessBoost);
            b = Math.min(0.95, b * brightnessBoost);
            
            if (!isFinite(r) || !isFinite(g) || !isFinite(b)) {
                r = 0.5; g = 0.2; b = 0.7;
            }
            return { r: Math.min(0.95, Math.max(0.05, r)), g: Math.min(0.95, Math.max(0.05, g)), b: Math.min(0.95, Math.max(0.05, b)) };
        }

        function getGrailColor(t, grailType, intensity, time, x, y, hiddenMutation, progression) {
            let r, g, b;
            
            // Add animated effects for Grails
            const grailPulse = 0.7 + animatedPulse * 0.6;
            const grailGlow = 0.3 + animatedPulse * 0.5;
            
            switch(grailType) {
                case "Nova":
                    r = 0.9 + 0.3 * Math.sin(t * 30 + time * 20) * grailPulse;
                    g = 0.5 + 0.5 * Math.sin(t * 25 + time * 15) * grailPulse;
                    b = 0.1 + 0.3 * Math.sin(t * 35 + time * 25) * grailPulse;
                    if (progression === "ascended") {
                        const explosion = Math.sin(time * 8) * 0.3 * grailGlow;
                        r += explosion; g += explosion * 0.7; b += explosion * 0.3;
                    }
                    break;
                case "Eclipse":
                    r = 0.15 + 0.25 * Math.sin(t * 8 + time * 0.5) * grailPulse;
                    g = 0.05 + 0.1 * Math.sin(t * 10 + time * 0.3) * grailPulse;
                    b = 0.3 + 0.4 * Math.sin(t * 12 + time * 0.4) * grailPulse;
                    if (progression === "ascended") {
                        const flare = Math.sin(time * 3) * 0.3 * grailGlow + 0.3;
                        r += flare; g += flare * 0.5; b += flare;
                    }
                    break;
                case "Cathedral":
                    r = 0.6 + 0.3 * Math.sin(t * 25 + time) * grailPulse;
                    g = 0.3 + 0.5 * Math.cos(t * 20 + time * 1.2) * grailPulse;
                    b = 0.7 + 0.2 * Math.sin(t * 30 + time * 0.8) * grailPulse;
                    break;
                case "Chromatic":
                    r = Math.sin(t * 35 + time * 10 + animatedHueShift * 0.02) * 0.7 + 0.5;
                    g = Math.sin(t * 35 + 2.094 + time * 12 + animatedHueShift * 0.02) * 0.7 + 0.5;
                    b = Math.sin(t * 35 + 4.188 + time * 8 + animatedHueShift * 0.02) * 0.7 + 0.5;
                    break;
                case "Aether":
                    r = 0.3 + 0.6 * Math.sin(t * 12 + time * 0.8) * grailPulse;
                    g = 0.5 + 0.5 * Math.cos(t * 14 + time * 0.6) * grailPulse;
                    b = 0.7 + 0.3 * Math.sin(t * 16 + time * 0.4) * grailPulse;
                    break;
                default:
                    r = t * 0.7 + 0.15;
                    g = t * 0.5 + 0.1;
                    b = t * 0.3 + 0.05;
            }
            
            // Apply grail glow
            r = Math.min(0.95, r * (0.8 + grailGlow * 0.4));
            g = Math.min(0.95, g * (0.8 + grailGlow * 0.4));
            b = Math.min(0.95, b * (0.8 + grailGlow * 0.6));
            
            return { r: Math.min(0.9, Math.max(0.03, r)), g: Math.min(0.9, Math.max(0.03, g)), b: Math.min(0.9, Math.max(0.03, b)) };
        }

        function getGrailRenderValue(rx, ry, fractalVal, patternVal, grailType, time, masterSeed, hiddenMutation, traits, progression, recursionDepth = 0) {
            let result;
            switch(grailType) {
                case "Nova":
                    { const r = Math.sqrt(rx*rx+ry*ry); const burst = Math.exp(-r * 2) * 1.5; const shockwave = Math.sin(r * 20 - time * 10 + animatedPhase) * 0.3; result = Math.min(0.95, burst + shockwave + 0.1); break; }
                case "Eclipse": 
                    { const r = Math.sqrt(rx*rx+ry*ry); const darkCore = Math.exp(-r * 3); const outerGlow = Math.sin(r * 15 - time * 2 + animatedPhase) * 0.3; result = Math.min(0.95, darkCore * 0.8 + outerGlow + 0.1); break; }
                case "Cathedral": 
                    { const sym = Math.cos(Math.atan2(ry,rx)*8 + animatedPhase) * Math.sin(Math.sqrt(rx*rx+ry*ry)*10 + animatedPhase); result = sym * 0.5 + 0.5; break; }
                case "Chromatic": 
                    { const wave = Math.sin(rx*12 + time*4 + animatedPhase) * Math.cos(ry*12 - time*3 + animatedPhase); result = wave * 0.5 + 0.5; break; }
                case "Aether": 
                    { const flow = Math.sin(rx*5 + time + animatedPhase) * Math.cos(ry*5 - time + animatedPhase); result = flow * 0.6 + 0.4; break; }
                default: 
                    result = (fractalVal + patternVal) * 0.5;
            }
            return Math.max(0.03, Math.min(0.97, result));
        }

        function applyHiddenGrailMutation(t, rx, ry, fractalVal, patternVal, grailType, hiddenMutation, time, phase, intensity, masterSeed, localIter, traits, mutationRand, progression, depth) {
            if (!hiddenMutation) return t;
            let result = t;
            
            // Add animated mutation strength
            const mutationStrength = 0.5 + animatedPulse * 0.5;
            
            switch(hiddenMutation) {
                case "Phase Bleed": result = t * 0.7 + fractalVal * 0.3; break;
                case "Void Echo": result = t * 0.6 + Math.sin(rx*8+time + animatedPhase)*0.2 + Math.cos(ry*8-time + animatedPhase)*0.2; break;
                case "Signal Ghost": { const ghost = Math.sin((rx+ry)*20 + time*6 + animatedPhase); result = ghost > (0.5 + mutationStrength * 0.2) ? (1 - t * 0.8) : t; break; }
                case "Mirror Collapse": result = getGrailRenderValue(rx + Math.sin(time*4 + animatedPhase)*0.08, ry, fractalVal, patternVal, grailType, time, masterSeed, null, traits, progression, depth+1); break;
                case "Gravity Well": { const r2 = rx*rx+ry*ry+0.0001; const well = Math.min(0.35, 0.04 / r2) * mutationStrength; result = t + well; break; }
                default: result = t;
            }
            return Math.max(0.03, Math.min(0.97, result));
        }

        function applyGlitchToColor(r, g, b, glitchType, intensity, x, y, time, glitchSeed, progression) {
            let strength = intensity * 0.25;
            if (progression === "ascended") strength *= 1.5;
            else if (progression === "awakened") strength *= 1.25;
            
            // Add animated glitch
            const animatedGlitch = Math.sin(time * 0.02 + animatedGlitchOffset) * 0.3;
            
            let nr = r, ng = g, nb = b;
            switch(glitchType) {
                case "Neon Bleed": {
                    const bleed = Math.exp(-Math.abs(x)*5) * strength * 0.6 * (1 + animatedGlitch);
                    nr = Math.min(0.95, r + bleed);
                    nb = Math.min(0.95, b + bleed * 0.5);
                    break;
                }
                case "Ghost Frame": {
                    const ghostStrength = strength * 0.4 * (1 + animatedGlitch);
                    nr = Math.min(0.95, r + Math.sin(x*50+time + animatedPhase)*ghostStrength);
                    ng = Math.min(0.95, g + Math.cos(y*50+time + animatedPhase)*ghostStrength);
                    nb = Math.min(0.95, b + Math.sin((x+y)*30+time*1.5 + animatedPhase)*ghostStrength);
                    break;
                }
                case "Wave": {
                    const wave = Math.sin(x*30 + y*30 + time*8 + animatedPhase) * strength * (1 + animatedGlitch);
                    nr = Math.min(0.95, r + wave);
                    ng = Math.min(0.95, g + wave);
                    nb = Math.min(0.95, b + wave);
                    break;
                }
                default: break;
            }
            return { r: nr, g: ng, b: nb };
        }

        // ============================================================
        // LIVE INTENSITY FETCHER (viewer only)
        // ============================================================
        const INTENSITY_API_URL = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
        
        async function fetchLiveIntensity() {
            try {
                const response = await fetch(INTENSITY_API_URL);
                if (response.ok) {
                    const data = await response.json();
                    if (typeof data.intensity === 'number' && !isNaN(data.intensity)) {
                        liveIntensity = Math.max(0.05, Math.min(0.95, data.intensity));
                    }
                }
            } catch (e) {}
        }

        // ============================================================
        // RENDER ENGINE
        // ============================================================
        const canvas = document.getElementById('artCanvas');
        if (!canvas) {
            console.error("Canvas element 'artCanvas' not found!");
            return;
        }

        canvas.width = 700;
        canvas.height = 700;
        const ctx = canvas.getContext('2d');
        
        let offscreen = null;
        let offCtx = null;
        let w = 0, h = 0;
        let baseTraitsCache = null;
        let deterministicPhase = 0;
        let deterministicIntensity = DEFAULT_INTENSITY;
        let canonicalTimeValue = 0;

        function initRNGStreams() { 
            for(let i = 1; i <= 7; i++) streamRNGs[i] = splitSeed(masterSeed, i); 
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
        
        function applyTokenOffset(tokenId) { 
            const tokenOffset = parseInt(tokenId, 10) || 0; 
            const steps = (tokenOffset * 997) % 1000; 
            for (let i = 0; i < steps; i++) { 
                for(let s = 1; s <= 7; s++) if(streamRNGs[s]) streamRNGs[s](); 
            } 
        }
        
        function generateBaseTraits() { 
            const traitsRNG = streamRNGs[1]; 
            return { 
                layout: { 
                    zoom: 0.7 + traitsRNG() * 1.2, 
                    offsetX: (traitsRNG() - 0.5) * 1.0, 
                    offsetY: (traitsRNG() - 0.5) * 1.0 
                }, 
                baseMaxIter: 80 + Math.floor(traitsRNG() * 160) 
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

        function getIntensityFromMintData(hlObj, rand) {
            try {
                if (hlObj.tx.customMintData && hlObj.tx.customMintData !== "0x") {
                    const data = JSON.parse(hlObj.tx.customMintData);
                    if (typeof data.intensity === 'number') {
                        return Math.max(0.05, Math.min(0.95, data.intensity));
                    }
                }
            } catch (e) {}
            return 0.2 + rand() * 0.7;
        }

        function updateOffscreen(phase) { 
            const dynamicScale = phase === PHASES.CHAOS ? 0.45 : 0.6; 
            const newW = Math.floor(700 * dynamicScale); 
            const newH = Math.floor(700 * dynamicScale); 
            if(!offscreen || offscreen.width !== newW || offscreen.height !== newH) { 
                offscreen = document.createElement('canvas'); 
                offscreen.width = newW; 
                offscreen.height = newH; 
                offCtx = offscreen.getContext('2d'); 
            } 
            w = offscreen.width; 
            h = offscreen.height; 
        }

        function render() {
            if (!currentTraits || masterSeed === null) {
                ctx.fillStyle = '#111';
                ctx.fillRect(0, 0, 700, 700);
                ctx.fillStyle = '#fff';
                ctx.font = '14px monospace';
                ctx.textAlign = 'center';
                ctx.fillText('Preparing...', 350, 350);
                return;
            }
            
            try {
                // Update animated values for this frame
                updateAnimatedValues();
                
                updateOffscreen(deterministicPhase);
                const imgData = offCtx.createImageData(w, h);
                const data = imgData.data;
                const isGrail = (currentTraits["Rarity Class"] === RARITY_CLASSES.GRAIL);
                
                // Use live intensity for viewer, but deterministic for metadata
                const displayIntensity = EXPERIMENTAL_ANIMATION ? liveIntensity : deterministicIntensity;
                const progression = getProgressionState(displayIntensity, isGrail);
                
                // Animated time (drifts slowly)
                const time = EXPERIMENTAL_ANIMATION ? 
                    canonicalTimeValue + timeOffset * 0.002 : 
                    canonicalTimeValue;
                
                const phase = deterministicPhase;
                const zoom = baseTraitsCache?.layout?.zoom || 1.0;
                const offsetX = baseTraitsCache?.layout?.offsetX || 0;
                const offsetY = baseTraitsCache?.layout?.offsetY || 0;
                const maxIter = baseTraitsCache?.baseMaxIter || 120;
                
                for(let y = 0; y < h; y++) {
                    for(let x = 0; x < w; x++) {
                        let ux = (x/w) * 4.0 - 2.5;
                        let uy = (y/h) * 4.0 - 2.0;
                        ux *= w/h;
                        
                        let transformed = applyCompositionTransform(ux, uy, currentTraits.Composition, zoom, offsetX, offsetY);
                        let rx = transformed.x;
                        let ry = transformed.y;
                        
                        let anchored = applyAnchorFormTransform(rx, ry, currentTraits["Anchor Form"], time, displayIntensity, progression);
                        rx = anchored.x; ry = anchored.y;
                        
                        let distorted = applyDistortion(rx, ry, currentTraits.Distortion, progression);
                        rx = distorted.x; ry = distorted.y;
                        
                        let fractalVal = getDepthFractalValue(rx, ry, currentTraits["Fractal Type"], maxIter, phase, progression, currentTraits["Archetype"]);
                        let patternVal = getPatternValue(rx, ry, currentTraits.Pattern, displayIntensity, time, phase, progression, currentTraits["Archetype"]);
                        
                        let t;
                        let r,g,b;
                        
                        if (isGrail && currentTraits.GrailType) {
                            t = getGrailRenderValue(rx, ry, fractalVal, patternVal, currentTraits.GrailType, time, masterSeed, currentTraits.GrailMutation, currentTraits, progression, 0);
                            t = applyHiddenGrailMutation(t, rx, ry, fractalVal, patternVal, currentTraits.GrailType, currentTraits.GrailMutation, time, phase, displayIntensity, masterSeed, maxIter, currentTraits, streamRNGs[3], progression, 0);
                            if (!isFinite(t)) t = 0.5;
                            t = Math.max(0.03, Math.min(0.97, t));
                            const colorMode = currentTraits["Color Mode"] || currentTraits.ColorMode || "smooth";
                            t = applyColorMode(t, colorMode, progression);
                            t = applyMask(t, rx, ry, currentTraits.Mask, progression);
                            if (!isFinite(t)) t = 0.5;
                            t = Math.max(0.03, Math.min(0.97, t));
                            ({ r, g, b } = getGrailColor(t, currentTraits.GrailType, displayIntensity, time, rx, ry, currentTraits.GrailMutation, progression));
                            if (!isFinite(r) || !isFinite(g) || !isFinite(b)) {
                                r = 0.2; g = 0.2; b = 0.2;
                            }
                        } else {
                            t = blendFractalAndPattern(fractalVal, patternVal, currentTraits.Style, currentTraits, progression, currentTraits["Archetype"]);
                            if (!isFinite(t)) t = 0.5;
                            t = Math.max(0.03, Math.min(0.97, t));
                            const colorMode = currentTraits["Color Mode"] || currentTraits.ColorMode || "smooth";
                            t = applyColorMode(t, colorMode, progression);
                            t = applyMask(t, rx, ry, currentTraits.Mask, progression);
                            if (!isFinite(t)) t = 0.5;
                            t = Math.max(0.03, Math.min(0.97, t));
                            ({ r, g, b } = getRichColor(t, currentTraits["Color Mood"] || "Neon", displayIntensity, time, phase, progression, currentTraits["Archetype"]));
                            if (!isFinite(r) || !isFinite(g) || !isFinite(b)) {
                                r = 0.2; g = 0.2; b = 0.2;
                            }
                        }
                        
                        const glitchType = currentTraits["Glitch Type"] || currentTraits.GlitchType || "Wave";
                        let glitched = applyGlitchToColor(r, g, b, glitchType, displayIntensity, x, y, time, masterSeed || 0, progression);
                        r = glitched.r; g = glitched.g; b = glitched.b;
                        
                        const idx = (y * w + x) * 4;
                        data[idx] = Math.min(255, Math.max(0, Math.floor(r * 255)));
                        data[idx+1] = Math.min(255, Math.max(0, Math.floor(g * 255)));
                        data[idx+2] = Math.min(255, Math.max(0, Math.floor(b * 255)));
                        data[idx+3] = 255;
                    }
                }
                offCtx.putImageData(imgData, 0, 0);
                ctx.drawImage(offscreen, 0, 0, w, h, 0, 0, 700, 700);
            } catch(e) { 
                console.error("Render error:", e);
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, 700, 700);
            }
        }

        // ============================================================
        // ANIMATION LOOP
        // ============================================================
        function animate() {
            if (!currentTraits || masterSeed === null) { 
                setTimeout(animate, 100); 
                return; 
            }
            timeOffset += 16;
            render();
            animationFrameId = requestAnimationFrame(animate);
        }
        
        function startAnimation() { 
            if(animationFrameId) return; 
            animate(); 
        }

        // ============================================================
        // WAIT FOR HL AND GENERATE
        // ============================================================
        function waitForHL(callback, attempts = 0) {
            const hlRef = getHL();
            
            if (hlRef && hlRef.tx) {
                const tokenId = hlRef.tx.tokenId;
                if (tokenId && tokenId !== "0" && tokenId !== "pending") {
                    callback(hlRef);
                    return;
                }
            }
            if (attempts < 60) {
                setTimeout(() => waitForHL(callback, attempts + 1), 500);
            } else {
                console.error("Timeout waiting for HL");
                ctx.fillStyle = '#ff4444';
                ctx.fillText('Timeout - refresh', 350, 380);
            }
        }

        // ============================================================
        // BOOT - Stable metadata then animation
        // ============================================================
        function boot() {
            // Show pending state
            ctx.fillStyle = '#111';
            ctx.fillRect(0, 0, 700, 700);
            ctx.fillStyle = '#fff';
            ctx.font = '14px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('Preparing...', 350, 350);
            
            waitForHL((hlRef) => {
                HL = hlRef;
                
                // Generate deterministic traits using DEFAULT intensity (stable)
                const tokenId = HL.tx.tokenId;
                const txHash = HL.tx.hash;
                masterSeed = getSeed(tokenId, txHash);
                
                // Generate traits deterministically
                currentTraits = generateCollectionTraits();
                
                // Setup RNG streams for base traits
                initRNGStreams();
                applyTokenOffset(tokenId);
                baseTraitsCache = generateBaseTraits();
                
                // Calculate deterministic values (used for both metadata and animation base)
                const intensityRand = makeSeededRand(masterSeed);
                deterministicIntensity = getIntensityFromMintData(HL, intensityRand);
                deterministicPhase = getDeterministicPhase(masterSeed, deterministicIntensity);
                canonicalTimeValue = deterministicTime(tokenId, masterSeed, deterministicIntensity);
                
                // CRITICAL: Set metadata with DEFAULT intensity (stable, not live)
                const exportTraits = getExportTraits(currentTraits);
                HL.token.setTraits(exportTraits);
                HL.token.setName(`Art of Farcaster #${tokenId}`);
                HL.token.setDescription(
                    `Art of Farcaster - ${currentTraits["Rarity Class"]} ${currentTraits["Archetype"]} piece.`
                );
                
                // First render (will use deterministic intensity)
                render();
                
                // Fetch live intensity for viewer (doesn't affect metadata)
                fetchLiveIntensity().then(() => {
                    // Re-render with live intensity for viewer
                    if (EXPERIMENTAL_ANIMATION) render();
                });
                
                // CRITICAL: Wait 300ms for render to settle, then capture preview
                setTimeout(() => {
                    render();  // Final render before capture
                    requestAnimationFrame(() => {
                        HL.token.capturePreview();
                        
                        // Start animation ONLY after preview capture
                        if (EXPERIMENTAL_ANIMATION) {
                            startAnimation();
                        }
                    });
                }, 300);
            });
        }
        
        boot();
    }
})();