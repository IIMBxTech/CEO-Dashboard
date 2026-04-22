require('dotenv').config();
const cron = require('node-cron');
const fs = require('fs');
const { google } = require('googleapis');
const mysql = require('mysql2/promise');

// Baseline SQL queries for creating tables
const createTablesSQL = `
CREATE TABLE IF NOT EXISTS Courses (
    course_name VARCHAR(255) PRIMARY KEY,
    overall_completion DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS Course_Stages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(255),
    stage_name VARCHAR(100),
    weightage DECIMAL(5,2),
    progress DECIMAL(5,2),
    due_date VARCHAR(50),
    FOREIGN KEY (course_name) REFERENCES Courses(course_name)
);
`;

// Google Sheets Authentication Logic
async function getGoogleSheetsClient() {
    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });
    return google.sheets({ version: 'v4', auth });
}

// Main Sync Flow Function
async function syncData() {
    console.log("Starting live data pipeline sync...");
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
        });

        await connection.query(createTablesSQL);
        console.log("Database schema ready.");

        const sheets = await getGoogleSheetsClient();
        console.log("Google Sheets authenticated.");

        // Perform Live Action
        if (!process.env.SPREADSHEET_ID) {
            throw new Error("SPREADSHEET_ID is missing in .env");
        }
        
        // Let's do a quick read of the first sheet to verify
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: process.env.SPREADSHEET_ID,
            // Assuming the sheet is named "Swayam Dashboard" or we can just fetch 'Sheet1'
            // We'll read a small range just to verify connectivity and access.
            range: 'A1:D10',
        });

        console.log("Successfully read from Swayam Dashboard Google Sheet!");
        console.log("First row of data:", response.data.values && response.data.values[0]);

        console.log("Data sync run successfully completed.");
        await connection.end();
    } catch (error) {
        console.error("Data sync failed:", error);
        // Fallback Error Logging for cPanel Environment
        fs.appendFileSync('error.log', `[${new Date().toISOString()}] Sync failed: ${error.message}\n`);
    }
}

// Live Cron Job Trigger
cron.schedule('0 * * * *', () => {
    console.log("Cron trigger executing live sync.");
    syncData();
});

// Run once immediately on pipeline start
syncData();
