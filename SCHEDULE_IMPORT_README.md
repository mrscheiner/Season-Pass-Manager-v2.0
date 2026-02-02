# Schedule Import Feature

## Overview
The Schedule Import feature allows you to replace your season schedule by uploading a CSV or Excel file. This is useful when you have the schedule in a spreadsheet and want to use it as the "single source of truth" for your season pass data.

## Important Notes
- **Sales data is preserved**: When you import a new schedule, your existing sales data is maintained
- **Unmapped games will lose sales**: If a game in your sales data doesn't match any game in the new schedule, those sales will be orphaned
- **Use unique game IDs**: Each game in the imported schedule gets a unique ID based on its position in the file

## File Format

### CSV Format
Create a CSV file with the following columns (in this exact order):

| Column 1 | Column 2 | Column 3 | Column 4 |
|----------|----------|----------|----------|
| Game Number | Date | Opponent | Time |

### Example CSV:
```csv
Game Number,Date,Opponent,Time
PS 1,Sep 29, 2025,vs Carolina Hurricanes,7:00 PM ET
PS 2,Oct 07, 2025,vs Tampa Bay Lightning,7:00 PM ET
1,Oct 09, 2025,vs Ottawa Senators,7:00 PM ET
2,Oct 11, 2025,vs Pittsburgh Penguins,7:00 PM ET
3,Oct 15, 2025,vs Chicago Blackhawks,7:30 PM ET
```

### Excel Format
Create an Excel file (.xlsx or .xls) with the same column structure as the CSV format. The first row should contain headers, and data should start from the second row.

## Column Details

### 1. Game Number
- **Preseason games**: Use "PS 1", "PS 2", etc.
- **Regular season games**: Use "1", "2", "3", etc.
- Examples: `PS 1`, `PS 2`, `1`, `2`, `3`, `40`

### 2. Date
Supported date formats:
- `Month DD, YYYY` (e.g., "Sep 29, 2025")
- `M/D/YY` (e.g., "9/29/25")
- `MM/DD/YYYY` (e.g., "09/29/2025")

### 3. Opponent
- Format: `vs Team Name` or `@ Team Name`
- If no prefix is provided, it defaults to a home game (`vs`)
- Examples:
  - `vs Carolina Hurricanes`
  - `@ Tampa Bay Lightning`
  - `Boston Bruins` (defaults to `vs Boston Bruins`)

### 4. Time
- Format: Game time with timezone
- Examples:
  - `7:00 PM ET`
  - `6:00 PM ET`
  - `5:00 PM ET`

## How to Use

1. **Navigate to Settings**: Open the Settings tab in your app
2. **Find Import Schedule**: Scroll to the "Import Schedule" button
3. **Select Your File**: Tap the button and choose your CSV or Excel file
4. **Review**: The app will parse the file and show you how many games were found
5. **Confirm**: Review the confirmation dialog showing the number of games
6. **Replace**: Tap "Replace" to update your schedule

## Sample File
A sample schedule file is available at:
- Path: `dev/sample-schedule.csv`
- Contains: 42 games (2 preseason + 40 regular season)
- Team: Florida Panthers 2025-2026 season

## Validation
The import process validates:
- ✅ File contains at least one game
- ✅ Each game has all required fields (game number, date, opponent, time)
- ✅ All game IDs are unique
- ✅ Dates are in valid format
- ✅ Game numbers are properly formatted

## Error Handling
If validation fails, you'll see an error message with details about what went wrong:
- Missing required fields
- Invalid date formats
- Duplicate game IDs
- Insufficient columns

## Technical Details

### File Parsing
- **CSV**: Uses PapaParse library for reliable CSV parsing
- **Excel**: Uses XLSX library to read .xlsx and .xls files
- **Encoding**: Supports UTF-8 encoding for international characters

### Game ID Assignment
- Game IDs are assigned sequentially (1, 2, 3, etc.) based on file order
- This ensures unique IDs and prevents conflicts

### Data Preservation
- All sales data (`salesData`) is preserved during import
- Seat pairs configuration remains unchanged
- Team and league information is maintained

## Tips
1. **Keep a backup**: Before importing, create a backup using "Generate Recovery Code"
2. **Test with small files**: Start with a small schedule to verify the format
3. **Use Excel for editing**: Excel makes it easier to maintain proper formatting
4. **Check opponent names**: Ensure opponent names match NHL team names for logo resolution
5. **Verify dates**: Double-check dates to avoid scheduling conflicts

## Troubleshooting

### "Invalid file type" error
- Make sure your file has a .csv, .xlsx, or .xls extension
- Save from Excel as "CSV (Comma delimited)" or "Excel Workbook"

### "Schedule validation failed" error
- Check that all required columns are present
- Verify date formats match supported formats
- Ensure game numbers are unique and properly formatted

### "Could not parse date" error
- Use one of the supported date formats
- Include the year (4-digit preferred)
- Check for typos in month names

### Sales data missing after import
- Sales are matched by game ID, which changes during import
- If games are reordered, sales may not match
- Always backup before importing

## Future Enhancements
Potential improvements for future versions:
- Support for additional date formats
- Automatic opponent name standardization
- Game ID preservation based on date/opponent matching
- Batch import for multiple season passes
- Schedule preview before replacement
- Partial schedule updates (add/remove individual games)
