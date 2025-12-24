import * as THREE from 'three';

// Helper to generate random number between min and max
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min;

export const generateTreePoints = (count: number, radius: number, height: number) => {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    // Height normalized 0 to 1
    const yNorm = Math.random();
    // Invert so 0 is bottom, 1 is top for calculation
    const y = (yNorm - 0.5) * height; 
    
    // Radius decreases as height increases (cone)
    const r = (1 - yNorm) * radius; 
    
    const theta = Math.random() * Math.PI * 2;
    // Add some randomness/volume
    const rRandom = r * Math.sqrt(Math.random()); 

    const x = rRandom * Math.cos(theta);
    const z = rRandom * Math.sin(theta);
    
    points.push(x, y, z);
  }
  return points;
};

// Generates a thick spiral (garland)
export const generateGarlandPoints = (count: number, radius: number, height: number, turns: number = 5, spread: number = 0.3) => {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / count; // 0 to 1
    const yBase = (t - 0.5) * height; // Bottom to top
    
    // Radius decreases as we go up, matches tree taper
    const currentRadius = (1 - t) * radius;
    
    const angle = t * Math.PI * 2 * turns;
    
    const xBase = currentRadius * Math.cos(angle);
    const zBase = currentRadius * Math.sin(angle);
    
    // Add spread (randomness) to make it look like tinsel/volume
    const rndTheta = Math.random() * Math.PI * 2;
    const rndPhi = Math.random() * Math.PI;
    const rndR = Math.random() * spread;
    
    const xOff = rndR * Math.sin(rndPhi) * Math.cos(rndTheta);
    const yOff = rndR * Math.sin(rndPhi) * Math.sin(rndTheta);
    const zOff = rndR * Math.cos(rndPhi);
    
    points.push(xBase + xOff, yBase + yOff, zBase + zOff);
  }
  return points;
};

export const generateNebulaPoints = (count: number, radius: number, tube: number) => {
  const points: number[] = [];
  for (let i = 0; i < count; i++) {
    // Torus distribution
    const u = Math.random() * Math.PI * 2;
    const v = Math.random() * Math.PI * 2;
    
    const x = (radius + tube * Math.cos(v)) * Math.cos(u);
    const y = tube * Math.sin(v); // Flattened height
    const z = (radius + tube * Math.cos(v)) * Math.sin(u);
    
    points.push(x, y, z);
  }
  return points;
};

// Generates a defined ring/disk for the garland in nebula mode
export const generateTorusPoints = (count: number, radius: number, tubeRadius: number) => {
    const points: number[] = [];
    for (let i = 0; i < count; i++) {
        const u = Math.random() * Math.PI * 2;
        const v = Math.random() * Math.PI * 2;
        
        // A thin ring
        const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
        const y = (tubeRadius * Math.sin(v)) * 0.2; // Very flat
        const z = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);

        points.push(x, y, z);
    }
    return points;
}

export const ORNAMENT_COLORS = [
  '#C5A059', // Antique Gold
  '#800020', // Burgundy
  '#778899', // Slate Gray/Blue
  '#B76E79', // Rose Gold
  '#F7E7CE', // Champagne
];