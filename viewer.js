// Art of Farcaster Viewer - Fixed Version
// No return statements outside functions

(function() {
    "use strict";
    
    // Wait for DOM to be ready
    function startViewer() {
        var canvas = document.getElementById("artCanvas");
        if (!canvas) {
            console.log("Waiting for canvas...");
            setTimeout(startViewer, 100);
            return;
        }
        
        console.log("Canvas found, starting viewer");
        
        canvas.width = 700;
        canvas.height = 700;
        var ctx = canvas.getContext("2d");
        
        // Get token from URL
        var params = new URLSearchParams(window.location.search);
        var tokenId = params.get("tokenId") || params.get("tid") || "1";
        var txHash = params.get("txHash") || params.get("h") || "0x0";
        
        console.log("Token ID:", tokenId);
        
        // Generate deterministic colors based on token
        var num = parseInt(tokenId) || 1;
        var hue = (num * 37) % 360;
        var sat = 50 + (num % 50);
        var light = 40 + (num % 40);
        
        // Draw background
        ctx.fillStyle = "hsl(" + hue + ", " + sat + "%, " + light + "%)";
        ctx.fillRect(0, 0, 700, 700);
        
        // Draw pattern based on token
        var centerX = 350;
        var centerY = 350;
        var patternNum = num % 6;
        
        ctx.strokeStyle = "white";
        ctx.lineWidth = 2;
        
        if (patternNum === 0) {
            // Concentric circles
            for (var i = 1; i <= 5; i++) {
                ctx.beginPath();
                ctx.arc(centerX, centerY, i * 50, 0, Math.PI * 2);
                ctx.stroke();
            }
        } else if (patternNum === 1) {
            // Radiating lines
            for (var i = 0; i < 12; i++) {
                var angle = (i * (num % 360)) * Math.PI / 180;
                var x2 = centerX + Math.cos(angle) * 300;
                var y2 = centerY + Math.sin(angle) * 300;
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            }
        } else if (patternNum === 2) {
            // Squares
            for (var i = 0; i < 8; i++) {
                var size = 50 + i * 30;
                ctx.strokeRect(centerX - size/2, centerY - size/2, size, size);
            }
        } else if (patternNum === 3) {
            // Diagonal lines
            for (var i = -700; i < 700; i += 40) {
                ctx.beginPath();
                ctx.moveTo(i, 0);
                ctx.lineTo(i + 700, 700);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, i);
                ctx.lineTo(700, i + 700);
                ctx.stroke();
            }
        } else if (patternNum === 4) {
            // Dots
            var step = 50;
            for (var x = 0; x < 700; x += step) {
                for (var y = 0; y < 700; y += step) {
                    ctx.fillStyle = "rgba(255,255,255,0.5)";
                    ctx.beginPath();
                    ctx.arc(x, y, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        } else {
            // Spirals
            for (var i = 0; i < 200; i++) {
                var t = i / 50;
                var radius = t * 150;
                var angle = t * Math.PI * 4;
                var x = centerX + Math.cos(angle) * radius;
                var y = centerY + Math.sin(angle) * radius;
                ctx.fillStyle = "white";
                ctx.fillRect(x, y, 4, 4);
            }
        }
        
        // Draw text
        ctx.fillStyle = "white";
        ctx.font = "bold 24px monospace";
        ctx.textAlign = "center";
        ctx.fillText("Art of Farcaster", 350, 50);
        
        ctx.font = "18px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.fillText("Token #" + tokenId, 350, 100);
        
        // Simple rarity based on token number
        var rarity = "Common";
        if (num % 100 === 0) rarity = "Grail";
        else if (num % 50 === 0) rarity = "Mythic";
        else if (num % 20 === 0) rarity = "Rare";
        else if (num % 10 === 0) rarity = "Uncommon";
        
        ctx.font = "14px monospace";
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.fillText("Rarity: " + rarity, 350, 140);
        
        // Grail special effect
        if (rarity === "Grail") {
            ctx.font = "italic 16px monospace";
            ctx.fillStyle = "gold";
            ctx.fillText("⚜️ GRAIL ⚜️", 350, 650);
            
            // Add gold glow
            ctx.fillStyle = "rgba(255,215,0,0.2)";
            ctx.fillRect(0, 0, 700, 700);
        }
        
        console.log("Viewer ready for token", tokenId);
    }
    
    // Start when DOM is ready
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", startViewer);
    } else {
        startViewer();
    }
})();