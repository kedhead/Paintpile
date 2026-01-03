/**
 * POST /api/admin/import-github-paints
 *
 * Import paints from GitHub miniature-paints repository
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';

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

    // Import to Firestore
    const paintsRef = collection(db, 'paints');
    let importedCount = 0;

    for (const paint of paints) {
      const paintRef = doc(paintsRef);
      await setDoc(paintRef, {
        ...paint,
        paintId: paintRef.id,
        createdAt: Timestamp.now(),
      });
      importedCount++;
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
  const brand = manufacturerFile
    .replace('_', ' ')
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

    if (cells.length < 6) {
      continue; // Skip invalid rows
    }

    const [name, set, r, g, b, hex] = cells;

    // Clean hex color (remove color swatch markdown)
    const hexMatch = hex.match(/#[0-9A-Fa-f]{6}/);
    const hexColor = hexMatch ? hexMatch[0] : hex;

    // Create paint object
    const paint = {
      brand,
      name,
      hexColor,
      type: determineType(set),
      category: set || 'Standard',
      finish: determineFinish(set),
      available: true,
      tags: [brand.toLowerCase(), set.toLowerCase()].filter(Boolean),
    };

    paints.push(paint);
  }

  return paints;
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
  if (lowerSet.includes('contrast')) {
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
