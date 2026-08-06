export type PaperSize = 'A4' | 'A3' | 'A2';
export type Orientation = 'portrait' | 'landscape' | 'auto';
export type FitMode = 'auto' | 'actual' | 'width';
export type MarginSize = 'narrow' | 'normal' | 'wide';

export interface PrintDimensions {
  paperSize: PaperSize;
  orientation: 'portrait' | 'landscape'; // Resolved orientation
  bracketBaseWidthPx: number;
  bracketBaseHeightPx: number;
  scaleFactor: number;
  marginMm: number;
}

/**
 * Calculates the best paper size, orientation, and scaling factor for a bracket.
 * 
 * @param competitorCount Number of competitors in the category
 * @param rounds Number of rounds in the bracket
 * @param isRoundRobin Whether this is a round-robin format
 * @param prefOrientation User's preferred orientation
 * @param prefFitMode User's preferred fit mode
 * @param prefMargin User's preferred margin size
 */
export function calculatePrintDimensions(
  competitorCount: number, 
  rounds: number,
  isRoundRobin: boolean,
  prefOrientation: Orientation = 'auto',
  prefFitMode: FitMode = 'auto',
  prefMargin: MarginSize = 'normal'
): PrintDimensions {
  
  // Resolve Margin in mm
  let marginMm = 15;
  if (prefMargin === 'narrow') marginMm = 10;
  if (prefMargin === 'wide') marginMm = 20;

  if (isRoundRobin) {
    // Round robin is just a table, force landscape usually
    const resolvedOrientation = prefOrientation === 'portrait' ? 'portrait' : 'landscape';
    return {
      paperSize: 'A4',
      orientation: resolvedOrientation,
      bracketBaseWidthPx: 1000,
      bracketBaseHeightPx: 750,
      scaleFactor: 1.0,
      marginMm
    };
  }

  const paperSize: PaperSize = 'A4';
  let resolvedOrientation: 'portrait' | 'landscape' = 'landscape';
  
  // 1. Intelligent Orientation
  if (prefOrientation === 'auto') {
    resolvedOrientation = competitorCount <= 8 ? 'portrait' : 'landscape';
  } else {
    resolvedOrientation = prefOrientation as 'portrait' | 'landscape';
  }

  // 2. Define standard paper sizes in pixels (assuming ~96 DPI)
  // A4 is ~794x1123 px at 96 DPI.
  const paperSizes = {
    'A4': { portrait: { w: 794, h: 1123 }, landscape: { w: 1123, h: 794 } },
    'A3': { portrait: { w: 1123, h: 1587 }, landscape: { w: 1587, h: 1123 } },
    'A2': { portrait: { w: 1587, h: 2245 }, landscape: { w: 2245, h: 1587 } }
  };

  // Safe printable area (subtract margins, approx 1mm = 3.8px)
  const marginPx = marginMm * 3.8;
  const availableWidth = paperSizes[paperSize][resolvedOrientation].w - (marginPx * 2);
  const availableHeight = paperSizes[paperSize][resolvedOrientation].h - (marginPx * 2) - 180; // 180px reserved for Header, Banner, Footer

  // 3. Calculate Base Pixel Size of the Bracket
  const minCardWidthPx = 180;
  const minRoundHeightPx = Math.max(competitorCount * 35, 600); // 35px height per competitor
  
  const baseWidth = Math.max((rounds + 1) * minCardWidthPx, 800); // +1 for champion slot
  const baseHeight = minRoundHeightPx;

  // 4. Calculate Scale Factor based on Fit Mode
  const scaleX = availableWidth / baseWidth;
  const scaleY = availableHeight / baseHeight;
  
  let scaleFactor = 1.0;

  if (prefFitMode === 'actual') {
    scaleFactor = 1.0;
  } else if (prefFitMode === 'width') {
    scaleFactor = Math.min(scaleX, 1.0); // Fit width, but never scale UP
  } else {
    // 'auto' mode - fit both dimensions if possible, but prioritize width.
    // If it's a huge bracket, fitting height might make it unreadable.
    scaleFactor = Math.min(scaleX, scaleY, 1.0);
    // Add a hard floor to scaleFactor in auto mode to prevent completely illegible text
    if (scaleFactor < 0.4 && competitorCount > 32) {
       scaleFactor = scaleX; // Fallback to width-only scaling if it gets too tiny
    }
  }

  // 5. Stretch bracket to utilize maximum left/right borders
  // If we have extra horizontal space after scaling, we expand the baseWidth.
  // Because the bracket uses percentages for card widths, this will stretch the cards
  // horizontally to fill the page, making text much clearer and utilizing all space.
  let finalBaseWidth = baseWidth;
  if (prefFitMode !== 'actual') {
    const requiredWidthToFill = availableWidth / scaleFactor;
    if (requiredWidthToFill > finalBaseWidth) {
      finalBaseWidth = requiredWidthToFill;
    }
  }

  return {
    paperSize,
    orientation: resolvedOrientation,
    bracketBaseWidthPx: finalBaseWidth,
    bracketBaseHeightPx: baseHeight,
    scaleFactor,
    marginMm
  };
}
