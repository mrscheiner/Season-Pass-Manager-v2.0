import * as XLSX from 'xlsx';
import { Game } from '@/constants/types';

/**
 * Expected CSV/Excel format:
 * - Column 1: Game Number (PS 1, PS 2, 1, 2, 3, etc.)
 * - Column 2: Date (e.g., "Sep 29, 2025")
 * - Column 3: Opponent (e.g., "vs Carolina Hurricanes")
 * - Column 4: Time (e.g., "7:00 PM ET")
 */

interface RawScheduleRow {
  gameNumber: string;
  date: string;
  opponent: string;
  time: string;
}

/**
 * Simple CSV parser for React Native
 * Handles quoted fields and commas within quotes
 */
function parseCSV(csvContent: string): string[][] {
  const lines = csvContent.split(/\r?\n/);
  const result: string[][] = [];

  for (const line of lines) {
    if (!line.trim()) continue; // Skip empty lines
    
    const row: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quote
          currentField += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    
    // Add last field
    row.push(currentField.trim());
    result.push(row);
  }

  return result;
}

function parseGameNumber(gameNumber: string): { type: 'Preseason' | 'Regular'; number: string } {
  const trimmed = gameNumber.trim().toUpperCase();
  
  if (trimmed.startsWith('PS')) {
    return {
      type: 'Preseason',
      number: trimmed.replace(/^PS\s*/, '').trim()
    };
  }
  
  return {
    type: 'Regular',
    number: trimmed
  };
}

function parseDate(dateStr: string): { month: string; day: string; dateTimeISO: string } {
  // Expected formats: "Sep 29, 2025" or "9/29/25" or "09/29/2025"
  const trimmed = dateStr.trim();
  
  // Try to parse various date formats
  let date: Date;
  
  // Try "Month DD, YYYY" format
  if (trimmed.includes(',')) {
    date = new Date(trimmed);
  } 
  // Try "M/D/YY" or "MM/DD/YYYY" format
  else if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    if (parts.length === 3) {
      let year = parseInt(parts[2]);
      // Convert 2-digit year to 4-digit
      if (year < 100) {
        year += 2000;
      }
      date = new Date(year, parseInt(parts[0]) - 1, parseInt(parts[1]));
    } else {
      throw new Error(`Invalid date format: ${trimmed}`);
    }
  }
  // Try ISO format
  else {
    date = new Date(trimmed);
  }
  
  if (isNaN(date.getTime())) {
    throw new Error(`Could not parse date: ${trimmed}`);
  }
  
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[date.getMonth()];
  const day = date.getDate().toString().padStart(2, '0');
  
  // Create ISO date (assuming 7:00 PM ET = 23:00 UTC)
  const dateTimeISO = date.toISOString().split('T')[0] + 'T23:00:00Z';
  
  return {
    month,
    day,
    dateTimeISO
  };
}

function normalizeOpponent(opponent: string): string {
  // Ensure it starts with "vs " or "@ "
  const trimmed = opponent.trim();
  
  if (trimmed.startsWith('vs ') || trimmed.startsWith('@ ')) {
    return trimmed;
  }
  
  // Default to home game if no prefix
  return `vs ${trimmed}`;
}

function createGame(row: RawScheduleRow, index: number): Game {
  const gameInfo = parseGameNumber(row.gameNumber);
  const dateInfo = parseDate(row.date);
  const opponent = normalizeOpponent(row.opponent);
  
  // Use index+1 as ID to ensure uniqueness
  const id = (index + 1).toString();
  
  return {
    id,
    date: row.date,
    month: dateInfo.month,
    day: dateInfo.day,
    opponent,
    opponentLogo: undefined, // Will be resolved by getOpponentLogo in app
    time: row.time.trim(),
    ticketStatus: 'Available',
    isPaid: false,
    type: gameInfo.type,
    gameNumber: gameInfo.number,
    dateTimeISO: dateInfo.dateTimeISO
  };
}

/**
 * Parse CSV content and convert to Game array
 */
export async function parseScheduleFromCSV(csvContent: string): Promise<Game[]> {
  try {
    const rows = parseCSV(csvContent);
    
    // Skip header row if present
    const dataRows = rows[0] && rows[0][0]?.toLowerCase().includes('game') 
      ? rows.slice(1) 
      : rows;
    
    const games: Game[] = dataRows
      .filter(row => row.length >= 4 && row[0].trim()) // Filter out empty rows
      .map((row, index) => {
        if (row.length < 4) {
          throw new Error(`Row ${index + 1} has insufficient columns (expected 4, got ${row.length})`);
        }
        
        return createGame({
          gameNumber: row[0],
          date: row[1],
          opponent: row[2],
          time: row[3]
        }, index);
      });
    
    return games;
  } catch (error: any) {
    throw new Error(`CSV parsing error: ${error.message}`);
  }
}

/**
 * Parse Excel content and convert to Game array
 */
export async function parseScheduleFromExcel(arrayBuffer: ArrayBuffer): Promise<Game[]> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to array of arrays
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    // Skip header row if present
    const dataRows = rawData[0] && rawData[0][0]?.toLowerCase().includes('game')
      ? rawData.slice(1)
      : rawData;
    
    // Filter out empty rows
    const validRows = dataRows.filter(row => row && row.length >= 4 && row[0]);
    
    const games: Game[] = validRows.map((row, index) => {
      if (row.length < 4) {
        throw new Error(`Row ${index + 1} has insufficient columns (expected 4, got ${row.length})`);
      }
      
      return createGame({
        gameNumber: String(row[0]),
        date: String(row[1]),
        opponent: String(row[2]),
        time: String(row[3])
      }, index);
    });
    
    return games;
  } catch (error: any) {
    throw new Error(`Excel parsing error: ${error.message}`);
  }
}

/**
 * Validate imported schedule
 */
export function validateSchedule(games: Game[]): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (games.length === 0) {
    errors.push('Schedule is empty');
    return { valid: false, errors };
  }
  
  // Check for duplicate IDs
  const ids = games.map(g => g.id);
  const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (duplicateIds.length > 0) {
    errors.push(`Duplicate game IDs found: ${duplicateIds.join(', ')}`);
  }
  
  // Check for required fields
  games.forEach((game, index) => {
    if (!game.gameNumber) {
      errors.push(`Game ${index + 1}: Missing game number`);
    }
    if (!game.date) {
      errors.push(`Game ${index + 1}: Missing date`);
    }
    if (!game.opponent) {
      errors.push(`Game ${index + 1}: Missing opponent`);
    }
    if (!game.time) {
      errors.push(`Game ${index + 1}: Missing time`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}
