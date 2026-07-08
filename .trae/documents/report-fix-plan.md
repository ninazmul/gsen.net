# Report Fix and Improvement Plan

## Issues Identified
1. **Reports only load on tab click**: The Income/Expense/Profit/Category reports don't load initially, only when clicking on their respective tab
2. **CSV export doesn't work**: The `exportToCSV` function in `lib/export-utils.ts` is trying to create an Excel file instead of a proper CSV
3. **Date range filters**: Let's verify the date range filtering is working correctly
4. **Category filters**: Verify category filtering is working

## Files to Modify
1. `app/(root)/reports/components/ReportsClient.tsx`: Fix initial report loading
2. `lib/export-utils.ts`: Fix CSV export function

## Steps
1. **Update ReportsClient**: Add useEffect to load initial reports for the active tab, and ensure all reports load properly when filters change
2. **Fix CSV Export**: Update `exportToCSV` to properly generate and download a CSV file
3. **Test all filters and functionalities**: Verify date range, category, and export functions work correctly

## Expected Outcome
All report tabs load their data automatically on initial page load, CSV exports work properly, and all filters (date range, category) function correctly.
