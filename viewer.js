// Art of Farcaster Viewer - Clean Version
(function() {
    "use strict";
    
    var canvas = null;
    var ctx = null;
    
    function init() {
        canvas = document.getElementById("artCanvas");
        if (!canvas) {
            console.log("Canvas not found, retrying...");
            setTimeout(init, 100);
            return;
        }
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext("2d");
        
        // Get token from URL
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || params.get("tid") || "1";
        var tokenNum = parseInt(tokenId) || 1;
        
        console.log("Drawing token:", tokenId);
        
        // Generate unique colors based on token
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
            // Concentric circles
            for (var i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, i * 50, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (patternType === 1) {
            // Radiating lines
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
            // Squares
            for (var i = 0; i < 8; i++) {
                var size = 50 + i * 30;
                ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
            }
        } else if (patternType === 3) {
            // Grid
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
            // Spiral dots
            for (var i = 0; i < 200; i++) {
                var t = i / 50;
                var radius = t * 150;
                var angle = t * Math.PI * 4;
                var x = centerX + Math.cos(angle) * radius;
                var y = centerY + Math.sin(angle) * radius;
                ctx.fillRect(x, y, 4, 4);
            }
        }
        
        // Token text
        ctx.fillStyle = "white";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Token #" + tokenId, 350, 50);
        
        // Rarity calculation
        var rarity = "Common";
        if (tokenNum % 100 === 0) rarity = "Grail";
        else if (tokenNum % 50 === 0) rarity = "Mythic";
        else if (tokenNum % 20 === 0) rarity = "Rare";
        else if (tokenNum % 10 === 0) rarity = "Uncommon";
        
        ctx.font = "16px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText(rarity, 350, 90);
        
        // Grail effect
        if (rarity === "Grail") {
            ctx.fillStyle = "gold";
            ctx.font = "italic 16px monospace";
            ctx.fillText("⚜️ GRAIL ⚜️", 350, 650);
            ctx.fillStyle = "rgba(255,215,0,0.15)";
            ctx.fillRect(0, 0, 700, 700);
        }
        
        console.log("Done - Token:", tokenId, "Rarity:", rarity);
    }
    
    // Start when ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();