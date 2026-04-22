// Art of Farcaster Viewer - Complete Fixed Version
(function() {
    "use strict";
    
    // Token signature function - SINGLE return
    function getTokenVisualSignature(tokenId) {
        var tokenNum = parseInt(tokenId) || 1;
        var hash = tokenNum;
        for (var i = 0; i < 10; i++) {
            hash = (hash * 9301 + 49297) % 233280;
        }
        
        function extreme(mod) {
            return 0.2 + ((hash * mod) % 160) / 100;
        }
        
        return {
            colorBias: { r: extreme(3), g: extreme(7), b: extreme(13) },
            contrast: 0.3 + ((hash * 3) % 170) / 100,
            brightness: 0.3 + ((hash * 5) % 120) / 100,
            saturation: 0.2 + ((hash * 11) % 160) / 100,
            distortion: ((hash * 17) % 60) / 100,
            glitchIntensity: ((hash * 29) % 80) / 100,
            zoomLevel: 0.5 + ((hash * 43) % 130) / 100,
            waveFreq: 0.5 + ((hash * 53) % 200) / 100,
            posterize: Math.floor(((hash * 59) % 16)),
            redShift: ((hash * 61) % 50) / 100,
            blueShift: ((hash * 67) % 50) / 100,
            invertColors: ((hash * 71) % 100) > 80,
            scanlineThick: ((hash * 73) % 50) / 100,
            vignette: ((hash * 79) % 80) / 100
        };
    }
    
    // Apply color signature
    function applyTokenColorSignature(r, g, b, sig) {
        var nr = r * sig.colorBias.r;
        var ng = g * sig.colorBias.g;
        var nb = b * sig.colorBias.b;
        
        nr = 0.5 + (nr - 0.5) * sig.contrast;
        ng = 0.5 + (ng - 0.5) * sig.contrast;
        nb = 0.5 + (nb - 0.5) * sig.contrast;
        
        nr = nr * sig.brightness;
        ng = ng * sig.brightness;
        nb = nb * sig.brightness;
        
        var gray = (nr + ng + nb) / 3;
        nr = gray + (nr - gray) * sig.saturation;
        ng = gray + (ng - gray) * sig.saturation;
        nb = gray + (nb - gray) * sig.saturation;
        
        if (sig.posterize > 0) {
            var levels = Math.max(2, 16 - sig.posterize);
            nr = Math.floor(nr * levels) / levels;
            ng = Math.floor(ng * levels) / levels;
            nb = Math.floor(nb * levels) / levels;
        }
        
        return {
            r: Math.min(0.98, Math.max(0.02, nr)),
            g: Math.min(0.98, Math.max(0.02, ng)),
            b: Math.min(0.98, Math.max(0.02, nb))
        };
    }
    
    // Main initialization
    function init() {
        var canvas = document.getElementById("artCanvas");
        if (!canvas) {
            console.error("Canvas not found");
            return;
        }
        
        canvas.width = 700;
        canvas.height = 700;
        var ctx = canvas.getContext("2d");
        
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || params.get("tid") || "1";
        
        console.log("Loading token:", tokenId);
        
        var sig = getTokenVisualSignature(tokenId);
        var num = parseInt(tokenId) || 1;
        
        // Background color from token
        var hue = (num * 37) % 360;
        ctx.fillStyle = "hsl(" + hue + ", 60%, 50%)";
        ctx.fillRect(0, 0, 700, 700);
        
        // Draw pattern
        var centerX = 350;
        var centerY = 350;
        var pattern = num % 5;
        
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 2;
        
        if (pattern === 0) {
            for (var i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, i * 50, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (pattern === 1) {
            for (var i = 0; i < 12; i++) {
                var angle = i * 30 * Math.PI / 180;
                var x2 = centerX + Math.cos(angle) * 300;
                var y2 = centerY + Math.sin(angle) * 300;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else if (pattern === 2) {
            for (var i = 0; i < 8; i++) {
                var size = 50 + i * 30;
                ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
            }
        } else if (pattern === 3) {
            for (var x = 0; x < 700; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x + 700, 700);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, x);
                ctx.lineTo(700, x + 700);
                ctx.stroke();
            }
        } else {
            for (var i = 0; i < 200; i++) {
                var t = i / 50;
                var radius = t * 150;
                var angle = t * Math.PI * 4;
                var x = centerX + Math.cos(angle) * radius;
                var y = centerY + Math.sin(angle) * radius;
                ctx.fillRect(x, y, 4, 4);
            }
        }
        
        // Token info
        ctx.fillStyle = "white";
        ctx.font = "24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Token #" + tokenId, 350, 50);
        
        // Rarity
        var rarity = "Common";
        if (num % 100 === 0) rarity = "Grail";
        else if (num % 50 === 0) rarity = "Mythic";
        else if (num % 20 === 0) rarity = "Rare";
        else if (num % 10 === 0) rarity = "Uncommon";
        
        ctx.font = "16px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(rarity, 350, 90);
        
        // Grail special
        if (rarity === "Grail") {
            ctx.fillStyle = "gold";
            ctx.font = "italic 16px monospace";
            ctx.fillText("⚜️ GRAIL ⚜️", 350, 650);
            ctx.fillStyle = "rgba(255,215,0,0.2)";
            ctx.fillRect(0, 0, 700, 700);
        }
        
        console.log("Viewer ready - Token:", tokenId, "Rarity:", rarity);
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();