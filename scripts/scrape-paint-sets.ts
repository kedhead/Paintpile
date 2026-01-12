#!/usr/bin/env tsx

/**
 * Paint Set Scraper Script
 *
 * Scrapes paint sets from manufacturer websites and generates
 * TypeScript code to add to paint-sets.ts
 *
 * Usage:
 *   npm run scrape:sets [brand]
 *
 * Examples:
 *   npm run scrape:sets monument
 *   npm run scrape:sets all
 */

import { MonumentSetScraperAI } from '../lib/scrapers/monument-set-scraper-ai';
import { PaintSetScraperResult } from '../lib/scrapers/paint-set-scraper-base';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  console.log('✅ Loaded environment variables from .env.local\n');
} else {
  console.warn('⚠️  .env.local not found - API key must be set manually\n');
}

// Command line arguments
const brand = process.argv[2] || 'monument';
const useAI = process.argv[3] !== '--no-ai'; // Default to using AI

async function main() {
  console.log('🎨 Paint Set Scraper\n');

  const results: PaintSetScraperResult[] = [];

  // Scrape requested brand(s)
  if (brand === 'all' || brand === 'monument') {
    if (useAI) {
      console.log('📦 Scraping Monument Hobbies (ProAcryl) with AI enhancement...\n');
      const scraper = new MonumentSetScraperAI();
      const result = await scraper.scrape();
      results.push(result);
    } else {
      console.log('📦 Scraping Monument Hobbies (ProAcryl) without AI...\n');
      console.log('❌ Basic scraper not recommended - use AI scraper instead');
    }
  }

  // Add more scrapers here as they're built
  // if (brand === 'all' || brand === 'citadel') { ... }
  // if (brand === 'all' || brand === 'vallejo') { ... }

  // Display results
  console.log('\n\n=== SCRAPING COMPLETE ===\n');

  let totalSets = 0;
  let totalErrors = 0;

  results.forEach(result => {
    console.log(`${result.brand}:`);
    console.log(`  Sets found: ${result.sets.length}`);
    console.log(`  Errors: ${result.errors.length}`);

    totalSets += result.sets.length;
    totalErrors += result.errors.length;

    if (result.errors.length > 0) {
      console.log('  Errors:');
      result.errors.forEach(error => console.log(`    - ${error}`));
    }
  });

  console.log(`\nTotal: ${totalSets} sets, ${totalErrors} errors\n`);

  // Generate TypeScript code
  if (totalSets > 0) {
    console.log('=== GENERATED CODE ===\n');
    console.log('Copy this into lib/data/paint-sets.ts:\n');
    console.log('---\n');

    results.forEach(result => {
      if (result.sets.length > 0) {
        generateTypeScriptCode(result);
      }
    });

    // Also save to file
    const outputDir = path.join(process.cwd(), 'scripts', 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const outputPath = path.join(outputDir, `scraped-sets-${brand}-${timestamp}.ts`);

    let fileContent = '// Scraped Paint Sets\n';
    fileContent += `// Generated: ${new Date().toISOString()}\n`;
    fileContent += '// Brand: ' + results.map(r => r.brand).join(', ') + '\n\n';

    fileContent += 'import { PaintSet } from "@/types/paint-set";\n\n';
    fileContent += 'export const SCRAPED_SETS: PaintSet[] = [\n';

    results.forEach(result => {
      result.sets.forEach(set => {
        fileContent += generatePaintSetObject(set);
      });
    });

    fileContent += '];\n';

    fs.writeFileSync(outputPath, fileContent, 'utf-8');
    console.log(`\n✅ Saved to: ${outputPath}\n`);
  }
}

/**
 * Generate TypeScript code for a paint set scraper result
 */
function generateTypeScriptCode(result: PaintSetScraperResult) {
  console.log(`// ===== ${result.brand.toUpperCase()} SETS (Scraped ${result.scrapedAt.toLocaleDateString()}) =====\n`);

  result.sets.forEach(set => {
    const code = generatePaintSetObject(set);
    console.log(code);
  });
}

/**
 * Generate a PaintSet object as TypeScript code
 */
function generatePaintSetObject(set: any): string {
  const setId = set.setId || generateSetId(set.brand, set.setName);

  let code = '  {\n';
  code += `    setId: '${setId}',\n`;
  code += `    setName: '${escapeSingleQuotes(set.setName)}',\n`;
  code += `    brand: '${set.brand}',\n`;
  code += `    paintCount: ${set.paintCount},\n`;
  code += `    isCurated: false, // Scraped - needs manual verification\n`;

  if (set.description) {
    code += `    description: '${escapeSingleQuotes(set.description)}',\n`;
  }

  if (set.sourceUrl) {
    code += `    sourceUrl: '${set.sourceUrl}',\n`;
  }

  if (set.imageUrl) {
    code += `    imageUrl: '${set.imageUrl}',\n`;
  }

  if (set.paintNames && set.paintNames.length > 0) {
    code += `    paintNames: [\n`;
    set.paintNames.forEach((name: string) => {
      code += `      '${escapeSingleQuotes(name)}',\n`;
    });
    code += `    ],\n`;
  } else {
    code += `    paintNames: [],\n`;
    code += `    // TODO: Manually add paint names from ${set.sourceUrl}\n`;
  }

  code += '  },\n';

  return code;
}

/**
 * Generate a set ID from brand and name
 */
function generateSetId(brand: string, setName: string): string {
  const brandSlug = brand.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const nameSlug = setName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  return `${brandSlug}-${nameSlug}`.replace(/^-|-$/g, '');
}

/**
 * Escape single quotes for TypeScript string literals
 */
function escapeSingleQuotes(str: string): string {
  return str.replace(/'/g, "\\'");
}

// Run the scraper
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
