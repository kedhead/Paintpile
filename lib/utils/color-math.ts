/**
 * Color Math Utilities
 * Handles conversion between Hex, RGB, XYZ, and LAB color spaces.
 * Calculates DeltaE for color matching.
 */

// --- Interfaces ---
export interface RGB {
    r: number;
    g: number;
    b: number;
}

export interface LAB {
    l: number;
    a: number;
    b: number;
}

// --- Conversions ---

/**
 * Convert Hex string (#RRGGBB) to RGB object
 */
export function hexToRgb(hex: string): RGB {
    const cleanHex = hex.replace('#', '');
    const bigint = parseInt(cleanHex, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return { r, g, b };
}

/**
 * Convert RGB to Hex string
 */
export function rgbToHex({ r, g, b }: RGB): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Convert RGB to XYZ (D65 illuminant, 2° observer)
 * Source: http://www.easyrgb.com/en/math.php
 */
function rgbToXyz({ r, g, b }: RGB): { x: number, y: number, z: number } {
    let R = r / 255;
    let G = g / 255;
    let B = b / 255;

    R = R > 0.04045 ? Math.pow(((R + 0.055) / 1.055), 2.4) : R / 12.92;
    G = G > 0.04045 ? Math.pow(((G + 0.055) / 1.055), 2.4) : G / 12.92;
    B = B > 0.04045 ? Math.pow(((B + 0.055) / 1.055), 2.4) : B / 12.92;

    R *= 100;
    G *= 100;
    B *= 100;

    // Observer. = 2°, Illuminant = D65
    const x = R * 0.4124 + G * 0.3576 + B * 0.1805;
    const y = R * 0.2126 + G * 0.7152 + B * 0.0722;
    const z = R * 0.0193 + G * 0.1192 + B * 0.9505;

    return { x, y, z };
}

/**
 * Convert XYZ to LAB
 * Source: http://www.easyrgb.com/en/math.php
 */
function xyzToLab({ x, y, z }: { x: number, y: number, z: number }): LAB {
    // Reference-X, Y and Z (D65)
    let refX = 95.047;
    let refY = 100.000;
    let refZ = 108.883;

    let X = x / refX;
    let Y = y / refY;
    let Z = z / refZ;

    X = X > 0.008856 ? Math.pow(X, 1 / 3) : (7.787 * X) + (16 / 116);
    Y = Y > 0.008856 ? Math.pow(Y, 1 / 3) : (7.787 * Y) + (16 / 116);
    Z = Z > 0.008856 ? Math.pow(Z, 1 / 3) : (7.787 * Z) + (16 / 116);

    const l = (116 * Y) - 16;
    const a = 500 * (X - Y);
    const b = 200 * (Y - Z);

    return { l, a, b };
}

/**
 * Convert Hex to LAB (Wrapper)
 */
export function hexToLab(hex: string): LAB {
    return xyzToLab(rgbToXyz(hexToRgb(hex)));
}

/**
 * Convert RGB to LAB (Wrapper)
 */
export function rgbToLab(rgb: RGB): LAB {
    return xyzToLab(rgbToXyz(rgb));
}

// --- Distance Metrics ---

/**
 * Calculate CIE76 Delta-E (Euclidean distance in LAB space)
 * Simple and fast, but percelptually non-uniform especially in blue/saturated regions.
 * Enough for finding "closest match" usually.
 */
export function deltaE76(lab1: LAB, lab2: LAB): number {
    const dL = lab1.l - lab2.l;
    const dA = lab1.a - lab2.a;
    const dB = lab1.b - lab2.b;
    return Math.sqrt(dL * dL + dA * dA + dB * dB);
}

/**
 * Find closest color match from a list of candidates
 */
export function findClosestMatch<T extends { hex: string }>(targetHex: string, candidates: T[]): { match: T, distance: number } | null {
    if (candidates.length === 0) return null;

    const targetLab = hexToLab(targetHex);
    let bestMatch: T | null = null;
    let minDistance = Infinity;

    for (const candidate of candidates) {
        // Skip invalid hexes
        if (!candidate.hex || !candidate.hex.startsWith('#')) continue;

        const candidateLab = hexToLab(candidate.hex);
        const distance = deltaE76(targetLab, candidateLab);

        if (distance < minDistance) {
            minDistance = distance;
            bestMatch = candidate;
        }
    }

    return bestMatch ? { match: bestMatch, distance: minDistance } : null;
}

/**
 * Find top N matches
 */
export function findTopMatches<T extends { hex: string }>(targetHex: string, candidates: T[], limit: number = 5): { match: T, distance: number }[] {
    const targetLab = hexToLab(targetHex);

    const results = candidates
        .filter(c => c.hex && c.hex.startsWith('#'))
        .map(candidate => ({
            match: candidate,
            distance: deltaE76(targetLab, hexToLab(candidate.hex))
        }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, limit);

    return results;
}
