const BASE_WORKBOOK = window.OCI_AI_FACTORY_WORKBOOK || { sheets: {}, blueprintNodeTemplates: {}, runtimeTemplates: {} };
const BASE_MANIFEST = window.OCI_AI_FACTORY_CONTENT_MANIFEST || [];

let WORKBOOK = clone(BASE_WORKBOOK);
let CONTENT_MANIFEST = clone(BASE_MANIFEST);
let runTimer = null;

const state = {
  screen: "register",
  name: "",
  registerError: false,
  personaId: "",
  personaError: false,
  experience: "Engineer",
  experienceSelected: true,
  workerName: "",
  workerNameError: false,
  patternId: "",
  selectedKnowledgeIds: [],
  knowledgeSelections: {},
  knowledgeContext: "",
  modalSourceId: "",
  docViewerSourceId: "",
  settingsOpen: false,
  downloadModalOpen: false,
  downloadPayload: null,
  benefitsPayload: null,
  runSuccessOpen: false,
  composerEngaged: false,
  customQuestion: "",
  traceOpen: false,
  sourceRailOpen: false,
  flowOrientation: "horizontal",
  activeQuestionThreadId: "",
  testedQuestionIds: [],
  runMessages: [],
  lastSavedRunKey: "",
  leaderboardPage: 0,
  run: emptyRun(),
  uploadedContent: [],
  leaderboard: readLeaderboard(),
};

const stepOrder = ["register", "persona", "pattern", "blueprint", "leaderboard"];
const stepLabels = {
  register: ["Register", "Your Nick Name"],
  persona: ["Persona", "Role + worker name"],
  pattern: ["What your agent should do ?", "Select capability"],
  blueprint: ["Run Agent", "Question + trace"],
  leaderboard: ["Complete", "Leaderboard + download"],
};

const personaPatternRules = {
  P01: {
    allowed: ["AP01", "AP02", "AP03"],
    AP01: ["Enterprise search", "Search your HR SharePoint and Email"],
    AP02: ["Task-oriented conversational assistance", "Query your HCM SaaS/ERP System About Employee Information"],
    AP03: ["Interpretation and narrative around documents", "Employee Contract Document"],
  },
  P02: {
    allowed: ["AP01", "AP02", "AP03"],
    AP01: ["Enterprise search", "Search your Finance SharePoint, policies, and Email"],
    AP02: ["Task-oriented conversational assistance", "Query your ERP system about finance cost, payroll, and budget information"],
    AP03: ["Interpretation and narrative around documents", "Invoice, purchase order, and vendor contract documents"],
  },
  P03: {
    allowed: ["AP01", "AP02", "AP04"],
    AP01: ["Enterprise search", "Search your call center knowledge base, SOPs, and customer emails"],
    AP02: ["Task-oriented conversational assistance", "Query your support operations system about staffing, queues, and quality"],
    AP04: ["Voice and media intelligence", "Analyze call recordings, transcripts, and customer sentiment"],
  },
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function emptyRun() {
  return {
    running: false,
    currentStep: -1,
    visualTick: 0,
    qnaId: "",
    question: "",
    response: "",
    startedAt: 0,
    durationMs: 0,
    isCustom: false,
    turnId: "",
  };
}

function sheet(name) {
  return WORKBOOK.sheets?.[name] || [];
}

function text(value) {
  if (value === null || value === undefined) return "";
  return String(value);
}

function esc(value) {
  return text(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function slug(value) {
  return text(value).replace(/[^A-Za-z0-9]+/g, "") || "Default";
}

function shortCode(value) {
  return slug(value).slice(0, 2).toUpperCase() || "AI";
}

function personas() {
  return sheet("02_Personas");
}

function patterns() {
  return sheet("03_Agent_Patterns");
}

function visiblePatterns() {
  const allowed = personaPatternRules[state.personaId]?.allowed;
  if (!allowed) return patterns();
  return patterns().filter((row) => allowed.includes(row.PatternID));
}

function knowledgeSources() {
  return sheet("04_Knowledge_Sources");
}

function personaById(id = state.personaId) {
  return personas().find((row) => row.PersonaID === id) || null;
}

function patternById(id = state.patternId) {
  return patterns().find((row) => row.PatternID === id) || null;
}

function patternDisplay(pattern = patternById()) {
  if (!pattern) return { name: "", description: "" };
  const display = personaPatternRules[state.personaId]?.[pattern.PatternID];
  return {
    name: display?.[0] || pattern.PatternName,
    description: display?.[1] || pattern.Description,
  };
}

function sourceById(id) {
  return knowledgeSources().find((row) => row.KnowledgeID === id) || null;
}

function scenarioFor(personaId = state.personaId, patternId = state.patternId) {
  return (
    sheet("07_Persona_Pattern_Scenarios").find(
      (row) => row.PersonaID === personaId && row.AgentPatternID === patternId,
    ) || null
  );
}

function isFollowUpQuestionId(qnaId) {
  return /F[12]$/.test(text(qnaId));
}

function rootQuestionId(qnaId) {
  return text(qnaId).replace(/F[12]$/, "");
}

function questionById(qnaId) {
  return sheet("08_Scenario_QnA").find((row) => row.QnAID === qnaId) || null;
}

function questionRowsFor(personaId = state.personaId, patternId = state.patternId) {
  const scenario = scenarioFor(personaId, patternId);
  if (!scenario) return [];
  const selected = new Set(state.selectedKnowledgeIds);
  const questions = sheet("08_Scenario_QnA")
    .filter((row) => row.ScenarioID === scenario.ScenarioID)
    .sort((a, b) => Number(a.QuestionOrder || 0) - Number(b.QuestionOrder || 0));
  const sourceAware = questions.some((row) => questionSourceIds(row).length);
  return sourceAware
    ? questions.filter((row) => questionSourceIds(row).some((id) => selected.has(id)))
    : questions;
}

function questionsFor(personaId = state.personaId, patternId = state.patternId) {
  return questionRowsFor(personaId, patternId)
    .filter((row) => !isFollowUpQuestionId(row.QnAID))
    .slice(0, 3);
}

function followUpQuestionsFor(qnaId = state.activeQuestionThreadId || state.run.qnaId) {
  const rootId = rootQuestionId(qnaId);
  if (!rootId) return [];
  const scenario = scenarioFor();
  if (!scenario) return [];
  return sheet("08_Scenario_QnA")
    .filter((row) => row.ScenarioID === scenario.ScenarioID)
    .sort((a, b) => Number(a.QuestionOrder || 0) - Number(b.QuestionOrder || 0))
    .filter((row) => rootQuestionId(row.QnAID) === rootId && row.QnAID !== rootId)
    .slice(0, 2);
}

function questionThreadFor(qnaId = state.activeQuestionThreadId || state.run.qnaId) {
  const rootId = rootQuestionId(qnaId);
  if (!rootId) return [];
  const rootQuestion = questionById(rootId);
  return [rootQuestion, ...followUpQuestionsFor(rootId)].filter(Boolean);
}

function runSuggestedQuestions() {
  if (state.run.running) return [];
  if (state.run.response && state.run.qnaId) {
    return followUpQuestionsFor(state.activeQuestionThreadId || state.run.qnaId)
      .filter((row) => !state.testedQuestionIds.includes(row.QnAID));
  }
  return questionsFor();
}

function responseFor(qnaId) {
  return sheet("09_Sample_Responses").find((row) => row.QnAID === qnaId) || null;
}

function questionSourceIds(row) {
  return text(row.RequiredKnowledgeIDs || row.KnowledgeID)
    .split(/[|,;]/)
    .map((id) => id.trim())
    .filter(Boolean);
}

function blueprintFor(personaId = state.personaId, patternId = state.patternId) {
  return (
    sheet("10_Blueprint_Map").find(
      (row) => row.PersonaID === personaId && row.AgentPatternID === patternId,
    ) || null
  );
}

function availableSourcesFor(personaId = state.personaId, patternId = state.patternId) {
  const mapped = sheet("05_Persona_Pattern_KB_Map").filter(
    (row) => row.PersonaID === personaId && row.PatternID === patternId,
  );
  if (!mapped.length) {
    return knowledgeSources().filter((row) => row.PatternID === patternId);
  }
  return mapped.map((row) => sourceById(row.KnowledgeID)).filter(Boolean);
}

function defaultSourceIds(personaId = state.personaId, patternId = state.patternId) {
  const mapped = sheet("05_Persona_Pattern_KB_Map").filter(
    (row) => row.PersonaID === personaId && row.PatternID === patternId,
  );
  const selected = mapped.filter((row) => row.DefaultSelected === "Y").map((row) => row.KnowledgeID);
  if (selected.length) return selected;
  return availableSourcesFor(personaId, patternId)
    .filter((row) => row.DefaultRecommended === "Y")
    .map((row) => row.KnowledgeID);
}

function selectedSources() {
  const selected = new Set(state.selectedKnowledgeIds);
  return availableSourcesFor().filter((row) => selected.has(row.KnowledgeID));
}

function knowledgeContextKey(personaId = state.personaId, patternId = state.patternId, experience = state.experience) {
  return `${personaId}|${patternId}|${experience}`;
}

function saveKnowledgeSelection() {
  if (!state.knowledgeContext) return;
  state.knowledgeSelections = {
    ...state.knowledgeSelections,
    [state.knowledgeContext]: [...state.selectedKnowledgeIds],
  };
}

function runEvidenceSources() {
  const qna = state.run.qnaId ? questionById(state.run.qnaId) : null;
  const ids = qna ? questionSourceIds(qna) : [];
  if (!ids.length) return selectedSources();
  const required = new Set(ids);
  return availableSourcesFor().filter((row) => required.has(row.KnowledgeID));
}

function markQuestionTested(qnaId) {
  if (!qnaId) return;
  if (!state.testedQuestionIds.includes(qnaId)) {
    state.testedQuestionIds = [...state.testedQuestionIds, qnaId];
  }
}

function testedQuestionIdsForThread(qnaId = state.activeQuestionThreadId || state.run.qnaId) {
  return questionThreadFor(qnaId).map((row) => row.QnAID);
}

function completedRunInteractions() {
  return state.runMessages.filter((message) => message.response && !message.running).length;
}

function hasCompletedRunInteraction() {
  return completedRunInteractions() > 0 || Boolean(state.run.response && !state.run.running);
}

function hasRunExecutionActivity() {
  return Boolean(state.runMessages.length || state.run.question || state.run.running);
}

function resetRunTesting() {
  if (runTimer) window.clearInterval(runTimer);
  runTimer = null;
  state.activeQuestionThreadId = "";
  state.testedQuestionIds = [];
  state.runMessages = [];
  state.runSuccessOpen = false;
  state.composerEngaged = false;
}

function resetSavedRunKey() {
  state.lastSavedRunKey = "";
}

function personaGroup(persona = personaById()) {
  const display = slug(persona?.PersonaName || "");
  const groups = [...new Set(sheet("11_Content_Repository_Map").map((row) => slug(row.PersonaGroup)).filter(Boolean))];
  return groups.find((group) => display.toLowerCase().includes(group.toLowerCase())) || groups[0] || "Default";
}

function patternFolder(pattern = patternById()) {
  return slug(pattern?.PatternName || "");
}

function blueprintNodes(pattern = patternById()) {
  const templates = WORKBOOK.blueprintNodeTemplates || {};
  return templates[pattern?.PatternName] || templates[patternFolder(pattern)] || [];
}

function runtimeSteps(pattern = patternById()) {
  const templates = WORKBOOK.runtimeTemplates || {};
  return templates[pattern?.PatternName] || templates[patternFolder(pattern)] || [];
}

function runElapsed() {
  if (!state.run.startedAt) return state.run.response ? RUN_TOTAL_MS : 0;
  return state.run.running ? Date.now() - state.run.startedAt : state.run.durationMs || RUN_TOTAL_MS;
}

function scrollRunChatToBottom() {
  window.requestAnimationFrame(() => {
    const body = document.querySelector(".agentChatBody");
    if (body) body.scrollTop = body.scrollHeight;
  });
}

function focusKnowledgePanel() {
  window.requestAnimationFrame(() => {
    const panel = document.querySelector("[data-knowledge-panel]");
    if (!panel) return;
    panel.scrollIntoView({ block: "center", behavior: "smooth" });
  });
}

function focusWorkerNamePanel() {
  window.requestAnimationFrame(() => {
    const panel = document.querySelector("[data-worker-name-panel]");
    panel?.scrollIntoView({ block: "center", behavior: "smooth" });
    document.getElementById("workerName")?.focus();
  });
}

const RUN_TOTAL_MS = 5400;
const LEADERBOARD_PAGE_SIZE = 5;
const RUN_PHASES = [
  { step: 0, until: 520 },
  { step: 1, until: 1320 },
  { step: 2, until: 2150 },
  { step: 3, until: 4550 },
  { step: 4, until: RUN_TOTAL_MS },
];

function visualStepFromElapsed(elapsed) {
  if (!state.run.question) return -1;
  return RUN_PHASES.find((phase) => elapsed < phase.until)?.step ?? 4;
}

function clampPercent(value) {
  return Math.max(0, Math.min(100, value));
}

function ensureDefaults(resetKnowledge = false) {
  const persona = personaById();
  if (!persona) return;
  state.experience = "Engineer";
  state.experienceSelected = true;
  const context = knowledgeContextKey();
  if (state.patternId && state.knowledgeContext !== context) {
    state.selectedKnowledgeIds = [...(state.knowledgeSelections[context] || [])];
    state.knowledgeContext = context;
  }
}

function compactWords(value) {
  return text(value)
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word) => (word.length <= 3 && word === word.toUpperCase() ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");
}

function suggestedWorkerNames() {
  const persona = personaById();
  if (!persona) return [];
  const firstName = compactWords(state.name.trim().split(/\s+/)[0] || "Builder");
  const personaBase = compactWords(persona.PersonaName.replace(/\b(Specialist|Agent)\b/gi, "").trim() || persona.PersonaName);
  return [...new Set([
    `${firstName}${personaBase}Pilot`,
    `${firstName}${personaBase}Spark`,
    `${personaBase}Nova`,
    `${firstName}Astra`,
  ])];
}

function workbookStats() {
  return {
    personas: personas().length,
    patterns: patterns().length,
    sources: knowledgeSources().length,
    scenarios: sheet("07_Persona_Pattern_Scenarios").length,
    responses: sheet("09_Sample_Responses").length,
    files: CONTENT_MANIFEST.length + state.uploadedContent.length,
  };
}

function canEnter(screen) {
  if (screen === "register") return true;
  if (screen === "persona") return Boolean(state.name.trim());
  if (screen === "pattern") return canEnter("persona") && Boolean(state.personaId) && Boolean(state.workerName.trim());
  if (screen === "blueprint") return canEnter("pattern") && Boolean(state.patternId) && selectedSources().length > 0;
  if (screen === "leaderboard") return canEnter("blueprint");
  return false;
}

function go(screen) {
  ensureDefaults();
  if (!canEnter(screen)) {
    if (screen === "persona" && state.screen === "register") validateRegisterName();
    if (state.screen === "persona" && stepOrder.indexOf(screen) > stepOrder.indexOf("persona")) validatePersonaStep();
    return;
  }
  state.screen = screen;
  render();
}

function next() {
  if (state.screen === "register") {
    if (!validateRegisterName()) return;
    return go("persona");
  }
  if (state.screen === "persona") {
    if (!validatePersonaStep()) return;
    ensureDefaults(true);
    return go("pattern");
  }
  if (state.screen === "pattern") {
    if (!selectedSources().length) {
      render();
      focusKnowledgePanel();
      return;
    }
    return go("blueprint");
  }
  if (state.screen === "blueprint") return requestRunCompletion();
  if (state.screen === "leaderboard") {
    resetExperience();
    return render();
  }
  return go("register");
}

function previous() {
  if (state.screen === "persona") return go("register");
  if (state.screen === "pattern") return go("persona");
  if (state.screen === "blueprint") return go("pattern");
  if (state.screen === "leaderboard") return go("blueprint");
  return go("register");
}

function canMoveNext() {
  if (state.screen === "persona") return Boolean(state.personaId && state.workerName.trim());
  if (state.screen === "pattern") return canEnter("blueprint");
  if (state.screen === "blueprint") return hasCompletedRunInteraction();
  return true;
}

function validateRegisterName() {
  const trimmedName = state.name.trim();
  if (!trimmedName) {
    state.registerError = true;
    render();
    window.requestAnimationFrame(() => {
      document.getElementById("nameInput")?.focus();
    });
    return false;
  }
  state.name = trimmedName;
  state.registerError = false;
  return true;
}

function validatePersonaStep() {
  const hasPersona = Boolean(state.personaId);
  const trimmedWorkerName = state.workerName.trim();
  state.personaError = !hasPersona;
  state.workerNameError = hasPersona && !trimmedWorkerName;
  if (state.personaError || state.workerNameError) {
    render();
    window.requestAnimationFrame(() => {
      if (state.personaError) document.querySelector("[data-persona]")?.focus();
      else document.getElementById("workerName")?.focus();
    });
    return false;
  }
  state.workerName = trimmedWorkerName;
  state.personaError = false;
  state.workerNameError = false;
  return true;
}

function renderRouteActions(nextLabel = "Next", nextIcon = "") {
  return `
    <div class="routeActions">
      <button class="action secondary" data-route-prev>&larr; Back</button>
      <button class="action primary" data-route-next ${canMoveNext() ? "" : "disabled"}>${esc(nextLabel)}${nextIcon ? ` ${nextIcon}` : ""}</button>
    </div>
  `;
}

function render() {
  ensureDefaults();
  document.getElementById("app").innerHTML = `
    <div class="shell">
      ${renderTopbar()}
      ${renderMetroJourney()}
      <div class="mainGrid ${state.screen === "blueprint" ? "blueprintMainGrid" : ""}">
        <main class="content ${state.screen === "pattern" ? "patternContent" : ""}">${renderScreen()}</main>
      </div>
      ${renderModal()}
    </div>
  `;
}

function renderTopbar() {
  return `
    <header class="topbar">
      <div class="brand">
        <div class="mark">AI</div>
        <div><b>AgentifyME</b><span>Create your Agent</span></div>
      </div>
      <div class="topActions">
        <button class="settingsButton" type="button" data-settings-open="true" aria-label="Settings" aria-haspopup="dialog" title="Settings">
          ${uiIcon("settings")}
        </button>
        <a class="oracleLogo" href="https://icon-icons.com/authors/934-julien-monty" target="_blank" rel="noreferrer" title="Oracle logo credit: Icon-Icons.com" aria-label="Oracle logo">
          ${oracleWordmark()}
        </a>
      </div>
    </header>
  `;
}

function renderMetroJourney() {
  const currentIndex = Math.max(stepOrder.indexOf(state.screen), 0);
  const progress = stepOrder.length > 1 ? (currentIndex / (stepOrder.length - 1)) * 100 : 0;
  return `
    <nav class="metroJourney" aria-label="Guided Journey">
      <div class="metroHead">
        <strong>Guided Journey</strong>
        <span>${esc(stepSummary(state.screen, stepLabels[state.screen]?.[1] || ""))}</span>
      </div>
      <div class="metroTrack" style="--metro-progress: ${progress}%">
        <div class="metroLine" aria-hidden="true"><span></span></div>
        <div class="metroStops">
          ${stepOrder.map((step, index) => renderMetroStop(step, index)).join("")}
        </div>
      </div>
      <div class="metroActions">
        <input class="hiddenInput" id="workbookUpload" type="file" accept=".json,.xlsx,.xls" />
        <input class="hiddenInput" id="contentUpload" type="file" multiple webkitdirectory />
        <button class="resetButton metroReset" data-reset-experience>Reset</button>
      </div>
    </nav>
  `;
}

function renderSide() {
  return `
    <aside class="side ${state.screen === "blueprint" ? "sideCompact" : ""}">
      <h2>Guided Journey</h2>
      <div class="stepper">
        ${stepOrder.map((step, index) => renderStep(step, index)).join("")}
      </div>
      <div class="sideFooter">
        <input class="hiddenInput" id="workbookUpload" type="file" accept=".json,.xlsx,.xls" />
        <input class="hiddenInput" id="contentUpload" type="file" multiple webkitdirectory />
        <button class="resetButton" data-reset-experience>Reset</button>
      </div>
    </aside>
  `;
}

function renderMetroStop(step, index) {
  const currentIndex = stepOrder.indexOf(state.screen);
  const done = index < currentIndex;
  const active = state.screen === step;
  const [title, meta] = stepLabels[step];
  const summary = stepSummary(step, meta);
  return `
    <button class="metroStop ${active ? "active" : ""} ${done ? "done" : ""}" data-step="${step}" title="${esc(title)} - ${esc(summary)}">
      <span class="metroDot">${index + 1}</span>
      <span class="metroText"><strong>${esc(title)}</strong><small>${esc(summary)}</small></span>
    </button>
  `;
}

function stepSummary(step, fallback) {
  if (step === "register") return state.screen === "register" ? fallback : state.name.trim() || fallback;
  if (step === "persona") return [personaById()?.PersonaName, state.workerName].filter(Boolean).join(" - ") || fallback;
  if (step === "pattern") return patternById()?.PatternName || fallback;
  if (step === "blueprint") {
    if ((state.screen === "blueprint" || state.screen === "leaderboard") && state.workerName && patternById()) return `${state.workerName} - ${patternById().PatternName}`;
    return fallback;
  }
  if (step === "leaderboard") return fallback;
  return fallback;
}

function renderStep(step, index) {
  const currentIndex = stepOrder.indexOf(state.screen);
  const done = index < currentIndex;
  const active = state.screen === step;
  const [title, meta] = stepLabels[step];
  const summary = stepSummary(step, meta);
  return `
    <button class="step ${active ? "active" : ""} ${done ? "done" : ""}" data-step="${step}">
      <span class="stepNum">${index + 1}</span>
      <span><span class="stepTitle">${esc(title)}</span><span class="stepMeta">${esc(summary)}</span></span>
    </button>
  `;
}

function renderScreen() {
  if (state.screen === "persona") return renderPersona();
  if (state.screen === "pattern") return renderPattern();
  if (state.screen === "blueprint") return renderBlueprintScreen();
  if (state.screen === "leaderboard") return renderLeaderboard();
  return renderRegister();
}

function renderRegister() {
  const hasError = state.registerError && !state.name.trim();
  return `
    <section class="page">
      <section class="panel pad registerCard">
        <div class="eyebrow">Step 1 - Register</div>
        <h1>Build your Digital co-worker with OCI AI</h1>
        <div class="registerForm">
          <div class="field ${hasError ? "fieldInvalid" : ""}">
            <label class="label" for="nameInput">NICK NAME</label>
            <input
              id="nameInput"
              class="input"
              value="${esc(state.name)}"
              placeholder="Enter your nick name to continue"
              autocomplete="off"
              aria-invalid="${hasError ? "true" : "false"}"
              aria-describedby="nameInputMessage"
            />
            <p id="nameInputMessage" class="fieldMessage" aria-live="polite">
              ${hasError ? "Please enter your nick name to continue." : ""}
            </p>
          </div>
          <div class="btnRow" style="margin-top: 14px">
            <button class="action primary" data-route-next data-register-start ${state.name.trim() ? "" : "disabled"}>Start</button>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderPersona() {
  const suggestions = suggestedWorkerNames();
  const personaError = state.personaError && !state.personaId;
  const workerNameError = state.workerNameError && state.personaId && !state.workerName.trim();
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Persona Selection</div>
          <h1>Select A Digital Co-Worker</h1>
          <p class="pageHelper">Choose one persona for your digital worker.</p>
        </div>
      </div>
      <div class="grid three personaGrid ${personaError ? "personaGridInvalid" : ""}" role="radiogroup" aria-label="Digital co-worker persona">
        ${personas().map((persona) => renderPersonaCard(persona)).join("")}
      </div>
      <p class="fieldMessage personaErrorMessage" aria-live="polite">
        ${personaError ? "Please select one digital co-worker to continue." : ""}
      </p>
      ${state.personaId ? `
        <section class="workerNamePanel ${state.workerName.trim() ? "" : "needsName"}" data-worker-name-panel>
          <div class="field ${workerNameError ? "fieldInvalid" : ""}">
            <label class="label" for="workerName">Digital Worker Name</label>
            <input
              id="workerName"
              class="input"
              value="${esc(state.workerName)}"
              placeholder="Name your digital worker to continue"
              autocomplete="off"
              aria-invalid="${workerNameError ? "true" : "false"}"
              aria-describedby="workerNameMessage"
            />
            <p id="workerNameMessage" class="fieldMessage" aria-live="polite">
              ${workerNameError ? "Please enter a digital worker name to continue." : ""}
            </p>
          </div>
          <div class="recommendationLabel">AI Recommended Digital Worker Name:</div>
          <div class="suggestionRow compactSuggestions recommendationCallout">
            ${suggestions.map((name) => `<button class="nameSuggestion" data-name-suggestion="${esc(name)}">${esc(name)}</button>`).join("")}
          </div>
        </section>
      ` : ""}
      ${renderRouteActions("Next", "&rarr;")}
    </section>
  `;
}

function renderPersonaCard(persona) {
  const selected = state.personaId === persona.PersonaID;
  return `
    <button
      class="choice personaChoice ${selected ? "selected" : ""}"
      data-persona="${esc(persona.PersonaID)}"
      role="radio"
      aria-checked="${selected ? "true" : "false"}"
    >
      <span class="personaChoiceTitle">
        <span class="personaRadio" aria-hidden="true"></span>
        <h3>${esc(persona.PersonaName)}</h3>
        <span class="personaSelectedCheck" aria-hidden="true">✓</span>
      </span>
      <p>${esc(`Digital Co worker for ${persona.Description}`)}</p>
    </button>
  `;
}

function renderPattern() {
  return `
    <section class="page journeyPanel patternPage ${state.patternId ? "" : "patternPageEmpty"}">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Agent capability</div>
          <h1>What your agent should do ?</h1>
        </div>
      </div>
      <div class="grid three capabilityGrid">
        ${visiblePatterns().map((pattern) => renderPatternCard(pattern)).join("")}
      </div>
      ${state.patternId ? renderPatternConfigurator() : ""}
      ${renderRouteActions("Run Agent", "&rarr;")}
    </section>
  `;
}

function renderPatternCard(pattern) {
  const selected = state.patternId === pattern.PatternID;
  const display = patternDisplay(pattern);
  return `
    <button class="choice ${selected ? "selected" : ""}" data-pattern="${esc(pattern.PatternID)}">
      <span class="check" aria-hidden="true">${selected ? "✓" : ""}</span>
      <h3>${esc(display.name)}</h3>
      <p>${esc(display.description)}</p>
    </button>
  `;
}

function patternPreviewCopy(pattern = patternById()) {
  const name = text(pattern?.PatternName);
  if (name === "RAG") {
    return {
      heading: "RAG - Retrieval Augmented Generation",
      subtext: "AI that understands and reasons over enterprise content",
    };
  }
  if (name === "NL2SQL") {
    return {
      heading: "NL2SQL",
      subtext: "Natural Language Query on Knowledge Base",
    };
  }
  if (name === "Document AI") {
    return {
      heading: "Document AI",
      subtext: "MutiModal AI that can Infer Insights from Documents",
    };
  }
  return {
    heading: name || "Selected capability",
    subtext: blueprintFor()?.BlueprintTheme || "Workbook mapped architecture",
  };
}

function renderPatternConfigurator() {
  const blueprint = blueprintFor();
  const sources = availableSourcesFor();
  const selected = new Set(state.selectedKnowledgeIds);
  const selectedCount = selectedSources().length;
  const previewCopy = patternPreviewCopy();
  return `
    <section class="patternConfigurator" aria-label="Capability blueprint configuration">
      <aside class="patternKnowledgePanel ${selectedCount ? "" : "needsSelection"}" data-knowledge-panel>
        <div class="patternPanelHead">
          <div>
            <span>Knowledge Base</span>
            <strong>Select sources</strong>
            <small class="knowledgeInstruction">Select at least one knowledge source to enable Run Agent.</small>
          </div>
          <b>${selectedCount}/${sources.length || 0}</b>
        </div>
        <div class="sourceList patternSourceList">
          ${sources.map((source) => renderSourceRow(source, selected.has(source.KnowledgeID), true)).join("") || `<div class="empty miniEmpty">No workbook sources mapped for this persona and capability.</div>`}
        </div>
      </aside>
      <section class="patternBlueprintPreview">
        <div class="patternPreviewHead">
          <div>
            <span>Blueprint Preview</span>
            <strong>${esc(previewCopy.heading)}</strong>
            <small>${esc(previewCopy.subtext)}</small>
          </div>
        </div>
        <div class="patternCanvas">
          ${renderBranchedBlueprint()}
        </div>
      </section>
    </section>
  `;
}

function renderBlueprintScreen() {
  return renderAgentRunScreen();
}

function renderBlueprintCanvasScreen() {
  const blueprint = blueprintFor();
  return `
    <section class="page journeyPanel blueprintPage">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Blueprint + Test Blueprint</div>
          <h1>${esc(state.workerName || "Digital Worker")}</h1>
        </div>
        <div class="btnRow">
          <button class="action secondary" data-download-qr>${uiIcon("download", "iconBox")}<span>Download Blueprint</span></button>
        </div>
      </div>
      <div class="blueprintWorkspace">
        ${renderBlueprintPane(blueprint)}
        ${renderChatPane()}
      </div>
      ${renderRouteActions("Next", "&rarr;")}
    </section>
  `;
}

function renderAgentRunScreen() {
  const workerName = state.workerName.trim() || "Digital Worker";
  const chatbotName = state.workerName.trim() ? `${workerName} Digital Co Worker` : "Digital Co Worker";
  const hasTrace = hasRunExecutionActivity();
  return `
    <section class="page agentRunPage">
      <div class="runTopLine">
        <div class="runAgentTitle">
          <span class="chatHeaderIcon">${esc(shortCode(chatbotName))}</span>
          <div>
            <h1>${esc(chatbotName)}</h1>
          </div>
        </div>
      </div>
      <div class="agentRunWorkspace ${hasTrace ? "traceActive" : "traceIdle"}">
        ${renderAgentChatSurface(chatbotName)}
        ${hasTrace ? renderAgentThinkingPanel() : ""}
      </div>
      <div class="routeActions agentRunActions">
        <button class="action secondary" data-route-prev>&larr; Back</button>
        <div class="btnRow">
          <button class="action secondary" data-download-qr>${uiIcon("download", "iconBox")}<span>Download Blueprint</span></button>
          <button class="action primary" data-route-next ${hasCompletedRunInteraction() ? "" : "disabled"}>Complete &rarr;</button>
        </div>
      </div>
    </section>
  `;
}

function renderAgentChatSurface(chatbotName) {
  const qs = runSuggestedQuestions();
  const hasConversation = Boolean(state.runMessages.length || state.run.question);
  const centerComposer = !hasConversation && !state.customQuestion.trim() && !state.composerEngaged;
  const hasFollowUps = Boolean(state.run.response && qs.some((q) => isFollowUpQuestionId(q.QnAID)));
  return `
    <section class="agentChatSurface ${hasConversation ? "hasConversation" : ""} ${centerComposer ? "noConversation" : "composerEngaged"}" aria-label="${esc(chatbotName)} chat">
      <div class="agentChatBody">
        ${hasConversation ? renderRunConversation(chatbotName, hasFollowUps ? qs : []) : renderRunEmptyState(chatbotName)}
      </div>
      ${!hasConversation ? `
        <div class="runSuggested">
          <div class="suggestedTitle">Suggested questions</div>
          <div class="runQuestionStrip">
            ${qs.map(renderRunQuestionButton).join("") || `<div class="empty miniEmpty">No workbook questions mapped for this scenario.</div>`}
          </div>
        </div>
      ` : ""}
      <div class="runComposerWrap">
        <div class="typingRecommendations" data-typing-recommendations>
          ${renderTypingRecommendations()}
        </div>
        <div class="runComposer">
          <button class="composerIconButton" type="button" aria-label="Attach context">+</button>
          <textarea id="customQuestion" class="runInput" placeholder="Ask ${esc(chatbotName)} anything..." rows="1">${esc(state.customQuestion)}</textarea>
          <button class="sendButton runSendButton" data-run-custom aria-label="Run question">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 20.5 21 12 3.5 3.5 6.25 10.9 14 12l-7.75 1.1-2.75 7.4Z"></path></svg>
          </button>
        </div>
      </div>
    </section>
  `;
}

function renderRunQuestionButton(q) {
  const tested = state.testedQuestionIds.includes(q.QnAID);
  const followUp = isFollowUpQuestionId(q.QnAID);
  return `
    <button class="runQuestion ${tested ? "tested" : ""} ${followUp ? "followUpQuestion" : ""}" data-run-question="${esc(q.QnAID)}">
      <span class="runQuestionCopy">
        ${followUp ? `<small>Follow-up</small>` : ""}
        <span>${esc(q.Question)}</span>
      </span>
      ${tested ? `<b class="questionDone">Done</b>` : ""}
    </button>
  `;
}

function renderRunEmptyState(chatbotName) {
  return `
    <div class="runEmptyState">
      <span class="runHalo">${esc(shortCode(chatbotName))}</span>
      <h2>What should ${esc(chatbotName)} answer?</h2>
      <p>Ask a workbook question or type your own prompt to test the selected digital co-worker.</p>
    </div>
  `;
}

function renderRunConversation(chatbotName, followUps = []) {
  const messages = state.runMessages.length
    ? state.runMessages
    : state.run.question
      ? [state.run]
      : [];
  return `
    <div class="runConversation">
      ${messages.map((message) => renderRunConversationTurn(message, chatbotName)).join("")}
      ${followUps.length ? renderInlineFollowUps(followUps) : ""}
    </div>
  `;
}

function renderInlineFollowUps(followUps) {
  return `
    <div class="runInlineFollowUps">
      <span class="runMessageLabel">Suggested follow-up questions</span>
      <div class="runInlineFollowUpList">
        ${followUps.map(renderRunQuestionButton).join("")}
      </div>
    </div>
  `;
}

function renderRunConversationTurn(message, chatbotName) {
  const isRunning = message.running && !message.response;
  return `
    <div class="runConversationTurn">
      <article class="runBubbleRow user">
        <div class="runMessageStack alignEnd">
          <span class="runMessageLabel">You</span>
          <div class="runBubble user">${esc(message.question)}</div>
        </div>
      </article>
      <article class="runBubbleRow agent">
        <span class="chatAvatar">${esc(shortCode(chatbotName))}</span>
        <div class="runMessageStack">
          <span class="runMessageLabel">${esc(chatbotName)}</span>
          <div class="runBubble agent">
            ${message.response ? esc(message.response) : isRunning ? `<span class="thinkingDots"><i></i><i></i><i></i></span><span>Thinking through the agent flow...</span>` : ""}
          </div>
        </div>
      </article>
    </div>
  `;
}

function recommendedQuestionsForTyping() {
  const query = state.customQuestion.trim().toLowerCase();
  if (!query) return [];
  const questions = questionsFor();
  const matches = questions
    .filter((q) => q.Question.toLowerCase().includes(query) || query.split(/\s+/).some((word) => word.length > 2 && q.Question.toLowerCase().includes(word)))
    .slice(0, 3);
  return matches.length ? matches : questions.slice(0, 3);
}

function renderTypingRecommendations() {
  const matches = recommendedQuestionsForTyping();
  if (!matches.length) return "";
  return `
    <div class="typingCard">
      <strong>Recommended questions</strong>
      ${matches.map((q) => `<button class="typingSuggestion" type="button" data-run-question="${esc(q.QnAID)}">${esc(q.Question)}</button>`).join("")}
    </div>
  `;
}

function renderAgentThinkingPanel() {
  const status = state.run.running ? "Thinking" : state.run.response ? "Complete" : "Waiting";
  const statusClass = state.run.running ? "amber" : state.run.response ? "green" : "";
  const summary = state.run.running ? "Tracing live orchestration" : state.run.response ? `Completed in ${state.run.durationMs} ms` : "Ask a question to start";
  return `
    <aside class="agentThinkingPanel" aria-label="Agent execution trace">
      <header class="thinkingHeader">
        <div>
          <span>Execution Trace</span>
          <strong>${esc(status)}</strong>
          <small>${esc(summary)}</small>
        </div>
        <b class="pill ${statusClass}">${esc(status)}</b>
      </header>
      ${renderThinkingTimeline()}
      ${renderThinkingAgents()}
      ${renderThinkingSources()}
    </aside>
  `;
}

function runStageStatus(stage) {
  const current = state.run.running ? visualStepFromElapsed(runElapsed()) : state.run.currentStep;
  if (!state.run.question) return "";
  if (current > stage || state.run.response) return "done";
  if (current === stage) return "active";
  return "";
}

function renderThinkingTimeline() {
  const steps = [
    { stage: 0, label: "Receive question", detail: "Capture user intent and selected persona" },
    { stage: 1, label: "AI Orchestrator", detail: "Classify the request and dispatch work" },
    { stage: 2, label: "Evidence retrieval", detail: "Select mapped workbook knowledge sources" },
    { stage: 3, label: "Agent workers", detail: "Run independent sub-agents" },
    { stage: 4, label: "Final answer", detail: "Ground and return the response" },
  ];
  return `
    <section class="thinkingBlock">
      <h3>Orchestration</h3>
      <div class="thinkingTimeline">
        ${steps.map((step, index) => `
          <div class="thinkingStep ${runStageStatus(step.stage)}">
            <span>${index + 1}</span>
            <div><strong>${esc(step.label)}</strong><small>${esc(step.detail)}</small></div>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

function renderThinkingAgents() {
  const nodes = blueprintNodes().filter((node) => !["user", "source", "response"].includes(node.id)).slice(0, 4);
  return `
    <section class="thinkingBlock">
      <h3>Sub-agents</h3>
      <div class="thinkingAgentList">
        ${nodes.map((node, index) => {
          const status = subAgentStatus(3, index, nodes.length);
          return `
            <div class="thinkingAgent ${esc(status.cardClass)}">
              <span class="agentAvatar">${uiIcon(agentIconName(node.label), "agentIcon")}</span>
              <div><strong>${esc(node.label)} Agent</strong><small>${esc(status.phase)}</small></div>
              <b class="agentStatus ${esc(status.className)}">${esc(status.label)}</b>
            </div>
          `;
        }).join("") || `<div class="empty miniEmpty">No sub-agents mapped.</div>`}
      </div>
    </section>
  `;
}

function renderThinkingSources() {
  const sources = runEvidenceSources();
  return `
    <section class="thinkingBlock">
      <h3>Evidence</h3>
      <div class="thinkingSourceList">
        ${sources.map((source) => `
          <div class="thinkingSource ${runStageStatus(2)}">
            ${sourceLogoBadge(source, "bpIcon sourceLogoBadge")}
            <div><strong>${esc(source.KnowledgeSource)}</strong><small>${esc(source.Channel || source.SourceType || "Workbook source")}</small></div>
          </div>
        `).join("") || `<div class="empty miniEmpty">No sources selected.</div>`}
      </div>
    </section>
  `;
}

function renderKnowledgePane() {
  const editable = true;
  const sources = availableSourcesFor();
  const selected = new Set(state.selectedKnowledgeIds);
  return `
    <section class="panel workPane">
      <div class="paneBody">
        <div class="panelHead">
          <div>
            <h3>Knowledge Sources</h3>
          </div>
        </div>
        <div class="sourceList">
          ${sources.map((source) => renderSourceRow(source, selected.has(source.KnowledgeID), editable)).join("") || `<div class="empty">No workbook sources mapped for this persona and capability.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderSourceRow(source, selected, editable) {
  const sourceName = esc(source.KnowledgeSource);
  const sourceMeta = esc(source.SourceType || source.Description || "Workbook source");
  const sourceTag = esc(source.Channel || "Source");
  const sourceTone = sourceToneClass(source);
  const toggleLabel = `${selected ? "Deselect" : "Select"} ${source.KnowledgeSource}`;
  return `
    <article class="sourceRow ${sourceTone} ${selected ? "selected" : "disabled"}" ${editable ? `data-source-toggle="${esc(source.KnowledgeID)}" role="button" aria-pressed="${selected ? "true" : "false"}"` : ""} aria-label="${sourceName} ${selected ? "selected" : "not selected"}">
      <span class="sourceAvatar sourceSelectControl ${selected ? "checked" : ""}" aria-hidden="true">
        ${sourceConnectorIcon(source)}
        <span class="sourceCheckBadge" aria-hidden="true">✓</span>
      </span>
      <div class="sourceContent">
        <div class="sourceTitleLine">
          <h4>${sourceName}</h4>
          ${selected ? `<span class="sourceSelectedPill">Selected</span>` : ""}
        </div>
        <p>${sourceMeta}</p>
      </div>
      <div class="sourceActions">
        <span class="sourceTypePill">${sourceTag}</span>
        <button class="sourceIconButton sourcePreviewButton" data-source-view="${esc(source.KnowledgeID)}" aria-label="Preview ${sourceName}">${redwoodEyeIcon()}</button>
      </div>
    </article>
  `;
}

function sourceConnectorIcon(source) {
  const kind = sourceIconKind(source);
  const icons = {
    outlook: `
      <svg class="sourceBrandIcon outlookIcon" viewBox="0 0 48 48" aria-hidden="true">
        <path d="M30.932 9.343 7.976 23.894 6.002 20.78v-2.684c0-.977.494-1.888 1.314-2.42l13.345-8.659a6.14 6.14 0 0 1 6.685 0z" fill="#20a7fa"></path>
        <path d="m27.14 6.89 10.62 6.882L11.938 30.14l-3.963-6.25 18.951-12.037c1.795-1.14 1.874-3.704.214-4.964" fill="#1880e5"></path>
        <path d="M22.24 33.266 11.938 30.14l21.904-13.885c1.845-1.17 1.84-3.863-.009-5.026l6.852 4.439A2.89 2.89 0 0 1 42 18.09v2.598z" fill="#2052cb"></path>
        <path d="M21.051 42.004h14.697a6.25 6.25 0 0 0 6.25-6.25V18.143c0 1.02-.524 1.968-1.388 2.51L18.75 34.38a4.05 4.05 0 0 0-1.895 3.427 4.197 4.197 0 0 0 4.196 4.197" fill="#0fafff"></path>
        <path d="M27.027 42.002H12.249A6.25 6.25 0 0 1 6 35.752V18.13c0 1.018.523 1.965 1.384 2.508l21.839 13.768a4.115 4.115 0 0 1-2.195 7.596" fill="#29c3ff"></path>
        <rect x="4" y="23" width="16" height="16" rx="3.25" fill="#183dad"></rect>
        <path d="M11.96 35.6q-1.99 0-3.26-1.24-1.27-1.24-1.27-3.24 0-2.11 1.29-3.42 1.29-1.3 3.39-1.3 1.98 0 3.22 1.25 1.25 1.25 1.25 3.29 0 2.1-1.3 3.38-1.28 1.28-3.32 1.28m.04-1.76q1.08 0 1.74-.74.66-.74.66-2.05 0-1.37-.64-2.14-.64-.76-1.71-.76-1.1 0-1.77.79-.67.78-.67 2.07 0 1.31.67 2.07.67.76 1.72.76" fill="#fff"></path>
      </svg>`,
    sharepoint: `
      <svg class="sourceBrandIcon sharepointIcon" viewBox="0 0 32 32" aria-hidden="true">
        <circle cx="15" cy="9.5" fill="#036c70" r="9.5"></circle>
        <circle cx="23.875" cy="17.875" fill="#1a9ba1" r="8.125"></circle>
        <circle cx="16" cy="25.5" fill="#37c6d0" r="6.5"></circle>
        <path d="M1.333 8h13.334A1.333 1.333 0 0 1 16 9.333v13.334A1.333 1.333 0 0 1 14.667 24H1.333A1.333 1.333 0 0 1 0 22.667V9.333A1.333 1.333 0 0 1 1.333 8z" fill="#03787c"></path>
        <path d="M5.67 15.825a2.645 2.645 0 0 1-.822-.87 2.361 2.361 0 0 1-.287-1.19 2.29 2.29 0 0 1 .533-1.541A3.142 3.142 0 0 1 6.51 11.3a5.982 5.982 0 0 1 1.935-.3 7.354 7.354 0 0 1 2.549.357v1.8a3.986 3.986 0 0 0-1.153-.471 5.596 5.596 0 0 0-1.349-.162 2.926 2.926 0 0 0-1.386.293.91.91 0 0 0-.549.833.844.844 0 0 0 .233.59 2.122 2.122 0 0 0 .627.448q.394.196 1.176.52a9.697 9.697 0 0 1 1.652.799 2.654 2.654 0 0 1 .877.883 2.558 2.558 0 0 1 .317 1.332 2.48 2.48 0 0 1-.499 1.605 2.789 2.789 0 0 1-1.335.896A6.049 6.049 0 0 1 7.703 21a10.028 10.028 0 0 1-1.722-.142 5.912 5.912 0 0 1-1.4-.404v-1.902a4.5 4.5 0 0 0 1.416.675 5.513 5.513 0 0 0 1.558.25 2.68 2.68 0 0 0 1.413-.3.947.947 0 0 0 .475-.847.904.904 0 0 0-.266-.648 2.704 2.704 0 0 0-.735-.512q-.469-.236-1.386-.62a7.86 7.86 0 0 1-1.386-.725z" fill="#fff"></path>
      </svg>`,
    slack: `
      <svg class="sourceBrandIcon slackIcon" viewBox="0 0 2447.6 2452.5" aria-hidden="true">
        <path d="m897.4 0c-135.3.1-244.8 109.9-244.7 245.2-.1 135.3 109.5 245.1 244.8 245.2h244.8v-245.1c.1-135.3-109.5-245.1-244.9-245.3m0 654h-652.6c-135.3.1-244.9 109.9-244.8 245.2-.2 135.3 109.4 245.1 244.7 245.3h652.7c135.3-.1 244.9-109.9 244.8-245.2.1-135.4-109.5-245.2-244.8-245.3z" fill="#36c5f0"></path>
        <path d="m2447.6 899.2c.1-135.3-109.5-245.1-244.8-245.2-135.3.1-244.9 109.9-244.8 245.2v245.3h244.8c135.3-.1 244.9-109.9 244.8-245.3zm-652.7 0v-654c.1-135.2-109.4-245-244.7-245.2-135.3.1-244.9 109.9-244.8 245.2v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.3z" fill="#2eb67d"></path>
        <path d="m1550.1 2452.5c135.3-.1 244.9-109.9 244.8-245.2.1-135.3-109.5-245.1-244.8-245.2h-244.8v245.2c-.1 135.2 109.5 245 244.8 245.2zm0-654.1h652.7c135.3-.1 244.9-109.9 244.8-245.2.2-135.3-109.4-245.1-244.7-245.3h-652.7c-135.3.1-244.9 109.9-244.8 245.2-.1 135.4 109.4 245.2 244.7 245.3z" fill="#ecb22e"></path>
        <path d="m0 1553.2c-.1 135.3 109.5 245.1 244.8 245.2 135.3-.1 244.9-109.9 244.8-245.2v-245.2h-244.8c-135.3.1-244.9 109.9-244.8 245.2zm652.7 0v654c-.2 135.3 109.4 245.1 244.7 245.3 135.3-.1 244.9-109.9 244.8-245.2v-653.9c.2-135.3-109.4-245.1-244.7-245.3-135.4 0-244.9 109.8-244.8 245.1" fill="#e01e5a"></path>
      </svg>`,
    jira: `
      <svg class="sourceBrandIcon jiraIcon" viewBox="0 0 255.324 255.324" aria-hidden="true">
        <path d="M244.658 0H121.707a55.502 55.502 0 0 0 55.502 55.502h22.649V77.37c.02 30.625 24.841 55.447 55.466 55.467V10.666C255.324 4.777 250.55 0 244.658 0z" fill="#2684ff"></path>
        <path d="M183.822 61.262H60.872c.019 30.625 24.84 55.447 55.466 55.467h22.649v21.938c.039 30.625 24.877 55.43 55.502 55.43V71.93c0-5.891-4.776-10.667-10.667-10.667z" fill="#0052cc"></path>
        <path d="M122.951 122.489H0c0 30.653 24.85 55.502 55.502 55.502h22.72v21.867c.02 30.597 24.798 55.408 55.396 55.466V133.156c0-5.891-4.776-10.667-10.667-10.667z" fill="#2684ff"></path>
      </svg>`,
    docs: `
      <svg class="sourceBrandIcon docsIcon" viewBox="0 0 1818.2 2500" aria-hidden="true">
        <path d="M1136.4 0H170.4C79.6 0 0 79.5 0 170.5v2159.1c0 90.9 79.5 170.5 170.5 170.5h1477.3c90.9 0 170.5-79.5 170.5-170.5V681.8l-397.7-284.1z" fill="#4285f4"></path>
        <path d="M454.5 1818.2h909.1v-113.6H454.6zm0 227.3h681.8v-113.6H454.5zM454.5 1250v113.6h909.1V1250zm0 340.9h909.1v-113.6H454.6z" fill="#f1f1f1"></path>
        <path d="M1136.4 0v511.4c0 90.9 79.5 170.4 170.4 170.4h511.4z" fill="#a1c2fa"></path>
      </svg>`,
    pdf: `
      <svg class="sourceBrandIcon pdfIcon" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#e53935" d="M38 42H10c-2.2 0-4-1.8-4-4V10c0-2.2 1.8-4 4-4h28c2.2 0 4 1.8 4 4v28c0 2.2-1.8 4-4 4z"></path>
        <path fill="#fff" d="M34.8 26.8c-1.7-1.8-6.3-1-7.4-.9-1.6-1.6-2.7-3.5-3.1-4.1.6-1.8 1-3.5 1-5.4 0-1.6-.7-3.4-2.5-3.4-1.9 0-2 2.3-2 3.2.1 1.3.5 3 1.2 4.6-.7 2-1.4 4-3.2 7.4-1.2.5-3.2 1.4-4.6 2.5-1.1.8-2.4 2.2-1 3.7 1.1 1.1 2.8.5 4-.4 1.5-1.2 2.9-3.3 4-5.2 1.4-.5 3.5-1.1 5.7-1.5 2.5 2.2 4.8 2.5 5.9 2.5 1.6 0 2.1-.7 2.3-1.2.4-.5.2-1.3-.3-1.8zM33.2 27.9c-.1.5-.7.9-1.7.7-1.2-.3-2.3-.9-3.3-1.7.8-.1 2.7-.3 4.1-.1.5.2 1.1.5.9 1.1zM22.9 14.2c.6 0 .7.7.7 1.3-.1 1.4-.3 2.7-.8 4-.6-1.7-.8-3.1-.7-4 0-.4.2-1.3.8-1.3zM22.2 27.2c.5-1 1.2-2.9 1.5-3.6.6 1 1.6 2.1 2.1 2.7 0-.1-2 .3-3.6.9zM18.4 29.8c-3.1 5-4.2 4-4.3 3.9-.2-.2-1.3-1.4 4.3-3.9z"></path>
      </svg>`,
    excel: `
      <svg class="sourceBrandIcon excelIcon" viewBox="0 0 32 32" aria-hidden="true">
        <path d="M20 2H9.333A1.333 1.333 0 0 0 8 3.333V9l12 7 6 2.532L32 16V9z" fill="#21a366"></path>
        <path fill="#107c41" d="M8 9h12v7H8z"></path>
        <path d="M30.667 2H20v7h12V3.333A1.333 1.333 0 0 0 30.667 2z" fill="#33c481"></path>
        <path d="M20 16H8v12.667A1.333 1.333 0 0 0 9.333 30h21.334A1.333 1.333 0 0 0 32 28.667V23z" fill="#185c37"></path>
        <path fill="#107c41" d="M20 16h12v7H20z"></path>
        <path d="M1.333 8h13.334A1.333 1.333 0 0 1 16 9.333v13.334A1.333 1.333 0 0 1 14.667 24H1.333A1.333 1.333 0 0 1 0 22.667V9.333A1.333 1.333 0 0 1 1.333 8z" fill="#107c41"></path>
        <path d="m3.533 21 3.236-5.014L3.805 11H6.19l1.618 3.187q.223.453.307.676h.021q.16-.362.335-.704L10.2 11h2.189l-3.04 4.958L12.466 21h-2.33l-1.869-3.5a2.922 2.922 0 0 1-.223-.468h-.028a2.207 2.207 0 0 1-.216.453L5.877 21z" fill="#fff"></path>
      </svg>`,
    audio: `
      <svg class="sourceBrandIcon audioIcon" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="12" y="5" width="8" height="15" rx="4" fill="#d86b2f"></rect>
        <path d="M8 16a8 8 0 0 0 16 0M16 24v4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"></path>
      </svg>`,
    video: `
      <svg class="sourceBrandIcon videoIcon" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="6" y="9" width="15" height="14" rx="3" fill="#7d4f96"></rect>
        <path d="m21 14 6-4v12l-6-4z" fill="#ad7bc7"></path>
        <circle cx="12" cy="16" r="2" fill="#fff"></circle>
      </svg>`,
    database: `
      <svg class="sourceBrandIcon databaseIcon" viewBox="0 0 32 32" aria-hidden="true">
        <ellipse cx="16" cy="8" rx="10" ry="4" fill="#6a7334"></ellipse>
        <path d="M6 8v12c0 2.2 4.5 4 10 4s10-1.8 10-4V8" fill="#8a944d"></path>
        <path d="M6 14c0 2.2 4.5 4 10 4s10-1.8 10-4" stroke="#fff" stroke-width="1.5" opacity=".8" fill="none"></path>
      </svg>`,
  };
  return icons[kind] || icons.docs;
}

function sourceLogoBadge(source, className = "sourceLogoBadge") {
  return `<span class="${esc(className)}" aria-hidden="true">${sourceConnectorIcon(source)}</span>`;
}

function sourceIconKind(source) {
  const name = text(source.KnowledgeSource).toLowerCase();
  const type = text(source.SourceType).toLowerCase();
  const channel = text(source.Channel).toLowerCase();
  const primary = `${name} ${type}`;
  if (name.includes("sharepoint") || name.includes("portal") || type.includes("site")) return "sharepoint";
  if (name.includes("email") || name.includes("mailbox") || name.includes("outlook")) return "outlook";
  if (name.includes("slack")) return "slack";
  if (name.includes("jira") || primary.includes("issue")) return "jira";
  if (primary.includes("csv") || primary.includes("dataset") || primary.includes("spreadsheet")) return "excel";
  if (primary.includes("audio") || primary.includes("voice") || primary.includes("recording")) return "audio";
  if (primary.includes("video") || primary.includes("cctv") || primary.includes("drone")) return "video";
  if (primary.includes("database") || primary.includes("sql")) return "database";
  if (primary.includes("pdf")) return "pdf";
  if (primary.includes("doc") || primary.includes("contract") || primary.includes("policy") || primary.includes("sop")) return "docs";
  if (channel.includes("slack")) return "slack";
  if (channel.includes("email")) return "outlook";
  if (channel.includes("csv")) return "excel";
  return "docs";
}

function sourceToneClass(source) {
  const value = `${source.Channel || ""} ${source.SourceType || ""} ${source.KnowledgeSource || ""}`.toLowerCase();
  if (value.includes("email")) return "sourceToneEmail";
  if (value.includes("slack") || value.includes("chat")) return "sourceToneSlack";
  if (value.includes("jira") || value.includes("issue")) return "sourceToneJira";
  if (value.includes("csv") || value.includes("dataset") || value.includes("data")) return "sourceToneData";
  if (value.includes("audio") || value.includes("voice")) return "sourceToneAudio";
  if (value.includes("video") || value.includes("cctv") || value.includes("drone")) return "sourceToneVideo";
  if (value.includes("sharepoint") || value.includes("portal") || value.includes("site")) return "sourceTonePortal";
  return "sourceToneDoc";
}

function redwoodEyeIcon() {
  return `
    <svg class="redwoodIcon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M2.75 12s3.45-5.75 9.25-5.75S21.25 12 21.25 12 17.8 17.75 12 17.75 2.75 12 2.75 12Z"></path>
      <circle cx="12" cy="12" r="2.65"></circle>
    </svg>
  `;
}

function uiIcon(name, className = "buttonIcon") {
  const icons = {
    settings: `<path d="M12 8.2a3.8 3.8 0 1 0 0 7.6 3.8 3.8 0 0 0 0-7.6Z"></path><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.04.04a2.06 2.06 0 0 1-2.91 2.91l-.04-.04A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .56V20a2 2 0 0 1-4 0v-.06a1.7 1.7 0 0 0-1-.56 1.7 1.7 0 0 0-1.88.34l-.04.04a2.06 2.06 0 0 1-2.91-2.91l.04-.04A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.56-1H4a2 2 0 0 1 0-4h.06a1.7 1.7 0 0 0 .56-1 1.7 1.7 0 0 0-.34-1.88l-.04-.04a2.06 2.06 0 0 1 2.91-2.91l.04.04A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.56V4a2 2 0 0 1 4 0v.06a1.7 1.7 0 0 0 1 .56 1.7 1.7 0 0 0 1.88-.34l.04-.04a2.06 2.06 0 0 1 2.91 2.91l-.04.04A1.7 1.7 0 0 0 19.4 9c.2.34.38.68.56 1H20a2 2 0 0 1 0 4h-.06a1.7 1.7 0 0 0-.56 1Z"></path>`,
    user: `<circle cx="12" cy="8" r="4"></circle><path d="M4.5 21a7.5 7.5 0 0 1 15 0"></path>`,
    message: `<path d="M5 6.5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 3v-13a2 2 0 0 1 2-2Z"></path><path d="M8 11h8"></path><path d="M8 14.5h5"></path>`,
    download: `<path d="M12 3v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>`,
    award: `<circle cx="12" cy="8" r="5"></circle><path d="m8.5 12.5-1 7 4.5-2.5 4.5 2.5-1-7"></path>`,
    close: `<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>`,
    image: `<rect x="4" y="5" width="16" height="14" rx="2"></rect><circle cx="9" cy="10" r="1.5"></circle><path d="m8 17 3.5-4 2.5 3 1.5-2 2.5 3"></path>`,
    upload: `<path d="M12 16V5"></path><path d="m7 10 5-5 5 5"></path><path d="M5 20h14"></path>`,
    folder: `<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"></path>`,
    list: `<path d="M8 6h13"></path><path d="M8 12h13"></path><path d="M8 18h13"></path><path d="M3 6h.01"></path><path d="M3 12h.01"></path><path d="M3 18h.01"></path>`,
    bot: `<rect x="5" y="8" width="14" height="10" rx="3"></rect><path d="M12 8V4"></path><circle cx="9" cy="13" r="1"></circle><circle cx="15" cy="13" r="1"></circle><path d="M9 18v2"></path><path d="M15 18v2"></path>`,
    database: `<ellipse cx="12" cy="5" rx="7" ry="3"></ellipse><path d="M5 5v6c0 1.66 3.13 3 7 3s7-1.34 7-3V5"></path><path d="M5 11v6c0 1.66 3.13 3 7 3s7-1.34 7-3v-6"></path>`,
    search: `<circle cx="10.5" cy="10.5" r="5.5"></circle><path d="m15 15 5 5"></path>`,
    vector: `<circle cx="6" cy="7" r="2"></circle><circle cx="18" cy="7" r="2"></circle><circle cx="12" cy="17" r="2"></circle><path d="M8 8.5 11 15"></path><path d="m16 8.5-3 6.5"></path><path d="M8 7h8"></path>`,
    brain: `<path d="M9 4.5a3 3 0 0 0-3 3v.2A3.5 3.5 0 0 0 4 11a3.4 3.4 0 0 0 2 3.1V16a3 3 0 0 0 5 2.2V5.8A3 3 0 0 0 9 4.5Z"></path><path d="M15 4.5a3 3 0 0 1 3 3v.2a3.5 3.5 0 0 1 2 3.3 3.4 3.4 0 0 1-2 3.1V16a3 3 0 0 1-5 2.2V5.8a3 3 0 0 1 2-1.3Z"></path>`,
    fileText: `<path d="M6 3h8l4 4v14H6z"></path><path d="M14 3v5h5"></path><path d="M8.5 12h7"></path><path d="M8.5 16h7"></path>`,
    scan: `<path d="M4 8V5a1 1 0 0 1 1-1h3"></path><path d="M16 4h3a1 1 0 0 1 1 1v3"></path><path d="M20 16v3a1 1 0 0 1-1 1h-3"></path><path d="M8 20H5a1 1 0 0 1-1-1v-3"></path><path d="M7 12h10"></path>`,
    code: `<path d="m9 8-4 4 4 4"></path><path d="m15 8 4 4-4 4"></path><path d="m13 5-2 14"></path>`,
    chart: `<path d="M4 19V5"></path><path d="M4 19h16"></path><rect x="7" y="11" width="3" height="5" rx=".7"></rect><rect x="12" y="8" width="3" height="8" rx=".7"></rect><rect x="17" y="6" width="3" height="10" rx=".7"></rect>`,
    mic: `<rect x="9" y="3" width="6" height="11" rx="3"></rect><path d="M5 11a7 7 0 0 0 14 0"></path><path d="M12 18v3"></path>`,
    video: `<rect x="4" y="6" width="11" height="12" rx="2"></rect><path d="m15 10 5-3v10l-5-3z"></path>`,
    tag: `<path d="M20 13 13 20 4 11V4h7l9 9Z"></path><circle cx="8.5" cy="8.5" r="1.2"></circle>`,
    chevronRight: `<path d="m9 18 6-6-6-6"></path>`,
  };
  return `<span class="${esc(className)}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${icons[name] || icons.download}</svg></span>`;
}

function oracleWordmark() {
  return `
    <svg viewBox="0 0 132 24" role="img" focusable="false" aria-label="Oracle">
      <text x="66" y="17" text-anchor="middle">ORACLE</text>
    </svg>
  `;
}

function agentIconName(label = "") {
  const value = label.toLowerCase();
  if (value.includes("retriev") || value.includes("search")) return "search";
  if (value.includes("vector") || value.includes("knowledge processing")) return "vector";
  if (value.includes("genai") || value.includes("llm") || value.includes("reason") || value.includes("inference")) return "brain";
  if (value.includes("extract")) return "scan";
  if (value.includes("validat") || value.includes("compliance")) return "shield";
  if (value.includes("upload")) return "upload";
  if (value.includes("ocr") || value.includes("vision")) return "scan";
  if (value.includes("understanding") || value.includes("document")) return "fileText";
  if (value.includes("sql") || value.includes("query")) return "code";
  if (value.includes("database")) return "database";
  if (value.includes("result") || value.includes("insight") || value.includes("analysis")) return "chart";
  if (value.includes("audio") || value.includes("speech")) return "mic";
  if (value.includes("video")) return "video";
  if (value.includes("classif") || value.includes("risk") || value.includes("intent")) return "tag";
  return "bot";
}

function renderBlueprintPane(blueprint) {
  return `
    <section class="panel blueprintArea">
      <div class="paneBody" style="border-bottom: 1px solid var(--line)">
        <div class="panelHead">
          <div>
            <h3>${esc(patternById()?.PatternName || "Selected capability")}</h3>
            <p>${esc(blueprint?.BlueprintTheme || "Workbook mapped architecture")}</p>
          </div>
          <div class="canvasActions">
            ${renderSourceRailButton()}
          </div>
        </div>
      </div>
      <div class="canvas">
        ${renderKnowledgeSourceRail()}
        ${renderBranchedBlueprint()}
      </div>
      ${renderRuntime()}
    </section>
  `;
}

function renderSourceRailButton() {
  const count = selectedSources().length;
  return `
    <button class="canvasToolButton" type="button" data-source-rail-toggle aria-expanded="${state.sourceRailOpen ? "true" : "false"}">
      ${uiIcon("database", "iconBox")}<span>Sources</span><b>${count}</b>
    </button>
  `;
}

function renderKnowledgeSourceRail() {
  const editable = true;
  const sources = availableSourcesFor();
  const selected = new Set(state.selectedKnowledgeIds);
  return `
    <aside class="sourceRail ${state.sourceRailOpen ? "open" : ""}" aria-label="Knowledge Sources">
      ${state.sourceRailOpen ? `
        <div class="sourceRailPanel">
          <div class="sourceRailHead">
            <div>
              <strong>Knowledge Sources</strong>
              <small>Used only when you need to inspect evidence</small>
            </div>
            <button class="sourceIconButton" type="button" data-source-rail-toggle aria-label="Hide knowledge sources">${uiIcon("close", "traceCloseIcon")}</button>
          </div>
          <div class="sourceList compactSourceList">
            ${sources.map((source) => renderSourceRow(source, selected.has(source.KnowledgeID), editable)).join("") || `<div class="empty">No workbook sources mapped for this persona and capability.</div>`}
          </div>
        </div>
      ` : ""}
    </aside>
  `;
}

function renderBranchedBlueprint() {
  const nodes = blueprintNodes();
  const userNode = nodes.find((node) => node.id === "user") || nodes[0] || { label: "User", detail: "Persona question" };
  const responseNode = nodes.find((node) => node.id === "response") || nodes[nodes.length - 1] || { label: "Response", detail: "Grounded answer" };
  const workerNodes = nodes.filter((node) => !["user", "source", "response"].includes(node.id));
  const sources = selectedSources();
  return `
    <div class="branchFlow horizontal">
      ${renderFlowNode(userNode, 0)}
      ${renderFlowConnector(0)}
      ${renderFlowNode({ label: "AI Orchestrator", detail: "Classifies intent and dispatches selected branches" }, 1, "orchestrator")}
      ${renderFlowConnector(1)}
      ${renderSourceConstellation(sources, 2)}
      ${renderFlowConnector(2)}
      ${renderAgentWorkerSwarm(workerNodes.slice(0, 4), 3)}
      ${renderFlowConnector(3)}
      ${renderFlowNode(responseNode, 4, "response")}
    </div>
  `;
}

function flowStageClass(stage) {
  const current = state.run.running ? visualStepFromElapsed(runElapsed()) : state.run.currentStep;
  const active = current === stage;
  const done = current > stage || (!state.run.running && state.run.response && current >= stage);
  return `${active ? "active" : ""} ${done ? "done" : ""}`;
}

function renderFlowNode(node, stage, extraClass = "") {
  return `
    <div class="bpNode flowNode ${extraClass} ${flowStageClass(stage)}">
      <span class="bpIcon bpSemanticIconWrap">${uiIcon(flowNodeIconName(node, extraClass), "bpSemanticIcon")}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
  `;
}

function flowNodeIconName(node, extraClass = "") {
  const label = text(node.label).toLowerCase();
  if (extraClass === "orchestrator") return "bot";
  if (extraClass === "response" || node.id === "response" || label.includes("response") || label.includes("answer")) return "message";
  if (node.id === "user" || label === "user") return "user";
  return agentIconName(node.label);
}

function renderSourceBranch(source, stage) {
  const status = sourceVisualStatus(stage);
  return `
    <div class="branchCard sourceBranch ${flowStageClass(stage)}">
      ${sourceLogoBadge(source, "bpIcon sourceLogoBadge")}
      <span><strong>${esc(source.KnowledgeSource)}</strong><small>${esc(status || source.Channel || source.SourceType || "Workbook source")}</small></span>
    </div>
  `;
}

function sourceVisualStatus(stage) {
  const current = state.run.running ? visualStepFromElapsed(runElapsed()) : state.run.currentStep;
  if (!state.run.question || current < stage) return "";
  if (current === stage) return "Retrieving evidence...";
  return "Evidence selected";
}

function renderSourceConstellation(sources, stage) {
  const sourceCount = Math.max(1, sources.length);
  return `
    <div class="sourceConstellation ${flowStageClass(stage)}" style="--source-count: ${sourceCount}">
      <div class="branchGroupTitle">Evidence retrieval</div>
      <div class="sourceChipGrid">
        ${sources.map((source) => renderSourceBranch(source, stage)).join("") || `<div class="empty miniEmpty">Select one or more knowledge sources.</div>`}
      </div>
    </div>
  `;
}

function renderWorkerBranch(node, stage) {
  const index = Number(node.__agentIndex || 0);
  const total = Number(node.__agentTotal || 1);
  const status = subAgentStatus(stage, index, total);
  const steps = subAgentStepClasses(status.progress);
  return `
    <div class="subAgentCard ${esc(status.cardClass)}" style="--agent-progress: ${status.progress}%">
      <div class="subAgentMain">
        <span class="agentAvatar">${uiIcon(agentIconName(node.label), "agentIcon")}</span>
        <span class="subAgentText"><strong>${esc(node.label)} Agent</strong><small>${esc(node.detail)}</small></span>
        <span class="agentStatus ${esc(status.className)}">${esc(status.label)}</span>
      </div>
      <div class="agentSignal">
        <span class="${steps[0]}"></span><span class="${steps[1]}"></span><span class="${steps[2]}"></span>
      </div>
      <div class="agentProgressTrack"><span></span></div>
      <div class="agentPhase">${esc(status.phase)}</div>
    </div>
  `;
}

function renderAgentWorkerSwarm(nodes, stage) {
  const groupClass = agentSwarmStatusClass(nodes, stage);
  return `
    <section class="agentSwarm agentCount${nodes.length || 0} ${groupClass}" aria-label="Agent Worker Branches">
      <div class="agentSwarmHead">
        <div>
          <span>Agent Worker Branches</span>
          <strong>Independent sub-agent execution</strong>
        </div>
        <b>${nodes.length || 0} agents</b>
      </div>
      <div class="subAgentGrid">
        ${nodes.map((node, index) => renderWorkerBranch({ ...node, __agentIndex: index, __agentTotal: nodes.length }, stage)).join("") || `<div class="empty miniEmpty">No worker agents mapped for this capability</div>`}
      </div>
    </section>
  `;
}

function agentSwarmStatusClass(nodes, stage) {
  if (!nodes.length) return flowStageClass(stage);
  const statuses = nodes.map((_, index) => subAgentStatus(stage, index, nodes.length));
  if (statuses.every((status) => status.cardClass === "done")) return "done";
  if (statuses.some((status) => status.cardClass === "active")) return "active";
  if (statuses.some((status) => status.cardClass === "queued")) return "queued";
  return flowStageClass(stage);
}

function subAgentStatus(stage, index = 0, total = 1) {
  if (!state.run.question) return { label: "Ready", className: "", cardClass: "", progress: 0, phase: "Waiting for query" };
  const elapsed = runElapsed();
  const start = 2100 + index * 360;
  const duration = Math.max(1450, 2350 - total * 130);
  const progress = clampPercent(Math.round(((elapsed - start) / duration) * 100));
  if (state.run.response || progress >= 100) {
    return { label: "Complete", className: "done", cardClass: "done", progress: 100, phase: "Returned result" };
  }
  if (progress > 0) {
    const phase = progress < 34 ? "Reading context" : progress < 70 ? "Reasoning independently" : "Returning result";
    return { label: "Running", className: "running", cardClass: "active", progress, phase };
  }
  const current = state.run.running ? visualStepFromElapsed(elapsed) : state.run.currentStep;
  return {
    label: current >= stage ? "Queued" : "Ready",
    className: current >= stage ? "queued" : "",
    cardClass: current >= stage ? "queued" : "",
    progress: 0,
    phase: current >= stage ? "Waiting for dispatch" : "Waiting for query",
  };
}

function subAgentStepClasses(progress) {
  if (progress >= 100) return ["done", "done", "done"];
  const activeThresholds = [18, 52, 86];
  const doneThresholds = [34, 70, 100];
  return activeThresholds.map((threshold, index) => {
    if (progress >= doneThresholds[index]) return "done";
    if (progress >= threshold) return "active";
    return index === 0 && progress > 0 ? "active" : "";
  });
}

function renderBranchGroup(title, cards, stage, className) {
  return `
    <div class="branchGroup ${className} ${flowStageClass(stage)}">
      <div class="branchGroupTitle">${esc(title)}</div>
      <div class="branchGrid">
        ${cards || `<div class="empty miniEmpty">Select one or more knowledge sources.</div>`}
      </div>
    </div>
  `;
}

function renderFlowConnector(stage) {
  const current = state.run.running ? visualStepFromElapsed(runElapsed()) : state.run.currentStep;
  return `<div class="edge flowConnector ${current > stage ? "active" : ""} ${current === stage ? "live" : ""}"><span></span></div>`;
}

function renderForkConnector(stage) {
  return `<div class="forkConnector ${state.run.currentStep > stage ? "active" : ""}"></div>`;
}

function renderMergeConnector(stage) {
  return `<div class="mergeConnector ${state.run.currentStep > stage ? "active" : ""}"></div>`;
}

function renderBlueprintNode(node, index, total) {
  const current = state.run.currentStep;
  const active = current === index;
  const done = current > index || (!state.run.running && state.run.response && current >= index);
  const edgeActive = current > index;
  return `
    <div class="bpNode ${active ? "active" : ""} ${done ? "done" : ""}">
      <span class="bpIcon bpSemanticIconWrap">${uiIcon(agentIconName(node.label), "bpSemanticIcon")}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
    ${index < total - 1 ? `<div class="edge ${edgeActive ? "active" : ""}"></div>` : ""}
  `;
}

function renderRuntime() {
  const steps = runtimeSteps();
  const nodeCount = blueprintNodes().length;
  const current = state.run.currentStep;
  const status = state.run.running ? "Running" : state.run.response ? "Complete" : "Idle";
  const statusClass = state.run.running ? "amber" : state.run.response ? "green" : "";
  const summary = state.run.running ? "Blueprint is executing." : state.run.response ? `Completed in ${state.run.durationMs} ms.` : "Run a question to animate the path.";
  return `
    <div class="runtime ${state.traceOpen ? "open" : ""}">
      <button class="traceToggle" type="button" data-trace-toggle aria-expanded="${state.traceOpen ? "true" : "false"}">
        ${uiIcon("list", "iconBox")}
        <span>Execution Trace</span>
        <b class="pill ${statusClass}">${esc(status)}</b>
      </button>
      ${state.traceOpen ? `
        <section class="tracePopover" aria-label="Execution Trace">
          <div class="panelHead">
            <div>
              <h4>Execution Trace</h4>
              <p class="small">${esc(summary)}</p>
            </div>
            <button class="sourceIconButton" type="button" data-trace-toggle aria-label="Close execution trace">${uiIcon("close", "traceCloseIcon")}</button>
          </div>
          <div class="trace">
            ${steps.map((step, index) => `<div class="traceRow ${current >= Math.min(index + 1, nodeCount - 1) ? "done" : ""}"><span class="traceDot">${index + 1}</span><span>${esc(step)}</span></div>`).join("")}
          </div>
        </section>
      ` : ""}
    </div>
  `;
}

function renderChatPane() {
  const qs = runSuggestedQuestions();
  const hasRun = Boolean(state.run.question);
  const hasFollowUps = hasRun && qs.some((q) => isFollowUpQuestionId(q.QnAID));
  const chatbotName = state.workerName.trim() || "Digital Worker";
  return `
    <aside class="panel chatPanel redwoodChat">
      <header class="chatHeader">
        <span class="chatHeaderIcon">${esc(shortCode(chatbotName))}</span>
        <strong>${esc(chatbotName)}</strong>
      </header>
      <div class="chatThread">
        <div class="chatMessage agentMessage">
          <span class="chatAvatar">${esc(shortCode(chatbotName))}</span>
          <div class="messageStack">
            <div class="bubble agent">Hello. I am ${esc(chatbotName)}. I am ready to test this blueprint.</div>
            <span class="chatTime">${esc(chatbotName)} test</span>
          </div>
        </div>
        ${renderMessages()}
        <div class="suggestedTitle">${hasFollowUps ? "Follow-up questions" : hasRun ? "Try another question" : "Suggested questions"}</div>
        <div class="promptList chatPromptList">
          ${qs.map((q) => `<button class="prompt" data-run-question="${esc(q.QnAID)}"><span>${esc(q.Question)}</span><b aria-hidden="true">&rsaquo;</b></button>`).join("") || `<div class="empty">No questions mapped for this scenario.</div>`}
        </div>
      </div>
      <div class="chatComposerBar">
        <textarea id="customQuestion" class="chatInput" placeholder="Type your message..." rows="1">${esc(state.customQuestion)}</textarea>
        <button class="sendButton" data-run-custom aria-label="Run custom question">
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 20.5 21 12 3.5 3.5 6.25 10.9 14 12l-7.75 1.1-2.75 7.4Z"></path></svg>
        </button>
      </div>
    </aside>
  `;
}

function renderMessages() {
  if (!state.run.question) return "";
  return `
    <div class="chatMessage userMessage">
      <div class="messageStack alignEnd">
        <div class="bubble user">${esc(state.run.question)}</div>
        <span class="chatTime">${state.run.running ? "Running" : "Now"}</span>
      </div>
    </div>
    <div class="chatMessage agentMessage">
      <span class="chatAvatar">AI</span>
      <div class="messageStack">
        ${state.run.response ? `<div class="bubble agent">${esc(state.run.response)}</div>` : `<div class="bubble agent">Executing blueprint path. Nodes light up sequentially in the center panel.</div>`}
        <span class="chatTime">${state.run.response ? `Completed in ${state.run.durationMs} ms` : "Working"}</span>
      </div>
    </div>
  `;
}

function renderLeaderboard() {
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Leaderboard + Download Blueprint</div>
          <h1>Leader Board</h1>
        </div>
      </div>
      <section class="panel pad">
        ${renderLeaderboardTable()}
      </section>
      ${renderRouteActions("Start Over", "&rarr;")}
    </section>
  `;
}

function renderLeaderboardTable() {
  const rows = sortedLeaderboardRows();
  if (!rows.length) return `<div class="empty">No leaderboard rows yet. Complete a Run Agent test to create a ranking.</div>`;
  const pageCount = Math.max(1, Math.ceil(rows.length / LEADERBOARD_PAGE_SIZE));
  const page = Math.min(Math.max(state.leaderboardPage, 0), pageCount - 1);
  state.leaderboardPage = page;
  const start = page * LEADERBOARD_PAGE_SIZE;
  const visibleRows = rows.slice(start, start + LEADERBOARD_PAGE_SIZE);
  return `
    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>User</th><th>Persona</th><th>Digital Worker Name</th><th>Capability</th><th>Benefits</th><th>Downloads</th>
          </tr>
        </thead>
        <tbody>
          ${visibleRows.map((row, index) => `
            <tr>
              <td>${esc(row.user)}</td>
              <td>${esc(row.persona)}</td>
              <td>${esc(row.digitalWorkerName || row.payload?.digitalWorkerName || row.blueprintName)}</td>
              <td>${esc(row.pattern)}</td>
              <td>
                <button class="iconMiniButton" data-benefits data-leader-index="${start + index}" aria-label="Show digital worker benefits">
                  ${uiIcon("chart", "miniIcon")}
                </button>
              </td>
              <td><button class="miniButton" data-download-qr data-leader-index="${start + index}">Download Blueprint</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
    ${renderLeaderboardPagination(rows.length, page, pageCount)}
  `;
}

function renderLeaderboardPagination(totalRows, page, pageCount) {
  const start = page * LEADERBOARD_PAGE_SIZE + 1;
  const end = Math.min(totalRows, start + LEADERBOARD_PAGE_SIZE - 1);
  return `
    <div class="leaderPagination">
      <span>Showing ${start}-${end} of ${totalRows}</span>
      <div>
        <button class="miniButton" data-leader-page="${page - 1}" ${page <= 0 ? "disabled" : ""}>Previous</button>
        <b>Page ${page + 1} of ${pageCount}</b>
        <button class="miniButton" data-leader-page="${page + 1}" ${page >= pageCount - 1 ? "disabled" : ""}>Next</button>
      </div>
    </div>
  `;
}

function renderModal() {
  if (state.runSuccessOpen) return renderRunSuccessModal();
  if (state.settingsOpen) return renderSettingsModal();
  if (state.downloadModalOpen) return renderDownloadModal();
  if (state.benefitsPayload) return renderBenefitsModal();
  if (state.docViewerSourceId) return renderDocumentViewerModal();
  if (!state.modalSourceId) return "";
  const source = sourceById(state.modalSourceId);
  if (!source) return "";
  const files = filesForSource(source);
  const previewKind = sourcePreviewKind(source);
  return `
    <div class="modalBackdrop" data-modal-close>
      <section class="modal" role="dialog" aria-modal="true" aria-label="Knowledge source preview">
        <header class="modalHead">
          <div>
            <div class="eyebrow">Knowledge Source Preview</div>
            <h2>${esc(source.KnowledgeSource)}</h2>
            <p>${esc(source.Description)}</p>
          </div>
          <button class="action secondary" data-modal-close>${uiIcon("close", "iconBox")}<span>Close</span></button>
        </header>
        <div class="modalBody">
          <div class="sourcePreviewLayout">
            <section class="previewBox sourcePreviewBox">
              ${renderFocusedSourcePreview(source, previewKind, files)}
            </section>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderRunSuccessModal() {
  const workerName = state.workerName.trim() || "Digital Co Worker";
  const benefits = benefitsForPayload(blueprintPayload());
  return `
    <div class="modalBackdrop runSuccessBackdrop" data-modal-close>
      <section class="modal runSuccessModal" role="dialog" aria-modal="true" aria-label="Agent test successful">
        <button class="runSuccessClose" type="button" data-modal-close aria-label="Close success message">
          ${uiIcon("close", "miniIcon")}
        </button>
        <div class="runSuccessHero">
          <span class="runSuccessBadge">${uiIcon("award", "successBadgeIcon")}</span>
          <p class="runSuccessEyebrow">Congratulations</p>
          <h2>Digital Co Worker creation is successful</h2>
          <p class="runSuccessLead">Wow, you have successfully tested the Digital Co Worker - ${esc(workerName)}.</p>
        </div>
        <div class="runSuccessBody">
          <section class="runSuccessBenefits" aria-label="Digital co-worker benefits">
            <div class="runSuccessBenefitHead">
              <div class="eyebrow">Benefits</div>
              <h3>What this Digital Co Worker helped automate</h3>
              <p>${esc(benefits.summary)}</p>
            </div>
            ${renderBenefitDetails(benefits)}
          </section>
          <p>Continue will save this run to the leaderboard.</p>
          <button class="action primary runSuccessContinue" data-run-success-continue>Continue &rarr;</button>
        </div>
      </section>
    </div>
  `;
}

function renderBenefitsModal() {
  const payload = state.benefitsPayload || {};
  const benefits = benefitsForPayload(payload);
  return `
    <div class="modalBackdrop" data-modal-close>
      <section class="modal benefitsModal" role="dialog" aria-modal="true" aria-label="Digital worker benefits">
        <header class="modalHead">
          <div>
            <div class="eyebrow">Agent Benefits</div>
            <h2>${esc(benefits.workerName)}</h2>
            <p>${esc(benefits.summary)}</p>
          </div>
          <button class="action secondary" data-modal-close>${uiIcon("close", "iconBox")}<span>Close</span></button>
        </header>
        <div class="modalBody">
          ${renderBenefitDetails(benefits)}
        </div>
      </section>
    </div>
  `;
}

function renderBenefitDetails(benefits) {
  return `
    <div class="benefitContext">
      <span>${esc(benefits.persona)}</span>
      <span>${esc(benefits.pattern)}</span>
    </div>
    <div class="benefitCompare">
      <section>
        <h3>Manual steps</h3>
        <ul>${benefits.manualSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ul>
      </section>
      <section>
        <h3>Digital worker automation</h3>
        <ul>${benefits.automatedSteps.map((step) => `<li>${esc(step)}</li>`).join("")}</ul>
      </section>
    </div>
    <section class="benefitImpact">
      <h3>What it helped automate</h3>
      <div>
        ${benefits.impact.map((item) => `<span>${esc(item)}</span>`).join("")}
      </div>
    </section>
  `;
}

function benefitsForPayload(payload = {}) {
  const pattern = payload.pattern || payload.blueprintName || "Selected capability";
  const persona = payload.persona || "Selected persona";
  const workerName = payload.digitalWorkerName
    ? `${payload.digitalWorkerName} Digital Co Worker`
    : payload.blueprintName || "Digital Co Worker";
  const sources = (payload.knowledgeSources || [])
    .map((source) => source.KnowledgeSource)
    .filter(Boolean)
    .slice(0, 3)
    .join(", ");
  const sourceText = sources || "selected enterprise sources";
  const normalized = pattern.toLowerCase();
  let manualSteps = [
    "Open each source system separately.",
    "Search for relevant evidence and compare details manually.",
    "Draft an answer and keep track of the source trail.",
  ];
  let automatedSteps = [
    "Classified the request and selected the right worker branch.",
    "Retrieved relevant evidence from the mapped knowledge sources.",
    "Generated a grounded answer with traceable supporting context.",
  ];
  let impact = ["Less source switching", "Faster answer drafting", "More consistent evidence trail"];

  if (normalized.includes("rag")) {
    manualSteps = [
      `Search ${sourceText} one by one.`,
      "Read policy pages, emails, and collaboration notes to find matching guidance.",
      "Compare the evidence, resolve conflicts, and write a response manually.",
      "Capture what source supported the final answer.",
    ];
    automatedSteps = [
      "Classified the question as an enterprise search request.",
      `Retrieved the best matching evidence from ${sourceText}.`,
      "Used retriever, knowledge processing, and Oracle GenAI agents to build a grounded answer.",
      "Returned the answer with the relevant evidence shown in the trace.",
    ];
    impact = ["Automated enterprise search", "Reduced manual evidence review", "Kept responses grounded in source content"];
  } else if (normalized.includes("nl2sql")) {
    manualSteps = [
      "Translate the business question into metrics, filters, and dimensions.",
      "Find the right tables, columns, and business definitions.",
      "Write and validate SQL before formatting the answer.",
      "Explain the result and call out exceptions manually.",
    ];
    automatedSteps = [
      "Detected intent, metrics, dimensions, and filters from natural language.",
      "Retrieved schema and business context before generating SQL.",
      "Validated SQL and formatted the result for business use.",
      "Highlighted the answer without asking the user to inspect raw tables.",
    ];
    impact = ["Automated SQL drafting", "Reduced schema lookup time", "Improved result consistency"];
  } else if (normalized.includes("document")) {
    manualSteps = [
      "Open each document and identify its type.",
      "Read pages to extract fields, clauses, dates, and exceptions.",
      "Check extracted information against business rules.",
      "Summarize findings and recommend next actions manually.",
    ];
    automatedSteps = [
      "Classified document type and selected the right extraction path.",
      "Extracted fields, clauses, and key business signals.",
      "Validated outputs against business and compliance checks.",
      "Generated insights, reasoning, and recommendations.",
    ];
    impact = ["Automated document review", "Reduced field extraction effort", "Improved clause and exception visibility"];
  } else if (normalized.includes("cognitive") || normalized.includes("voice")) {
    manualSteps = [
      "Review recordings, transcripts, or media files manually.",
      "Identify sentiment, events, and priority signals.",
      "Classify risk and route the case to the right team.",
    ];
    automatedSteps = [
      "Analyzed media and transcript signals automatically.",
      "Classified intent, risk, sentiment, and operational priority.",
      "Prepared a next-best action for the support or operations team.",
    ];
    impact = ["Automated media triage", "Faster issue classification", "Clearer next-best action"];
  }

  return {
    workerName,
    persona,
    pattern,
    summary: `${workerName} helped ${persona} by turning manual investigation into an orchestrated AI workflow.`,
    manualSteps,
    automatedSteps,
    impact,
  };
}

function renderDownloadModal() {
  const payload = state.downloadPayload || blueprintPayload();
  const downloadUrl = blueprintDownloadUrl();
  return `
    <div class="modalBackdrop" data-modal-close>
      <section class="modal qrModal" role="dialog" aria-modal="true" aria-label="Download blueprint">
        <header class="modalHead">
          <div>
            <div class="eyebrow">Download Blueprint</div>
            <h2>${esc(payload.digitalWorkerName || "Blueprint")}</h2>
            <p>Scan the QR code to open the blueprint image download, or download it directly from this screen.</p>
          </div>
          <button class="action secondary" data-modal-close>${uiIcon("close", "iconBox")}<span>Close</span></button>
        </header>
        <div class="modalBody">
          <div class="qrLayout">
            <div class="qrFrame">
              <span class="qrFallback">Preparing QR code</span>
              <img
                src="${esc(qrImageUrl(downloadUrl))}"
                alt="QR code for blueprint PNG download"
                onload="this.closest('.qrFrame').classList.add('qrLoaded')"
                onerror="this.closest('.qrFrame').classList.add('qrFailed')"
              />
            </div>
            <div class="qrDetails">
              <h3>${esc(payload.pattern || patternById()?.PatternName || "Selected capability")}</h3>
              <p>${esc(payload.persona || personaById()?.PersonaName || "Selected persona")} blueprint for ${esc(payload.digitalWorkerName || state.workerName || "Digital Worker")}</p>
              <button class="action primary" data-download="png">${uiIcon("image", "iconBox")}<span>Download Image</span></button>
            </div>
          </div>
        </div>
      </section>
    </div>
  `;
}

function qrImageUrl(value) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=12&data=${encodeURIComponent(value)}`;
}

function renderSettingsModal() {
  const stats = workbookStats();
  return `
    <div class="modalBackdrop" data-modal-close>
      <section class="modal settingsModal" role="dialog" aria-modal="true" aria-label="Settings">
        <header class="modalHead">
          <div>
            <div class="eyebrow">Settings</div>
            <h2>Workbook and source controls</h2>
            <p>Load the OCI AI Factory workbook and detect local KnowledgeSources content.</p>
          </div>
          <button class="action secondary" data-modal-close>${uiIcon("close", "iconBox")}<span>Close</span></button>
        </header>
        <div class="modalBody">
          <div class="settingsGrid">
            <section class="settingsBox">
              <h3>Current workbook</h3>
              <p>${esc(WORKBOOK.generatedFrom || "Workbook data bundle")}</p>
              <div class="settingsStats">
                <div class="metric"><b>${stats.personas}</b><span>Personas</span></div>
                <div class="metric"><b>${stats.patterns}</b><span>Capabilities</span></div>
                <div class="metric"><b>${stats.sources}</b><span>Sources</span></div>
                <div class="metric"><b>${stats.responses}</b><span>Responses</span></div>
              </div>
              <div class="btnRow" style="margin-top: 14px">
                <button class="action primary" data-workbook-upload-trigger>${uiIcon("upload", "iconBox")}<span>Load Excel</span></button>
                <button class="action secondary" data-content-upload-trigger>${uiIcon("folder", "iconBox")}<span>Detect Sources</span></button>
              </div>
            </section>
            <section class="settingsBox">
              <h3>Runtime source repository</h3>
              <p>${stats.files} files are available to source preview dialogs. Select a local KnowledgeSources folder to detect uploaded files in this browser session.</p>
              <div class="notice">Workbook upload accepts .xlsx, .xls, or exported JSON. The default bundle remains available until another workbook is loaded.</div>
            </section>
          </div>
        </div>
      </section>
    </div>
  `;
}

function renderPreviewCategory(title, extensions, files) {
  const matches = files
    .filter((file) => extensions.includes(file.extension) || (extensions.includes("readme") && file.name.toLowerCase() === "readme.md"))
    .slice(0, 5);
  return `
    <article class="previewBox">
      <h4>${esc(title)}</h4>
      <div class="fileList">
        ${matches.length ? matches.map(renderFileItem).join("") : `<p class="small">No files detected for this category. Add files under the mapped KnowledgeSources folder and select the folder in the app.</p>`}
      </div>
    </article>
  `;
}

function renderFocusedSourcePreview(source, kind, files) {
  if (kind === "dataset") return renderDatasetPreview(source);
  if (kind === "email") return renderEmailPreview(source);
  if (kind === "slack") return renderSlackPreview(source);
  if (kind === "audio" || kind === "video") return renderMediaPreview(source, kind);
  return renderDocumentPreview(source, files);
}

function renderDocumentPreview(source, files) {
  const primary = primaryDocumentFile(files);
  return `
    <h4>Document preview</h4>
    <div class="documentPreview">
      <div class="docPage">
        <div class="docKicker">${esc(source.SourceType || "Document")}</div>
        <h3>${esc(source.KnowledgeSource)}</h3>
        <p>${esc(source.Description || "Workbook mapped source content")}</p>
        <ul>
          <li>Source category: ${esc(source.Channel || "Document")}</li>
          <li>Used by ${esc(patternById()?.PatternName || "selected capability")} blueprint testing</li>
          <li>Scoped to ${esc(personaById()?.PersonaName || "selected persona")}</li>
        </ul>
      </div>
      ${primary ? `<button class="fileOpenLink" type="button" data-doc-open="${esc(source.KnowledgeID)}">${uiIcon("folder", "iconBox")}<span>Open ${esc(primary.name)}</span></button>` : ""}
    </div>
  `;
}

function primaryDocumentFile(files) {
  return files.find((file) => file.extension === "docx") || files.find((file) => ["pdf", "md"].includes(file.extension)) || files[0] || null;
}

function renderDocumentViewerModal() {
  const source = sourceById(state.docViewerSourceId);
  if (!source) return "";
  const file = primaryDocumentFile(filesForSource(source));
  const persona = personaById()?.PersonaName || "Selected Persona";
  const pattern = patternById()?.PatternName || "Selected capability";
  const group = personaGroup();
  const generated = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const sections = documentViewerSections(source, file);
  return `
    <div class="docViewerBackdrop" data-doc-close>
      <section class="modal docViewerModal" role="dialog" aria-modal="true" aria-label="Document viewer">
        <header class="modalHead docViewerHead">
          <div>
            <div class="eyebrow">Document Viewer</div>
            <h2>${esc(file?.name || source.KnowledgeSource)}</h2>
            <p>${esc(source.KnowledgeSource)} - ${esc(pattern)} - ${esc(persona)}</p>
          </div>
          <button class="action secondary" data-doc-close>${uiIcon("close", "iconBox")}<span>Close</span></button>
        </header>
        <div class="docViewerBody">
          <aside class="docViewerRail">
            <div class="docMetaBlock">
              <span class="fileType">${esc(file?.extension || "doc")}</span>
              <strong>${esc(file?.name || "source_document.docx")}</strong>
              <small>${esc(file?.path || "Workbook generated source preview")}</small>
            </div>
            <div class="docOutline">
              ${sections.map((section, index) => `<a href="#doc-section-${index + 1}">${esc(section.title)}</a>`).join("")}
            </div>
          </aside>
          <main class="docCanvas" aria-label="Document pages">
            <article class="docSheet">
              <header class="docSheetHeader">
                <div class="docBrandMark">AI</div>
                <div>
                  <div class="docTitle">${esc(source.KnowledgeSource)}</div>
                  <div class="docSubtitle">${esc(file?.name || "sample_handbook.docx")} - ${esc(group)} knowledge source</div>
                </div>
              </header>
              <section class="docHero">
                <p class="docLabel">OCI AI Factory Source Document</p>
                <h1>${esc(source.KnowledgeSource)} Handbook</h1>
                <p>${esc(source.Description || "Source content used by the selected blueprint to answer grounded questions.")}</p>
              </section>
              <div class="docInfoGrid">
                <div><span>Capability</span><strong>${esc(pattern)}</strong></div>
                <div><span>Persona</span><strong>${esc(persona)}</strong></div>
                <div><span>Generated</span><strong>${esc(generated)}</strong></div>
              </div>
              ${sections.map((section, index) => renderDocSection(section, index)).join("")}
              <footer class="docSheetFooter">
                <span>AgentifyME OCI AI Factory</span>
                <span>${esc(file?.path || source.KnowledgeID)}</span>
              </footer>
            </article>
          </main>
        </div>
      </section>
    </div>
  `;
}

function renderDocSection(section, index) {
  return `
    <section class="docSection" id="doc-section-${index + 1}">
      <p class="docSectionNum">${String(index + 1).padStart(2, "0")}</p>
      <div>
        <h3>${esc(section.title)}</h3>
        <p>${esc(section.body)}</p>
        ${section.points?.length ? `<ul>${section.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>` : ""}
      </div>
    </section>
  `;
}

function documentViewerSections(source, file) {
  const sourceName = source.KnowledgeSource || "Knowledge Source";
  const sourceText = `${sourceName} ${source.Description} ${source.SourceType} ${source.Channel}`.toLowerCase();
  if (sourceText.includes("policy") || sourceText.includes("handbook") || sourceText.includes("sop")) {
    return [
      {
        title: "Purpose and Scope",
        body: `${sourceName} is used as the approved policy reference for the selected blueprint. The assistant should ground answers in this document before responding to employee or manager questions.`,
        points: ["Applies to the selected persona workflow.", "Used for eligibility, approval, exception, and escalation guidance.", "Responses should cite the relevant policy area when possible."],
      },
      {
        title: "Eligibility and Approvals",
        body: "Policy questions are resolved by matching the employee situation to documented eligibility rules, then checking whether manager, HR operations, or specialist approval is required.",
        points: ["Confirm employee type, location, and effective dates.", "Check approval routing before recommending an action.", "Escalate exceptions or missing evidence to HR review."],
      },
      {
        title: "Response Guidance",
        body: "The digital worker should provide concise, business-readable answers and avoid unsupported interpretation when the source document does not contain enough evidence.",
        points: ["Summarize the answer first.", "List required next steps.", "Call out unknowns and required human review."],
      },
      {
        title: "Document Metadata",
        body: `This preview represents ${file?.name || "the mapped handbook document"} from the local KnowledgeSources repository. It is displayed in-app to avoid browser downloads during demos.`,
        points: [`Source type: ${source.SourceType || "Document"}`, `Channel: ${source.Channel || "Document"}`, `Source ID: ${source.KnowledgeID}`],
      },
    ];
  }
  return [
    {
      title: "Source Overview",
      body: `${sourceName} provides source evidence for the current AI Factory blueprint. The assistant uses it to ground answers and execution traces.`,
        points: [`Capability: ${patternById()?.PatternName || "selected capability"}`, `Persona: ${personaById()?.PersonaName || "selected persona"}`, `Source type: ${source.SourceType || "Document"}`],
    },
    {
      title: "Usage in Blueprint",
      body: "During a test run, the orchestrator selects the source branch, retrieves the relevant evidence, and passes the result to the worker branch before generating the final response.",
      points: ["Classify user intent.", "Retrieve relevant source evidence.", "Return grounded answer with source rationale."],
    },
  ];
}

function renderDatasetPreview(source) {
  const rows = sampleRowsForSource(source);
  const columns = Object.keys(rows[0] || {});
  return `
    <h4>Dataset preview</h4>
    <div class="tableWrap sourceTableWrap">
      <table class="sourceDataTable">
        <thead>
          <tr>${columns.map((column) => `<th>${esc(column)}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `<tr>${columns.map((column) => `<td>${esc(row[column])}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderEmailPreview(source) {
  return `
    <h4>Email preview</h4>
    <div class="emailPreview">
      <div><b>From:</b> ${esc(personaGroup().toLowerCase())}-ops@example.com</div>
      <div><b>To:</b> ${esc(personaGroup().toLowerCase())}-team@example.com</div>
      <div><b>Subject:</b> ${esc(source.KnowledgeSource)} sample thread</div>
      <p>${esc(source.Description)}. The blueprint uses this mailbox source to ground answers in prior approvals, clarifications, and response patterns.</p>
    </div>
  `;
}

function renderSlackPreview(source) {
  return `
    <h4>Slack conversation preview</h4>
    <div class="slackPreview">
      <div class="slackLine"><b>analyst</b><span>Can someone confirm the latest guidance for ${esc(source.KnowledgeSource)}?</span></div>
      <div class="slackLine"><b>specialist</b><span>Use the mapped ${esc(personaGroup())} source package and cite the approved workflow.</span></div>
      <div class="slackLine"><b>lead</b><span>Flag any exception for manager review before responding.</span></div>
    </div>
  `;
}

function renderMediaPreview(source, kind) {
  const label = kind === "audio" ? "Audio metadata" : "Video metadata";
  const rows = [
    { Field: "Source", Value: source.KnowledgeSource },
    { Field: "Type", Value: source.SourceType || label },
    { Field: "Duration", Value: kind === "audio" ? "03:42 sample clip" : "00:48 sample clip" },
    { Field: "Signals", Value: kind === "audio" ? "intent, sentiment, escalation risk" : "scene, object, anomaly markers" },
  ];
  return `
    <h4>${esc(label)}</h4>
    <div class="tableWrap sourceTableWrap">
      <table class="sourceDataTable">
        <tbody>
          ${rows.map((row) => `<tr><th>${esc(row.Field)}</th><td>${esc(row.Value)}</td></tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function sampleRowsForSource(source) {
  const name = `${source.KnowledgeSource} ${source.SourceType} ${source.Channel}`.toLowerCase();
  if (name.includes("payroll")) {
    return [
      { Period: "2026-05", Region: "North America", "Gross Pay": "$4.8M", Trend: "Up 2.1%" },
      { Period: "2026-05", Region: "EMEA", "Gross Pay": "$3.2M", Trend: "Flat" },
      { Period: "2026-05", Region: "APAC", "Gross Pay": "$2.7M", Trend: "Up 1.4%" },
    ];
  }
  if (name.includes("workforce planning")) {
    return [
      { "Cost Center": "HR Ops", "Planned FTE": "42", Gap: "+3", Risk: "Low" },
      { "Cost Center": "Shared Services", "Planned FTE": "68", Gap: "-5", Risk: "Medium" },
      { "Cost Center": "Talent", "Planned FTE": "31", Gap: "+1", Risk: "Low" },
    ];
  }
  if (name.includes("recruiting")) {
    return [
      { Requisition: "REQ-1842", Stage: "Interview", Candidates: "12", "Avg Days": "18" },
      { Requisition: "REQ-1901", Stage: "Offer", Candidates: "3", "Avg Days": "31" },
      { Requisition: "REQ-1930", Stage: "Screen", Candidates: "24", "Avg Days": "7" },
    ];
  }
  if (name.includes("performance")) {
    return [
      { Department: "Operations", Rating: "Exceeds", Count: "28", Trend: "Improving" },
      { Department: "Finance", Rating: "Meets", Count: "54", Trend: "Stable" },
      { Department: "Support", Rating: "Watch", Count: "9", Trend: "Needs review" },
    ];
  }
  if (name.includes("learning")) {
    return [
      { Course: "AI Factory Basics", Completion: "86%", Overdue: "7", Audience: "Managers" },
      { Course: "Data Handling", Completion: "92%", Overdue: "3", Audience: "Analysts" },
      { Course: "Security Policy", Completion: "78%", Overdue: "14", Audience: "All employees" },
    ];
  }
  if (name.includes("call") || name.includes("transcript") || name.includes("metrics")) {
    return [
      { Case: "C-1042", Intent: "Refund", Sentiment: "Neutral", Escalated: "No" },
      { Case: "C-1188", Intent: "Complaint", Sentiment: "Negative", Escalated: "Yes" },
      { Case: "C-1210", Intent: "Status", Sentiment: "Positive", Escalated: "No" },
    ];
  }
  return [
    { Record: "REC-001", Source: source.KnowledgeSource, Status: "Active", Priority: "High" },
    { Record: "REC-002", Source: source.KnowledgeSource, Status: "In Review", Priority: "Medium" },
    { Record: "REC-003", Source: source.KnowledgeSource, Status: "Closed", Priority: "Low" },
  ];
}

function renderFileItem(file) {
  return `
    <div class="fileItem">
      <span class="fileType">${esc(file.extension || "file")}</span>
      <span><strong>${esc(file.name)}</strong><span class="small">${esc(file.path)} - ${Math.ceil((file.size || 0) / 1024)} KB</span></span>
    </div>
  `;
}

function filesForContext() {
  const folder = `KnowledgeSources/${patternFolder()}/${personaGroup()}/`;
  const generated = CONTENT_MANIFEST.filter((file) => file.path.includes(folder));
  const uploaded = state.uploadedContent.filter((file) => file.path.includes(folder) || file.path.includes(`${patternFolder()}/${personaGroup()}/`));
  return [...generated, ...uploaded];
}

function filesForSource(source) {
  const kind = sourcePreviewKind(source);
  const files = filesForContext();
  const preferred = sourceFileMatchers(source, kind);
  const matches = files.filter((file) => {
    const path = `${file.path} ${file.name}`.toLowerCase();
    return preferred.some((matcher) => path.includes(matcher));
  });
  if (matches.length) return matches;
  return files.filter((file) => sourceExtensions(kind).includes(file.extension)).slice(0, 3);
}

function sourcePreviewKind(source) {
  const label = `${source.KnowledgeSource} ${source.SourceType}`.toLowerCase();
  const channel = text(source.Channel).toLowerCase();
  if (/\b(audio|voice|recording|recordings)\b/.test(label) || /\baudio\b/.test(channel)) return "audio";
  if (/\b(video|drone|cctv|footage)\b/.test(label) || /\bvideo\b/.test(channel)) return "video";
  if (/(dataset|structured|master|payroll|planning|analytics|performance|learning|metrics|csv|txt\/csv)/.test(label) || channel.includes("csv")) return "dataset";
  if (/(email|mailbox)/.test(label) || channel === "email") return "email";
  if (/(slack|chat|conversation|collaboration)/.test(label) || channel === "slack") return "slack";
  return "document";
}

function sourceExtensions(kind) {
  const map = {
    dataset: ["csv", "json"],
    email: ["eml"],
    slack: ["json"],
    audio: ["mp3", "wav", "m4a", "md"],
    video: ["mp4", "mov", "md"],
    document: ["pdf", "docx", "md"],
  };
  return map[kind] || map.document;
}

function sourceFileMatchers(source, kind) {
  const value = `${source.KnowledgeSource} ${source.SourceType} ${source.Channel}`.toLowerCase();
  if (kind === "dataset") return ["sample_dataset", "sample_records"];
  if (kind === "email") return ["sample_email"];
  if (kind === "slack") return ["sample_slack"];
  if (kind === "audio") return ["audio/readme", "callcenteraudio/readme", "sample_audio"];
  if (kind === "video") return ["video/readme", "dronevideos/readme", "sample_video"];
  if (value.includes("invoice") || value.includes("purchase order") || value.includes("expense") || value.includes("forms")) return ["sample_invoice", "sample_policy"];
  if (value.includes("contract") || value.includes("agreement") || value.includes("vendor")) return ["sample_contract"];
  if (value.includes("handbook")) return ["sample_handbook", "sample_policy"];
  return ["sample_policy", "sample_handbook"];
}

function startRun(qnaId, customQuestion = "") {
  const qna = qnaId ? questionById(qnaId) : null;
  const question = customQuestion || qna?.Question || "";
  if (!question.trim()) return;
  if (state.run.running) return;
  if (runTimer) window.clearInterval(runTimer);
  state.runSuccessOpen = false;
  state.customQuestion = "";
  state.composerEngaged = false;
  if (qnaId) {
    const rootId = rootQuestionId(qnaId);
    if (!isFollowUpQuestionId(qnaId) && state.activeQuestionThreadId !== rootId) {
      state.testedQuestionIds = [];
      state.runMessages = [];
    }
    state.activeQuestionThreadId = rootId;
  }
  const turnId = `TURN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  state.run = {
    ...emptyRun(),
    turnId,
    running: true,
    currentStep: 0,
    visualTick: 0,
    qnaId: qnaId || "",
    question,
    startedAt: Date.now(),
    isCustom: Boolean(customQuestion),
  };
  state.runMessages = [...state.runMessages, { ...state.run }];
  render();
  scrollRunChatToBottom();
  runTimer = window.setInterval(() => {
    const elapsed = Date.now() - state.run.startedAt;
    state.run.visualTick += 1;
    state.run.currentStep = visualStepFromElapsed(elapsed);
    if (elapsed >= RUN_TOTAL_MS) {
      window.clearInterval(runTimer);
      runTimer = null;
      state.run.running = false;
      state.run.currentStep = 4;
      state.run.durationMs = elapsed;
      state.run.response = state.run.isCustom ? customResponse(question) : workbookResponse(qna);
      state.runMessages = state.runMessages.map((message) =>
        message.turnId === state.run.turnId ? { ...message, ...state.run } : message,
      );
      if (qnaId) markQuestionTested(qnaId);
    }
    render();
    scrollRunChatToBottom();
  }, 180);
}

function workbookResponse(qna) {
  const response = responseFor(qna?.QnAID);
  return response?.ExpectedResponse || qna?.ExpectedAnswer || "No sample response is mapped for this workbook question.";
}

function customResponse(question) {
  const scenario = scenarioFor();
  const sources = selectedSources().map((source) => source.KnowledgeSource).join(", ");
  const firstResponse = responseFor(questionsFor()[0]?.QnAID)?.ExpectedResponse || "";
  return [
    `Custom question routed through ${scenario?.ScenarioTitle || "the selected workbook scenario"}.`,
    `Question: ${question}`,
    `Selected sources: ${sources || "No knowledge sources selected"}.`,
    firstResponse ? `Nearest workbook response style: ${firstResponse}` : "No nearest workbook response style is available.",
  ].join("\n\n");
}

function computeScore() {
  const weights = sheet("12_Leaderboard_Config");
  const totalWeight = weights.reduce((sum, row) => sum + Number(row.Weight || 0), 0) || 100;
  const available = availableSourcesFor().length || 1;
  const selected = selectedSources().length;
  const questions = questionsFor().length;
  const threadQuestions = testedQuestionIdsForThread().length || 3;
  const testedQuestions = state.testedQuestionIds.length || (state.run.response ? 1 : 0);
  const values = {
    "Blueprint completeness": state.personaId && state.patternId && state.workerName ? 1 : 0,
    "Knowledge source coverage": Math.min(selected / available, 1),
    "Question coverage": Math.min(testedQuestions / Math.max(threadQuestions, questions, 1), 1),
    "Execution readiness": state.run.response ? 1 : 0.75,
  };
  const score = weights.reduce((sum, row) => {
    const weight = Number(row.Weight || 0);
    const value = values[row.Metric] ?? (state.run.response ? 1 : 0.85);
    return sum + weight * value;
  }, 0);
  return Math.round((score / totalWeight) * 100);
}

function blueprintPayload(rowPayload = null) {
  if (rowPayload) return rowPayload;
  const persona = personaById();
  const pattern = patternById();
  const blueprint = blueprintFor();
  return {
    generatedAt: new Date().toISOString(),
    user: state.name,
    persona: persona?.PersonaName || "",
    experience: "Engineer",
    pattern: pattern?.PatternName || "",
    digitalWorkerName: state.workerName,
    blueprintName: pattern?.PatternName || blueprint?.BlueprintType || "Selected capability",
    workbookBlueprintType: blueprint?.BlueprintType || "",
    blueprintTheme: blueprint?.BlueprintTheme || "",
    executionStyle: blueprint?.ExecutionStyle || "",
    knowledgeSources: selectedSources(),
    questions: questionsFor(),
    testedQuestionIds: state.testedQuestionIds,
    activeFollowUpQuestions: followUpQuestionsFor(),
    conversation: state.runMessages,
    latestRun: state.run,
    nodes: blueprintNodes(),
    runtimeDetails: runtimeSteps(),
    score: computeScore(),
  };
}

function leaderboardRunKey(payload) {
  return [
    payload.user,
    payload.persona,
    payload.pattern,
    payload.digitalWorkerName,
    payload.latestRun?.startedAt || 0,
    payload.latestRun?.qnaId || "",
    payload.latestRun?.response || "",
    (payload.testedQuestionIds || []).join("|"),
  ].join("::");
}

function saveCurrentRunToLeaderboard() {
  const payload = clone(blueprintPayload());
  const runKey = leaderboardRunKey(payload);
  if (state.lastSavedRunKey === runKey) return;
  const createdAt = new Date().toISOString();
  const row = {
    id: `LB-${Date.now()}`,
    runKey,
    createdAt,
    user: payload.user || "Anonymous",
    persona: payload.persona,
    digitalWorkerName: payload.digitalWorkerName,
    experience: payload.experience,
    pattern: payload.pattern,
    blueprintName: payload.blueprintName,
    score: payload.score,
    payload: { ...payload, generatedAt: payload.generatedAt || createdAt },
  };
  state.leaderboard = [row, ...state.leaderboard.filter((item) => item.runKey !== runKey)].slice(0, 20);
  state.lastSavedRunKey = runKey;
  state.leaderboardPage = 0;
  try {
    localStorage.setItem("ociAiFactoryLeaderboard", JSON.stringify(state.leaderboard));
  } catch (error) {
    console.warn("Could not persist leaderboard to browser storage.", error);
  }
}

function completeCurrentRun() {
  state.runSuccessOpen = false;
  try {
    saveCurrentRunToLeaderboard();
  } catch (error) {
    console.warn("Could not save the current run to the leaderboard.", error);
  }
  state.screen = "leaderboard";
  render();
}

function requestRunCompletion() {
  if (!hasCompletedRunInteraction()) {
    render();
    return;
  }
  state.runSuccessOpen = true;
  render();
}

function addLeaderboard() {
  completeCurrentRun();
}

function continueFromRunSuccess() {
  completeCurrentRun();
}

function readLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem("ociAiFactoryLeaderboard") || "[]");
  } catch {
    return [];
  }
}

function leaderboardCreatedAt(row) {
  const dateValue = Date.parse(row?.createdAt || row?.payload?.createdAt || row?.payload?.generatedAt || "");
  if (Number.isFinite(dateValue)) return dateValue;
  const idTime = String(row?.id || "").match(/^LB-(\d+)/);
  return idTime ? Number(idTime[1]) : 0;
}

function sortedLeaderboardRows() {
  return [...state.leaderboard].sort((a, b) => {
    const createdDiff = leaderboardCreatedAt(b) - leaderboardCreatedAt(a);
    if (createdDiff) return createdDiff;
    return String(b.id || "").localeCompare(String(a.id || ""));
  });
}

function goLeaderboardPage(page) {
  const rows = sortedLeaderboardRows();
  const pageCount = Math.max(1, Math.ceil(rows.length / LEADERBOARD_PAGE_SIZE));
  state.leaderboardPage = Math.min(Math.max(page, 0), pageCount - 1);
  render();
}

function rowPayloadFromButton(button) {
  const index = button.dataset.leaderIndex;
  if (index === undefined) return null;
  const rows = sortedLeaderboardRows();
  const row = rows[Number(index)];
  return row?.payload || row || null;
}

function openBenefitsModal(payload = null) {
  state.benefitsPayload = payload || blueprintPayload();
  state.runSuccessOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  render();
}

function openDownloadModal(payload = null) {
  const data = payload || blueprintPayload();
  state.downloadPayload = data;
  state.downloadModalOpen = true;
  state.benefitsPayload = null;
  state.runSuccessOpen = false;
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  localStorage.setItem("ociAiFactoryPendingBlueprintDownload", JSON.stringify(data));
  render();
}

function blueprintDownloadUrl() {
  return `${window.location.href.split("#")[0]}#download-blueprint-png`;
}

function readPendingBlueprintDownload() {
  try {
    return JSON.parse(localStorage.getItem("ociAiFactoryPendingBlueprintDownload") || "null");
  } catch {
    return null;
  }
}

function download(type, payload = null) {
  const data = blueprintPayload(payload || state.downloadPayload);
  const baseName = slug(`${data.digitalWorkerName || "Blueprint"}-${data.pattern || "Pattern"}`);
  if (type === "json") {
    saveBlob(`${baseName}.json`, "application/json", JSON.stringify(data, null, 2));
    return;
  }
  if (type === "pdf") {
    saveBlob(`${baseName}.pdf`, "application/pdf", makePdf(data));
    return;
  }
  if (type === "png") {
    downloadPng(data, `${baseName}.png`);
  }
}

function downloadFromHash() {
  if (window.location.hash !== "#download-blueprint-png") return;
  const payload = readPendingBlueprintDownload();
  window.setTimeout(() => {
    download("png", payload || null);
    window.history.replaceState(null, document.title, window.location.href.split("#")[0]);
  }, 350);
}

function saveBlob(fileName, type, content) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function makePdf(data) {
  const lines = [
    "AgentifyME OCI AI Factory Blueprint",
    `User: ${data.user}`,
    `Persona: ${data.persona}`,
    `Capability: ${data.pattern}`,
    `Blueprint: ${data.blueprintName}`,
    `Score: ${data.score}`,
    `Sources: ${data.knowledgeSources.map((source) => source.KnowledgeSource).join(", ")}`,
    `Nodes: ${data.nodes.map((node) => node.label).join(" > ")}`,
  ].map((line) => line.replace(/[^\x20-\x7E]/g, ""));
  const stream = ["BT", "/F1 14 Tf", "72 760 Td", `(${pdfEscape(lines[0])}) Tj`, "/F1 10 Tf"];
  lines.slice(1).forEach((line) => {
    stream.push("0 -18 Td", `(${pdfEscape(line.slice(0, 105))}) Tj`);
  });
  stream.push("ET");
  return buildPdf(stream.join("\n"));
}

function pdfEscape(value) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

function buildPdf(streamText) {
  const streamLength = streamText.length;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${streamLength} >>\nstream\n${streamText}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return pdf;
}

function downloadPng(data, fileName) {
  const canvas = document.createElement("canvas");
  canvas.width = 1500;
  canvas.height = 940;
  const ctx = canvas.getContext("2d");
  const nodes = data.nodes || [];
  const userNode = nodes.find((node) => node.id === "user") || nodes[0] || { label: "User", detail: "Persona question and task intent" };
  const responseNode = nodes.find((node) => node.id === "response") || nodes[nodes.length - 1] || { label: "Response", detail: "Answer with trace and source evidence" };
  const workerNodes = nodes.filter((node) => !["user", "source", "response"].includes(node.id)).slice(0, 4);
  const sources = data.knowledgeSources || [];
  const isComplete = Boolean(data.latestRun?.response);
  const doneBorder = isComplete ? "#2e7d32" : "#c74634";

  ctx.fillStyle = "#f7f5f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#c74634";
  ctx.fillRect(0, 0, canvas.width, 74);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText("AgentifyME OCI AI Factory Blueprint", 40, 46);

  ctx.fillStyle = "#171412";
  ctx.font = "bold 34px Arial";
  ctx.fillText(fitCanvasText(ctx, `${data.digitalWorkerName || "Digital Worker"} Digital Co Worker`, 760), 40, 124);
  ctx.font = "bold 22px Arial";
  ctx.fillText(fitCanvasText(ctx, blueprintHeading(data), 860), 40, 160);
  ctx.fillStyle = "#635d57";
  ctx.font = "16px Arial";
  ctx.fillText(fitCanvasText(ctx, `${data.persona || "Selected persona"} | ${data.pattern || "Selected capability"}`, 860), 40, 188);

  const stageY = 350;
  const cardH = 92;
  drawCanvasCard(ctx, 44, stageY, 190, cardH, userNode.label, userNode.detail, "user", doneBorder);
  drawCanvasArrow(ctx, 240, stageY + cardH / 2, 295, stageY + cardH / 2, doneBorder);
  drawCanvasCard(ctx, 300, stageY, 220, cardH, "AI Orchestrator", "Classifies intent and dispatches selected branches", "bot", doneBorder);
  drawCanvasArrow(ctx, 528, stageY + cardH / 2, 570, stageY + cardH / 2, doneBorder);
  drawCanvasSourceGroup(ctx, 575, 250, 285, 290, sources, doneBorder);
  drawCanvasArrow(ctx, 868, stageY + cardH / 2, 915, stageY + cardH / 2, doneBorder);
  drawCanvasWorkerGroup(ctx, 920, 230, 315, 330, workerNodes, doneBorder, isComplete);
  drawCanvasArrow(ctx, 1243, stageY + cardH / 2, 1285, stageY + cardH / 2, doneBorder);
  drawCanvasCard(ctx, 1290, stageY, 170, cardH, responseNode.label, responseNode.detail, "message", doneBorder, { compact: true });

  drawCanvasLegend(ctx, 54, 720, data, sources, workerNodes);
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
}

function blueprintHeading(data) {
  if (data.pattern === "RAG") return "RAG - Retrieval Augmented Generation";
  if (data.pattern === "NL2SQL") return "NL2SQL - Natural Language Query on Knowledge Base";
  if (data.pattern === "Document AI") return "Document AI - Multimodal Document Intelligence";
  return data.blueprintName || data.pattern || "Selected capability";
}

function fitCanvasText(ctx, value, maxWidth) {
  const safeValue = text(value);
  if (ctx.measureText(safeValue).width <= maxWidth) return safeValue;
  let clipped = safeValue;
  while (clipped.length > 3 && ctx.measureText(`${clipped}...`).width > maxWidth) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped.trim()}...`;
}

function drawCanvasCard(ctx, x, y, width, height, title, detail, iconName, borderColor, options = {}) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  const iconSize = options.compact ? 32 : 40;
  ctx.fillStyle = "#c74634";
  roundRect(ctx, x + 16, y + 22, iconSize, iconSize, 8);
  ctx.fill();
  drawCanvasNodeIcon(ctx, iconName, x + 16 + iconSize / 2, y + 22 + iconSize / 2);
  const textX = x + 16 + iconSize + 16;
  const textWidth = Math.max(24, width - (textX - x) - 16);
  ctx.fillStyle = "#171412";
  ctx.font = options.compact ? "bold 15px Arial" : "bold 17px Arial";
  ctx.fillText(fitCanvasText(ctx, title, textWidth), textX, y + 38);
  ctx.fillStyle = "#635d57";
  ctx.font = options.compact ? "11px Arial" : "13px Arial";
  drawCanvasWrappedText(ctx, detail, textX, y + 60, textWidth, 15, options.compact ? 2 : 3);
  ctx.restore();
}

function drawCanvasSourceGroup(ctx, x, y, width, height, sources, borderColor) {
  drawCanvasGroupFrame(ctx, x, y, width, height, "Evidence Retrieval", borderColor, "#f8fff7");
  if (!sources.length) {
    ctx.fillStyle = "#171412";
    ctx.font = "bold 18px Arial";
    drawCanvasWrappedText(ctx, "Select one or more knowledge sources.", x + 34, y + 108, width - 68, 24, 3);
    return;
  }
  let itemY = y + 50;
  sources.slice(0, 5).forEach((source) => {
    drawCanvasSourceMiniItem(ctx, x + 18, itemY, width - 36, 46, source, borderColor);
    itemY += 52;
  });
}

function drawCanvasWorkerGroup(ctx, x, y, width, height, nodes, borderColor, isComplete) {
  drawCanvasGroupFrame(ctx, x, y, width, height, "Agent Worker Branches", borderColor, "#f8fff7");
  ctx.fillStyle = "#171412";
  ctx.font = "bold 15px Arial";
  ctx.fillText("Independent sub-agent execution", x + 16, y + 42);
  ctx.fillStyle = "#2e7d32";
  roundRect(ctx, x + width - 82, y + 18, 58, 26, 13);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 12px Arial";
  ctx.fillText(`${nodes.length || 0} agents`, x + width - 73, y + 36);
  let itemY = y + 64;
  nodes.forEach((node) => {
    drawCanvasMiniItem(ctx, x + 16, itemY, width - 32, 50, `${node.label} Agent`, node.detail, agentIconName(node.label), borderColor, isComplete ? "Complete" : "Ready");
    itemY += 58;
  });
}

function drawCanvasGroupFrame(ctx, x, y, width, height, title, borderColor, fillColor) {
  ctx.save();
  ctx.fillStyle = fillColor;
  roundRect(ctx, x, y, width, height, 10);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = "#c74634";
  ctx.font = "bold 13px Arial";
  ctx.fillText(title.toUpperCase(), x + 16, y + 26);
  ctx.restore();
}

function drawCanvasMiniItem(ctx, x, y, width, height, title, detail, iconName, borderColor, status = "") {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  ctx.fillStyle = "#c74634";
  roundRect(ctx, x + 9, y + 9, 28, 28, 7);
  ctx.fill();
  drawCanvasNodeIcon(ctx, iconName, x + 23, y + 23);
  ctx.fillStyle = "#171412";
  ctx.font = "bold 13px Arial";
  const titleWidth = status ? width - 116 : width - 56;
  ctx.fillText(fitCanvasText(ctx, title, titleWidth), x + 46, y + 21);
  ctx.fillStyle = "#635d57";
  ctx.font = "10.5px Arial";
  ctx.fillText(fitCanvasText(ctx, detail, width - 66), x + 46, y + 36);
  if (status) {
    ctx.fillStyle = status === "Complete" ? "#2e7d32" : "#e9e3de";
    roundRect(ctx, x + width - 72, y + 15, 58, 20, 10);
    ctx.fill();
    ctx.fillStyle = status === "Complete" ? "#ffffff" : "#635d57";
    ctx.font = "bold 9px Arial";
    ctx.fillText(status.toUpperCase(), x + width - 64, y + 29);
  }
  ctx.restore();
}

function drawCanvasSourceMiniItem(ctx, x, y, width, height, source, borderColor) {
  ctx.save();
  ctx.fillStyle = "#ffffff";
  roundRect(ctx, x, y, width, height, 8);
  ctx.fill();
  ctx.strokeStyle = borderColor;
  ctx.lineWidth = 1.3;
  ctx.stroke();
  drawCanvasSourceBrandBadge(ctx, x + 9, y + 8, 30, sourceIconKind(source));
  ctx.fillStyle = "#171412";
  ctx.font = "bold 13px Arial";
  ctx.fillText(fitCanvasText(ctx, source.KnowledgeSource, width - 58), x + 47, y + 21);
  ctx.fillStyle = "#635d57";
  ctx.font = "10.5px Arial";
  ctx.fillText(fitCanvasText(ctx, source.Channel || source.SourceType || "Knowledge source", width - 66), x + 47, y + 36);
  ctx.restore();
}

function drawCanvasSourceBrandBadge(ctx, x, y, size, kind) {
  const cx = x + size / 2;
  const cy = y + size / 2;
  ctx.save();
  ctx.lineWidth = 1.6;
  if (kind === "sharepoint") {
    ctx.fillStyle = "#e8f7f7";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.fillStyle = "#36c5bd";
    ctx.beginPath();
    ctx.arc(cx + 5, cy - 5, 8, 0, Math.PI * 2);
    ctx.arc(cx + 7, cy + 6, 7, 0, Math.PI * 2);
    ctx.arc(cx - 4, cy + 2, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#078a92";
    roundRect(ctx, x + 4, y + 6, 17, 18, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.fillText("S", x + 8, y + 20);
  } else if (kind === "outlook") {
    ctx.fillStyle = "#e8f1ff";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.fillStyle = "#0f6cbd";
    roundRect(ctx, x + 5, y + 7, 14, 17, 3);
    ctx.fill();
    ctx.fillStyle = "#2b88d8";
    roundRect(ctx, x + 15, y + 9, 11, 13, 2);
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(x + 16, y + 10);
    ctx.lineTo(x + 21, y + 15);
    ctx.lineTo(x + 26, y + 10);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px Arial";
    ctx.fillText("O", x + 8, y + 20);
  } else if (kind === "slack") {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    drawSlackBar(ctx, cx - 8, cy - 2, 14, 5, "#36c5f0", 0);
    drawSlackBar(ctx, cx - 2, cy - 8, 5, 14, "#2eb67d", 0);
    drawSlackBar(ctx, cx + 2, cy + 3, 14, 5, "#ecb22e", 0);
    drawSlackBar(ctx, cx + 3, cy - 1, 5, 14, "#e01e5a", 0);
    ctx.strokeStyle = "#e5ded8";
    roundRect(ctx, x, y, size, size, 8);
    ctx.stroke();
  } else if (kind === "excel") {
    ctx.fillStyle = "#eaf6ef";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.fillStyle = "#107c41";
    roundRect(ctx, x + 5, y + 5, 20, 20, 4);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 15px Arial";
    ctx.fillText("X", x + 10, y + 21);
  } else if (kind === "pdf") {
    ctx.fillStyle = "#fff0ee";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    ctx.fillStyle = "#d93025";
    roundRect(ctx, x + 6, y + 5, 18, 21, 3);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 7px Arial";
    ctx.fillText("PDF", x + 8, y + 19);
  } else if (kind === "database") {
    ctx.fillStyle = "#3b6ea8";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    drawCanvasNodeIcon(ctx, "database", cx, cy);
  } else if (kind === "audio") {
    ctx.fillStyle = "#b85c00";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    drawCanvasNodeIcon(ctx, "mic", cx, cy);
  } else if (kind === "video") {
    ctx.fillStyle = "#315bb8";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    drawCanvasNodeIcon(ctx, "video", cx, cy);
  } else {
    ctx.fillStyle = "#4472c4";
    roundRect(ctx, x, y, size, size, 8);
    ctx.fill();
    drawCanvasNodeIcon(ctx, "fileText", cx, cy);
  }
  ctx.restore();
}

function drawSlackBar(ctx, x, y, width, height, color) {
  ctx.fillStyle = color;
  roundRect(ctx, x, y, width, height, height / 2);
  ctx.fill();
}

function drawCanvasArrow(ctx, fromX, fromY, toX, toY, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX - 12, toY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - 14, toY - 9);
  ctx.lineTo(toX - 14, toY + 9);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCanvasLegend(ctx, x, y, data, sources, workerNodes) {
  ctx.save();
  ctx.fillStyle = "#171412";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Selected Knowledge Sources", x, y);
  ctx.font = "14px Arial";
  ctx.fillStyle = "#635d57";
  const sourceText = sources.length ? sources.map((source) => source.KnowledgeSource).join(", ") : "None selected";
  drawCanvasWrappedText(ctx, sourceText, x, y + 26, 600, 20, 3);
  ctx.fillStyle = "#171412";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Agent Worker Branches", x + 720, y);
  ctx.fillStyle = "#635d57";
  ctx.font = "14px Arial";
  const workerText = workerNodes.length ? workerNodes.map((node) => `${node.label} Agent`).join(", ") : "No worker agents mapped";
  drawCanvasWrappedText(ctx, workerText, x + 720, y + 26, 620, 20, 3);
  ctx.fillStyle = "#8a8178";
  ctx.font = "12px Arial";
  ctx.fillText(`Generated ${new Date(data.generatedAt || Date.now()).toLocaleString()}`, x, y + 120);
  ctx.restore();
}

function drawCanvasWrappedText(ctx, value, x, y, maxWidth, lineHeight, maxLines = 3) {
  const words = text(value).split(/\s+/).filter(Boolean);
  let line = "";
  let lines = 0;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(lines === maxLines - 1 ? fitCanvasText(ctx, line, maxWidth) : line, x, y);
      lines += 1;
      if (lines >= maxLines) return;
      line = word;
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line && lines < maxLines) ctx.fillText(fitCanvasText(ctx, line, maxWidth), x, y);
}

function drawCanvasNodeIcon(ctx, iconName, cx, cy) {
  const drawCircle = (x, y, radius, fill = false) => {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    fill ? ctx.fill() : ctx.stroke();
  };
  const drawRoundedRect = (x, y, width, height, radius) => {
    roundRect(ctx, x, y, width, height, radius);
    ctx.stroke();
  };
  ctx.save();
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2.2;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  switch (iconName) {
    case "user":
      drawCircle(cx, cy - 6, 4);
      ctx.beginPath();
      ctx.arc(cx, cy + 9, 8, Math.PI * 1.05, Math.PI * 1.95);
      ctx.stroke();
      break;
    case "message":
      drawRoundedRect(cx - 10, cy - 8, 20, 14, 3);
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 6);
      ctx.lineTo(cx - 9, cy + 11);
      ctx.lineTo(cx - 8, cy + 5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 2);
      ctx.lineTo(cx + 6, cy - 2);
      ctx.moveTo(cx - 5, cy + 3);
      ctx.lineTo(cx + 3, cy + 3);
      ctx.stroke();
      break;
    case "search":
      drawCircle(cx - 2, cy - 2, 7);
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy + 4);
      ctx.lineTo(cx + 10, cy + 10);
      ctx.stroke();
      break;
    case "database":
      ctx.beginPath();
      ctx.ellipse(cx, cy - 8, 9, 4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - 9, cy - 8);
      ctx.lineTo(cx - 9, cy + 7);
      ctx.ellipse(cx, cy + 7, 9, 4, 0, 0, Math.PI);
      ctx.moveTo(cx + 9, cy - 8);
      ctx.lineTo(cx + 9, cy + 7);
      ctx.moveTo(cx - 9, cy - 1);
      ctx.ellipse(cx, cy - 1, 9, 4, 0, 0, Math.PI);
      ctx.stroke();
      break;
    case "code":
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy - 8);
      ctx.lineTo(cx - 10, cy);
      ctx.lineTo(cx - 4, cy + 8);
      ctx.moveTo(cx + 4, cy - 8);
      ctx.lineTo(cx + 10, cy);
      ctx.lineTo(cx + 4, cy + 8);
      ctx.stroke();
      break;
    case "fileText":
    case "scan":
      ctx.beginPath();
      ctx.moveTo(cx - 7, cy - 10);
      ctx.lineTo(cx + 3, cy - 10);
      ctx.lineTo(cx + 9, cy - 4);
      ctx.lineTo(cx + 9, cy + 10);
      ctx.lineTo(cx - 7, cy + 10);
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx + 3, cy - 10);
      ctx.lineTo(cx + 3, cy - 4);
      ctx.lineTo(cx + 9, cy - 4);
      ctx.moveTo(cx - 3, cy);
      ctx.lineTo(cx + 4, cy);
      ctx.moveTo(cx - 3, cy + 5);
      ctx.lineTo(cx + 4, cy + 5);
      ctx.stroke();
      break;
    case "chart":
      ctx.beginPath();
      ctx.moveTo(cx - 10, cy + 9);
      ctx.lineTo(cx + 10, cy + 9);
      ctx.moveTo(cx - 8, cy + 9);
      ctx.lineTo(cx - 8, cy + 2);
      ctx.moveTo(cx, cy + 9);
      ctx.lineTo(cx, cy - 7);
      ctx.moveTo(cx + 8, cy + 9);
      ctx.lineTo(cx + 8, cy - 1);
      ctx.stroke();
      break;
    case "mic":
      drawRoundedRect(cx - 4, cy - 10, 8, 14, 4);
      ctx.beginPath();
      ctx.arc(cx, cy - 1, 9, 0, Math.PI);
      ctx.moveTo(cx, cy + 8);
      ctx.lineTo(cx, cy + 12);
      ctx.stroke();
      break;
    case "video":
      drawRoundedRect(cx - 10, cy - 7, 14, 14, 3);
      ctx.beginPath();
      ctx.moveTo(cx + 4, cy - 3);
      ctx.lineTo(cx + 11, cy - 7);
      ctx.lineTo(cx + 11, cy + 7);
      ctx.lineTo(cx + 4, cy + 3);
      ctx.stroke();
      break;
    case "tag":
      ctx.beginPath();
      ctx.moveTo(cx + 9, cy);
      ctx.lineTo(cx, cy + 9);
      ctx.lineTo(cx - 10, cy - 1);
      ctx.lineTo(cx - 10, cy - 9);
      ctx.lineTo(cx - 2, cy - 9);
      ctx.closePath();
      ctx.stroke();
      drawCircle(cx - 6, cy - 5, 1.4, true);
      break;
    case "vector":
      drawCircle(cx - 8, cy - 7, 3);
      drawCircle(cx + 8, cy - 7, 3);
      drawCircle(cx, cy + 9, 3);
      ctx.beginPath();
      ctx.moveTo(cx - 5, cy - 6);
      ctx.lineTo(cx + 5, cy - 6);
      ctx.moveTo(cx - 7, cy - 4);
      ctx.lineTo(cx - 2, cy + 7);
      ctx.moveTo(cx + 7, cy - 4);
      ctx.lineTo(cx + 2, cy + 7);
      ctx.stroke();
      break;
    case "upload":
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8);
      ctx.lineTo(cx, cy - 9);
      ctx.moveTo(cx - 6, cy - 3);
      ctx.lineTo(cx, cy - 9);
      ctx.lineTo(cx + 6, cy - 3);
      ctx.moveTo(cx - 9, cy + 11);
      ctx.lineTo(cx + 9, cy + 11);
      ctx.stroke();
      break;
    case "brain":
    case "bot":
    default:
      drawRoundedRect(cx - 10, cy - 7, 20, 14, 5);
      ctx.beginPath();
      ctx.moveTo(cx, cy - 7);
      ctx.lineTo(cx, cy - 12);
      ctx.stroke();
      drawCircle(cx - 5, cy - 1, 1.5, true);
      drawCircle(cx + 5, cy - 1, 1.5, true);
      ctx.beginPath();
      ctx.moveTo(cx - 4, cy + 4);
      ctx.lineTo(cx + 4, cy + 4);
      ctx.stroke();
      break;
  }
  ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapCanvasText(ctx, textValue, x, y, maxWidth, lineHeight) {
  const words = text(textValue).split(/\s+/);
  let line = "";
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
      return;
    }
    line = testLine;
  });
  if (line) ctx.fillText(line, x, y);
}

async function handleWorkbookUpload(file) {
  if (!file) return;
  if (file.name.toLowerCase().endsWith(".json")) {
    const parsed = JSON.parse(await file.text());
    WORKBOOK = parsed.sheets ? parsed : { ...BASE_WORKBOOK, sheets: parsed };
    resetAfterWorkbook(file.name);
    return;
  }
  if (!window.XLSX) {
    window.alert("The browser XLSX parser did not load. Use scripts/export_workbook.py to generate JSON, then upload that JSON.");
    return;
  }
  const buffer = await file.arrayBuffer();
  const workbook = window.XLSX.read(buffer, { type: "array" });
  const sheets = {};
  workbook.SheetNames.forEach((name) => {
    sheets[name] = window.XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: "" }).map((row) => {
      const clean = {};
      Object.keys(row).forEach((key) => {
        if (!key.startsWith("__EMPTY")) clean[key] = text(row[key]);
      });
      return clean;
    });
  });
  WORKBOOK = {
    ...BASE_WORKBOOK,
    generatedFrom: file.name,
    generatedAt: new Date().toISOString(),
    requiredTabs: workbook.SheetNames,
    sheets,
  };
  resetAfterWorkbook(file.name);
}

function resetAfterWorkbook() {
  state.personaId = "";
  state.patternId = "";
  state.experience = "Engineer";
  state.experienceSelected = true;
  state.selectedKnowledgeIds = [];
  state.knowledgeSelections = {};
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.benefitsPayload = null;
  state.traceOpen = false;
  state.sourceRailOpen = false;
  state.flowOrientation = "horizontal";
  resetRunTesting();
  resetSavedRunKey();
  state.run = emptyRun();
  state.screen = "persona";
  render();
}

function handleContentUpload(files) {
  state.uploadedContent = Array.from(files || []).map((file) => ({
    path: file.webkitRelativePath || file.name,
    name: file.name,
    extension: file.name.includes(".") ? file.name.split(".").pop().toLowerCase() : "file",
    size: file.size,
    modified: new Date(file.lastModified).toISOString(),
  }));
  render();
}

function closeActiveModal() {
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.benefitsPayload = null;
  state.runSuccessOpen = false;
  render();
}

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-settings-open], [data-doc-close], [data-trace-toggle], [data-source-rail-toggle], [data-source-toggle], button, [data-modal-close]");
  if (!target) return;
  if (target.dataset.sourceRailToggle !== undefined) {
    event.preventDefault();
    state.sourceRailOpen = !state.sourceRailOpen;
    return render();
  }
  if (target.dataset.traceToggle !== undefined) {
    event.preventDefault();
    state.traceOpen = !state.traceOpen;
    return render();
  }
  if (target.dataset.docClose !== undefined) {
    if (event.target === target || target.matches("button")) {
      event.preventDefault();
      state.docViewerSourceId = "";
      return render();
    }
    return;
  }
  if (target.dataset.settingsOpen !== undefined) {
    event.preventDefault();
    state.settingsOpen = true;
    state.modalSourceId = "";
    state.docViewerSourceId = "";
    state.downloadModalOpen = false;
    state.downloadPayload = null;
    state.benefitsPayload = null;
    state.runSuccessOpen = false;
    return render();
  }
  if (target.dataset.modalClose !== undefined) {
    if (event.target === target || target.matches("button")) {
      closeActiveModal();
    }
    return;
  }
  if (target.dataset.resetExperience !== undefined) {
    resetExperience();
    return render();
  }
  if (target.dataset.step) return go(target.dataset.step);
  if (target.dataset.routePrev !== undefined) return previous();
  if (target.dataset.routeNext !== undefined) return next();
  if (target.dataset.persona) {
    state.personaId = target.dataset.persona;
    state.personaError = false;
    state.experience = "Engineer";
    state.experienceSelected = true;
    state.patternId = "";
    state.selectedKnowledgeIds = [];
    state.knowledgeSelections = {};
    state.knowledgeContext = "";
    resetRunTesting();
    state.run = emptyRun();
    state.traceOpen = false;
    state.sourceRailOpen = false;
    state.workerName = "";
    state.workerNameError = false;
    ensureDefaults(true);
    render();
    focusWorkerNamePanel();
    return;
  }
  if (target.dataset.nameSuggestion) {
    state.workerName = target.dataset.nameSuggestion;
    state.workerNameError = false;
    return render();
  }
  if (target.dataset.pattern) {
    saveKnowledgeSelection();
    state.patternId = target.dataset.pattern;
    resetRunTesting();
    state.run = emptyRun();
    state.traceOpen = false;
    state.sourceRailOpen = false;
    ensureDefaults();
    render();
    focusKnowledgePanel();
    return;
  }
  if (target.dataset.sourceToggle) {
    const selected = new Set(state.selectedKnowledgeIds);
    if (selected.has(target.dataset.sourceToggle)) selected.delete(target.dataset.sourceToggle);
    else selected.add(target.dataset.sourceToggle);
    state.selectedKnowledgeIds = [...selected];
    state.knowledgeSelections = {
      ...state.knowledgeSelections,
      [knowledgeContextKey()]: [...state.selectedKnowledgeIds],
    };
    state.knowledgeContext = knowledgeContextKey();
    resetRunTesting();
    state.run = emptyRun();
    state.traceOpen = false;
    return render();
  }
  if (target.dataset.sourceView) {
    state.docViewerSourceId = target.dataset.sourceView;
    state.modalSourceId = "";
    state.downloadModalOpen = false;
    state.downloadPayload = null;
    state.benefitsPayload = null;
    state.runSuccessOpen = false;
    state.settingsOpen = false;
    return render();
  }
  if (target.dataset.docOpen) {
    state.docViewerSourceId = target.dataset.docOpen;
    state.runSuccessOpen = false;
    return render();
  }
  if (target.dataset.runQuestion) return startRun(target.dataset.runQuestion);
  if (target.dataset.runCustom !== undefined) return startRun("", state.customQuestion.trim());
  if (target.dataset.runSuccessContinue !== undefined) return continueFromRunSuccess();
  if (target.dataset.addLeader !== undefined) return addLeaderboard();
  if (target.dataset.leaderPage !== undefined) return goLeaderboardPage(Number(target.dataset.leaderPage));
  if (target.dataset.benefits !== undefined) return openBenefitsModal(rowPayloadFromButton(target));
  if (target.dataset.downloadQr !== undefined) return openDownloadModal(rowPayloadFromButton(target));
  if (target.dataset.download) return download(target.dataset.download, rowPayloadFromButton(target));
  if (target.dataset.workbookUploadTrigger !== undefined) return document.getElementById("workbookUpload")?.click();
  if (target.dataset.contentUploadTrigger !== undefined) return document.getElementById("contentUpload")?.click();
});

function resetExperience() {
  if (runTimer) window.clearInterval(runTimer);
  runTimer = null;
  state.screen = "register";
  state.name = "";
  state.registerError = false;
  state.personaId = "";
  state.personaError = false;
  state.experience = "Engineer";
  state.experienceSelected = true;
  state.workerName = "";
  state.workerNameError = false;
  state.patternId = "";
  state.selectedKnowledgeIds = [];
  state.knowledgeSelections = {};
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.benefitsPayload = null;
  state.composerEngaged = false;
  state.customQuestion = "";
  state.traceOpen = false;
  state.sourceRailOpen = false;
  state.flowOrientation = "horizontal";
  resetRunTesting();
  resetSavedRunKey();
  state.run = emptyRun();
}

document.addEventListener("input", (event) => {
  if (event.target.id === "nameInput") {
    state.name = event.target.value;
    const startButton = document.querySelector("[data-register-start]");
    if (startButton) startButton.disabled = !state.name.trim();
    if (state.registerError && state.name.trim()) {
      state.registerError = false;
      event.target.setAttribute("aria-invalid", "false");
      event.target.closest(".field")?.classList.remove("fieldInvalid");
      const message = document.getElementById("nameInputMessage");
      if (message) {
        message.textContent = "";
      }
    }
  }
  if (event.target.id === "workerName") {
    state.workerName = event.target.value;
    const nextButton = document.querySelector(".routeActions [data-route-next]");
    if (nextButton) nextButton.disabled = !state.workerName.trim();
    document.querySelector("[data-worker-name-panel]")?.classList.toggle("needsName", !state.workerName.trim());
    if (state.workerNameError && state.workerName.trim()) {
      state.workerNameError = false;
      event.target.setAttribute("aria-invalid", "false");
      event.target.closest(".field")?.classList.remove("fieldInvalid");
      const message = document.getElementById("workerNameMessage");
      if (message) {
        message.textContent = "";
      }
    }
  }
  if (event.target.id === "customQuestion") {
    state.customQuestion = event.target.value;
    if (state.screen === "blueprint" && state.customQuestion.trim()) {
      state.composerEngaged = true;
      document.querySelector(".agentChatSurface")?.classList.remove("noConversation");
      document.querySelector(".agentChatSurface")?.classList.add("composerEngaged");
    }
    updateTypingRecommendations();
  }
});

document.addEventListener("focusin", (event) => {
  if (event.target.id !== "customQuestion" || state.screen !== "blueprint") return;
  state.composerEngaged = true;
  document.querySelector(".agentChatSurface")?.classList.remove("noConversation");
  document.querySelector(".agentChatSurface")?.classList.add("composerEngaged");
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeActiveModal();
    return;
  }
  if (event.key !== "Enter" || event.shiftKey || event.isComposing) return;
  if (event.target.id === "customQuestion" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    startRun("", state.customQuestion.trim());
    return;
  }
  if (document.querySelector(".modalBackdrop")) return;
  if (event.target.matches?.("textarea:not(#customQuestion), [contenteditable='true']")) return;
  if (event.target.matches?.("button:not([data-route-next])")) return;
  const nextButton = document.querySelector("[data-route-next]");
  if (nextButton && !nextButton.disabled) {
    event.preventDefault();
    next();
  }
});

function updateTypingRecommendations() {
  const container = document.querySelector("[data-typing-recommendations]");
  if (!container) return;
  container.innerHTML = renderTypingRecommendations();
}

document.addEventListener("change", (event) => {
  if (event.target.id === "workbookUpload") {
    handleWorkbookUpload(event.target.files?.[0]);
    event.target.value = "";
    return;
  }
  if (event.target.id === "contentUpload") {
    handleContentUpload(event.target.files);
    event.target.value = "";
    return;
  }
});

render();
downloadFromHash();
window.addEventListener("hashchange", downloadFromHash);
