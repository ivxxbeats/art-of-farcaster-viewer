(function() {
    const RARITY_CLASSES = {
        COMMON: "Common",
        UNCOMMON: "Uncommon", 
        RARE: "Rare",
        MYTHIC: "Mythic",
        GRAIL: "Grail"
    };
    
    const ARCHETYPES = ["Signal", "Drift", "Rift", "Core", "Prism", "Void"];
    const ANCHOR_FORMS = ["Aether", "PrismHeart", "Faultline", "Gate", "Nexus", "Bloom"];
    
    let canvas, ctx;
    let currentTraits = null;
    let masterSeed = null;
    let tokenId = null;
    
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
        
        const colors = ["Neon", "Rainbow", "Fire", "Aurora", "Ice", "Magma"];
        const colorRand = deterministicRandom(seed, 3);
        traits["Color Mood"] = colors[Math.floor(colorRand * colors.length)];
        
        const compositions = ["Centered", "Radial", "Spiral", "FlowField"];
        const compRand = deterministicRandom(seed, 4);
        traits.Composition = compositions[Math.floor(compRand * compositions.length)];
        
        return traits;
    }
    
    function generateBaseParams(seed, tokenId) {
        const tokenNum = parseInt(tokenId) || 1;
        const zoomVariation = 0.7 + ((tokenNum * 997) % 100) / 100;
        return {
            zoom: zoomVariation,
            offsetX: ((tokenNum * 13) % 200 - 100) / 100,
            offsetY: ((tokenNum * 17) % 200 - 100) / 100,
            maxIter: 80 + (tokenNum % 120)
        };
    }
    
    function render() {
        if (!currentTraits || !ctx) return;
        
        const w = 700, h = 700;
        const tokenNum = parseInt(tokenId) || 1;
        
        // Create unique colors based on token ID
        const hue = (tokenNum * 37) % 360;
        const sat = 50 + (tokenNum % 50);
        const light = 40 + (tokenNum % 40);
        
        ctx.fillStyle = `hsl(${hue}, ${sat}%, ${light}%)`;
        ctx.fillRect(0, 0, w, h);
        
        // Draw unique pattern based on token ID
        const patternType = tokenNum % 5;
        const centerX = w/2;
        const centerY = h/2;
        
        for (let i = 0; i < 100; i++) {
            const angle = (i * (tokenNum % 360)) * Math.PI / 180;
            const radius = 50 + (i * 3) % 300;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            ctx.fillStyle = `hsl(${(hue + i * 10) % 360}, ${sat}%, ${light + 20}%)`;
            ctx.beginPath();
            ctx.arc(x, y, 5 + (tokenNum % 10), 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Show token info
        ctx.fillStyle = "white";
        ctx.font = "16px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`Token #${tokenId}`, w/2, 50);
        ctx.fillText(`${currentTraits["Rarity Class"]} ${currentTraits.Archetype}`, w/2, 80);
    }
    
    function init() {
        canvas = document.getElementById("artCanvas");
        if (!canvas) return;
        
        canvas.width = 700;
        canvas.height = 700;
        ctx = canvas.getContext("2d");
        
        const params = new URLSearchParams(window.location.search);
        tokenId = params.get("tokenId") || params.get("tid") || "1";
        let txHash = params.get("txHash") || params.get("h") || "0x0";
        
        masterSeed = getSeed(tokenId, txHash);
        currentTraits = generateTraits(masterSeed, tokenId);
        
        render();
        
        console.log("Viewer ready - Token:", tokenId, currentTraits);
    }
    
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();