const { google } = require('googleapis');
const auth = new google.auth.GoogleAuth({
    keyFile: 'service-account.json',
    scopes: ['https://www.googleapis.com/auth/drive.readonly'],
});

async function listSheets() {
    try {
        const drive = google.drive({ version: 'v3', auth });
        const res = await drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet'",
            fields: 'files(id, name)',
        });
        console.log("Spreadsheets shared with this service account:");
        res.data.files.forEach(file => {
            console.log(`- ${file.name} (ID: ${file.id})`);
        });
    } catch (error) {
        console.error("Error accessing Google Drive:", error.message);
    }
}
listSheets();
