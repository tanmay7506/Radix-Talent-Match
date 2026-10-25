/**
 * RADIX Talent Check — Main Application
 *
 * Automatically connects to Profile Builder (candidate data) and
 * Company Skillsets (company requirements JSON). No manual typing required.
 */

import {
  getHealth,
  getCompanySkillsets,
  getProfileBuilderCandidate,
  talentCheck,
  talentCheckAll,
  talentCheckAnalyze,
  talentCheckAllAnalyze,
  ApiError,
} from './api.js';

// ─── State ────────────────────────────────────────────────────────
let chartInstances = [];     // Track Chart.js instances for cleanup
let activeCandidate = null;   // Active candidate object from Profile Builder
let companyData = null;       // Companies dictionary from company_skillsets.json
let skillRowCounter = 0;

// ─── DOM references ───────────────────────────────────────────────
const $ = id => document.getElementById(id);
const sections = {
  assessment: $('assessment'),
  results:    $('results'),
  analysis:   $('analysis'),
};

// ─── Initialisation ───────────────────────────────────────────────
async function initApp() {
  initNav();
  initModeSelector();
  initProfileBuilderUI();
  initForm();
  initHealthCheck();
  showSection('assessment');

  // 1. Dynamically load companies from JSON
  await loadCompanies();

  // 2. Automatically load candidate profile from Profile Builder
  await autoLoadCandidateProfile();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// ─── Navigation ───────────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      showSection(link.dataset.nav);
    });
  });
  $('backToFormBtn')?.addEventListener('click', () => showSection('assessment'));
  $('viewAnalysisBtn')?.addEventListener('click', () => showSection('analysis'));
  $('backToResultsBtn')?.addEventListener('click', () => showSection('results'));
  $('backToFormFromAnalysisBtn')?.addEventListener('click', () => showSection('assessment'));
  $('runAnalysisNowBtn')?.addEventListener('click', () => triggerRunMode('single-analyze'));
  $('runAllAnalysisNowBtn')?.addEventListener('click', () => triggerRunMode('all-analyze'));
}

function triggerRunMode(targetMode) {
  const radio = document.querySelector(`input[name="mode"][value="${targetMode}"]`);
  if (radio) {
    radio.checked = true;
    radio.dispatchEvent(new Event('change'));
  }
  if (typeof $('assessmentForm').requestSubmit === 'function') {
    $('assessmentForm').requestSubmit();
  } else {
    $('assessmentForm').dispatchEvent(new Event('submit', { cancelable: true }));
  }
}

function showSection(name) {
  Object.entries(sections).forEach(([key, el]) => {
    if (!el) return;
    el.classList.remove('hidden');
    el.classList.toggle('active', key === name);
  });
  document.querySelectorAll('[data-nav]').forEach(link => {
    link.classList.toggle('active', link.dataset.nav === name);
  });
}

// ─── Health Check ─────────────────────────────────────────────────
function initHealthCheck() {
  checkHealth();
  $('healthRefresh').addEventListener('click', checkHealth);
}

async function checkHealth() {
  const dot  = $('healthDot');
  const text = $('healthText');
  dot.className  = 'health-dot loading';
  text.textContent = 'Checking…';
  try {
    const data = await getHealth();
    const isOk = data?.status === 'ok';
    dot.className  = `health-dot ${isOk ? 'ok' : 'error'}`;
    text.textContent = isOk ? 'API online' : `Unexpected: ${data?.status}`;
  } catch {
    dot.className  = 'health-dot error';
    text.textContent = 'API offline';
  }
}

// ─── Company Selector (Dynamic from data/company_skillsets.json) ──
async function loadCompanies() {
  const select = $('companySelect');
  const hint   = $('companyHint');

  try {
    const data = await getCompanySkillsets();
    companyData = data?.companies ?? {};
    const companyNames = Object.keys(companyData);

    if (companyNames.length === 0) {
      select.innerHTML = '<option value="">No companies found in JSON file</option>';
      hint.textContent = 'No companies found in company_skillsets.json.';
      return;
    }

    select.innerHTML = '';
    companyNames.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });

    hint.innerHTML = `Loaded <strong>${companyNames.length}</strong> companies dynamically from <code>data/company_skillsets.json</code>.`;
  } catch (err) {
    select.innerHTML = '<option value="">Failed to load companies</option>';
    hint.textContent = `Error loading company requirements: ${err.message}`;
  }
}

// ─── Mode selector ────────────────────────────────────────────────
function initModeSelector() {
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', () => updateCompanySelector());
  });
  updateCompanySelector();
}

function getMode() {
  return document.querySelector('input[name="mode"]:checked')?.value ?? 'single';
}

function updateCompanySelector() {
  const mode = getMode();
  const isSingle = mode === 'single' || mode === 'single-analyze';
  $('companySelector').style.display = isSingle ? 'block' : 'none';
}

// ─── Profile Builder Integration ──────────────────────────────────
function initProfileBuilderUI() {
  const fileInput = $('pbFileInput');
  const importBtn = $('importPbJsonBtn');
  const reloadBtn = $('reloadPbBtn');
  const toggleBtn = $('toggleFormDetailsBtn');

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target.result);
        applyCandidateProfile(parsed, `Imported file: ${file.name}`);
      } catch (err) {
        alert(`Failed to parse candidate JSON: ${err.message}`);
      }
    };
    reader.readAsText(file);
  });

  reloadBtn.addEventListener('click', () => autoLoadCandidateProfile());

  toggleBtn.addEventListener('click', () => {
    const card = $('candidateDetailsCard');
    const isHidden = card.classList.contains('hidden');
    card.classList.toggle('hidden');
    toggleBtn.textContent = isHidden ? '🙈 Hide Details' : '✏️ View/Edit Details';
  });

  $('addSkillBtn').addEventListener('click', () => addSkillRow());
}

async function autoLoadCandidateProfile() {
  const badge = $('pbStatusBadge');
  badge.className = 'pb-badge loading';
  badge.textContent = 'Loading Profile Builder data...';

  try {
    const profile = await getProfileBuilderCandidate();
    applyCandidateProfile(profile, 'Profile Builder (data/test_candidate_profile.json)');
  } catch (err) {
    badge.className = 'pb-badge';
    badge.style.background = 'var(--danger-bg)';
    badge.style.color = 'var(--danger)';
    badge.textContent = 'Profile Builder offline (Manual input available)';
    $('pbCandName').textContent = 'No Profile Builder candidate loaded';
    $('pbCandMeta').textContent = 'Use "Import Profile JSON" or fill in the details below.';
  }
}

function applyCandidateProfile(profile, sourceDescription) {
  activeCandidate = profile;

  // Extract candidate profile if wrapped
  const cand = profile.profile || profile.candidate_profile || profile;

  // 1. Update summary card
  $('pbCandName').textContent = cand.name || 'Unnamed Candidate';

  const eduStr = typeof cand.education === 'object' && cand.education
    ? `${cand.education.degree || ''} ${cand.education.college && cand.education.college !== 'Not specified' ? `· ${cand.education.college}` : ''} ${cand.education.graducation_year ? `(${cand.education.graducation_year})` : ''} ${cand.education.cgpa ? `· CGPA: ${cand.education.cgpa}` : ''}`.trim()
    : (cand.education || '');

  $('pbCandMeta').textContent = `${cand.email || ''} ${eduStr ? `· ${eduStr}` : ''}`;

  const skills = Array.isArray(cand.skills) ? cand.skills : [];
  const assessedSkills = skills.filter(s => s.skill_level !== undefined || s.level !== undefined);

  $('pbAssessedCounts').innerHTML = `
    <span class="stat-pill green">${skills.length} skills listed</span>
    <span class="stat-pill blue">${assessedSkills.length} assessed levels</span>
  `;

  // Chips
  const chipsRow = $('pbChipsRow');
  chipsRow.innerHTML = '';

  if (cand.preferred_roles?.length) {
    const roleChip = document.createElement('span');
    roleChip.className = 'pb-chip';
    roleChip.innerHTML = `<strong>Role:</strong> ${esc(cand.preferred_roles.join(', '))}`;
    chipsRow.appendChild(roleChip);
  }

  if (cand.hackathons?.length) {
    const hChip = document.createElement('span');
    hChip.className = 'pb-chip';
    hChip.innerHTML = `<strong>Hackathons:</strong> ${cand.hackathons.length}`;
    chipsRow.appendChild(hChip);
  }

  if (cand.internships?.length) {
    const iChip = document.createElement('span');
    iChip.className = 'pb-chip';
    iChip.innerHTML = `<strong>Internships:</strong> ${cand.internships.length}`;
    chipsRow.appendChild(iChip);
  }

  const badge = $('pbStatusBadge');
  badge.className = 'pb-badge';
  badge.textContent = `✅ Connected: ${sourceDescription}`;

  // 2. Pre-fill form fields (for inspection or manual tweaking)
  $('fieldName').value = cand.name || '';
  $('fieldEmail').value = cand.email || '';
  $('fieldEducation').value = eduStr || (typeof cand.education === 'string' ? cand.education : '');
  $('fieldRoles').value = Array.isArray(cand.preferred_roles) ? cand.preferred_roles.join(', ') : '';
  $('fieldHackathons').value = Array.isArray(cand.hackathons) ? cand.hackathons.join('\n') : '';
  $('fieldInternships').value = Array.isArray(cand.internships) ? cand.internships.join('\n') : '';
  $('fieldCertifications').value = Array.isArray(cand.certifications) ? cand.certifications.join('\n') : '';

  // 3. Populate skill rows
  $('skillsList').innerHTML = '';
  skills.forEach(s => {
    const evText = Array.isArray(s.evidence) ? s.evidence.join('; ') : (s.evidence || '');
    addSkillRow({
      skill_name: s.skill_name || s.name || '',
      category_code: s.skill_code || s.category_code || '',
      level: s.skill_level !== undefined ? s.skill_level : s.level,
      evidence: evText,
      confidence: (s.confidence || 'medium').toLowerCase(),
    });
  });
}

// ─── Skills manager ───────────────────────────────────────────────
function addSkillRow(data = {}) {
  const id = ++skillRowCounter;
  const row = document.createElement('div');
  row.className = 'skill-row';
  row.dataset.rowId = id;
  row.innerHTML = `
    <div class="field-group">
      <label class="field-label" for="sk-name-${id}">Skill Name</label>
      <input type="text" id="sk-name-${id}" class="field-input sk-name" placeholder="e.g. Python, System Design" value="${esc(data.skill_name ?? '')}" />
    </div>
    <div class="field-group">
      <label class="field-label" for="sk-cat-${id}">Category Code</label>
      <select id="sk-cat-${id}" class="field-input sk-category">
        <option value="">Auto-detect</option>
        ${['COD','DSA','OOD','APTI','COMM','AI','CLOUD','SQL','SWE','SYSD','NETW','OS'].map(c =>
          `<option value="${c}" ${data.category_code === c ? 'selected' : ''}>${c}</option>`
        ).join('')}
      </select>
    </div>
    <div class="field-group">
      <label class="field-label" for="sk-lvl-${id}">Level <span class="field-hint-inline">(1–10)</span></label>
      <input type="number" id="sk-lvl-${id}" class="field-input sk-level" min="1" max="10" placeholder="Optional" value="${esc(data.level ?? '')}" />
    </div>
    <div class="field-group">
      <label class="field-label" for="sk-conf-${id}">Confidence</label>
      <select id="sk-conf-${id}" class="field-input sk-confidence">
        <option value="medium" ${(!data.confidence || data.confidence === 'medium') ? 'selected' : ''}>Medium</option>
        <option value="high"   ${data.confidence === 'high'   ? 'selected' : ''}>High</option>
        <option value="low"    ${data.confidence === 'low'    ? 'selected' : ''}>Low</option>
      </select>
    </div>
    <div class="field-group" style="grid-column: 1 / -1">
      <label class="field-label" for="sk-ev-${id}">Evidence</label>
      <input type="text" id="sk-ev-${id}" class="field-input sk-evidence" placeholder="Supporting evidence (optional)" value="${esc(data.evidence ?? '')}" />
    </div>
    <button type="button" class="remove-skill-btn" title="Remove skill" aria-label="Remove skill row">✕</button>
  `;
  row.querySelector('.remove-skill-btn').addEventListener('click', () => {
    row.remove();
  });
  $('skillsList').appendChild(row);
  return row;
}

function collectSkills() {
  const rows = document.querySelectorAll('.skill-row');
  const skills = [];
  for (const row of rows) {
    const name = row.querySelector('.sk-name')?.value?.trim() ?? '';
    if (!name) continue;
    const cat  = row.querySelector('.sk-category')?.value ?? '';
    const lvl  = row.querySelector('.sk-level')?.value?.trim() ?? '';
    const conf = row.querySelector('.sk-confidence')?.value ?? 'medium';
    const ev   = row.querySelector('.sk-evidence')?.value?.trim() ?? '';
    const skill = { skill_name: name, confidence: conf };
    if (cat)  skill.category_code = cat;
    if (lvl)  skill.level = parseInt(lvl, 10);
    if (ev)   skill.evidence = ev;
    skills.push(skill);
  }
  return skills;
}

// ─── Form Submission ──────────────────────────────────────────────
function initForm() {
  $('assessmentForm').addEventListener('submit', handleSubmit);
}

function clearErrors() {
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
  document.querySelectorAll('.api-error-banner').forEach(el => el.remove());
}

function buildProfile() {
  // If user made manual edits or form is populated, read from form
  const name  = $('fieldName').value.trim();
  const email = $('fieldEmail').value.trim() || 'not provided';
  const edu   = $('fieldEducation').value.trim();
  const roles = $('fieldRoles').value.split(',').map(s => s.trim()).filter(Boolean);
  const hacks = $('fieldHackathons').value.split('\n').map(s => s.trim()).filter(Boolean);
  const ints  = $('fieldInternships').value.split('\n').map(s => s.trim()).filter(Boolean);
  const certs = $('fieldCertifications').value.split('\n').map(s => s.trim()).filter(Boolean);
  const skills = collectSkills();

  const errors = {};
  if (!name) errors.name = 'Name is required.';
  if (skills.length === 0) errors.skills = 'Add at least one skill or load a Profile Builder profile.';

  return {
    profile: {
      name,
      email,
      education: edu,
      skills,
      hackathons: hacks,
      internships: ints,
      certifications: certs,
      preferred_roles: roles,
    },
    errors,
  };
}

async function handleSubmit(e) {
  e.preventDefault();
  clearErrors();

  const { profile, errors } = buildProfile();

  if (Object.keys(errors).length > 0) {
    for (const [field, msg] of Object.entries(errors)) {
      const el = $(`err-${field}`);
      if (el) el.textContent = msg;
    }
    return;
  }

  const mode    = getMode();
  const company = $('companySelect').value;

  if ((mode === 'single' || mode === 'single-analyze') && !company) {
    alert('Please select a target company.');
    return;
  }

  const btn     = $('submitBtn');
  const spinner = $('submitSpinner');
  const btnText = $('submitBtnText');

  btn.disabled = true;
  spinner.classList.remove('hidden');
  btnText.textContent = 'Running Talent Check…';

  try {
    let result;
    if (mode === 'single')              result = await talentCheck(profile, company);
    else if (mode === 'all')            result = await talentCheckAll(profile);
    else if (mode === 'single-analyze') result = await talentCheckAnalyze(profile, company);
    else                                result = await talentCheckAllAnalyze(profile);

    try {
      renderResults(mode, result, profile, company);
    } catch (renderErr) {
      console.error('Error rendering results:', renderErr);
      const errBanner = document.createElement('div');
      errBanner.className = 'api-error-banner';
      errBanner.textContent = `Display error: ${renderErr.message}`;
      $('singleResultContainer').innerHTML = '';
      $('singleResultContainer').appendChild(errBanner);
    }
    showSection('results');

  } catch (err) {
    const banner = document.createElement('div');
    banner.className = 'api-error-banner';
    banner.textContent = err instanceof ApiError
      ? `Error ${err.status ? `(${err.status})` : ''}: ${err.message}`
      : `Unexpected error: ${err.message}`;
    $('err-global').parentNode.insertBefore(banner, $('err-global'));
  } finally {
    btn.disabled = false;
    spinner.classList.add('hidden');
    btnText.textContent = 'Run Talent Check';
  }
}

// ─── Results rendering ────────────────────────────────────────────
function renderResults(mode, result, profile, company) {
  destroyCharts();
  $('companyCardsContainer').innerHTML = '';
  $('singleResultContainer').innerHTML = '';
  $('skillsTableBody').innerHTML = '';

  const isAll       = mode === 'all' || mode === 'all-analyze';
  const hasAnalysis = mode === 'single-analyze' || mode === 'all-analyze';

  let assessments = [];
  let analysisData = null;

  if (isAll) {
    assessments  = result.assessments ?? result;
    analysisData = result.analysis ?? null;
  } else {
    assessments  = result.assessment ? [result.assessment] : [result];
    analysisData = result.analysis ?? null;
  }

  $('resultsSubtitle').textContent = profile.name
    ? `Candidate: ${profile.name}${company && !isAll ? ` · ${company}` : ''}`
    : '';

  if (isAll && assessments.length > 0) {
    const grid = document.createElement('div');
    grid.className = 'company-cards';
    assessments.forEach(a => grid.appendChild(buildCompanyCard(a)));
    $('companyCardsContainer').appendChild(grid);
  } else if (assessments.length === 1) {
    $('singleResultContainer').appendChild(buildSingleResult(assessments[0]));
  }

  renderSkillsTable(assessments);

  const bannerContainer = $('resultsAnalysisBannerContainer');
  if (bannerContainer) {
    bannerContainer.innerHTML = '';
    if (hasAnalysis && analysisData) {
      bannerContainer.innerHTML = `
        <div class="card" style="border: 1.5px solid var(--accent); background: var(--accent-muted); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-top:1.25rem; margin-bottom:1.25rem">
          <div>
            <div style="font-weight:700; font-size:1.05rem; display:flex; align-items:center; gap:.4rem">
              <span>✨</span> AI Analysis & Insights Ready
            </div>
            <div style="font-size:.85rem; color:var(--text-secondary); margin-top:.25rem">
              Career overview, confirmed strengths, 4-week learning roadmap, recommended projects, and visualizations are generated.
            </div>
          </div>
          <button type="button" class="btn btn-primary" id="goToAnalysisFromBannerBtn">View Full AI Analysis →</button>
        </div>
      `;
      $('goToAnalysisFromBannerBtn')?.addEventListener('click', () => showSection('analysis'));
    } else {
      bannerContainer.innerHTML = `
        <div class="card" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:1rem; margin-top:1.25rem; margin-bottom:1.25rem; border:1px dashed var(--border)">
          <div>
            <div style="font-weight:600; font-size:.95rem">Want AI Insights & Career Recommendations?</div>
            <div style="font-size:.82rem; color:var(--text-muted); margin-top:.2rem">
              You are currently viewing deterministic scores. Click below to generate an AI synthesis, learning roadmap, and project recommendations.
            </div>
          </div>
          <button type="button" class="btn btn-primary" id="triggerAnalysisFromBannerBtn">⚡ Run AI Analysis Now</button>
        </div>
      `;
      $('triggerAnalysisFromBannerBtn')?.addEventListener('click', () => triggerRunMode('single-analyze'));
    }
  }

  if (hasAnalysis && analysisData) {
    renderAnalysis(analysisData, profile, assessments);
    document.querySelector('[data-nav="analysis"]').style.opacity = '1';
    $('viewAnalysisBtn')?.classList.remove('hidden');
  } else {
    document.querySelector('[data-nav="analysis"]').style.opacity = '.4';
    document.querySelector('[data-nav="analysis"]').title = 'Run an analysis mode to see AI analysis';
    $('viewAnalysisBtn')?.classList.add('hidden');
  }
}

function readinessClass(score) {
  if (score === null || score === undefined) return 'readiness-null';
  if (score >= 75) return 'readiness-high';
  if (score >= 50) return 'readiness-medium';
  return 'readiness-low';
}

function buildCompanyCard(a) {
  const score  = a.readiness_score;
  const cov    = typeof a.coverage_percentage === 'number' ? a.coverage_percentage : 0;
  const cls    = readinessClass(score);
  const notice = (score === 100 && cov < 100)
    ? `<div class="readiness-callout-notice">
         <strong>100% Attainment:</strong> Candidate meets all <strong>${a.assessed_categories} assessed categories</strong>. Note: <strong>${a.skills_not_assessed} categories</strong> remain unassessed (${cov.toFixed(1)}% coverage).
       </div>`
    : '';

  const card   = document.createElement('div');
  card.className = 'company-card';
  card.innerHTML = `
    <div class="company-card-header">
      <div>
        <div class="company-name">${esc(a.company)}</div>
        ${a.role ? `<div class="company-role">${esc(a.role)}</div>` : ''}
      </div>
      <div class="readiness-badge ${cls}">
        ${score !== null && score !== undefined ? score.toFixed(1) + '%' : 'N/A'}
      </div>
    </div>
    <div class="stat-row">
      <span class="stat-pill green">✔ ${a.skills_meeting_requirement} meeting</span>
      <span class="stat-pill yellow">⚠ ${a.skills_below_requirement} below</span>
      <span class="stat-pill grey">— ${a.skills_not_assessed} unassessed</span>
    </div>
    <div>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:.2rem">
        <span style="font-size:.75rem;color:var(--text-muted)">Coverage</span>
        <span style="font-size:.78rem;font-weight:600;color:var(--text-secondary)">${cov.toFixed(1)}%</span>
      </div>
      <div class="coverage-bar-track">
        <div class="coverage-bar-fill" style="width:${cov}%;background:${cov >= 70 ? 'var(--success)' : cov >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div>
      </div>
      <div class="coverage-label">${a.assessed_categories} of ${a.total_categories} categories assessed</div>
    </div>
    ${notice}
  `;
  return card;
}

function buildSingleResult(a) {
  const wrap = document.createElement('div');
  wrap.className = 'card';
  const score = a.readiness_score;
  const cov   = typeof a.coverage_percentage === 'number' ? a.coverage_percentage : 0;
  const cls   = readinessClass(score);
  const notice = (score === 100 && cov < 100)
    ? `<div class="readiness-callout-notice">
         <strong>Note on 100% Readiness:</strong> Candidate meets or exceeds configured requirements across all <strong>${a.assessed_categories} assessed categories</strong>. However, <strong>${a.skills_not_assessed} categories remain unassessed</strong> (${cov.toFixed(1)}% overall coverage). Unassessed categories are omitted from readiness calculations rather than assumed to be zero.
       </div>`
    : '';

  wrap.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:1rem;flex-wrap:wrap">
      <div>
        <div style="font-size:1.2rem;font-weight:700">${esc(a.company)}</div>
        ${a.role ? `<div style="color:var(--text-secondary);font-size:.85rem;margin-top:.2rem">${esc(a.role)}</div>` : ''}
      </div>
      <div class="readiness-badge ${cls}" style="font-size:1.8rem;padding:.4rem 1rem">
        ${score !== null && score !== undefined ? score.toFixed(1) + '%' : 'N/A'}
        <div style="font-size:.65rem;font-weight:400;color:inherit;opacity:.7;text-align:center">Readiness</div>
      </div>
    </div>
    <div class="stat-row" style="margin-top:1rem">
      <span class="stat-pill green">✔ ${a.skills_meeting_requirement} meeting requirement</span>
      <span class="stat-pill yellow">⚠ ${a.skills_below_requirement} below requirement</span>
      <span class="stat-pill grey">— ${a.skills_not_assessed} not assessed</span>
      <span class="stat-pill blue">Coverage: ${cov.toFixed(1)}%</span>
    </div>
    <div style="margin-top:.75rem">
      <div class="coverage-bar-track" style="height:7px">
        <div class="coverage-bar-fill" style="width:${cov}%;background:${cov >= 70 ? 'var(--success)' : cov >= 40 ? 'var(--warning)' : 'var(--danger)'}"></div>
      </div>
      <div class="coverage-label">${a.assessed_categories} of ${a.total_categories} categories assessed — readiness is calculated only over assessed categories</div>
    </div>
    ${notice}
  `;
  return wrap;
}

function renderSkillsTable(assessments) {
  const tbody = $('skillsTableBody');
  tbody.innerHTML = '';
  for (const a of assessments) {
    for (const gap of (a.skillset_gap ?? [])) {
      const lvl = gap.candidate_level;
      const req = gap.required_level;
      const lvlClass = lvl !== null && lvl !== undefined ? 'level-assessed' : 'level-unassessed';
      const lvlText  = lvl !== null && lvl !== undefined ? lvl : 'Not assessed';
      let statusHtml;
      if (gap.meets_requirement === true) {
        statusHtml = `<span class="status-chip status-meeting">✔ Meets</span>`;
      } else if (gap.meets_requirement === false) {
        statusHtml = `<span class="status-chip status-gap">⚠ Gap (${gap.gap})</span>`;
      } else {
        statusHtml = `<span class="status-chip status-none">Not assessed</span>`;
      }

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${esc(gap.category_name)}</strong><br><code>${esc(gap.category_code)}</code></td>
        <td>${esc(a.company)}</td>
        <td><span class="level-chip ${lvlClass}">${lvlText}</span></td>
        <td><span class="level-chip level-required">${req}</span></td>
        <td>${gap.gap !== null && gap.gap !== undefined ? gap.gap : '—'}</td>
        <td>${statusHtml}</td>
        <td><span style="color:var(--text-muted)">${gap.confidence ?? '—'}</span></td>
      `;
      tbody.appendChild(tr);
    }
  }
}

// ─── Analysis rendering ───────────────────────────────────────────
function renderAnalysis(analysis, profile, assessments) {
  // Reveal content container and hide empty placeholder
  $('noAnalysisPlaceholder')?.classList.add('hidden');
  $('analysisContentContainer')?.classList.remove('hidden');

  $('analysisSubtitle').textContent = profile.name
    ? `Candidate: ${profile.name}`
    : 'Analysis results';

  renderAiStatusBanner(analysis);

  $('aiOverviewText').textContent  = analysis.ai_overview ?? '';
  $('aiSummaryText').textContent   = analysis.summary ?? '';
  $('aiOverviewCard').style.display = (!analysis.ai_overview && !analysis.summary) ? 'none' : '';

  renderCharts(analysis.graphs, assessments);
  renderSkillComparisonTable(analysis.graphs?.skill_comparison, assessments);
  renderStrengths(analysis.strengths ?? []);
  renderImprovements(analysis.improvement_areas ?? []);
  renderRoadmap(analysis.learning_roadmap ?? []);
  renderProjects(analysis.recommended_projects ?? []);
  renderDetailedAnalysis(analysis.detailed_analysis ?? []);
  renderLimitations(analysis.limitations ?? [], analysis.provider_errors ?? {});
}

function renderAiStatusBanner(analysis) {
  const banner = $('aiStatusBanner');
  const status = analysis.ai_status ?? 'unknown';
  const mode   = analysis.analysis_mode ?? '';

  const icons = {
    complete:    '✨',
    partial:     '⚡',
    fallback:    'ℹ',
    unavailable: '—',
  };
  const messages = {
    complete:    'AI-generated explanations are included in this analysis.',
    partial:     'Partial AI output used — primary provider failed but secondary succeeded. Explanations are factual and grounded.',
    fallback:    'All AI providers unavailable — deterministic assessment results are shown without interruption.',
    unavailable: 'No AI provider configured — showing deterministic assessment results.',
  };

  banner.className = `ai-status-banner status-${status}`;
  banner.innerHTML = `
    <span style="font-size:1.2rem">${icons[status] ?? '—'}</span>
    <div>
      <strong>AI Status: ${esc(status)}</strong>
      ${mode ? `<span style="margin-left:.5rem;opacity:.7;font-size:.8rem">(${esc(mode)})</span>` : ''}
      <br>${messages[status] ?? ''}
    </div>
  `;
}

function renderStrengths(strengths) {
  const list = $('strengthsList');
  list.innerHTML = '';
  if (!strengths.length) {
    list.innerHTML = '<li class="analysis-item"><div class="analysis-item-detail">No confirmed strengths identified from the assessed data.</div></li>';
    return;
  }
  for (const s of strengths) {
    const li = document.createElement('li');
    li.className = 'analysis-item';
    const conf = s.confidence ? `<span class="stat-pill blue" style="font-size:.7rem;margin-left:.4rem">${esc(s.confidence)} confidence</span>` : '';
    li.innerHTML = `
      <div class="analysis-item-title">${esc(s.category ?? s.name ?? 'Strength')} ${conf}</div>
      <div class="analysis-item-detail">${esc(s.reason ?? s.description ?? '')}</div>
    `;
    list.appendChild(li);
  }
}

function renderImprovements(improvements) {
  const list = $('improvementsList');
  list.innerHTML = '';
  if (!improvements.length) {
    list.innerHTML = '<li class="analysis-item"><div class="analysis-item-detail">No confirmed below-requirement gaps found among assessed categories.</div></li>';
    return;
  }
  for (const imp of improvements) {
    const li = document.createElement('li');
    li.className = 'analysis-item';
    li.innerHTML = `
      <div class="analysis-item-title">${esc(imp.category)}</div>
      <div class="analysis-item-meta">
        <span class="stat-pill yellow">Current: ${imp.current_level}</span>
        <span class="stat-pill grey">Required: ${imp.required_level}</span>
        <span class="stat-pill yellow">Gap: ${imp.gap}</span>
        ${imp.company ? `<span class="stat-pill blue">${esc(imp.company)}</span>` : ''}
      </div>
      <div class="analysis-item-detail" style="margin-top:.4rem">${esc(imp.reason ?? '')}</div>
    `;
    list.appendChild(li);
  }
}

function renderRoadmap(roadmap) {
  const container = $('roadmapContainer');
  container.innerHTML = '';
  if (!roadmap.length) {
    container.innerHTML = '<p class="prose">No roadmap generated.</p>';
    return;
  }
  const steps = document.createElement('div');
  steps.className = 'roadmap-steps';
  for (const step of roadmap) {
    const div = document.createElement('div');
    div.className = 'roadmap-step';
    const tasks = (step.tasks ?? []).map(t => `<li>${esc(t)}</li>`).join('');
    div.innerHTML = `
      <div class="roadmap-week">Wk ${esc(step.week ?? '?')}</div>
      <div class="roadmap-content">
        <div class="roadmap-focus">${esc(step.focus ?? '')}</div>
        <ul class="roadmap-tasks">${tasks}</ul>
        ${step.milestone ? `<div class="roadmap-milestone">🏁 ${esc(step.milestone)}</div>` : ''}
      </div>
    `;
    steps.appendChild(div);
  }
  container.appendChild(steps);
}

function renderProjects(projects) {
  const container = $('projectsContainer');
  container.innerHTML = '';
  if (!projects.length) {
    container.innerHTML = '<p class="prose">No projects recommended.</p>';
    return;
  }
  const grid = document.createElement('div');
  grid.className = 'projects-grid';
  for (const p of projects) {
    const card = document.createElement('div');
    card.className = 'project-card';
    const deliverables = (p.deliverables ?? []).map(d => `<li>${esc(d)}</li>`).join('');
    card.innerHTML = `
      <div class="project-name">${esc(p.name ?? '')}</div>
      <div class="project-purpose">${esc(p.purpose ?? '')}</div>
      <ul class="project-deliverables">${deliverables}</ul>
    `;
    grid.appendChild(card);
  }
  container.appendChild(grid);
}

function renderDetailedAnalysis(details) {
  const container = $('detailedContainer');
  container.innerHTML = '';
  if (!details.length) {
    container.innerHTML = '<p class="prose">No detailed analysis available.</p>';
    return;
  }
  const sections = document.createElement('div');
  sections.className = 'detail-sections';
  for (const d of details) {
    const div = document.createElement('div');
    div.className = 'detail-section';
    div.innerHTML = `
      <div class="detail-heading">${esc(d.heading ?? '')}</div>
      <div class="detail-details">${esc(d.details ?? '')}</div>
    `;
    sections.appendChild(div);
  }
  container.appendChild(sections);
}

function renderLimitations(limitations, providerErrors) {
  const list = $('limitationsList');
  list.innerHTML = '';
  for (const lim of limitations) {
    const li = document.createElement('li');
    li.textContent = lim;
    list.appendChild(li);
  }

  const errContainer = $('providerErrorsContainer');
  errContainer.innerHTML = '';
  const errKeys = Object.keys(providerErrors ?? {});
  if (errKeys.length > 0) {
    const title = document.createElement('div');
    title.className = 'provider-errors-title';
    title.textContent = '⚠ Provider errors';
    errContainer.appendChild(title);
    for (const [provider, msg] of Object.entries(providerErrors)) {
      const div = document.createElement('div');
      div.className = 'provider-error-item';
      div.textContent = `${provider}: ${msg}`;
      errContainer.appendChild(div);
    }
  }
}

// ─── Charts ───────────────────────────────────────────────────────
function destroyCharts() {
  for (const c of chartInstances) c.destroy();
  chartInstances = [];
  $('chartsContainer').innerHTML = '';
}

const CHART_COLORS = [
  '#6366f1', '#22c55e', '#f59e0b', '#38bdf8', '#f43f5e', '#a78bfa',
];
const CHART_BORDER = '#2e3140';

if (typeof Chart !== 'undefined') {
  Chart.defaults.color = '#9ca3b0';
  Chart.defaults.borderColor = CHART_BORDER;
  Chart.defaults.font.family = "'Inter', system-ui, sans-serif";
}

function renderCharts(graphs, assessments) {
  if (!graphs) return;
  const container = $('chartsContainer');
  container.innerHTML = '';

  if (typeof Chart === 'undefined') {
    container.innerHTML = '<p class="prose">Chart library (Chart.js) loading or unavailable.</p>';
    return;
  }

  if (graphs.readiness_by_company) {
    renderBarChart(container, graphs.readiness_by_company, 'readiness_score', '%', 100);
  }
  if (graphs.coverage_by_company) {
    renderBarChart(container, graphs.coverage_by_company, 'coverage_percentage', '%', 100);
  }
  if (graphs.skill_comparison) {
    renderGroupedBarChart(container, graphs.skill_comparison, assessments);
  }
}

function makeChartWrap(title) {
  const wrap = document.createElement('div');
  wrap.className = 'chart-wrap';
  const t = document.createElement('div');
  t.className = 'chart-title';
  t.textContent = title;
  const cw = document.createElement('div');
  cw.className = 'chart-canvas-wrap';
  const canvas = document.createElement('canvas');
  cw.appendChild(canvas);
  wrap.appendChild(t);
  wrap.appendChild(cw);
  return { wrap, canvas };
}

function renderBarChart(container, graph, yKey, unit, maxY) {
  const data = graph.data ?? [];
  if (!data.length) return;

  const labels = data.map(d => d[graph.x_key ?? 'company']);
  const values = data.map(d => {
    const v = d[yKey];
    return (v !== null && v !== undefined) ? v : null;
  });

  const { wrap, canvas } = makeChartWrap(graph.title);
  container.appendChild(wrap);

  const chart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: graph.title,
        data: values,
        backgroundColor: CHART_COLORS.map(c => c + 'cc'),
        borderColor: CHART_COLORS,
        borderWidth: 1.5,
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: { label: ctx => `${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(1) : 'N/A'}${unit}` },
        },
      },
      scales: {
        y: {
          min: 0, max: maxY,
          grid: { color: CHART_BORDER },
          ticks: { callback: v => `${v}${unit}` },
        },
        x: { grid: { display: false } },
      },
    },
  });
  chartInstances.push(chart);
}

function renderGroupedBarChart(container, graph, assessments) {
  const catData = graph.data ?? [];
  if (!catData.length) return;

  const companies = [...new Set(catData.flatMap(cat => (cat.companies ?? []).map(c => c.company)))];
  const categories = catData.map(cat => cat.category);

  const datasets = [];
  companies.forEach((company, ci) => {
    const color = CHART_COLORS[ci % CHART_COLORS.length];
    datasets.push({
      label: `${company} (candidate)`,
      data: catData.map(cat => {
        const row = (cat.companies ?? []).find(c => c.company === company);
        return row ? row.candidate_level : null;
      }),
      backgroundColor: color + '99',
      borderColor: color,
      borderWidth: 1.5,
      borderRadius: 4,
    });
    datasets.push({
      label: `${company} (required)`,
      data: catData.map(cat => {
        const row = (cat.companies ?? []).find(c => c.company === company);
        return row ? row.required_level : null;
      }),
      backgroundColor: 'transparent',
      borderColor: color,
      borderWidth: 2,
      borderDash: [4, 4],
      type: 'bar',
    });
  });

  const { wrap, canvas } = makeChartWrap(graph.title);
  wrap.style.gridColumn = '1 / -1';
  canvas.parentElement.style.height = '280px';
  container.appendChild(wrap);

  const chart = new Chart(canvas, {
    type: 'bar',
    data: { labels: categories, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom', labels: { boxWidth: 12, padding: 12, font: { size: 11 } } },
        tooltip: {
          callbacks: {
            label: ctx => {
              const v = ctx.parsed.y;
              return `${ctx.dataset.label}: ${v !== null ? v : 'Not assessed'}`;
            },
          },
        },
      },
      scales: {
        y: {
          min: 0, max: 10,
          grid: { color: CHART_BORDER },
          title: { display: true, text: 'Level (1–10)' },
        },
        x: { grid: { display: false } },
      },
    },
  });
  chartInstances.push(chart);
}

function renderSkillComparisonTable(skillComp, assessments) {
  const container = $('skillComparisonTable');
  container.innerHTML = '';
  if (!skillComp) { container.innerHTML = '<p class="prose">No skill comparison data available.</p>'; return; }

  const catData  = skillComp.data ?? [];
  if (!catData.length) { container.innerHTML = '<p class="prose">No skill comparison data available.</p>'; return; }

  const companies = [...new Set(catData.flatMap(cat => (cat.companies ?? []).map(c => c.company)))];

  const table = document.createElement('table');
  table.className = 'skill-cmp-table';

  const thead = document.createElement('thead');
  thead.innerHTML = `<tr>
    <th>Category</th>
    ${companies.flatMap(c => [
      `<th>${esc(c)}<br><small style="opacity:.6">Candidate</small></th>`,
      `<th>${esc(c)}<br><small style="opacity:.6">Required</small></th>`,
    ]).join('')}
  </tr>`;
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  for (const cat of catData) {
    const tr = document.createElement('tr');
    let html = `<td><strong>${esc(cat.category)}</strong></td>`;
    for (const company of companies) {
      const row = (cat.companies ?? []).find(c => c.company === company);
      const lvl = row?.candidate_level;
      const req = row?.required_level;
      const cls = lvl === null || lvl === undefined ? 'level-unassessed' : (lvl >= req ? 'status-meeting' : 'status-gap');
      html += `<td><span class="level-chip ${cls}">${lvl !== null && lvl !== undefined ? lvl : 'N/A'}</span></td>`;
      html += `<td><span class="level-chip level-required">${req ?? '—'}</span></td>`;
    }
    tr.innerHTML = html;
    tbody.appendChild(tr);
  }
  table.appendChild(tbody);
  container.appendChild(table);
}

// ─── Utility ──────────────────────────────────────────────────────
function esc(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

showSection('assessment');
