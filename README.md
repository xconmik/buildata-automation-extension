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

## For Installation Guide contact me on my email a6mist@gmail.com

### 1. Clone Repository
```bash
git clone https://github.com/xconmik/buildata-automation-extension.git
cd buildata-automation-extension
```
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
