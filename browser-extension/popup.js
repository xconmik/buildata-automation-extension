let leads = [];
let currentIndex = 0;
let isRunning = false;
let isProcessing = false;
let logRows = [];
const lastGoodZoomData = new Map();
const lastGoodRocketData = new Map();
const invalidEmailStreakByCompany = new Map();
const blockedCompanies = new Set();
const dispotrackerRows = [];
const dispotrackerByDomain = new Map();
const dispotrackerByCompany = new Map();
let dispotrackerLoadAttempted = false;
let dispotrackerLoaded = false;

const csvFileInput = document.getElementById('csvFile');
const fileInfo = document.getElementById('fileInfo');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadLogBtn = document.getElementById('downloadLogBtn');
const status = document.getElementById('status');
const progress = document.getElementById('progress');
const campaignInput = document.getElementById('campaignInput');
const campaignToggle = document.getElementById('campaignToggle');
const toggleLabel = document.getElementById('toggleLabel');
const autoButtonsToggle = document.getElementById('autoButtonsToggle');
const autoButtonsLabel = document.getElementById('autoButtonsLabel');

// Initialize auto buttons toggle label
if (autoButtonsToggle.checked) {
  autoButtonsLabel.textContent = 'ON';
  autoButtonsLabel.style.color = '#2ecc71';
} else {
  autoButtonsLabel.textContent = 'OFF';
  autoButtonsLabel.style.color = '#7f8c8d';
}

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

// Handle auto buttons toggle
autoButtonsToggle.addEventListener('change', () => {
  if (autoButtonsToggle.checked) {
    autoButtonsLabel.textContent = 'ON';
    autoButtonsLabel.style.color = '#2ecc71';
  } else {
    autoButtonsLabel.textContent = 'OFF';
    autoButtonsLabel.style.color = '#7f8c8d';
  }
});

csvFileInput.addEventListener('change', handleFileUpload);
startBtn.addEventListener('click', startAutomation);
stopBtn.addEventListener('click', stopAutomation);
downloadLogBtn.addEventListener('click', downloadLogCsv);

// Check if we're on the right page
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  const tab = tabs[0];
  if (tab.url && tab.url.includes('buildata.pharosiq.com')) {
    showStatus('Ready to automate', 'info');
  } else {
    showStatus('⚠️ Please navigate to buildata.pharosiq.com first', 'error');
  }
});

ensureDispotrackerLoaded();

function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  fileInfo.textContent = `${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const csv = event.target.result;
    leads = parseCSV(csv);
    logRows = [];
    downloadLogBtn.disabled = true;
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

function isTwoLetterToken(token) {
  return /^[A-Za-z]{2}$/.test(token || '');
}

function normalizeToken(token) {
  return String(token || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

function normalizeDomain(rawDomain) {
  if (!rawDomain) return '';
  let value = String(rawDomain).trim().toLowerCase();
  if (!value) return '';
  value = value.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0].trim();
  return value;
}

function normalizeCompanyKey(name) {
  return String(name || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function extractDomainFromText(text) {
  const raw = String(text || '').trim();
  if (!raw) return '';

  const urlLike = raw.match(/(?:https?:\/\/)?(?:www\.)?([a-z0-9.-]+\.[a-z]{2,})(?:\/|$)/i);
  if (urlLike && urlLike[1]) return normalizeDomain(urlLike[1]);

  const emailLike = raw.match(/@([a-z0-9.-]+\.[a-z]{2,})/i);
  if (emailLike && emailLike[1]) return normalizeDomain(emailLike[1]);

  return normalizeDomain(raw);
}

function indexDispotrackerRow(row) {
  const companyName = String(row['COMPANY NAME'] || row['Company Name'] || row.Company || row.company || '').trim();
  if (!companyName) return;

  dispotrackerRows.push({
    companyName,
    normalizedCompany: normalizeCompanyKey(companyName)
  });

  const companyKey = normalizeCompanyKey(companyName);
  if (companyKey && !dispotrackerByCompany.has(companyKey)) {
    dispotrackerByCompany.set(companyKey, companyName);
  }

  const linkDomain = extractDomainFromText(row.links || row.Website || row['Domain or Website'] || '');
  if (linkDomain && !dispotrackerByDomain.has(linkDomain)) {
    dispotrackerByDomain.set(linkDomain, companyName);
  }
}

async function ensureDispotrackerLoaded() {
  if (dispotrackerLoadAttempted) return dispotrackerLoaded;
  dispotrackerLoadAttempted = true;

  const candidatePaths = ['data/dispotracker.csv', 'dispotracker.csv', '../data/dispotracker.csv'];

  for (const relativePath of candidatePaths) {
    try {
      const fileUrl = chrome.runtime.getURL(relativePath);
      const response = await fetch(fileUrl);
      if (!response.ok) continue;

      const csvContent = await response.text();
      const parsedRows = parseCSV(csvContent);
      parsedRows.forEach(indexDispotrackerRow);

      dispotrackerLoaded = dispotrackerRows.length > 0;
      if (dispotrackerLoaded) {
        console.log(`✓ Dispotracker loaded (${dispotrackerRows.length} companies) from ${relativePath}`);
      }
      return dispotrackerLoaded;
    } catch (error) {
      // try next path
    }
  }

  console.warn('⚠️ Dispotracker CSV not found in extension bundle (checked data/dispotracker.csv and dispotracker.csv)');
  return false;
}

function findDispotrackerReference(baseCompany, domain) {
  const normalizedDomain = normalizeDomain(domain);
  if (normalizedDomain && dispotrackerByDomain.has(normalizedDomain)) {
    return dispotrackerByDomain.get(normalizedDomain);
  }

  const normalizedBase = normalizeCompanyKey(baseCompany);
  if (!normalizedBase) return '';

  if (dispotrackerByCompany.has(normalizedBase)) {
    return dispotrackerByCompany.get(normalizedBase);
  }

  if (normalizedBase.length < 4) return '';

  const baseTokens = normalizedBase.split(' ').filter(Boolean);
  const meaningfulBaseTokens = baseTokens.filter(token => token.length > 2);
  if (meaningfulBaseTokens.length === 0) return '';

  let bestMatch = '';
  let bestScore = 0;

  for (const entry of dispotrackerRows) {
    const candidateTokens = entry.normalizedCompany.split(' ').filter(Boolean);
    let overlapCount = 0;
    meaningfulBaseTokens.forEach(token => {
      if (candidateTokens.includes(token)) overlapCount += 1;
    });

    const overlapScore = overlapCount / meaningfulBaseTokens.length;
    if (overlapScore > bestScore && overlapScore >= 0.8) {
      bestScore = overlapScore;
      bestMatch = entry.companyName;
    }
  }

  return bestMatch;
}

function resolveCompanyName(baseCompany, referenceCompany) {
  const base = String(baseCompany || '').trim();
  const reference = String(referenceCompany || '').trim();

  if (!base) return reference;
  if (!reference) return base;

  const baseTokens = base.split(/\s+/).filter(Boolean);
  const refTokens = reference.split(/\s+/).filter(Boolean);

  if (baseTokens.length === 1 && isTwoLetterToken(baseTokens[0])) {
    return reference;
  }

  if (baseTokens.length === refTokens.length) {
    let diffCount = 0;
    let replaceableDiff = false;

    for (let index = 0; index < baseTokens.length; index++) {
      const left = normalizeToken(baseTokens[index]);
      const right = normalizeToken(refTokens[index]);
      if (left !== right) {
        diffCount += 1;
        if (isTwoLetterToken(baseTokens[index])) {
          replaceableDiff = true;
        }
      }
    }

    if (diffCount === 1 && replaceableDiff) {
      return reference;
    }
  }

  return base;
}

function getCompanyName(lead) {
  const baseCompany = lead.Company || lead.company || lead.Column_5_Text || '';
  const domain = lead['Domain or Website'] || lead.domain || '';
  const referenceCompany = lead['COMPANY NAME'] || lead['Company Name'] || findDispotrackerReference(baseCompany, domain) || '';
  return resolveCompanyName(baseCompany, referenceCompany);
}

function companyKey(name) {
  const key = normalizeCompanyKey(name);
  return key || '__unknown_company__';
}

async function startAutomation() {
  if (isRunning || isProcessing) {
    showStatus('Automation already running...', 'info');
    return;
  }
  if (leads.length === 0) {
    showStatus('Please upload a CSV file first', 'error');
    return;
  }

  await ensureDispotrackerLoaded();
  
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
  downloadLogBtn.disabled = logRows.length === 0;
  showStatus('Automation started...', 'info');
  
  processNextLead();
}

function stopAutomation() {
  isRunning = false;
  startBtn.disabled = false;
  stopBtn.disabled = true;
  downloadLogBtn.disabled = logRows.length === 0;
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
  if (isProcessing) {
    console.warn('⚠️ Lead processing already in progress. Skipping duplicate call.');
    return;
  }
  isProcessing = true;

  const lead = leads[currentIndex];
  updateProgress();

  const domain = lead['Domain or Website'] || lead.domain || '';
  const company = getCompanyName(lead);
  const companyId = companyKey(company);

  if (blockedCompanies.has(companyId)) {
    logLeadResult(lead, 'SKIPPED_COMPANY', 'Company blocked due to email check policy');
    currentIndex++;
    isProcessing = false;
    if (isRunning && currentIndex < leads.length) {
      setTimeout(() => processNextLead(), 300);
    } else {
      showStatus('All leads processed!', 'success');
      stopAutomation();
    }
    return;
  }

  let zoomData = { phone: '', headquarters: '', employees: '', revenue: '', industry: '', zoomInfoUrl: '' };
  let rocketData = { email: '' };
  try {
    // Step 1: Scrape ZoomInfo
    if (!isRunning) { isProcessing = false; return; }
    showStatus(`Scraping ZoomInfo for ${company || domain}...`, 'info');
    zoomData = await scrapeZoomInfo(domain);
    if (!isRunning) { isProcessing = false; return; }
    if (zoomData && (zoomData.phone || zoomData.headquarters || zoomData.employees || zoomData.revenue || zoomData.industry)) {
      lastGoodZoomData.set(domain, zoomData);
    } else if (lastGoodZoomData.has(domain)) {
      console.log('Using cached ZoomInfo data in popup for:', domain);
      zoomData = lastGoodZoomData.get(domain);
    }
    await sleep(2000);
    if (!isRunning) { isProcessing = false; return; }

    // Step 2: Scrape RocketReach
    showStatus(`Scraping RocketReach for ${company || domain}...`, 'info');
    rocketData = await scrapeRocketReach(domain);
    if (!isRunning) { isProcessing = false; return; }
    if (rocketData && rocketData.email) {
      lastGoodRocketData.set(domain, rocketData);
    } else if (lastGoodRocketData.has(domain)) {
      console.log('Using cached RocketReach data in popup for:', domain);
      rocketData = lastGoodRocketData.get(domain);
    }
    await sleep(2000);
    if (!isRunning) { isProcessing = false; return; }
  } catch (error) {
    console.error('Scrape error:', error);
    logLeadResult(lead, 'ERROR', error.message || 'Scrape failed');
    showStatus('Error scraping data. Check console for details.', 'error');
    isProcessing = false;
    stopAutomation();
    return;
  }

  // Get campaign name from input only if toggle is ON
  let campaignName = '';
  if (campaignToggle.checked) {
    campaignName = campaignInput.value.trim();
  }

  // Merge scraped data with CSV data
  const enrichedLead = {
    ...lead,
    resolvedCompanyName: company,
    campaignName: campaignName, // Will be empty string if toggle is OFF
    autoButtonsEnabled: autoButtonsToggle.checked,
    scrapedPhone: zoomData.phone,
    scrapedHeadquarters: zoomData.headquarters,
    scrapedEmployees: zoomData.employees,
    scrapedRevenue: zoomData.revenue,
    scrapedIndustry: zoomData.industry,
    scrapedZoomInfoUrl: zoomData.zoomInfoUrl,
    scrapedEmail: rocketData.email
  };

  // Step 3: Fill Buildata form
  if (!isRunning) { isProcessing = false; return; }
  showStatus(`Filling form for ${company || domain}...`, 'info');
  chrome.runtime.sendMessage({
    action: 'fillBuildataForm',
    data: enrichedLead
  }, (response) => {
    if (!isRunning) { isProcessing = false; return; }
    if (chrome.runtime.lastError || !response || response.status === 'error') {
      console.error('Fill error:', chrome.runtime.lastError || response);
      logLeadResult(lead, 'ERROR', (response && response.message) || (chrome.runtime.lastError && chrome.runtime.lastError.message) || 'Unknown error');
      showStatus('Error filling form. Check console for details.', 'error');
      isProcessing = false;
      stopAutomation();
      return;
    }

    const outcome = String(response.emailCheckOutcome || '').toLowerCase();
    const outcomeMessage = response.emailCheckMessage || '';

    if (outcome === 'hard-invalid') {
      blockedCompanies.add(companyId);
      invalidEmailStreakByCompany.set(companyId, 5);
      logLeadResult(lead, 'HARD_INVALID', outcomeMessage || 'Restricted + proofpoint protected; blocking company immediately');
      showStatus(`Blocked company: ${company}`, 'info');
      currentIndex++;
      isProcessing = false;
      if (isRunning && currentIndex < leads.length) {
        setTimeout(() => processNextLead(), 500);
      } else {
        showStatus('All leads processed!', 'success');
        stopAutomation();
      }
      return;
    }

    if (outcome === 'invalid') {
      const nextCount = (invalidEmailStreakByCompany.get(companyId) || 0) + 1;
      invalidEmailStreakByCompany.set(companyId, nextCount);

      if (nextCount >= 5) {
        blockedCompanies.add(companyId);
        logLeadResult(lead, 'INVALID_5_BLOCK', `Invalid email streak reached 5 (${outcomeMessage || 'Invalid Email'})`);
        showStatus(`Blocked company after 5 invalid emails: ${company}`, 'info');
      } else {
        logLeadResult(lead, 'INVALID_EMAIL', `${outcomeMessage || 'Invalid Email'} (${nextCount}/5)`);
      }

      currentIndex++;
      isProcessing = false;
      if (isRunning && currentIndex < leads.length) {
        setTimeout(() => processNextLead(), 500);
      } else {
        showStatus('All leads processed!', 'success');
        stopAutomation();
      }
      return;
    }

    if (outcome === 'retry') {
      logLeadResult(lead, 'RETRY_NEXT_PERSON', outcomeMessage || 'Email cannot be verified at this time');
      currentIndex++;
      isProcessing = false;
      if (isRunning && currentIndex < leads.length) {
        setTimeout(() => processNextLead(), 500);
      } else {
        showStatus('All leads processed!', 'success');
        stopAutomation();
      }
      return;
    }

    if (outcome === 'valid') {
      invalidEmailStreakByCompany.delete(companyId);
    }

    logLeadResult(lead, 'SUCCESS', '');

    currentIndex++;
    isProcessing = false;
    if (isRunning && currentIndex < leads.length) {
      setTimeout(() => processNextLead(), 3000); // Wait 3 seconds before next lead
    } else if (!isRunning) {
      showStatus('Automation stopped', 'info');
      startBtn.disabled = false;
      stopBtn.disabled = true;
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
      resolve(response || { phone: '', headquarters: '', employees: '', revenue: '', industry: '' });
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

function logLeadResult(lead, statusValue, message) {
  const domain = lead['Domain or Website'] || lead.domain || '';
  const company = getCompanyName(lead);
  const name = lead['First Name, Last Name'] || lead.firstNameLastName || '';
  const timestamp = new Date().toISOString();

  logRows.push({
    timestamp,
    status: statusValue,
    company,
    domain,
    name,
    message
  });

  downloadLogBtn.disabled = logRows.length === 0;
}

function downloadLogCsv() {
  if (logRows.length === 0) return;

  const headers = ['Timestamp', 'Status', 'Company', 'Domain', 'Name', 'Message'];
  const lines = [headers.join(',')];

  logRows.forEach(row => {
    const values = [
      row.timestamp,
      row.status,
      row.company,
      row.domain,
      row.name,
      row.message
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    lines.push(values.join(','));
  });

  const csvContent = lines.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `buildata_log_${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
