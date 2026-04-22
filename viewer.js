// Art of Farcaster Viewer - Clean Working Version
(function() {
    "use strict";
    
    // Rarity classes
    var RARITY_CLASSES = {
        COMMON: "Common",
        UNCOMMON: "Uncommon",
        RARE: "Rare",
        MYTHIC: "Mythic",
        GRAIL: "Grail"
    };
    
    var ARCHETYPES = ["Signal", "Drift", "Rift", "Core", "Prism", "Void"];
    var ANCHOR_FORMS = ["Aether", "PrismHeart", "Faultline", "Gate", "Nexus", "Bloom"];
    
    var canvas = null;
    var ctx = null;
    var currentTraits = null;
    var tokenId = null;
    
    // Helper functions
    function getSeed(tokenId, txHash) {
        var hash = 2166136261;
        var str = txHash + "_" + tokenId;
        for (var i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = (hash * 16777619) >>> 0;
        }
        return hash >>> 0;
    }
    
    function deterministicRandom(seed, index) {
        var state = (seed + index) >>> 0;
        state = (state + 0x9e3779b9) >>> 0;
        state ^= state >>> 15;
        state = (state * 0x85ebca6b) >>> 0;
        state ^= state >>> 13;
        state = (state * 0xc2b2ae35) >>> 0;
        state ^= state >>> 16;
        return state / 0xffffffff;
    }
    
    function generateTraits(seed, tokenId) {
        var traits = {};
        var rarityRand = deterministicRandom(seed, 0);
        if (rarityRand < 0.60) {
            traits["Rarity Class"] = "Common";
        } else if (rarityRand < 0.85) {
            traits["Rarity Class"] = "Uncommon";
        } else if (rarityRand < 0.95) {
            traits["Rarity Class"] = "Rare";
        } else if (rarityRand < 0.99) {
            traits["Rarity Class"] = "Mythic";
        } else {
            traits["Rarity Class"] = "Grail";
        }
        
        var archetypeRand = deterministicRandom(seed, 1);
        var archetypeIndex = Math.floor(archetypeRand * ARCHETYPES.length);
        traits.Archetype = ARCHETYPES[archetypeIndex];
        
        var formRand = deterministicRandom(seed, 2);
        var formIndex = Math.floor(formRand * ANCHOR_FORMS.length);
        traits["Anchor Form"] = ANCHOR_FORMS[formIndex];
        
        var colors = ["Neon", "Rainbow", "Fire", "Aurora", "Ice", "Magma"];
        var colorRand = deterministicRandom(seed, 3);
        traits["Color Mood"] = colors[Math.floor(colorRand * colors.length)];
        
        var compositions = ["Centered", "Radial", "Spiral", "FlowField"];
        var compRand = deterministicRandom(seed, 4);
        traits.Composition = compositions[Math.floor(compRand * compositions.length)];
        
        return traits;
    }
    
    function getUniqueColor(tokenId) {
        var num = parseInt(tokenId) || 1;
        var hue = (num * 37) % 360;
        var sat = 50 + (num % 50);
        var light = 40 + (num % 40);
        return "hsl(" + hue + ", " + sat + "%, " + light + "%)";
    }
    
    function getAccentColor(tokenId, offset) {
        var num = parseInt(tokenId) || 1;
        var hue = ((num * 37) + offset) % 360;
        return "hsl(" + hue + ", 70%, 60%)";
    }
    
    function renderArt() {
        if (!currentTraits || !ctx) {
            return;
        }
        
        var w = canvas.width;
        var h = canvas.height;
        var num = parseInt(tokenId) || 1;
        
        // Clear with token-unique background
        ctx.fillStyle = getUniqueColor(tokenId);
        ctx.fillRect(0, 0, w, h);
        
        var centerX = w / 2;
        var centerY = h / 2;
        
        // Draw pattern based on token ID
        var patternType = num % 5;
        var ringCount = 5 + (num % 10);
        
        if (patternType === 0) {
            // Concentric rings
            for (var i = 0; i < ringCount; i++) {
                var radius = 50 + i * 40;
                ctx.beginPath();
                ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                ctx.strokeStyle = getAccentColor(tokenId, i * 30);
                ctx.lineWidth = 3;
                ctx.stroke();
            }
        } else if (patternType === 1) {
            // Radiating lines
            for (var i = 0; i < 36; i++) {
                var angle = (i * (num % 360)) * Math.PI / 180;
                var x2 = centerX + Math.cos(angle) * 300;
                var y2 = centerY + Math.sin(angle) * 300;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x2, y2);
                ctx.strokeStyle = getAccentColor(tokenId, i * 10);
                ctx.stroke();
            }
        } else if (patternType === 2) {
            // Spirals
            for (var i = 0; i < 200; i++) {
                var t = i / 50;
                var radius = t * 150;
                var angle = t * Math.PI * 4 * (num % 5 + 1);
                var x = centerX + Math.cos(angle) * radius;
                var y = centerY + Math.sin(angle) * radius;
                ctx.fillStyle = getAccentColor(tokenId, i);
                ctx.fillRect(x, y, 4, 4);
            }
        } else if (patternType === 3) {
            // Grid
            var step = 30 + (num % 20);
            for (var x = 0; x < w; x += step) {
                for (var y = 0; y < h; y += step) {
                    ctx.fillStyle = getAccentColor(tokenId, x + y);
                    ctx.fillRect(x, y, step - 2, step - 2);
                }
            }
        } else {
            // Circles pattern
            for (var i = 0; i < 50; i++) {
                var x = Math.random() * w;
                var y = Math.random() * h;
                var r = 5 + (num % 15);
                ctx.fillStyle = getAccentColor(tokenId, i * 7);
                ctx.beginPath();
                ctx.arc(x, y, r, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // Draw token info text
        ctx.fillStyle = "white";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        ctx.fillText("Token #" + tokenId, centerX, 50);
        
        ctx.font = "14px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(currentTraits["Rarity Class"] + " " + currentTraits.Archetype, centerX, 80);
        
        // Add Grail effect if applicable
        if (currentTraits["Rarity Class"] === "Grail") {
            ctx.font = "italic 12px monospace";
            ctx.fillStyle = "gold";
            ctx.fillText("⚜️ GRAIL ⚜️", centerX, h - 20);
        }
    }
    
    function init() {
        canvas = document.getElementById("artCanvas");
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext("2d");
        
        var params = new URLSearchParams(window.location.search);
        tokenId = params.get("tokenId") || params.get("tid") || "1";
        var txHash = params.get("txHash") || params.get("h") || "0x0";
        
        console.log("Loading token:", tokenId);
        
        var seed = getSeed(tokenId, txHash);
        currentTraits = generateTraits(seed, tokenId);
        
        renderArt();
        
        console.log("Ready:", currentTraits);
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();