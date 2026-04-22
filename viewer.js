// Art of Farcaster Viewer - Original with Awakened Engine
(function() {
    "use strict";
    
    var canvas = null;
    var ctx = null;
    var liveIntensity = 0.5;
    var awakenedLevel = "base";
    
    // Fetch intensity from API
    function fetchIntensity() {
        var url = "https://raw.githubusercontent.com/ivxxbeats/farcaster-intensity/main/intensity.json";
        fetch(url + "?t=" + Date.now())
            .then(function(r) { return r.json(); })
            .then(function(data) {
                liveIntensity = data.intensity || 0.5;
                if (liveIntensity > 0.8) awakenedLevel = "ascended";
                else if (liveIntensity > 0.55) awakenedLevel = "awakened";
                else awakenedLevel = "base";
                drawArt();
            })
            .catch(function(e) { console.log("Intensity fetch failed"); });
    }
    
    // Fractal calculation
    function fractal(x, y, maxIter, seed) {
        var cx = x * 3.5 - 2.5;
        var cy = y * 3.5 - 2.0;
        var zx = 0, zy = 0;
        var iter = 0;
        var smooth = 0;
        
        for (iter = 0; iter < maxIter; iter++) {
            var zx2 = zx * zx;
            var zy2 = zy * zy;
            if (zx2 + zy2 > 4.0) break;
            var xt = zx2 - zy2 + cx;
            zy = 2.0 * zx * zy + cy;
            zx = xt;
        }
        
        if (iter < maxIter) {
            var log_zn = Math.log(zx * zx + zy * zy) / 2;
            var nu = Math.log(log_zn / Math.log(2)) / Math.log(2);
            smooth = (iter + 1 - nu) / maxIter;
        } else {
            smooth = 1.0;
        }
        
        return Math.min(0.98, Math.max(0.02, smooth));
    }
    
    // Apply awakened effects to drawing
    function applyAwakenedEffects(ctx, w, h, level, intensity) {
        if (level === "ascended") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255,100,255,0.5)";
            for (var i = 0; i < 80; i++) {
                ctx.fillStyle = "rgba(255,100,255," + (Math.random() * 0.2) + ")";
                ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
            }
        } else if (level === "awakened") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(100,200,255,0.3)";
            for (var i = 0; i < 40; i++) {
                ctx.fillStyle = "rgba(100,200,255," + (Math.random() * 0.15) + ")";
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        }
        ctx.shadowBlur = 0;
        
        // Intensity meter
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.fillRect(10, 670, 100, 8);
        ctx.fillStyle = level === "ascended" ? "#ff00ff" : (level === "awakened" ? "#00ffff" : "#00ff00");
        ctx.fillRect(10, 670, intensity * 100, 8);
    }
    
    function drawArt() {
        if (!ctx) return;
        
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || params.get("tid") || "1";
        var tokenNum = parseInt(tokenId) || 1;
        
        var w = 700, h = 700;
        var seed = tokenNum;
        var maxIter = 80 + (seed % 120);
        var hueBase = (seed * 37) % 360;
        
        // Create image data for faster rendering
        var imgData = ctx.createImageData(w, h);
        var data = imgData.data;
        
        // Render fractal
        for (var y = 0; y < h; y++) {
            for (var x = 0; x < w; x++) {
                var ux = x / w;
                var uy = y / h;
                
                var val = fractal(ux, uy, maxIter, seed);
                
                // Color based on fractal value and token
                var hue = (hueBase + val * 360) % 360;
                var sat = 50 + (seed % 50);
                var light = 30 + val * 40;
                
                // Adjust based on awakened level
                if (awakenedLevel === "ascended") {
                    light = Math.min(90, light + 20);
                    sat = Math.min(100, sat + 30);
                } else if (awakenedLevel === "awakened") {
                    light = Math.min(80, light + 10);
                    sat = Math.min(90, sat + 15);
                }
                
                var rgb = hslToRgb(hue, sat, light);
                
                var idx = (y * w + x) * 4;
                data[idx] = rgb.r;
                data[idx+1] = rgb.g;
                data[idx+2] = rgb.b;
                data[idx+3] = 255;
            }
        }
        
        ctx.putImageData(imgData, 0, 0);
        
        // Apply awakened effects
        applyAwakenedEffects(ctx, w, h, awakenedLevel, liveIntensity);
        
        // Token text
        ctx.fillStyle = "white";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Token #" + tokenId, 350, 50);
        
        // Rarity
        var rarity = "Common";
        if (tokenNum % 100 === 0) rarity = "Grail";
        else if (tokenNum % 50 === 0) rarity = "Mythic";
        else if (tokenNum % 20 === 0) rarity = "Rare";
        else if (tokenNum % 10 === 0) rarity = "Uncommon";
        
        ctx.font = "16px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(rarity, 350, 90);
        
        // Awakened level text
        ctx.font = "12px monospace";
        ctx.fillStyle = awakenedLevel === "ascended" ? "#ff00ff" : (awakenedLevel === "awakened" ? "#00ffff" : "rgba(255,255,255,0.5)");
        ctx.fillText(awakenedLevel.toUpperCase(), 350, 115);
        
        // Grail effect
        if (rarity === "Grail") {
            ctx.fillStyle = "gold";
            ctx.font = "italic 16px monospace";
            ctx.fillText("⚜️ GRAIL ⚜️", 350, 650);
            ctx.fillStyle = "rgba(255,215,0,0.15)";
            ctx.fillRect(0, 0, w, h);
        }
        
        // Update info display
        var infoEl = document.getElementById("tokenInfo");
        if (infoEl) {
            infoEl.innerHTML = "Token #" + tokenId + " | " + awakenedLevel.toUpperCase() + " | " + Math.round(liveIntensity * 100) + "%";
        }
    }
    
    // Helper: HSL to RGB
    function hslToRgb(h, s, l) {
        h = h / 360;
        s = s / 100;
        l = l / 100;
        var r, g, b;
        if (s === 0) {
            r = g = b = l;
        } else {
            var hue2rgb = function(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
    }
    
    // Download image
    function downloadImage() {
        var link = document.createElement("a");
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || "1";
        link.download = "art-of-farcaster-token-" + tokenId + ".png";
        link.href = canvas.toDataURL();
        link.click();
    }
    
    // Random token
    function randomToken() {
        var newId = Math.floor(Math.random() * 10000) + 1;
        window.location.href = "?tokenId=" + newId + "&txHash=0x" + Math.random().toString(36).substring(2, 10);
    }
    
    // Initialize
    function init() {
        canvas = document.getElementById("artCanvas");
        if (!canvas) {
            setTimeout(init, 100);
            return;
        }
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext("2d");
        
        // Add buttons if not exists
        if (!document.getElementById("randomBtn")) {
            var btn1 = document.createElement("button");
            btn1.id = "randomBtn";
            btn1.innerHTML = "🎲 Random";
            btn1.style.position = "fixed";
            btn1.style.bottom = "20px";
            btn1.style.right = "20px";
            btn1.style.background = "rgba(0,0,0,0.7)";
            btn1.style.color = "white";
            btn1.style.border = "1px solid rgba(255,255,255,0.3)";
            btn1.style.padding = "10px 20px";
            btn1.style.borderRadius = "30px";
            btn1.style.fontFamily = "monospace";
            btn1.style.cursor = "pointer";
            btn1.style.zIndex = "100";
            btn1.onclick = randomToken;
            document.body.appendChild(btn1);
            
            var btn2 = document.createElement("button");
            btn2.id = "downloadBtn";
            btn2.innerHTML = "💾 Save";
            btn2.style.position = "fixed";
            btn2.style.bottom = "20px";
            btn2.style.right = "130px";
            btn2.style.background = "rgba(0,0,0,0.7)";
            btn2.style.color = "white";
            btn2.style.border = "1px solid rgba(255,255,255,0.3)";
            btn2.style.padding = "10px 20px";
            btn2.style.borderRadius = "30px";
            btn2.style.fontFamily = "monospace";
            btn2.style.cursor = "pointer";
            btn2.style.zIndex = "100";
            btn2.onclick = downloadImage;
            document.body.appendChild(btn2);
        }
        
        // Initial draw
        drawArt();
        
        // Fetch intensity and redraw periodically
        fetchIntensity();
        setInterval(function() {
            fetchIntensity();
        }, 30000);
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();