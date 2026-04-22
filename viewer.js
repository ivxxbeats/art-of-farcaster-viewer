// Art of Farcaster Viewer - Complete with Awakened Engine
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
                if (data.awakenedEngine && data.awakenedEngine.progression) {
                    awakenedLevel = data.awakenedEngine.progression;
                } else if (liveIntensity > 0.8) {
                    awakenedLevel = "ascended";
                } else if (liveIntensity > 0.55) {
                    awakenedLevel = "awakened";
                } else {
                    awakenedLevel = "base";
                }
                console.log("Intensity:", liveIntensity, "Level:", awakenedLevel);
                
                // Redraw with new intensity
                drawArt();
            })
            .catch(function(e) { console.log("Intensity fetch failed", e); });
    }
    
    // Apply awakened visual effects
    function applyAwakenedEffects(ctx, w, h, level, intensity) {
        if (level === "ascended") {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "rgba(255,100,255,0.5)";
            for (var i = 0; i < 50; i++) {
                ctx.fillStyle = "rgba(255,100,255," + (Math.random() * 0.3) + ")";
                ctx.fillRect(Math.random() * w, Math.random() * h, 3, 3);
            }
            for (var y = 0; y < h; y += 8) {
                ctx.fillStyle = "rgba(0,0,0,0.1)";
                ctx.fillRect(0, y, w, 2);
            }
        } else if (level === "awakened") {
            ctx.shadowBlur = 8;
            ctx.shadowColor = "rgba(100,200,255,0.3)";
            for (var i = 0; i < 20; i++) {
                ctx.fillStyle = "rgba(100,200,255," + (Math.random() * 0.2) + ")";
                ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
            }
        }
        ctx.shadowBlur = 0;
        
        // Intensity meter
        if (intensity) {
            ctx.fillStyle = "rgba(0,0,0,0.5)";
            ctx.fillRect(10, 670, 100, 8);
            ctx.fillStyle = level === "ascended" ? "#ff00ff" : (level === "awakened" ? "#00ffff" : "#00ff00");
            ctx.fillRect(10, 670, intensity * 100, 8);
        }
    }
    
    function drawArt() {
        if (!ctx) return;
        
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || params.get("tid") || "1";
        var tokenNum = parseInt(tokenId) || 1;
        
        // Unique colors based on token
        var hue = (tokenNum * 37) % 360;
        var sat = 50 + (tokenNum % 50);
        var light = 40 + (tokenNum % 40);
        
        // Background
        ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, " + light + "%)";
        ctx.fillRect(0, 0, 700, 700);
        
        // Pattern based on token
        var centerX = 350;
        var centerY = 350;
        var patternType = tokenNum % 5;
        
        ctx.strokeStyle = "white";
        ctx.fillStyle = "white";
        ctx.lineWidth = 2;
        
        if (patternType === 0) {
            for (var i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, i * 50, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (patternType === 1) {
            for (var i = 0; i < 12; i++) {
                var angle = i * 30 * Math.PI / 180;
                var x2 = centerX + Math.cos(angle) * 300;
                var y2 = centerY + Math.sin(angle) * 300;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else if (patternType === 2) {
            for (var i = 0; i < 8; i++) {
                var size = 50 + i * 30;
                ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
            }
        } else if (patternType === 3) {
            for (var x = 0; x < 700; x += 50) {
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, 700);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, x);
                ctx.lineTo(700, x);
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
        
        // Apply Awakened Engine effects
        applyAwakenedEffects(ctx, 700, 700, awakenedLevel, liveIntensity);
        
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
            ctx.fillRect(0, 0, 700, 700);
        }
        
        // Update info display
        var infoEl = document.getElementById("tokenInfo");
        if (infoEl) {
            infoEl.innerHTML = "Token #" + tokenId + " | " + awakenedLevel.toUpperCase() + " | " + Math.round(liveIntensity * 100) + "%";
        }
        
        console.log("Drawn - Token:", tokenId, "Rarity:", rarity, "Level:", awakenedLevel);
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
        var url = new URL(window.location.href);
        url.searchParams.set("tokenId", newId);
        url.searchParams.set("txHash", "0x" + Math.random().toString(36).substring(2, 10));
        window.location.href = url.toString();
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
            drawArt();
        }, 30000);
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();// Force rebuild - 2026-04-22 02:32:35
