# Buildata Automation Browser Extension

A Chrome/Brave browser extension that automates form filling on Buildata (PharosIQ) with data enrichment from ZoomInfo and RocketReach.

## Features

### Core Automation
- **CSV Upload**: Upload CSV files with lead data for batch processing
- **Sequential Processing**: Processes each row automatically (ZoomInfo → RocketReach → Form Fill)
- **Campaign Toggle**: Enable/disable campaign selection with ON/OFF switch
- **Undetectable**: Uses browser extension approach to avoid automation detection

### Data Enrichment
- **ZoomInfo Scraping**: Automatically extracts company data
  - Employee count
  - Revenue
  - Phone number
  - Headquarters address
- **RocketReach Scraping**: Finds contact information
  - Email addresses
  - Social profiles
- **Email Construction**: Builds emails from CSV first/last names (e.g., `firstname.lastname@domain.com`)

### Form Filling
Populates 40+ Buildata form fields including:
- **Contact Info**: Email, Names, Title, Phone
- **Company Data**: Domain, Company Name, LinkedIn URL
- **Metrics**: Employee Range, Revenue Range, SIC/NAICS Codes
- **Classification**: Industry, Sub Industry, Seniority, Department, Function
- **Location**: Street Address, City, State, Zip Code, Country
- **Verification**: 3 verification link fields

### Smart Features
- **Data Conversion**: Maps ZoomInfo formats to Buildata dropdowns
  - `"10K+"` employees → Dropdown value `"8"`
  - `"$6.8 Billion"` revenue → Dropdown value `"7"`
- **Button Automation**: 
  - Click "Check Email" button after email entry
  - Click "Check Suppression" button after domain entry
  - Click "Check Duplicates" button after contact link entry
- **Modal Handling**: Automatically dismisses validation modals
- **Duplicate Prevention**: Refined typing with 50ms delays to prevent character duplication
- **Fallback Selectors**: Multiple selector strategies for robust field detection

## Installation

### 1. Clone Repository
```bash
git clone https://github.com/xconmik/buildata-automation-extension.git
cd buildata-automation-extension
```

### 2. Load Extension in Browser

#### Chrome/Brave
1. Open `chrome://extensions/` (or `brave://extensions/`)
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. Extension icon will appear in toolbar

### 3. Pin Extension
- Click the puzzle icon in toolbar
- Find "Buildata Automation"
- Click the pin icon to keep it visible

## Usage

### Step 1: Prepare CSV File
Create a CSV file with these columns:
```
First Name, Last Name,Domain or Website,Email Address,Company Linkedin URL,Contact Link,Title,SIC Code,NAICS Code,Industry,Sub Industry,Seniority Level,Department,Function,Specialty,Street Address,City,State,Zip Code,Country,Comments
```

**Required columns**:
- `First Name, Last Name` (comma or space separated)
- `Domain or Website` (e.g., `bechtle.com`)

**Optional columns**: All others (CSV values override scraped data)

### Step 2: Configure Extension
1. Click extension icon in toolbar
2. **Campaign Name**: 
   - Toggle ON: Enter campaign name (e.g., "397618")
   - Toggle OFF: Skip campaign selection
3. Click "Upload CSV" and select your file
4. File info will display (e.g., "25 leads loaded")

### Step 3: Open Buildata
1. Navigate to `https://buildata.pharosiq.com`
2. Log in to your account
3. Go to the lead entry form

### Step 4: Start Automation
1. Click "Start" button in extension popup
2. Watch progress counter (e.g., "Processing 1 of 25...")
3. Monitor browser console for detailed logs:
   - `✓` = Success
   - `❌` = Field not found
   - `⚠️` = Warning/Modal

### Step 5: Pause/Stop
- Click "Stop" to pause processing
- Click "Start" again to resume from current lead
- Reload extension to reset

## File Structure

```
browser-extension/
├── manifest.json          # Extension configuration (Manifest V3)
├── popup.html            # Extension UI
├── popup.js              # Workflow orchestration
├── content.js            # Form filling logic
├── background.js         # Tab management & scraping
├── scraper.js            # ZoomInfo/RocketReach extraction
└── icon*.png             # Extension icons

src/                      # TypeScript source files (legacy Playwright)
data/                     # Sample CSV files
```

## Configuration

### Campaign Selection
The campaign toggle controls whether the extension fills the campaign field:

**Toggle ON (Green)**:
- Campaign name is required
- Extension will search and select campaign
- Types campaign name → clicks first result → loads specifications

**Toggle OFF (Gray)**:
- Campaign field is skipped
- Automation starts immediately after clicking "Start"

### Data Priority
For each field, the extension uses this priority:

1. **Email**: 
   - Constructed from CSV names (`firstname.lastname@domain.com`)
   - CSV "Email Address" column
   - RocketReach scraped email

2. **Phone**:
   - ZoomInfo scraped phone
   - CSV "Phone" column

3. **Company Data**:
   - CSV columns
   - ZoomInfo scraped data

4. **Address**:
   - ZoomInfo headquarters
   - CSV address columns

## Troubleshooting

### Campaign Selection Fails
- **Error**: "Search input not found"
- **Fix**: Extension now uses 4+ fallback selectors; reload page and try again

### Duplicate Characters in Fields
- **Issue**: Text appears doubled (e.g., `hhttttppss`)
- **Fix**: Latest version uses 50ms typing delays to prevent this

### Address Fields Empty
- **Cause**: CSV doesn't have City/State/Zip data
- **Fix**: Add address columns to CSV or leave them blank

### Modals Appearing
The extension auto-dismisses these modals:
- "Check Email" → "Please select campaign"
- "Check Suppression" → "Invalid format"
- "Check Contact Link" → "No problem, you can use this link"

If modal blocks automation, click OK manually and report the modal title.

### Scraping Fails
- **ZoomInfo**: Ensure Google search returns ZoomInfo company page
- **RocketReach**: Verify domain has RocketReach profile
- Extension logs scraping errors to console

## Development

### Prerequisites
- Node.js 18+ (for TypeScript compilation)
- Chrome/Brave browser

### Build Extension
```bash
npm install
npm run build
```

### Debug Mode
Open browser console (F12) on Buildata page to see detailed logs:
```
========== CAMPAIGN SELECTION START ==========
✓ Campaign button found
✓ Found search input, typing campaign...
✓ Clicking first item: "397618"
...
✓✓✓ FORM FILLING COMPLETED ✓✓✓
```

## Technical Details

### Data Conversion Logic

**Employee Count**:
- `10K+` → 10000 → Value `8` (More than 10000)
- `5K-10K` → 7500 → Value `7` (5001-10000)
- `2K-5K` → 3500 → Value `6` (2001-5000)

**Revenue**:
- `$6.8 Billion` → 6800M → Value `7` ($1B-$10B)
- `$500M-$1B` → 750M → Value `6`
- `$100M-$500M` → 300M → Value `5`

**Phone Parsing**:
- Input: `"+49 4971329810"`
- Code: `"49"` → Dropdown
- Number: `"4971329810"` → Text field

### Timing Configuration
- Campaign button → 1500ms wait
- Search input focus → 500ms wait
- Character typing → 50ms delay
- Dropdown selection → 1500ms wait
- Button clicks → 2000ms wait
- Modal dismissal → 1000ms wait

## Security & Privacy

- **No External Servers**: All processing happens locally in your browser
- **No Data Storage**: CSV data stays in browser memory (cleared on reload)
- **No Credentials**: Extension doesn't store login information
- **Permissions**: Only accesses specified domains (Buildata, ZoomInfo, RocketReach)

## License

This project is for educational and automation purposes. Ensure compliance with terms of service for Buildata, ZoomInfo, and RocketReach.

## Support

For issues or feature requests:
1. Check browser console for error logs
2. Verify CSV format matches required columns
3. Open GitHub issue with error details and screenshots

## Changelog

### Latest Updates
- ✅ Fixed campaign search input detection (4+ fallback selectors)
- ✅ Eliminated character duplication (50ms typing delays)
- ✅ Added modal auto-dismiss for all validation buttons
- ✅ Enhanced address field detection with label-text matching
- ✅ Campaign toggle switch for optional campaign selection
- ✅ Check Email/Suppression/Duplicates button automation

### Core Features
- ✅ CSV upload and batch processing
- ✅ ZoomInfo/RocketReach sequential scraping
- ✅ Email construction from CSV names
- ✅ 40+ form fields with dropdowns
- ✅ Data conversion for employees/revenue
- ✅ Phone number parsing and formatting
