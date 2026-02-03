let leads = [];
let currentIndex = 0;
let isRunning = false;

const csvFileInput = document.getElementById('csvFile');
const fileInfo = document.getElementById('fileInfo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const campaignInput = document.getElementById('campaignInput');
const campaignToggle = document.getElementById('campaignToggle');
const toggleLabel = document.getElementById('toggleLabel');

// Helper function for delays
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Handle campaign toggle
campaignToggle.addEventListener('change', () => {
  if (campaignToggle.checked) {
    campaignInput.disabled = false;
    toggleLabel.textContent = 'ON';
    toggleLabel.style.color = '#2ecc71';
    campaignInput.focus();
  } else {
    campaignInput.disabled = true;
    toggleLabel.textContent = 'OFF';
    toggleLabel.style.color = '#7f8c8d';
  }
});

csvFileInput.addEventListener('change', handleFileUpload);
startBtn.addEventListener('click', startAutomation);
stopBtn.addEventListener('click', stopAutomation);

// Check if we're on the right page
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  const tab = tabs[0];
  if (tab.url && tab.url.includes('buildata.pharosiq.com')) {
    showStatus('Ready to automate', 'info');
  } else {
    showStatus('⚠️ Please navigate to buildata.pharosiq.com first', 'error');
  }
});

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const csv = event.target.result;
    leads = parseCSV(csv);
    showStatus(`Loaded ${leads.length} leads`, 'success');
    startBtn.disabled = false;
    currentIndex = 0;
    updateProgress();
  };
  reader.readAsText(file);
}

function parseCSV(csv) {
  const lines = csv.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];
  
  // Parse headers - handle quoted fields properly
  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);
  const data = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (values[index] || '').trim();
    });
    data.push(row);
  }
  
  return data;
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        i++; // Skip next quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function startAutomation() {
  if (leads.length === 0) {
    showStatus('Please upload a CSV file first', 'error');
    return;
  }
  
  // Check if campaign toggle is ON and validate campaign name
  if (campaignToggle.checked) {
    const campaignName = campaignInput.value.trim();
    if (!campaignName) {
      showStatus('Please enter a Campaign Name or turn OFF the campaign toggle', 'error');
      return;
    }
  }
  
  isRunning = true;
  startBtn.disabled = true;
  stopBtn.disabled = false;
  showStatus('Automation started...', 'info');
  
  processNextLead();
}

function stopAutomation() {
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  showStatus('Automation stopped', 'info');
}

async function processNextLead() {
  if (!isRunning || currentIndex >= leads.length) {
    if (currentIndex >= leads.length) {
      showStatus('All leads processed!', 'success');
      startBtn.disabled = true;
      stopBtn.disabled = true;
    }
    return;
  }
  
  const lead = leads[currentIndex];
  updateProgress();
  
  const domain = lead['Domain or Website'] || lead.domain || '';
  const company = lead.Company || lead.company || '';
  
  // Step 1: Scrape ZoomInfo
  showStatus(`Scraping ZoomInfo for ${company || domain}...`, 'info');
  const zoomData = await scrapeZoomInfo(domain);
  await sleep(2000);
  
  // Step 2: Scrape RocketReach
  showStatus(`Scraping RocketReach for ${company || domain}...`, 'info');
  const rocketData = await scrapeRocketReach(domain);
  await sleep(2000);
  
  // Get campaign name from input only if toggle is ON
  let campaignName = '';
  if (campaignToggle.checked) {
    campaignName = campaignInput.value.trim();
  }
  
  // Merge scraped data with CSV data
  const enrichedLead = {
    ...lead,
    campaignName: campaignName, // Will be empty string if toggle is OFF
    scrapedPhone: zoomData.phone,
    scrapedHeadquarters: zoomData.headquarters,
    scrapedEmployees: zoomData.employees,
    scrapedRevenue: zoomData.revenue,
    scrapedZoomInfoUrl: zoomData.zoomInfoUrl,
    scrapedEmail: rocketData.email
  };
  
  // Step 3: Fill Buildata form
  showStatus(`Filling form for ${company || domain}...`, 'info');
  chrome.runtime.sendMessage({
    action: 'fillBuildataForm',
    data: enrichedLead
  }, (response) => {
    if (chrome.runtime.lastError || !response || response.status === 'error') {
      console.error('Fill error:', chrome.runtime.lastError || response);
      showStatus('Error filling form. Check console for details.', 'error');
      stopAutomation();
      return;
    }
    
    currentIndex++;
    if (currentIndex < leads.length) {
      setTimeout(() => processNextLead(), 3000); // Wait 3 seconds before next lead
    } else {
      showStatus('All leads processed!', 'success');
      stopAutomation();
    }
  });
}

async function scrapeZoomInfo(domain) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ 
      action: 'scrapeZoomInfo', 
      domain 
    }, (response) => {
      resolve(response || { phone: '', headquarters: '', employees: '', revenue: '' });
    });
  });
}

async function scrapeRocketReach(domain) {
  return new Promise((resolve) => {
    const lead = leads[currentIndex];
    const firstLast = (lead['First Name, Last Name'] || lead.firstNameLastName || '').split(/,| /).map(s => s.trim()).filter(Boolean);
    const firstName = firstLast[0] || '';
    const lastName = firstLast.length > 1 ? firstLast[firstLast.length - 1] : '';
    
    chrome.runtime.sendMessage({ 
      action: 'scrapeRocketReach', 
      domain,
      firstName,
      lastName
    }, (response) => {
      resolve(response || { email: '' });
    });
  });
}

function updateProgress() {
  progress.textContent = `Processing: ${currentIndex + 1} / ${leads.length}`;
}

function showStatus(message, type) {
  status.textContent = message;
  status.className = `status ${type}`;
}
