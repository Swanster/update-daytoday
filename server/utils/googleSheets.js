const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

/**
 * Google Sheets Integration Utility
 * 
 * SETUP GUIDE:
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select existing one
 * 3. Enable "Google Sheets API"
 * 4. Create Service Account credentials:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "Service Account"
 *    - Fill in name and description
 *    - Grant role: "Viewer" (for read) or "Editor" (for read/write)
 *    - Click "Done"
 * 5. Generate key file:
 *    - Click on the service account email
 *    - Go to "Keys" tab
 *    - Click "Add Key" > "Create new key"
 *    - Choose JSON format
 *    - Download and save as `google-credentials.json` in server/config/
 * 6. Share your Google Sheet with the service account email:
 *    - Open your Google Sheet
 *    - Click "Share" button
 *    - Add the service account email (from JSON file)
 *    - Grant "Editor" access
 * 7. Set environment variable:
 *    - GOOGLE_SHEET_ID=your_sheet_id (from URL)
 *    - GOOGLE_SHEET_RANGE=Sheet1!A:G (or your sheet name)
 */

class GoogleSheetsService {
  constructor() {
    this.auth = null;
    this.sheets = null;
    this.initialized = false;
  }

  /**
   * Initialize Google Sheets API with Service Account
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // Load credentials
      const credentialsPath = path.join(__dirname, '../config/google-credentials.json');
      
      if (!fs.existsSync(credentialsPath)) {
        console.warn('⚠️  Google credentials file not found. Google Sheets sync will not work.');
        console.warn('   Please place google-credentials.json in server/config/ directory.');
        return;
      }

      const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

      // Create JWT client
      this.auth = new google.auth.GoogleAuth({
        keyFile: credentialsPath,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      });

      // Create sheets client
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      this.initialized = true;
      
      console.log('✅ Google Sheets API initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets API:', error.message);
      throw error;
    }
  }

  /**
   * Read data from Google Sheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - Range to read (e.g., "Sheet1!A:G")
   * @returns {Array} Array of row objects
   */
  async readSheet(spreadsheetId, range = 'Sheet1!A:G') {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized. Please check credentials.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId,
        range,
      });

      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        return [];
      }

      // First row is headers
      const headers = rows[0];
      const data = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const rowObj = {};
        
        headers.forEach((header, index) => {
          rowObj[header] = row[index] || '';
        });

        // Add row index for tracking (1-based, excluding header)
        rowObj._rowIndex = i + 1;
        data.push(rowObj);
      }

      return data;
    } catch (error) {
      console.error('Error reading from Google Sheet:', error.message);
      throw new Error(`Failed to read from Google Sheet: ${error.message}`);
    }
  }

  /**
   * Write/update data to Google Sheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - Range to update (e.g., "Sheet1!A2:G5")
   * @param {Array} values - 2D array of values to write
   * @returns {Object} Update result
   */
  async writeToSheet(spreadsheetId, range, values) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized. Please check credentials.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error writing to Google Sheet:', error.message);
      throw new Error(`Failed to write to Google Sheet: ${error.message}`);
    }
  }

  /**
   * Append data to Google Sheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - Range to append to
   * @param {Array} values - 2D array of values to append
   * @returns {Object} Append result
   */
  async appendToSheet(spreadsheetId, range, values) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized. Please check credentials.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.append({
        spreadsheetId,
        range,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error appending to Google Sheet:', error.message);
      throw new Error(`Failed to append to Google Sheet: ${error.message}`);
    }
  }

  /**
   * Clear a range in the sheet
   * @param {string} spreadsheetId - The ID of the spreadsheet
   * @param {string} range - Range to clear
   * @returns {Object} Clear result
   */
  async clearSheet(spreadsheetId, range) {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.sheets) {
      throw new Error('Google Sheets API not initialized. Please check credentials.');
    }

    try {
      const response = await this.sheets.spreadsheets.values.clear({
        spreadsheetId,
        range,
        requestBody: {},
      });

      return response.data;
    } catch (error) {
      console.error('Error clearing Google Sheet:', error.message);
      throw new Error(`Failed to clear Google Sheet: ${error.message}`);
    }
  }

  /**
   * Format date from sheet to ISO format
   * @param {string} dateStr - Date string from sheet
   * @returns {string} ISO date string
   */
  parseSheetDate(dateStr) {
    if (!dateStr) return null;
    
    // Try to parse various date formats
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  /**
   * Format date for sheet display
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date
   */
  formatDateForSheet(date) {
    if (!date) return '';
    
    const d = new Date(date);
    return d.toISOString().split('T')[0]; // YYYY-MM-DD
  }
}

// Singleton instance
const googleSheetsService = new GoogleSheetsService();

module.exports = googleSheetsService;
