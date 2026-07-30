export type PaperSize = 'A4' | 'A3' | 'A2';
export type Orientation = 'portrait' | 'landscape';

export interface PrintDimensions {
  paperSize: PaperSize;
  orientation: Orientation;
  bracketBaseWidthPx: number;
  bracketBaseHeightPx: number;
  scaleFactor: number;
}

/**
 * Calculates the best paper size, orientation, and scaling factor for a bracket.
 * 
 * @param competitorCount Number of competitors in the category
 * @param rounds Number of rounds in the bracket
 * @param isRoundRobin Whether this is a round-robin format
 */
export function calculatePrintDimensions(
  competitorCount: number, 
  rounds: number,
  isRoundRobin: boolean
): PrintDimensions {
  
  if (isRoundRobin) {
    // Round robin is just a table, but we will force A4 Landscape
    return {
      paperSize: 'A4',
      orientation: 'landscape',
      bracketBaseWidthPx: 1000,
      bracketBaseHeightPx: 750,
      scaleFactor: 1.0
    };
  }

  let paperSize: PaperSize = 'A4';
  let orientation: Orientation = 'portrait';
  
  // 1. Force A4 Landscape for all print previews per user request
  paperSize = 'A4';
  orientation = 'landscape';

  // 2. Define standard paper sizes in pixels (assuming ~96 DPI, though for print it's just a relative ratio)
  // We'll use CSS pixels. A4 is ~794x1123 px at 96 DPI.
  const paperSizes = {
    'A4': { portrait: { w: 794, h: 1123 }, landscape: { w: 1123, h: 794 } },
    'A3': { portrait: { w: 1123, h: 1587 }, landscape: { w: 1587, h: 1123 } },
    'A2': { portrait: { w: 1587, h: 2245 }, landscape: { w: 2245, h: 1587 } }
  };

  // Safe printable area (subtract margins)
  const marginPx = 20; 
  const availableWidth = paperSizes[paperSize][orientation].w - (marginPx * 2);
  const availableHeight = paperSizes[paperSize][orientation].h - (marginPx * 2) - 220; // 220px reserved for Header, Banner, Footer, and gaps

  // 3. Calculate Base Pixel Size of the Bracket
  // We want to give the bracket enough space to not compress the text or lines.
  // Standard card height is ~28px, width is relative to number of rounds.
  // The bracket draws its own lines and cards using percentages.
  // So we just need a big enough base rectangle.
  
  const minCardWidthPx = 180;
  const minRoundHeightPx = Math.max(competitorCount * 35, 600); // 35px height per competitor
  
  const baseWidth = Math.max((rounds + 1) * minCardWidthPx, 1000); // +1 for champion slot
  const baseHeight = minRoundHeightPx;

  // 4. Calculate Scale Factor to fit the bracket into the paper's printable area
  const scaleX = availableWidth / baseWidth;
  const scaleY = availableHeight / baseHeight;
  
  // Fit it proportionally
  const scaleFactor = Math.min(scaleX, scaleY, 1.0); // Never scale UP, only DOWN

  return {
    paperSize,
    orientation,
    bracketBaseWidthPx: baseWidth,
    bracketBaseHeightPx: baseHeight,
    scaleFactor
  };
}
