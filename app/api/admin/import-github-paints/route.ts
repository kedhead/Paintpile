/**
 * POST /api/admin/import-github-paints
 *
 * Import paints from GitHub miniature-paints repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';

const GITHUB_BASE_URL = 'https://raw.githubusercontent.com/Arcturus5404/miniature-paints/main/paints';

export async function POST(request: NextRequest) {
  try {
    const { manufacturer } = await request.json();

    if (!manufacturer) {
      return NextResponse.json(
        { success: false, error: 'Manufacturer is required' },
        { status: 400 }
      );
    }

    // Fetch markdown file from GitHub
    const fileUrl = `${GITHUB_BASE_URL}/${manufacturer}.md`;
    const response = await fetch(fileUrl);

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Failed to fetch ${manufacturer} data` },
        { status: 404 }
      );
    }

    const markdownText = await response.text();

    // Parse markdown table
    const paints = parseMarkdownTable(markdownText, manufacturer);

    // Import to Firestore using Admin SDK
    const db = getAdminFirestore();
    const paintsRef = db.collection('paints');
    let importedCount = 0;

    // Process in batches of 500 (Firestore limit)
    const BATCH_SIZE = 500;
    const chunks = [];

    for (let i = 0; i < paints.length; i += BATCH_SIZE) {
      chunks.push(paints.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
      const batch = db.batch();

      for (const paint of chunk) {
        const paintRef = paintsRef.doc();
        batch.set(paintRef, {
          ...paint,
          paintId: paintRef.id,
          createdAt: FieldValue.serverTimestamp(),
        });
      }

      await batch.commit();
      importedCount += chunk.length;
      console.log(`[Import] ${manufacturer}: Committed batch of ${chunk.length} paints`);
    }

    console.log(`[Import] ${manufacturer}: Imported ${importedCount} paints`);

    return NextResponse.json({
      success: true,
      count: importedCount,
      manufacturer,
    });
  } catch (error: any) {
    console.error('[Import GitHub Paints] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import paints' },
      { status: 500 }
    );
  }
}

/**
 * Parse markdown table into Paint objects
 */
function parseMarkdownTable(markdown: string, manufacturerFile: string): any[] {
  const paints: any[] = [];

  // Extract brand name from filename
  // Replace ALL underscores with spaces
  const brand = manufacturerFile
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim();

  // Split into lines
  const lines = markdown.split('\n');

  // Find table header (contains | Name | Set | R | G | B | Hex |)
  let tableStartIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('| Name |') || lines[i].includes('|Name|')) {
      tableStartIndex = i;
      break;
    }
  }

  if (tableStartIndex === -1) {
    console.warn(`No table found in ${manufacturerFile}`);
    return paints;
  }

  // Parse header to detect format
  const headerLine = lines[tableStartIndex];
  const headers = headerLine
    .split('|')
    .map(h => h.trim().toLowerCase())
    .filter(h => h.length > 0);

  // Detect if there's a "Code" column
  const hasCodeColumn = headers.includes('code');

  console.log(`[Import] ${manufacturerFile} - Headers:`, headers);
  console.log(`[Import] ${manufacturerFile} - Has Code column:`, hasCodeColumn);

  // Skip header and separator line
  const dataStartIndex = tableStartIndex + 2;

  // Parse data rows
  for (let i = dataStartIndex; i < lines.length; i++) {
    const line = lines[i].trim();

    // Stop at empty line or end of table
    if (!line || !line.startsWith('|')) {
      break;
    }

    // Split by pipe and clean
    const cells = line
      .split('|')
      .map(cell => cell.trim())
      .filter(cell => cell.length > 0);

    // Determine minimum required columns based on format
    const minColumns = hasCodeColumn ? 7 : 6;
    if (cells.length < minColumns) {
      console.warn(`[Import] Skipping row with ${cells.length} columns (expected ${minColumns}):`, line);
      continue;
    }

    let name, code, set, r, g, b, hex;

    if (hasCodeColumn) {
      // Format: |Name|Code|Set|R|G|B|Hex|
      [name, code, set, r, g, b, hex] = cells;
    } else {
      // Format: |Name|Set|R|G|B|Hex|
      [name, set, r, g, b, hex] = cells;
      code = null;
    }

    // Clean and validate hex color
    let hexColor = null;

    // Try to extract hex from the hex column (might have color swatch markdown)
    const hexMatch = hex.match(/#[0-9A-Fa-f]{6}/);
    if (hexMatch) {
      hexColor = hexMatch[0];
    } else if (hex.startsWith('#') && hex.length === 7) {
      hexColor = hex;
    } else if (r && g && b) {
      // If hex is missing but we have RGB, convert it
      const rVal = parseInt(r);
      const gVal = parseInt(g);
      const bVal = parseInt(b);

      if (!isNaN(rVal) && !isNaN(gVal) && !isNaN(bVal)) {
        hexColor = rgbToHex(rVal, gVal, bVal);
        console.log(`[Import] Converted RGB(${r},${g},${b}) to ${hexColor} for ${name}`);
      }
    }

    if (!hexColor) {
      console.warn(`[Import] Skipping ${name} - no valid hex color found`);
      continue;
    }

    // Create paint object
    const paint = {
      brand,
      name,
      code: code || null,
      hexColor,
      type: determineType(set),
      category: set || 'Standard',
      finish: determineFinish(set),
      available: true,
      tags: [brand.toLowerCase(), set.toLowerCase()].filter(Boolean),
    };

    paints.push(paint);
  }

  console.log(`[Import] ${manufacturerFile} - Successfully parsed ${paints.length} paints`);
  return paints;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => {
    const hex = Math.max(0, Math.min(255, n)).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * Determine paint type from set name
 */
function determineType(set: string): string {
  const lowerSet = set.toLowerCase();

  if (lowerSet.includes('base') || lowerSet.includes('foundation')) {
    return 'base';
  }
  if (lowerSet.includes('shade') || lowerSet.includes('wash')) {
    return 'shade';
  }
  if (lowerSet.includes('layer') || lowerSet.includes('highlight')) {
    return 'layer';
  }
  if (lowerSet.includes('dry')) {
    return 'dry';
  }
  if (lowerSet.includes('technical') || lowerSet.includes('effect')) {
    return 'technical';
  }
  if (lowerSet.includes('contrast') || lowerSet.includes('speedpaint') || lowerSet.includes('xpress')) {
    return 'contrast';
  }
  if (lowerSet.includes('air')) {
    return 'air';
  }
  if (lowerSet.includes('spray') || lowerSet.includes('primer')) {
    return 'primer';
  }
  if (lowerSet.includes('metallic') || lowerSet.includes('metal')) {
    return 'metallic';
  }

  return 'standard';
}

/**
 * Determine paint finish from set name
 */
function determineFinish(set: string): string {
  const lowerSet = set.toLowerCase();

  if (lowerSet.includes('gloss')) {
    return 'gloss';
  }
  if (lowerSet.includes('satin')) {
    return 'satin';
  }
  if (lowerSet.includes('metallic') || lowerSet.includes('metal')) {
    return 'metallic';
  }
  if (lowerSet.includes('matte') || lowerSet.includes('mat')) {
    return 'matte';
  }

  return 'matte'; // Default
}
