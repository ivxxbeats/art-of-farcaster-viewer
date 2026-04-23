// ============================================================
// dartHLGEN Engine v1.5
// Pure deterministic core with maximum visual impact
// Event Score now drives VISUAL DOMINANCE
// ============================================================

// ============================================================
// PART 1: CONSTANTS & CONFIGURATION
// ============================================================

const DART_CONST = {
  RARITY_CLASSES: [
    { name: "Common", weight: 55, threshold: 55 },
    { name: "Uncommon", weight: 25, threshold: 80 },
    { name: "Rare", weight: 12, threshold: 92 },
    { name: "Mythic", weight: 6, threshold: 98 },
    { name: "Grail", weight: 2, threshold: 100 }
  ],
  
  ARCHETYPES: [
    "The Anchor", "The Echo Chamber", "The Fracture Field", 
    "The Resonant Void", "The Pulse Axis", "The Memory Coil"
  ],
  
  ANCHOR_FORMS: [
    "Core Ring", "Pillar Stack", "Cruciform", "Nodal Point", 
    "Orbital Loop", "Axis Line", "Void Basin"
  ],
  
  ENGINE_TYPES: [
    { name: "Canonical", weight: 40 },
    { name: "Echo", weight: 35 },
    { name: "Rupture", weight: 25 }
  ],
  
  PRIMARY_DRIVERS: [
    "Phase Collapse", "Frequency Pressure", "Resonant Interference",
    "Spatial Tension", "Chromatic Stress", "Temporal Shear"
  ],
  
  STRUCTURE_TYPES: [
    "Radial", "Linear", "Grid", "Spiral", "Chaotic", "Dual Axis"
  ],
  
  SPATIAL_BEHAVIORS: [
    "Orbiting", "Drifting", "Pulsing", "Fracturing", "Recursing", "Collapsing"
  ],
  
  ANOMALY_CLASSES: [
    { name: "None", weight: 70 },
    { name: "SpectralSplit", weight: 15 },
    { name: "PhaseInversion", weight: 10 },
    { name: "GravityWell", weight: 5 }
  ],
  
  FAILURE_MODES: [
    { name: "Stable", weight: 55 },
    { name: "Fracture", weight: 25 },
    { name: "VoidBloom", weight: 12 },
    { name: "Recovering", weight: 8 }
  ],
  
  DOMINANT_ZONES: ["Center", "Offset", "Edge", "Split"],
  COLOR_MOODS: [
    "Inferno", "Ice", "Void", "Arc", "Ghost", "Bloom"
  ]
};

// ============================================================
// PART 2: SEED & RNG SYSTEM (Deterministic)
// ============================================================

function cyrb128(str) {
  let h1 = 1779033703, h2 = 3144134277, h3 = 1013904242, h4 = 2773480762;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ ch, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ ch, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ ch, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ ch, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [h1>>>0, h2>>>0, h3>>>0, h4>>>0];
}

function splitmix32(a) {
  return function() {
    a |= 0;
    a = a + 0x9e3779b9 | 0;
    let t = a ^ a >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
}

export function getSeed(tokenId, txHash) {
  const combined = `${txHash}_${tokenId}`;
  const hash = cyrb128(combined);
  return hash[0] + hash[1] * 2 + hash[2] * 3 + hash[3] * 4;
}

export function makeSeededRand(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 0x9e3779b9 | 0;
    let t = s ^ s >>> 16;
    t = Math.imul(t, 0x21f0aaad);
    t = t ^ t >>> 15;
    t = Math.imul(t, 0x735a2d97);
    return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
  };
}

export function splitSeed(seed, streamId) {
  return cyrb128(`${seed}_${streamId}`)[0];
}

export function initRNGStreams(masterSeed) {
  return {
    stream1: makeSeededRand(splitSeed(masterSeed, 1)),
    stream2: makeSeededRand(splitSeed(masterSeed, 2)),
    stream3: makeSeededRand(splitSeed(masterSeed, 3)),
    stream4: makeSeededRand(splitSeed(masterSeed, 4)),
    stream5: makeSeededRand(splitSeed(masterSeed, 5))
  };
}

function weightedPick(items, weights, rng) {
  const total = weights.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (let i = 0; i < items.length; i++) {
    if (roll < weights[i]) return items[i];
    roll -= weights[i];
  }
  return items[0];
}

// ============================================================
// PART 3: TRAIT GENERATION (Deterministic)
// ============================================================

export function rollRarityClass(rng, debugOptions = null) {
  if (debugOptions && debugOptions.onlyMythicRareUncommon) {
    const r = rng();
    if (r < 0.5) return "Mythic";
    if (r < 0.8) return "Rare";
    return "Uncommon";
  }
  if (debugOptions && debugOptions.forceGrailPercent) {
    if (rng() * 100 < debugOptions.forceGrailPercent) return "Grail";
  }
  const weights = DART_CONST.RARITY_CLASSES.map(c => c.weight);
  const classes = DART_CONST.RARITY_CLASSES.map(c => c.name);
  return weightedPick(classes, weights, rng);
}

export function rollArchetype(rarityClass, rng) {
  let weights = [16, 16, 16, 18, 18, 16];
  if (rarityClass === "Rare") weights.forEach((_, i) => weights[i] *= 1.2);
  if (rarityClass === "Mythic") weights.forEach((_, i) => weights[i] *= 1.5);
  if (rarityClass === "Grail") weights.forEach((_, i) => weights[i] *= 2);
  return weightedPick(DART_CONST.ARCHETYPES, weights, rng);
}

export function rollAnchorForm(archetype, rng) {
  let weights = [14, 14, 14, 16, 16, 12, 14];
  if (archetype === "The Anchor") weights = [25, 15, 15, 15, 10, 10, 10];
  if (archetype === "The Echo Chamber") weights = [10, 10, 10, 20, 25, 15, 10];
  if (archetype === "The Fracture Field") weights = [10, 15, 20, 10, 10, 15, 20];
  return weightedPick(DART_CONST.ANCHOR_FORMS, weights, rng);
}

export function rollEngineType(rng, rarityClass, debugOptions = null) {
  if (debugOptions && debugOptions.balanceNonCanonicalEngines) {
    const r = rng();
    if (r < 0.34) return { name: "Canonical", weight: 40 };
    if (r < 0.67) return { name: "Echo", weight: 35 };
    return { name: "Rupture", weight: 25 };
  }
  let weights = [40, 35, 25];
  if (rarityClass === "Rare") weights = [35, 35, 30];
  if (rarityClass === "Mythic") weights = [30, 35, 35];
  if (rarityClass === "Grail") weights = [20, 35, 45];
  const engineNames = weightedPick(["Canonical", "Echo", "Rupture"], weights, rng);
  const engine = DART_CONST.ENGINE_TYPES.find(e => e.name === engineNames);
  return engine || { name: "Canonical", weight: 40 };
}

export function rollPrimaryDriver(rng) {
  return weightedPick(DART_CONST.PRIMARY_DRIVERS, [18, 18, 16, 16, 16, 16], rng);
}

export function rollStructureType(rng) {
  return weightedPick(DART_CONST.STRUCTURE_TYPES, [20, 16, 16, 16, 16, 16], rng);
}

export function rollColorMood(rng) {
  return weightedPick(DART_CONST.COLOR_MOODS, [18, 18, 16, 16, 16, 16], rng);
}

export function rollFailureMode(rng, engineType, rarityClass) {
  let weights = [55, 25, 12, 8];
  if (engineType === "Rupture") weights = [25, 45, 15, 15];
  if (engineType === "Echo") weights = [45, 15, 25, 15];
  if (rarityClass === "Rare") weights = weights.map(w => w * 0.9);
  if (rarityClass === "Mythic") weights = weights.map(w => w * 0.8);
  if (rarityClass === "Grail") weights = weights.map(w => w * 0.6);
  const total = weights.reduce((a, b) => a + b, 0);
  if (total === 0) return "Stable";
  return weightedPick(DART_CONST.FAILURE_MODES.map(f => f.name), weights, rng);
}

export function rollAnomalyClass(rng, rarityClass) {
  let weights = [70, 15, 10, 5];
  if (rarityClass === "Rare") weights = [50, 25, 15, 10];
  if (rarityClass === "Mythic") weights = [30, 30, 25, 15];
  if (rarityClass === "Grail") weights = [15, 35, 35, 15];
  return weightedPick(DART_CONST.ANOMALY_CLASSES.map(a => a.name), weights, rng);
}

export function rollDominantZone(rng) {
  const weights = [35, 25, 20, 20];
  return weightedPick(DART_CONST.DOMINANT_ZONES, weights, rng);
}

export function getEngineConfig(engineType) {
  const configs = {
    "Canonical": { name: "Canonical", fieldStrength: 0.82, recursionFactor: 0.15, fractureFactor: 0.05, colorPressure: 0.3 },
    "Echo": { name: "Echo", fieldStrength: 0.65, recursionFactor: 0.45, fractureFactor: 0.1, colorPressure: 0.25 },
    "Rupture": { name: "Rupture", fieldStrength: 0.5, recursionFactor: 0.1, fractureFactor: 0.55, colorPressure: 0.4 }
  };
  return configs[engineType] || configs["Canonical"];
}

export function generateCollectionTraits({ seed, tokenId, debugOptions = null }) {
  const streams = initRNGStreams(seed);
  const traitRng = streams.stream1;
  
  const rarityClass = rollRarityClass(traitRng, debugOptions);
  const archetype = rollArchetype(rarityClass, traitRng);
  const anchorForm = rollAnchorForm(archetype, traitRng);
  const engineTypeObj = rollEngineType(traitRng, rarityClass, debugOptions);
  const engineType = engineTypeObj.name;
  const primaryDriver = rollPrimaryDriver(traitRng);
  const structureType = rollStructureType(traitRng);
  const colorMood = rollColorMood(traitRng);
  let failureMode = rollFailureMode(traitRng, engineType, rarityClass);
  const anomalyClass = rollAnomalyClass(traitRng, rarityClass);
  const dominantZone = rollDominantZone(traitRng);
  
  if (engineType === "Rupture" && failureMode === "Recovering") {
    failureMode = "Fracture";
  }
  if (rarityClass === "Grail" && dominantZone === "Center") {
    const zones = ["Offset", "Edge", "Split"];
    const newZone = zones[Math.floor(traitRng() * zones.length)];
    dominantZone = newZone;
  }
  if (anomalyClass === "GravityWell" && engineType === "Canonical") {
    engineType = "Echo";
  }
  
  const engineConfig = getEngineConfig(engineType);
  
  return {
    rarityClass,
    archetype,
    anchorForm,
    engineType,
    engineConfig,
    primaryDriver,
    structureType,
    colorMood,
    failureMode,
    anomalyClass,
    dominantZone,
    spatialBehavior: weightedPick(DART_CONST.SPATIAL_BEHAVIORS, [16, 16, 16, 18, 18, 16], traitRng)
  };
}

export function generateBaseTraits({ seed, tokenId }) {
  const streams = initRNGStreams(seed);
  const baseRng = streams.stream2;
  
  return {
    intensityBaseline: 0.3 + baseRng() * 0.5,
    phaseShift: baseRng() * Math.PI * 2,
    warpAmount: 0.2 + baseRng() * 0.6,
    colorSaturation: 0.5 + baseRng() * 0.5,
    edgeSharpness: 0.3 + baseRng() * 0.7,
    microNoise: baseRng() * 0.15
  };
}

// ============================================================
// PART 4: EVENT SCORE & AWAKENING POLICY (ENHANCED)
// ============================================================

function getEventScore(traits) {
  let score = 0;
  if (traits.rarityClass === "Rare") score += 1;
  if (traits.rarityClass === "Mythic") score += 2;
  if (traits.rarityClass === "Grail") score += 4;
  if (traits.failureMode === "Fracture") score += 2;
  if (traits.failureMode === "VoidBloom") score += 1;
  if (traits.engineType === "Rupture") score += 1;
  if (traits.anomalyClass !== "None") score += 2;
  if (traits.dominantZone !== "Center") score += 1;
  return score;
}

export function getAwakeningState({ intensity, rarityClass, engineType, anomalyClass, failureMode }) {
  let level = "Base";
  if (intensity > 0.82) level = "Ascended";
  else if (intensity > 0.58) level = "Awakened";
  
  if (rarityClass === "Rare" && intensity > 0.5) level = "Awakened";
  if (rarityClass === "Mythic" && intensity > 0.4) level = "Awakened";
  if (rarityClass === "Mythic" && intensity > 0.7) level = "Ascended";
  if (rarityClass === "Grail") level = "Ascended";
  
  return {
    level,
    fieldBias: level === "Ascended" ? 1.22 : level === "Awakened" ? 1.11 : 1.0,
    contrastBias: engineType === "Rupture" ? 1.18 : engineType === "Echo" ? 1.09 : 1.0,
    fractureBias: failureMode === "Fracture" ? 1.30 : level === "Ascended" ? 1.15 : 1.0,
    recursionBias: engineType === "Echo" ? (level === "Ascended" ? 1.35 : 1.12) : 
                    (level === "Ascended" ? 1.10 : 1.0),
    colorBias: anomalyClass === "SpectralSplit" ? 1.22 : 
               (level === "Ascended" ? 1.15 : level === "Awakened" ? 1.08 : 1.0)
  };
}

// ============================================================
// PART 5: FIELD & GEOMETRY HELPERS
// ============================================================

function zoneBias(rx, ry, zone) {
  const x = (rx - 0.5) * 2, y = (ry - 0.5) * 2;
  if (zone === "Center") {
    return Math.exp(-(x * x + y * y) * 1.6);
  }
  if (zone === "Offset") {
    return Math.exp(-((x - 0.6) ** 2 + (y + 0.35) ** 2) * 2.2);
  }
  if (zone === "Edge") {
    const r = Math.sqrt(x * x + y * y);
    return Math.max(0, Math.min(1, Math.pow(r * 0.85, 1.2)));
  }
  if (zone === "Split") {
    const splitX = Math.abs(Math.sin(x * 3.2)) * 0.85;
    const splitY = Math.abs(Math.cos(y * 3.2)) * 0.85;
    return (splitX + splitY) * 0.5;
  }
  return 0.5;
}

function macroMask(rx, ry) {
  const x = (rx - 0.5) * 2, y = (ry - 0.5) * 2;
  const r = Math.sqrt(x * x + y * y);
  return Math.max(0, Math.min(1, 1 - Math.pow(r * 0.55, 1.1)));
}

function novaFractalCalc(rx, ry, time, depth = 4) {
  let x = (rx - 0.5) * 3.2, y = (ry - 0.5) * 3.2;
  let value = 0;
  let amp = 0.55;
  for (let i = 0; i < depth; i++) {
    value += Math.sin(x * (1.5 << i) + time * 1.2) * Math.cos(y * (1.5 << i) + time * 0.8) * amp;
    amp *= 0.52;
  }
  return (value + 0.6) * 0.75 + 0.15;
}

function getDepthFractalValue(rx, ry, time, depth) {
  let x = (rx - 0.5) * 2.8, y = (ry - 0.5) * 2.8;
  let sum = 0;
  let amp = 0.65;
  for (let i = 0; i < depth; i++) {
    sum += Math.sin(x * (2.2 << i) + time * 1.6) * Math.cos(y * (2.2 << i) + time * 1.1) * amp;
    amp *= 0.58;
  }
  return (sum + 0.75) * 0.55 + 0.1;
}

function getPatternValue(rx, ry, time, patternType) {
  const x = (rx - 0.5) * 2.4, y = (ry - 0.5) * 2.4;
  const r = Math.sqrt(x * x + y * y);
  const a = Math.atan2(y, x);
  
  switch(patternType) {
    case "Radial":
      return (Math.sin(r * 14 - time * 3.5) + 1) / 2;
    case "Linear":
      return (Math.sin(x * 7 + time * 2.2) + 1) / 2;
    case "Grid":
      return ((Math.sin(x * 5.5) * Math.cos(y * 5.5) + 1) / 2) * 0.85 + 0.1;
    case "Spiral":
      return (Math.sin(r * 18 - a * 3.5 + time * 4.5) + 1) / 2;
    case "Dual Axis":
      return ((Math.sin(x * 7 + time * 1.2) * Math.sin(y * 7 + time * 1.2) + 1) / 2) * 0.9 + 0.05;
    default:
      return novaFractalCalc(rx, ry, time, 3);
  }
}

// ============================================================
// PART 6: ENGINE FIELD LAWS (MAXIMUM IMPACT VERSION)
// ============================================================

function computeEngineField({ fractalVal, patternVal, rx, ry, engineType, awakening, traits, time, eventScore }) {
  let x = (rx - 0.5) * 2, y = (ry - 0.5) * 2;
  let r = Math.sqrt(x * x + y * y);
  const macroM = macroMask(rx, ry);
  
  // SIGNATURE INVARIANT - consistent fingerprint
  const signatureWave = Math.sin((x * 1.8 + y * 2.2 + time * 4.2) * Math.PI) * 0.04;
  
  // DOMINANT ZONE with EVENT-DRIVEN override strength
  const zoneB = zoneBias(rx, ry, traits.dominantZone);
  const baseZoneStrength = traits.rarityClass === "Common" ? 0.28 :
                           traits.rarityClass === "Uncommon" ? 0.38 :
                           traits.rarityClass === "Rare" ? 0.50 :
                           traits.rarityClass === "Mythic" ? 0.68 : 0.82;
  
  // Zone should override composition, not blend with it
  const zoneMix = baseZoneStrength * (0.82 + Math.min(0.18, eventScore * 0.012));
  
  // CRITICAL UPGRADE: Event Score drives VISUAL DOMINANCE harder
  const eventAmp = 1 + Math.pow(eventScore, 1.2) * 0.12;
  const contrastBoost = 1 + Math.pow(eventScore, 1.1) * 0.08;
  
  let t;
  
  if (engineType === "Canonical") {
    t = fractalVal * 0.80 + patternVal * 0.20;
    t += Math.sin(x * 1.0 + y * 0.8) * 0.035;
    t = t * 0.72 + macroM * 0.28;
    t = t * (1 - zoneMix) + zoneB * zoneMix;
    t *= eventAmp;
    
    // Canonical stress under pressure (subtle but present)
    t += Math.sin((x + y + time) * 2.2) * 0.022 * Math.min(1.0, eventScore * 0.08);
    
    if (awakening.level === "Awakened") {
      t = t * 0.88 + Math.sin(t * Math.PI * 2.4) * 0.10;
    }
    if (awakening.level === "Ascended") {
      t = t * 0.80 + Math.sin(t * Math.PI * 3.5) * 0.16;
    }
    t = Math.pow(t, Math.max(0.52, 1 - eventScore * 0.038));
    t = Math.max(0.02, Math.min(0.98, t));
  }
  else if (engineType === "Echo") {
    const rr = Math.sqrt(x * x + y * y);
    const echo = Math.sin(rr * 10 + t * Math.PI * 5) * 0.55 + 0.45;
    
    // Memory shift - Echo should feel like memory distortion
    const memoryShift = Math.sin(time * 2.2 + rr * 12) * 0.18;
    
    t = fractalVal * 0.50 + patternVal * 0.30;
    t = t * 0.55 + echo * 0.45;
    t += memoryShift * Math.min(0.12, eventScore * 0.018);
    t = t * 0.62 + macroM * 0.38;
    t = t * (1 - zoneMix * 0.7) + zoneB * (zoneMix * 0.7);
    t *= eventAmp * 1.04;
    
    if (awakening.level === "Awakened") {
      t = t * 0.68 + Math.sin(t * 7.5 + rr * 7) * 0.18;
    }
    if (awakening.level === "Ascended") {
      const loop = Math.sin(rr * 14 + t * Math.PI * 7) * 0.55 + 0.45;
      t = t * 0.42 + loop * 0.58;
      rx += Math.sin(ry * 3.5) * 0.14;
      ry += Math.cos(rx * 3.5) * 0.14;
    }
    t = Math.pow(t, (Math.max(0.52, 1 - eventScore * 0.038)) * 0.90);
    t = Math.max(0.01, Math.min(0.99, t));
  }
  else { // Rupture - with quantization fracture for high event scores
    // Coordinate breaking
    rx += Math.sin(ry * (4.5 + Math.min(2.5, eventScore * 0.18))) * 0.28;
    ry += Math.cos(rx * (4.5 + Math.min(2.5, eventScore * 0.18))) * 0.28;
    x = (rx - 0.5) * 2;
    y = (ry - 0.5) * 2;
    
    const crack = Math.abs(Math.sin(x * 12 - y * 9));
    t = Math.abs(fractalVal - patternVal);
    t = Math.abs(t - crack * 0.60);
    t = t * 0.78 + (1 - macroM) * 0.22;
    t = t * (1 - zoneMix * 0.45) + zoneB * (zoneMix * 0.45);
    t = Math.min(0.99, t * (1 + eventScore * 0.09));
    
    t = Math.abs(t - Math.sin(x * (15 + Math.min(6, eventScore * 0.35)) - y * 10) * 0.55);
    
    // QUANTIZATION FRACTURE for high event scores
    if (eventScore > 4.0) {
      const quantSteps = 3 + Math.min(6, eventScore * 0.35);
      t = Math.abs(t - Math.floor(t * quantSteps) / quantSteps);
    }
    
    if (awakening.level === "Awakened") {
      t = Math.abs(t - Math.sin(x * 9 - y * 6) * 0.26);
    }
    if (awakening.level === "Ascended") {
      const fracture = Math.abs(Math.sin(x * 18 - y * 12));
      t = Math.abs(t - fracture * 0.72);
      rx += Math.sin(ry * 4.5) * 0.22;
      ry += Math.cos(rx * 4.5) * 0.22;
    }
    t = Math.pow(t, (Math.max(0.52, 1 - eventScore * 0.038)) * 0.86);
    t = Math.max(0.008, Math.min(0.995, t));
  }
  
  // Add signature invariant
  t += signatureWave;
  t = Math.max(0.008, Math.min(0.995, t));
  
  // Apply awakening field bias
  t = Math.pow(t, 1 / awakening.fieldBias);
  t *= contrastBoost;
  
  // Failure mode effects with event amplification
  if (traits.failureMode === "Fracture") {
    t = Math.abs(t - Math.sin(x * 13 + y * 10) * (0.14 + eventScore * 0.022));
    t = Math.min(0.99, t * (1.10 + eventScore * 0.012));
  } else if (traits.failureMode === "VoidBloom") {
    const bloomFalloff = Math.exp(-Math.pow(r * 2.2, 1.5));
    t = t * 0.68 + bloomFalloff * 0.32;
  } else if (traits.failureMode === "Recovering") {
    t = t * 0.90 + 0.10;
  }
  
  return Math.max(0.008, Math.min(0.995, t));
}

function applyGrailOverride({ t, fractalVal, patternVal, rx, ry, engineType, anomalyClass, awakening, eventScore }) {
  const x = (rx - 0.5) * 2, y = (ry - 0.5) * 2;
  const r = Math.sqrt(x * x + y * y);
  
  // GRAIL LAW-BREAKING TRANSFORMS - "this is a different system"
  if (engineType === "Canonical") {
    t = 1 - t;
    t = Math.pow(t, 0.32);
    t = t * 0.58 + Math.sin(r * 14) * 0.22;
  } 
  else if (engineType === "Echo") {
    t = Math.sin(t * Math.PI * 9) * 0.55 + 0.45;
    t = Math.pow(t, 0.26);
    const echoes = Math.sin(r * 20 - t * 14) * 0.38 + 0.38;
    t = t * 0.48 + echoes * 0.52;
  } 
  else {
    t = Math.abs(t - Math.floor(t * 6) / 6);
    t = Math.pow(t, 0.20);
    t = Math.abs(t - Math.sin(x * 22 - y * 18) * 0.45);
  }
  
  // GRAIL COLLAPSE for very high event scores
  if (eventScore > 5.0) {
    const collapse = Math.sin((x * y * 22) + t * 12);
    t = t * 0.52 + Math.abs(collapse) * 0.48;
  }
  
  t = Math.pow(t, Math.max(0.12, 1 - eventScore * 0.072));
  
  if (anomalyClass === "GravityWell") {
    t = t * 0.48 + Math.exp(-r * 4.5) * 0.52;
  }
  
  if (awakening.level === "Ascended") {
    t = Math.pow(t, 0.72);
  }
  
  return Math.max(0.008, Math.min(0.995, t));
}

// ============================================================
// PART 7: COLOR PIPELINE (ENHANCED)
// ============================================================

function signatureColor(t, time) {
  const r = Math.sin(t * Math.PI * 2.4 + time) * 0.32;
  const g = Math.sin(t * Math.PI * 2.7 + time * 1.35) * 0.32;
  const b = Math.sin(t * Math.PI * 3.0 + time * 1.8) * 0.32;
  return { r, g, b };
}

function engineColorDiscipline(r, g, b, engineType, t, time, awakening, traits, eventScore) {
  const isAggressive = (engineType === "Rupture" || traits.rarityClass === "Grail" || eventScore > 3.0);
  const eventColorBoost = 1 + Math.min(0.15, eventScore * 0.022);
  
  if (engineType === "Canonical") {
    r = r * 0.88 + Math.sin(t * 9 + time) * 0.06;
    g = g * 0.88 + Math.cos(t * 8 - time) * 0.06;
    b = b * 0.88 + Math.sin(t * 10 + time * 1.6) * 0.06;
  } else if (engineType === "Echo") {
    r = r * 0.82 + Math.sin(t * 14 + time * 2.2) * 0.10;
    g = g * 0.82 + Math.cos(t * 12 - time * 1.2) * 0.10;
    b = b * 0.82 + Math.sin(t * 16 + time * 2.0) * 0.10;
  } else {
    r = r * 0.68 + Math.abs(Math.sin(t * 20 + time * 1.5)) * 0.22;
    g = g * 0.68 + Math.abs(Math.cos(t * 18 - time * 1.2)) * 0.22;
    b = b * 0.68 + Math.abs(Math.sin(t * 22 + time * 1.8)) * 0.22;
  }
  
  // Apply event color boost
  r *= eventColorBoost;
  g *= eventColorBoost;
  b *= eventColorBoost;
  
  if (awakening.level === "Awakened") {
    r = r * 1.10;
    g = g * 1.08;
    b = b * 1.12;
  } else if (awakening.level === "Ascended") {
    r = r * 1.22;
    g = g * 1.18;
    b = b * 1.24;
  }
  
  return { r: Math.min(1, r), g: Math.min(1, g), b: Math.min(1, b) };
}

function getRichColor(t, colorMood, time, primaryDriver) {
  let r, g, b;
  const phase = time * 0.85;
  
  switch(colorMood) {
    case "Inferno":
      r = 0.72 + Math.sin(t * 11 + phase) * 0.32;
      g = 0.18 + Math.sin(t * 13 + phase + 1.2) * 0.18;
      b = 0.04 + Math.sin(t * 15 + phase + 2.4) * 0.10;
      break;
    case "Ice":
      r = 0.08 + Math.sin(t * 9 + phase) * 0.12;
      g = 0.48 + Math.sin(t * 11 + phase + 1.2) * 0.34;
      b = 0.78 + Math.sin(t * 13 + phase + 2.4) * 0.22;
      break;
    case "Void":
      r = 0.28 + Math.sin(t * 7 + phase) * 0.22;
      g = 0.12 + Math.sin(t * 8 + phase + 1.2) * 0.18;
      b = 0.38 + Math.sin(t * 9 + phase + 2.4) * 0.28;
      break;
    case "Arc":
      r = 0.48 + Math.sin(t * 12 + phase) * 0.44;
      g = 0.28 + Math.sin(t * 14 + phase + 1.6) * 0.34;
      b = 0.68 + Math.sin(t * 16 + phase + 0.9) * 0.34;
      break;
    case "Ghost":
      r = 0.58 + Math.sin(t * 6 + phase) * 0.22;
      g = 0.62 + Math.sin(t * 7 + phase + 1.2) * 0.22;
      b = 0.68 + Math.sin(t * 8 + phase + 2.4) * 0.22;
      break;
    default: // Bloom
      r = 0.38 + Math.sin(t * 10 + phase) * 0.38;
      g = 0.58 + Math.sin(t * 12 + phase + 1.2) * 0.34;
      b = 0.28 + Math.sin(t * 14 + phase + 2.4) * 0.44;
  }
  
  if (primaryDriver.includes("Chromatic")) {
    r = Math.pow(r, 1.12);
    b = Math.pow(b, 1.18);
  } else if (primaryDriver.includes("Pressure")) {
    r = r * 1.14;
    g = g * 1.10;
  } else if (primaryDriver.includes("Phase")) {
    const phaseShift = Math.sin(t * 15 + time) * 0.12;
    r = Math.min(1, r + phaseShift);
    b = Math.max(0, b - phaseShift * 0.8);
  }
  
  return { r: Math.min(0.92, Math.max(0.08, r)), g: Math.min(0.92, Math.max(0.08, g)), b: Math.min(0.92, Math.max(0.08, b)) };
}

function applySpectralSplitColor({ r, g, b, t, time, engineType, anomalyClass }) {
  if (anomalyClass !== "SpectralSplit") return { r, g, b };
  
  const split = Math.sin(t * 22 + time * 5.5) * 0.35 + 0.35;
  if (engineType === "Rupture") {
    return { r: r * 0.75 + b * 0.55, g: g * 0.65 + r * 0.45, b: b * 0.55 + g * 0.55 };
  } else if (engineType === "Echo") {
    return { r: r * 0.65 + g * 0.45, g: g * 0.75 + b * 0.35, b: b * 0.65 + r * 0.45 };
  }
  return { r: r * 0.75 + g * 0.35, g: g * 0.75 + b * 0.35, b: b * 0.75 + r * 0.35 };
}

// ============================================================
// PART 8: CANONICAL INTENSITY & TIME
// ============================================================

export function getCanonicalIntensity({ customMintData, masterSeed, mode = "highlight" }) {
  if (customMintData && typeof customMintData.intensity === 'number') {
    return Math.max(0.08, Math.min(0.96, customMintData.intensity));
  }
  
  const rng = makeSeededRand(splitSeed(masterSeed, 10));
  const baseIntensity = 0.32 + rng() * 0.58;
  
  if (mode === "viewer_canonical") {
    return baseIntensity;
  }
  return baseIntensity;
}

export function deterministicTime(tokenId, masterSeed, intensity) {
  const rng = makeSeededRand(splitSeed(masterSeed, 11));
  const phase = rng() * Math.PI * 2;
  return (tokenId * 0.0011 + phase) * (0.48 + intensity * 0.85);
}

// ============================================================
// PART 9: CANONICAL PIXEL COMPUTATION
// ============================================================

export function computePixel({ x, y, width, height, traits, baseTraits, canonicalTime, canonicalIntensity, awakeningState }) {
  const nx = x / width;
  const ny = y / height;
  
  let rx = nx;
  let ry = ny;
  
  const tVal = canonicalTime * 0.85;
  
  let fractalVal = novaFractalCalc(rx, ry, tVal, 5);
  let patternVal = getPatternValue(rx, ry, tVal, traits.structureType);
  
  const eventScore = getEventScore(traits);
  
  let engineRx = rx;
  let engineRy = ry;
  
  let fieldValue = computeEngineField({
    fractalVal, patternVal, rx: engineRx, ry: engineRy,
    engineType: traits.engineType,
    awakening: awakeningState,
    traits: traits,
    time: tVal,
    eventScore
  });
  
  if (traits.rarityClass === "Grail") {
    fieldValue = applyGrailOverride({
      t: fieldValue,
      fractalVal, patternVal, rx: engineRx, ry: engineRy,
      engineType: traits.engineType,
      anomalyClass: traits.anomalyClass,
      awakening: awakeningState,
      eventScore
    });
  }
  
  const richColor = getRichColor(fieldValue, traits.colorMood, tVal, traits.primaryDriver);
  const signature = signatureColor(fieldValue, tVal);
  
  const isAggressive = (traits.engineType === "Rupture" || traits.rarityClass === "Grail" || eventScore > 3.5);
  if (isAggressive) {
    var rFinal = richColor.r * 0.58 + signature.r * 0.42;
    var gFinal = richColor.g * 0.58 + signature.g * 0.42;
    var bFinal = richColor.b * 0.58 + signature.b * 0.42;
  } else {
    var rFinal = richColor.r * 0.68 + signature.r * 0.32;
    var gFinal = richColor.g * 0.68 + signature.g * 0.32;
    var bFinal = richColor.b * 0.68 + signature.b * 0.32;
  }
  
  const disciplined = engineColorDiscipline(rFinal, gFinal, bFinal, traits.engineType, fieldValue, tVal, awakeningState, traits, eventScore);
  rFinal = disciplined.r;
  gFinal = disciplined.g;
  bFinal = disciplined.b;
  
  const split = applySpectralSplitColor({ r: rFinal, g: gFinal, b: bFinal, t: fieldValue, time: tVal, engineType: traits.engineType, anomalyClass: traits.anomalyClass });
  rFinal = split.r;
  gFinal = split.g;
  bFinal = split.b;
  
  rFinal = Math.min(1, rFinal * awakeningState.colorBias);
  gFinal = Math.min(1, gFinal * awakeningState.colorBias);
  bFinal = Math.min(1, bFinal * awakeningState.colorBias);
  
  const intensity = canonicalIntensity * 0.78 + fieldValue * 0.44;
  rFinal = Math.pow(rFinal, 1 - intensity * 0.32) * intensity;
  gFinal = Math.pow(gFinal, 1 - intensity * 0.32) * intensity;
  bFinal = Math.pow(bFinal, 1 - intensity * 0.32) * intensity;
  
  if (traits.failureMode === "VoidBloom") {
    const darken = Math.exp(-Math.pow((rx-0.5)*2.2, 2) - Math.pow((ry-0.5)*2.2, 2) * 1.6);
    rFinal = rFinal * (0.28 + darken * 0.72);
    gFinal = gFinal * (0.18 + darken * 0.62);
    bFinal = bFinal * (0.38 + darken * 0.82);
  }
  
  const contrast = awakeningState.contrastBias;
  rFinal = Math.min(1, Math.max(0, (rFinal - 0.5) * contrast + 0.5));
  gFinal = Math.min(1, Math.max(0, (gFinal - 0.5) * contrast + 0.5));
  bFinal = Math.min(1, Math.max(0, (bFinal - 0.5) * contrast + 0.5));
  
  return {
    r: Math.floor(rFinal * 255),
    g: Math.floor(gFinal * 255),
    b: Math.floor(bFinal * 255),
    a: 255
  };
}

// ============================================================
// PART 10: MAIN CANONICAL RENDER FUNCTION
// ============================================================

export function renderCanonicalFrame({
  tokenId,
  txHash,
  width = 320,
  height = 320,
  customMintData = null,
  debugOptions = null
}) {
  const seed = getSeed(tokenId, txHash);
  
  const traits = generateCollectionTraits({ seed, tokenId, debugOptions });
  const baseTraits = generateBaseTraits({ seed, tokenId });
  
  const canonicalIntensity = getCanonicalIntensity({ customMintData, masterSeed: seed, mode: "highlight" });
  const canonicalTime = deterministicTime(tokenId, seed, canonicalIntensity);
  
  const awakeningState = getAwakeningState({
    intensity: canonicalIntensity,
    rarityClass: traits.rarityClass,
    engineType: traits.engineType,
    anomalyClass: traits.anomalyClass,
    failureMode: traits.failureMode
  });
  
  const pixels = new Uint8ClampedArray(width * height * 4);
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = computePixel({
        x, y, width, height,
        traits,
        baseTraits,
        canonicalTime,
        canonicalIntensity,
        awakeningState
      });
      
      const idx = (y * width + x) * 4;
      pixels[idx] = pixel.r;
      pixels[idx + 1] = pixel.g;
      pixels[idx + 2] = pixel.b;
      pixels[idx + 3] = pixel.a;
    }
  }
  
  const eventScore = getEventScore(traits);
  
  const metadata = {
    name: `dartHLGEN #${tokenId}`,
    description: `A deterministic generative artwork on Farcaster. Engine: ${traits.engineType}. Rarity: ${traits.rarityClass}. Awakening: ${awakeningState.level}. Event Score: ${eventScore}`,
    attributes: [
      { trait_type: "Rarity Class", value: traits.rarityClass },
      { trait_type: "Engine Type", value: traits.engineType },
      { trait_type: "Archetype", value: traits.archetype },
      { trait_type: "Anchor Form", value: traits.anchorForm },
      { trait_type: "Primary Driver", value: traits.primaryDriver },
      { trait_type: "Structure Type", value: traits.structureType },
      { trait_type: "Color Mood", value: traits.colorMood },
      { trait_type: "Failure Mode", value: traits.failureMode },
      { trait_type: "Anomaly Class", value: traits.anomalyClass || "None" },
      { trait_type: "Dominant Zone", value: traits.dominantZone },
      { trait_type: "Awakening Level", value: awakeningState.level },
      { trait_type: "Intensity", value: canonicalIntensity.toFixed(3) },
      { trait_type: "Event Score", value: eventScore.toString() }
    ]
  };
  
  return {
    seed,
    traits,
    baseTraits,
    canonicalIntensity,
    canonicalTime,
    awakeningState,
    pixels,
    metadata,
    eventScore
  };
}

// ============================================================
// PART 11: DEBUG & URL PARSING
// ============================================================

function getDebugOptionsFromURL() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has('debug') && !params.has('forceGrail') && !params.has('balanceEngines')) {
    return null;
  }
  
  return {
    enabled: params.has('debug'),
    forceGrailPercent: params.has('forceGrail') ? parseFloat(params.get('forceGrail')) : null,
    onlyMythicRareUncommon: params.has('onlyRare'),
    balanceNonCanonicalEngines: params.has('balanceEngines')
  };
}

// ============================================================
// PART 12: HIGHLIGHT MINT ADAPTER
// ============================================================

let hlReady = false;
let mintResult = null;

function getHL() {
  if (typeof HL === 'undefined') {
    console.log("Waiting for Highlight SDK...");
    return null;
  }
  return HL;
}

function waitForHL(callback) {
  if (typeof HL !== 'undefined' && HL.tx && HL.tx.tokenId) {
    console.log("HL SDK ready");
    hlReady = true;
    callback();
  } else {
    setTimeout(() => waitForHL(callback), 100);
  }
}

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

function runMint() {
  waitForHL(() => {
    const hl = getHL();
    if (!hl || !hl.tx) {
      console.error("HL not available");
      return;
    }
    
    const tokenId = hl.tx.tokenId;
    const txHash = hl.tx.hash;
    const customMintData = hl.tx.customMintData || null;
    const debugOptions = getDebugOptionsFromURL();
    
    console.log(`🎨 Minting token #${tokenId} with tx ${txHash}`);
    if (debugOptions) console.log("Debug mode active", debugOptions);
    
    const result = renderCanonicalFrame({
      tokenId,
      txHash,
      width: 320,
      height: 320,
      customMintData,
      debugOptions
    });
    
    mintResult = result;
    
    const canvas = document.getElementById('preview-canvas') || document.createElement('canvas');
    if (canvas.parentElement) {
      drawPixelsToCanvas(canvas, result.pixels, 320, 320, 640, 640);
    }
    
    hl.token.setTraits(result.metadata.attributes);
    hl.token.setName(result.metadata.name);
    hl.token.setDescription(result.metadata.description);
    
    console.log(`✅ Mint ready: ${result.traits.engineType} | ${result.traits.rarityClass} | Awakening: ${result.awakeningState.level} | Event Score: ${result.eventScore}`);
    
    if (hl.token.capturePreview) {
      hl.token.capturePreview();
    }
  });
}

// ============================================================
// PART 13: P5.JS SETUP (Viewer mode)
// ============================================================

let currentFrame = null;
let isCanonicalMode = true;

function setup() {
  const canvas = createCanvas(640, 640);
  canvas.parent('canvas-container');
  pixelDensity(1);
  noLoop();
  
  const params = new URLSearchParams(window.location.search);
  isCanonicalMode = !params.has('live');
  
  if (typeof HL !== 'undefined' && HL.tx) {
    runMint();
  } else {
    loadDemoToken();
  }
}

function loadDemoToken() {
  const params = new URLSearchParams(window.location.search);
  const tokenId = params.get('tokenId') || '1';
  const txHash = params.get('tx') || '0x742d35Cc6634C0532925a3b844Bc9e7595f0b3b3';
  const debugOptions = getDebugOptionsFromURL();
  
  console.log(`👁️ Viewer mode: Token #${tokenId}`);
  
  const result = renderCanonicalFrame({
    tokenId: parseInt(tokenId),
    txHash,
    width: 320,
    height: 320,
    customMintData: null,
    debugOptions
  });
  
  currentFrame = result;
  drawPixelsToCanvas(canvas, result.pixels, 320, 320, 640, 640);
  displayMetadata(result);
}

function displayMetadata(result) {
  const infoDiv = document.getElementById('info') || createInfoDiv();
  infoDiv.innerHTML = `
    <h3>dartHLGEN #?</h3>
    <p><strong>Engine:</strong> ${result.traits.engineType}</p>
    <p><strong>Rarity:</strong> ${result.traits.rarityClass}</p>
    <p><strong>Awakening:</strong> ${result.awakeningState.level}</p>
    <p><strong>Intensity:</strong> ${result.canonicalIntensity.toFixed(3)}</p>
    <p><strong>Failure:</strong> ${result.traits.failureMode}</p>
    <p><strong>Anomaly:</strong> ${result.traits.anomalyClass || 'None'}</p>
    <p><strong>Event Score:</strong> ${result.eventScore}</p>
  `;
}

function createInfoDiv() {
  const div = document.createElement('div');
  div.id = 'info';
  div.style.position = 'absolute';
  div.style.bottom = '10px';
  div.style.left = '10px';
  div.style.backgroundColor = 'rgba(0,0,0,0.7)';
  div.style.color = 'white';
  div.style.padding = '10px';
  div.style.fontFamily = 'monospace';
  div.style.fontSize = '12px';
  div.style.borderRadius = '5px';
  document.body.appendChild(div);
  return div;
}

function draw() {
  // draw is handled by loadDemoToken / runMint
}

// ============================================================
// PART 14: EXPORT FOR VIEWER
// ============================================================

window.renderCanonicalFrame = renderCanonicalFrame;
window.getSeed = getSeed;
window.generateCollectionTraits = generateCollectionTraits;
window.getAwakeningState = getAwakeningState;
window.deterministicTime = deterministicTime;
window.getCanonicalIntensity = getCanonicalIntensity;
window.getEventScore = getEventScore;

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    renderCanonicalFrame,
    getSeed,
    generateCollectionTraits,
    getAwakeningState
  };
}