const BASE_WORKBOOK = window.OCI_AI_FACTORY_WORKBOOK || { sheets: {}, blueprintNodeTemplates: {}, runtimeTemplates: {} };
const BASE_MANIFEST = window.OCI_AI_FACTORY_CONTENT_MANIFEST || [];

let WORKBOOK = clone(BASE_WORKBOOK);
let CONTENT_MANIFEST = clone(BASE_MANIFEST);
let runTimer = null;

const state = {
  screen: "register",
  name: "Harry",
  personaId: "",
  experience: "Explore",
  experienceSelected: false,
  workerName: "",
  patternId: "",
  selectedKnowledgeIds: [],
  knowledgeContext: "",
  modalSourceId: "",
  settingsOpen: false,
  downloadModalOpen: false,
  downloadPayload: null,
  customQuestion: "",
  run: emptyRun(),
  uploadedContent: [],
  leaderboard: readLeaderboard(),
};

const stepOrder = ["register", "persona", "experience", "pattern", "blueprint", "leaderboard"];
const stepLabels = {
  register: ["Register", "Your Nick Name"],
  persona: ["Persona", "Actual Role"],
  experience: ["Experience", "Explore / Engineer"],
  pattern: ["Agent Pattern", "Engineer only"],
  blueprint: ["Blueprint", "Build + test"],
  leaderboard: ["Complete", "Leaderboard + download"],
};

function clone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function emptyRun() {
  return {
    running: false,
    currentStep: -1,
    qnaId: "",
    question: "",
    response: "",
    startedAt: 0,
    durationMs: 0,
    isCustom: false,
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

function knowledgeSources() {
  return sheet("04_Knowledge_Sources");
}

function personaById(id = state.personaId) {
  return personas().find((row) => row.PersonaID === id) || null;
}

function patternById(id = state.patternId) {
  return patterns().find((row) => row.PatternID === id) || null;
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

function questionsFor(personaId = state.personaId, patternId = state.patternId) {
  const scenario = scenarioFor(personaId, patternId);
  if (!scenario) return [];
  const selected = new Set(state.selectedKnowledgeIds);
  const questions = sheet("08_Scenario_QnA")
    .filter((row) => row.ScenarioID === scenario.ScenarioID)
    .sort((a, b) => Number(a.QuestionOrder || 0) - Number(b.QuestionOrder || 0));
  const sourceAware = questions.some((row) => questionSourceIds(row).length);
  const filtered = sourceAware
    ? questions.filter((row) => questionSourceIds(row).some((id) => selected.has(id)))
    : questions;
  return filtered.slice(0, 2);
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

function experienceRule(name = state.experience) {
  return sheet("06_Experience_Rules").find((row) => row.Experience === name) || null;
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

function ensureDefaults(resetKnowledge = false) {
  const persona = personaById();
  if (!persona) return;
  if (!state.workerName) state.workerName = suggestedWorkerNames()[0] || `${persona.PersonaName.replace(/\s+(Specialist|Agent)$/i, "")} Worker`;
  if (state.experience === "Explore") state.patternId = persona.RecommendedPatternID || state.patternId;
  const context = `${state.personaId}|${state.patternId}|${state.experience}`;
  if (state.patternId && (resetKnowledge || state.knowledgeContext !== context || !state.selectedKnowledgeIds.length)) {
    state.selectedKnowledgeIds = defaultSourceIds();
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
  if (screen === "experience") return canEnter("persona") && Boolean(state.personaId);
  if (screen === "pattern") return canEnter("experience") && Boolean(state.workerName.trim()) && state.experience === "Engineer";
  if (screen === "blueprint") return canEnter("experience") && Boolean(state.workerName.trim()) && Boolean(state.patternId);
  if (screen === "leaderboard") return canEnter("blueprint");
  return false;
}

function go(screen) {
  ensureDefaults();
  if (screen === "pattern" && state.experience === "Explore") screen = "blueprint";
  if (!canEnter(screen)) return;
  state.screen = screen;
  render();
}

function next() {
  if (state.screen === "register") return go("persona");
  if (state.screen === "persona") return go("experience");
  if (state.screen === "experience") {
    if (!state.workerName.trim()) return render();
    state.experienceSelected = true;
    ensureDefaults(true);
    return state.experience === "Engineer" ? go("pattern") : go("blueprint");
  }
  if (state.screen === "pattern") return go("blueprint");
  if (state.screen === "blueprint") return go("leaderboard");
  if (state.screen === "leaderboard") {
    resetExperience();
    return render();
  }
  return go("register");
}

function previous() {
  if (state.screen === "persona") return go("register");
  if (state.screen === "experience") return go("persona");
  if (state.screen === "pattern") return go("experience");
  if (state.screen === "blueprint") return state.experience === "Engineer" ? go("pattern") : go("experience");
  if (state.screen === "leaderboard") return go("blueprint");
  return go("register");
}

function canMoveNext() {
  if (state.screen === "persona") return canEnter("experience");
  if (state.screen === "experience") return Boolean(state.workerName.trim());
  if (state.screen === "pattern") return canEnter("blueprint");
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
      <div class="mainGrid">
        ${renderSide()}
        <main class="content">${renderScreen()}</main>
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
        <div><b>AgentifyME</b><span>Experience the Agent Creation</span></div>
      </div>
      <div class="topActions">
        <button class="settingsButton" type="button" data-settings-open="true" aria-label="Settings" aria-haspopup="dialog" title="Settings">
          ${uiIcon("settings")}
        </button>
        <div class="oracle">ORACLE</div>
      </div>
    </header>
  `;
}

function renderSide() {
  return `
    <aside class="side">
      <h2>Guided Journey</h2>
      <div class="stepper">
        ${stepOrder.map((step, index) => renderStep(step, index)).join("")}
      </div>
      <div class="sideFooter">
        <input class="hiddenInput" id="workbookUpload" type="file" accept=".json,.xlsx,.xls" />
        <input class="hiddenInput" id="contentUpload" type="file" multiple webkitdirectory />
        <button class="resetButton" data-reset-experience>Reset Experience</button>
      </div>
    </aside>
  `;
}

function stepSummary(step, fallback) {
  if (step === "register") return state.screen === "register" ? fallback : state.name.trim() || fallback;
  if (step === "persona") return personaById()?.PersonaName || fallback;
  if (step === "experience") return state.experienceSelected ? [state.experience, state.workerName].filter(Boolean).join(" - ") : fallback;
  if (step === "pattern") {
    if (!state.experienceSelected) return fallback;
    if (state.experience === "Explore" && patternById()) return `${patternById().PatternName} auto-selected`;
    return patternById()?.PatternName || fallback;
  }
  if (step === "blueprint") {
    if ((state.screen === "blueprint" || state.screen === "leaderboard") && state.workerName && patternById()) return `${state.workerName} - ${patternById().PatternName}`;
    return fallback;
  }
  if (step === "leaderboard") return state.screen === "leaderboard" || state.run.response ? `Score ${computeScore()}` : fallback;
  return fallback;
}

function renderStep(step, index) {
  const currentIndex = stepOrder.indexOf(state.screen);
  const skipped = step === "pattern" && state.experience === "Explore";
  const done = index < currentIndex || (skipped && canEnter("blueprint"));
  const active = state.screen === step;
  const [title, meta] = stepLabels[step];
  const summary = stepSummary(step, skipped ? "Auto-selected for Explore" : meta);
  const stepAttribute = skipped ? "" : `data-step="${step}"`;
  return `
    <button class="step ${active ? "active" : ""} ${done ? "done" : ""} ${skipped ? "skipped" : ""}" ${stepAttribute}>
      <span class="stepNum">${index + 1}</span>
      <span><span class="stepTitle">${esc(title)}</span><span class="stepMeta">${esc(summary)}</span></span>
    </button>
  `;
}

function renderScreen() {
  if (state.screen === "persona") return renderPersona();
  if (state.screen === "experience") return renderExperience();
  if (state.screen === "pattern") return renderPattern();
  if (state.screen === "blueprint") return renderBlueprintScreen();
  if (state.screen === "leaderboard") return renderLeaderboard();
  return renderRegister();
}

function renderRegister() {
  return `
    <section class="page">
      <section class="panel pad registerCard">
        <div class="eyebrow">Step 1 - Register</div>
        <h1>Build your Digital co-worker with OCI AI Factory</h1>
        <div class="registerForm">
          <div class="field">
            <label class="label" for="nameInput">Participant name</label>
            <input id="nameInput" class="input" value="${esc(state.name)}" placeholder="Enter your name" autocomplete="off" />
          </div>
          <div class="btnRow" style="margin-top: 14px">
            <button class="action primary" data-route-next>Start experience</button>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderPersona() {
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Persona Selection</div>
          <h1>Select a persona</h1>
        </div>
      </div>
      <div class="grid three">
        ${personas().map((persona) => renderPersonaCard(persona)).join("")}
      </div>
      ${renderRouteActions("Next", "&rarr;")}
    </section>
  `;
}

function renderPersonaCard(persona) {
  const selected = state.personaId === persona.PersonaID;
  return `
    <button class="choice ${selected ? "selected" : ""}" data-persona="${esc(persona.PersonaID)}">
      <h3>${esc(persona.PersonaName)}</h3>
      <p>${esc(persona.Description)}</p>
    </button>
  `;
}

function renderExperience() {
  const rules = sheet("06_Experience_Rules");
  const suggestions = suggestedWorkerNames();
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Experience Path + Digital Worker</div>
          <h1>Pick the experience and name your digital worker</h1>
        </div>
      </div>
      <div class="grid two">
        ${rules.map((rule) => renderExperienceCard(rule)).join("")}
      </div>
      <section class="panel pad" style="margin-top: 14px">
        <div class="field">
          <label class="label" for="workerName">Digital worker name</label>
          <input id="workerName" class="input" value="${esc(state.workerName)}" placeholder="Name your digital worker" autocomplete="off" />
        </div>
        <div class="suggestionRow">
          ${suggestions.map((name) => `<button class="nameSuggestion" data-name-suggestion="${esc(name)}">${esc(name)}</button>`).join("")}
        </div>
      </section>
      ${renderRouteActions("Next", "&rarr;")}
    </section>
  `;
}

function renderExperienceCard(rule) {
  const selected = state.experience === rule.Experience;
  const meta = experienceCardMeta(rule.Experience);
  return `
    <button class="choice experienceChoice ${selected ? "selected" : ""}" data-experience="${esc(rule.Experience)}">
      <span class="check" aria-hidden="true">${selected ? "✓" : ""}</span>
      <span class="experienceTime">${esc(meta.time)}</span>
      <h3>${esc(rule.Experience)}</h3>
      <p>${esc(meta.description)}</p>
      <span class="audiencePill">${esc(meta.audience)}</span>
    </button>
  `;
}

function experienceCardMeta(experience) {
  if (experience === "Engineer") {
    return {
      time: "~5 min",
      description: "Deeper build with technical toggles",
      audience: "HRIT, CIO, architects, technical attendees",
    };
  }
  return {
    time: "2-3 min",
    description: "Guided business build with prefilled options",
    audience: "Business users and execs",
  };
}

function renderPattern() {
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Agent Pattern Selection</div>
          <h1>Select any agent pattern</h1>
        </div>
      </div>
      <div class="grid four">
        ${patterns().map((pattern) => renderPatternCard(pattern)).join("")}
      </div>
      ${renderRouteActions("Build Blueprint", "&rarr;")}
    </section>
  `;
}

function renderPatternCard(pattern) {
  const selected = state.patternId === pattern.PatternID;
  return `
    <button class="choice ${selected ? "selected" : ""}" data-pattern="${esc(pattern.PatternID)}">
      <span class="check" aria-hidden="true">${selected ? "✓" : ""}</span>
      <h3>${esc(pattern.PatternName)}</h3>
      <p>${esc(pattern.Description)}</p>
    </button>
  `;
}

function renderBlueprintScreen() {
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
          <button class="action primary" data-add-leader>${uiIcon("award", "iconBox")}<span>Add to Leaderboard</span></button>
        </div>
      </div>
      <div class="threePane">
        ${renderKnowledgePane()}
        ${renderBlueprintPane(blueprint)}
        ${renderChatPane()}
      </div>
      ${renderRouteActions("Next", "&rarr;")}
    </section>
  `;
}

function renderKnowledgePane() {
  const editable = state.experience === "Engineer";
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
          ${sources.map((source) => renderSourceRow(source, selected.has(source.KnowledgeID), editable)).join("") || `<div class="empty">No workbook sources mapped for this persona and pattern.</div>`}
        </div>
      </div>
    </section>
  `;
}

function renderSourceRow(source, selected, editable) {
  return `
    <article class="sourceRow ${selected ? "selected" : "disabled"}">
      <h4>${esc(source.KnowledgeSource)}</h4>
      <div class="sourceActions">
        ${editable && !selected ? `<button class="sourceIconButton" data-source-toggle="${esc(source.KnowledgeID)}" aria-label="Add ${esc(source.KnowledgeSource)}">+</button>` : ""}
        ${editable && selected ? `<button class="sourceIconButton" data-source-toggle="${esc(source.KnowledgeID)}" aria-label="Remove ${esc(source.KnowledgeSource)}">-</button>` : ""}
        <button class="sourceIconButton" data-source-view="${esc(source.KnowledgeID)}" aria-label="View ${esc(source.KnowledgeSource)}">${redwoodEyeIcon()}</button>
      </div>
    </article>
  `;
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
    download: `<path d="M12 3v11"></path><path d="m7 10 5 5 5-5"></path><path d="M5 21h14"></path>`,
    award: `<circle cx="12" cy="8" r="5"></circle><path d="m8.5 12.5-1 7 4.5-2.5 4.5 2.5-1-7"></path>`,
    close: `<path d="M6 6l12 12"></path><path d="M18 6 6 18"></path>`,
    image: `<rect x="4" y="5" width="16" height="14" rx="2"></rect><circle cx="9" cy="10" r="1.5"></circle><path d="m8 17 3.5-4 2.5 3 1.5-2 2.5 3"></path>`,
    upload: `<path d="M12 16V5"></path><path d="m7 10 5-5 5 5"></path><path d="M5 20h14"></path>`,
    folder: `<path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v7A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-9Z"></path>`,
  };
  return `<span class="${esc(className)}" aria-hidden="true"><svg viewBox="0 0 24 24" focusable="false">${icons[name] || icons.download}</svg></span>`;
}

function renderBlueprintPane(blueprint) {
  return `
    <section class="panel blueprintArea">
      <div class="paneBody" style="border-bottom: 1px solid var(--line)">
        <div class="panelHead">
          <div>
            <h3>${esc(patternById()?.PatternName || "Agent Pattern")}</h3>
            <p>${esc(blueprint?.BlueprintTheme || "Workbook mapped architecture")}</p>
          </div>
          <span class="pill red">${esc(patternById()?.PatternName)}</span>
        </div>
      </div>
      <div class="canvas">
        ${renderBranchedBlueprint()}
      </div>
      ${renderRuntime()}
    </section>
  `;
}

function renderBranchedBlueprint() {
  const nodes = blueprintNodes();
  const userNode = nodes.find((node) => node.id === "user") || nodes[0] || { label: "User", detail: "Persona question" };
  const responseNode = nodes.find((node) => node.id === "response") || nodes[nodes.length - 1] || { label: "Response", detail: "Grounded answer" };
  const workerNodes = nodes.filter((node) => !["user", "source", "response"].includes(node.id));
  const sources = selectedSources();
  return `
    <div class="branchFlow">
      ${renderFlowNode(userNode, 0)}
      ${renderFlowConnector(0)}
      ${renderFlowNode({ label: "AI Orchestrator", detail: "Classifies intent and dispatches selected branches" }, 1, "orchestrator")}
      ${renderBranchGroup("Knowledge Source Branches", sources.slice(0, 4).map((source) => renderSourceBranch(source, 2)).join(""), 2, "sourceBranches")}
      ${renderFlowConnector(2)}
      ${renderBranchGroup("Agent Worker Branches", workerNodes.slice(0, 4).map((node) => renderWorkerBranch(node, 3)).join(""), 3, "workerBranches")}
      ${renderFlowConnector(3)}
      ${renderFlowNode(responseNode, 4, "response")}
    </div>
  `;
}

function flowStageClass(stage) {
  const current = state.run.currentStep;
  const active = current === stage;
  const done = current > stage || (!state.run.running && state.run.response && current >= stage);
  return `${active ? "active" : ""} ${done ? "done" : ""}`;
}

function renderFlowNode(node, stage, extraClass = "") {
  return `
    <div class="bpNode flowNode ${extraClass} ${flowStageClass(stage)}">
      <span class="bpIcon">${esc(shortCode(node.label))}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
  `;
}

function renderSourceBranch(source, stage) {
  return `
    <div class="branchCard sourceBranch ${flowStageClass(stage)}">
      <span class="bpIcon">${esc(shortCode(source.KnowledgeSource))}</span>
      <span><strong>${esc(source.KnowledgeSource)}</strong><small>${esc(source.Channel || source.SourceType || "Workbook source")}</small></span>
    </div>
  `;
}

function renderWorkerBranch(node, stage) {
  return `
    <div class="branchCard workerBranch ${flowStageClass(stage)}">
      <span class="bpIcon">${esc(shortCode(node.label))}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
  `;
}

function renderBranchGroup(title, cards, stage, className) {
  return `
    <div class="branchGroup ${className} ${flowStageClass(stage)}">
      <div class="branchGroupTitle">${esc(title)}</div>
      <div class="branchGrid">
        ${cards || `<div class="empty miniEmpty">No workbook items selected</div>`}
      </div>
    </div>
  `;
}

function renderFlowConnector(stage) {
  return `<div class="edge flowConnector ${state.run.currentStep > stage ? "active" : ""}"></div>`;
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
      <span class="bpIcon">${esc(shortCode(node.label))}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
    ${index < total - 1 ? `<div class="edge ${edgeActive ? "active" : ""}"></div>` : ""}
  `;
}

function renderRuntime() {
  const steps = runtimeSteps();
  const nodeCount = blueprintNodes().length;
  const current = state.run.currentStep;
  return `
    <div class="runtime">
      <div class="panelHead" style="margin-bottom: 0">
        <div>
          <h4>Execution Trace</h4>
          <p class="small">${state.run.running ? "Blueprint is executing." : state.run.response ? `Completed in ${state.run.durationMs} ms.` : "Run a question to animate the path."}</p>
        </div>
        <span class="pill ${state.run.running ? "amber" : state.run.response ? "green" : ""}">${state.run.running ? "Running" : state.run.response ? "Complete" : "Idle"}</span>
      </div>
      <div class="trace">
        ${steps.map((step, index) => `<div class="traceRow ${current >= Math.min(index + 1, nodeCount - 1) ? "done" : ""}"><span class="traceDot">${index + 1}</span><span>${esc(step)}</span></div>`).join("")}
      </div>
    </div>
  `;
}

function renderChatPane() {
  const qs = questionsFor();
  const hasRun = Boolean(state.run.question);
  return `
    <aside class="panel chatPanel redwoodChat">
      <header class="chatHeader">
        <span class="chatHeaderIcon">AI</span>
        <strong>Redwood Assistant</strong>
      </header>
      <div class="chatThread">
        <div class="chatMessage agentMessage">
          <span class="chatAvatar">AI</span>
          <div class="messageStack">
            <div class="bubble agent">Hello. I am ready to test this blueprint.</div>
            <span class="chatTime">Blueprint test</span>
          </div>
        </div>
        ${renderMessages()}
        <div class="suggestedTitle">${hasRun ? "Follow-up questions" : "Suggested questions"}</div>
        <div class="promptList chatPromptList">
          ${qs.map((q) => `<button class="prompt" data-run-question="${esc(q.QnAID)}"><span>${esc(q.Question)}</span><b aria-hidden="true">&rsaquo;</b></button>`).join("") || `<div class="empty">No questions mapped for this scenario.</div>`}
        </div>
      </div>
      ${state.experience === "Engineer" ? `
        <div class="chatComposerBar">
          <textarea id="customQuestion" class="chatInput" placeholder="Type your message..." rows="1">${esc(state.customQuestion)}</textarea>
          <button class="sendButton" data-run-custom aria-label="Run custom question">
            <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M3.5 20.5 21 12 3.5 3.5 6.25 10.9 14 12l-7.75 1.1-2.75 7.4Z"></path></svg>
          </button>
        </div>
      ` : `
        <div class="chatFooter">Powered by <b>Redwood</b></div>
      `}
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
        ${state.run.response ? `<div class="bubble agent">${esc(state.run.response)}</div>${renderReasoning()}` : `<div class="bubble agent">Executing blueprint path. Nodes light up sequentially in the center panel.</div>`}
        <span class="chatTime">${state.run.response ? `Completed in ${state.run.durationMs} ms` : "Working"}</span>
      </div>
    </div>
  `;
}

function renderReasoning() {
  const sourceNames = selectedSources().map((source) => source.KnowledgeSource).join(", ");
  const scenario = scenarioFor();
  return `
    <div class="previewBox">
      <h4>Reasoning Flow</h4>
      <p class="small">Scenario: ${esc(scenario?.ScenarioTitle || "Workbook scenario")}</p>
      <p class="small">Sources: ${esc(sourceNames || "No sources selected")}</p>
      <p class="small">Pattern: ${esc(patternById()?.PatternName)}. Experience: ${esc(state.experience)}.</p>
    </div>
  `;
}

function renderLeaderboard() {
  const currentScore = computeScore();
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Leaderboard + Download Blueprint</div>
          <h1>Blueprint rankings</h1>
          <p class="subcopy">Scores are calculated from <b>12_Leaderboard_Config</b> weights and current blueprint state.</p>
        </div>
        <div class="btnRow">
          <span class="pill green">Current score ${currentScore}</span>
          <button class="action primary" data-add-leader>${uiIcon("award", "iconBox")}<span>Add Current Run</span></button>
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
  const rows = [...state.leaderboard].sort((a, b) => b.score - a.score);
  if (!rows.length) return `<div class="empty">No leaderboard rows yet. Add the current blueprint to create a ranking.</div>`;
  return `
    <div class="tableWrap">
      <table>
        <thead>
          <tr>
            <th>User</th><th>Persona</th><th>Experience</th><th>Pattern</th><th>Blueprint Name</th><th>Score</th><th>Downloads</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td>${esc(row.user)}</td>
              <td>${esc(row.persona)}</td>
              <td>${esc(row.experience)}</td>
              <td>${esc(row.pattern)}</td>
              <td>${esc(row.blueprintName)}</td>
              <td><span class="score">${row.score}</span></td>
              <td><button class="miniButton" data-download-qr data-leader-index="${index}">Download Blueprint</button></td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderModal() {
  if (state.settingsOpen) return renderSettingsModal();
  if (state.downloadModalOpen) return renderDownloadModal();
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
            <section class="previewBox sourceFilesBox">
              <h4>Mapped file</h4>
              <div class="fileList">
                ${files.length ? files.slice(0, 1).map(renderFileItem).join("") : `<p class="small">No local file is detected for this source type yet.</p>`}
              </div>
            </section>
          </div>
        </div>
      </section>
    </div>
  `;
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
              <h3>${esc(payload.pattern || patternById()?.PatternName || "Agent Pattern")}</h3>
              <p>${esc(payload.persona || personaById()?.PersonaName || "Selected persona")} - ${esc(payload.experience || state.experience)} - Score ${esc(payload.score || computeScore())}</p>
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
                <div class="metric"><b>${stats.patterns}</b><span>Patterns</span></div>
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
  const primary = files[0];
  return `
    <h4>Document preview</h4>
    <div class="documentPreview">
      <div class="docPage">
        <div class="docKicker">${esc(source.SourceType || "Document")}</div>
        <h3>${esc(source.KnowledgeSource)}</h3>
        <p>${esc(source.Description || "Workbook mapped source content")}</p>
        <ul>
          <li>Source category: ${esc(source.Channel || "Document")}</li>
          <li>Used by ${esc(patternById()?.PatternName || "selected pattern")} blueprint testing</li>
          <li>Scoped to ${esc(personaById()?.PersonaName || "selected persona")}</li>
        </ul>
      </div>
      ${primary ? `<a class="fileOpenLink" href="${esc(primary.path)}" target="_blank" rel="noopener">Open ${esc(primary.name)}</a>` : ""}
    </div>
  `;
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
  const qna = qnaId ? sheet("08_Scenario_QnA").find((row) => row.QnAID === qnaId) : null;
  const question = customQuestion || qna?.Question || "";
  if (!question.trim()) return;
  if (runTimer) window.clearInterval(runTimer);
  state.run = {
    ...emptyRun(),
    running: true,
    currentStep: 0,
    qnaId: qnaId || "",
    question,
    startedAt: Date.now(),
    isCustom: Boolean(customQuestion),
  };
  render();
  const total = Math.max(blueprintNodes().length, 1);
  runTimer = window.setInterval(() => {
    if (state.run.currentStep < total - 1) {
      state.run.currentStep += 1;
      render();
      return;
    }
    window.clearInterval(runTimer);
    runTimer = null;
    state.run.running = false;
    state.run.durationMs = Date.now() - state.run.startedAt;
    state.run.response = state.run.isCustom ? customResponse(question) : workbookResponse(qna);
    render();
  }, 620);
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
    firstResponse ? `Nearest workbook response pattern: ${firstResponse}` : "No nearest workbook response pattern is available.",
  ].join("\n\n");
}

function computeScore() {
  const weights = sheet("12_Leaderboard_Config");
  const totalWeight = weights.reduce((sum, row) => sum + Number(row.Weight || 0), 0) || 100;
  const available = availableSourcesFor().length || 1;
  const selected = selectedSources().length;
  const questions = questionsFor().length;
  const values = {
    "Blueprint completeness": state.personaId && state.experience && state.patternId && state.workerName ? 1 : 0,
    "Knowledge source coverage": Math.min(selected / available, 1),
    "Question coverage": Math.min(questions / 2, 1),
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
    experience: state.experience,
    pattern: pattern?.PatternName || "",
    digitalWorkerName: state.workerName,
    blueprintName: pattern?.PatternName || blueprint?.BlueprintType || "Agent Pattern",
    workbookBlueprintType: blueprint?.BlueprintType || "",
    blueprintTheme: blueprint?.BlueprintTheme || "",
    executionStyle: blueprint?.ExecutionStyle || "",
    knowledgeSources: selectedSources(),
    questions: questionsFor(),
    latestRun: state.run,
    nodes: blueprintNodes(),
    runtimeDetails: runtimeSteps(),
    score: computeScore(),
  };
}

function addLeaderboard() {
  const payload = blueprintPayload();
  const row = {
    id: `LB-${Date.now()}`,
    user: payload.user || "Anonymous",
    persona: payload.persona,
    experience: payload.experience,
    pattern: payload.pattern,
    blueprintName: payload.blueprintName,
    score: payload.score,
    payload,
  };
  state.leaderboard = [row, ...state.leaderboard].slice(0, 20);
  localStorage.setItem("ociAiFactoryLeaderboard", JSON.stringify(state.leaderboard));
  state.screen = "leaderboard";
  render();
}

function readLeaderboard() {
  try {
    return JSON.parse(localStorage.getItem("ociAiFactoryLeaderboard") || "[]");
  } catch {
    return [];
  }
}

function rowPayloadFromButton(button) {
  const index = button.dataset.leaderIndex;
  if (index === undefined) return null;
  const rows = [...state.leaderboard].sort((a, b) => b.score - a.score);
  return rows[Number(index)]?.payload || null;
}

function openDownloadModal(payload = null) {
  const data = payload || blueprintPayload();
  state.downloadPayload = data;
  state.downloadModalOpen = true;
  state.modalSourceId = "";
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
    `Experience: ${data.experience}`,
    `Pattern: ${data.pattern}`,
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
  canvas.width = 1000;
  canvas.height = 1320;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#f7f5f2";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#c74634";
  ctx.fillRect(0, 0, canvas.width, 74);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText("AgentifyME OCI AI Factory Blueprint", 40, 46);
  ctx.fillStyle = "#171412";
  ctx.font = "bold 26px Arial";
  ctx.fillText(data.blueprintName, 40, 120);
  ctx.font = "16px Arial";
  ctx.fillText(`${data.persona} | ${data.experience} | ${data.pattern} | Score ${data.score}`, 40, 150);
  let y = 210;
  data.nodes.forEach((node, index) => {
    ctx.fillStyle = "#ffffff";
    roundRect(ctx, 250, y, 500, 76, 8);
    ctx.fill();
    ctx.strokeStyle = index <= (data.latestRun?.currentStep ?? -1) ? "#c74634" : "#cfc7bf";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = "#c74634";
    roundRect(ctx, 270, y + 17, 42, 42, 8);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px Arial";
    ctx.fillText(shortCode(node.label), 280, y + 44);
    ctx.fillStyle = "#171412";
    ctx.font = "bold 17px Arial";
    ctx.fillText(node.label, 330, y + 33);
    ctx.fillStyle = "#635d57";
    ctx.font = "13px Arial";
    wrapCanvasText(ctx, node.detail, 330, y + 54, 380, 15);
    if (index < data.nodes.length - 1) {
      ctx.strokeStyle = "#c8c0b8";
      ctx.beginPath();
      ctx.moveTo(500, y + 76);
      ctx.lineTo(500, y + 110);
      ctx.stroke();
    }
    y += 112;
  });
  y += 20;
  ctx.fillStyle = "#171412";
  ctx.font = "bold 18px Arial";
  ctx.fillText("Knowledge Sources", 40, y);
  y += 28;
  ctx.fillStyle = "#635d57";
  ctx.font = "14px Arial";
  data.knowledgeSources.slice(0, 8).forEach((source) => {
    ctx.fillText(`- ${source.KnowledgeSource}`, 52, y);
    y += 22;
  });
  const url = canvas.toDataURL("image/png");
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
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
  state.experienceSelected = false;
  state.selectedKnowledgeIds = [];
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
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

document.addEventListener("click", (event) => {
  const target = event.target.closest("[data-settings-open], button, [data-modal-close]");
  if (!target) return;
  if (target.dataset.settingsOpen !== undefined) {
    event.preventDefault();
    state.settingsOpen = true;
    state.modalSourceId = "";
    state.downloadModalOpen = false;
    state.downloadPayload = null;
    return render();
  }
  if (target.dataset.modalClose !== undefined) {
    if (event.target === target || target.matches("button")) {
      state.modalSourceId = "";
      state.settingsOpen = false;
      state.downloadModalOpen = false;
      state.downloadPayload = null;
      render();
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
    state.experience = "Explore";
    state.experienceSelected = false;
    state.patternId = "";
    state.selectedKnowledgeIds = [];
    state.knowledgeContext = "";
    state.run = emptyRun();
    state.workerName = "";
    ensureDefaults(true);
    return render();
  }
  if (target.dataset.experience) {
    state.experience = target.dataset.experience;
    state.experienceSelected = true;
    state.patternId = "";
    state.selectedKnowledgeIds = [];
    state.knowledgeContext = "";
    state.run = emptyRun();
    ensureDefaults(true);
    return render();
  }
  if (target.dataset.nameSuggestion) {
    state.workerName = target.dataset.nameSuggestion;
    return render();
  }
  if (target.dataset.pattern) {
    state.patternId = target.dataset.pattern;
    state.run = emptyRun();
    ensureDefaults(true);
    return render();
  }
  if (target.dataset.sourceToggle) {
    const selected = new Set(state.selectedKnowledgeIds);
    if (selected.has(target.dataset.sourceToggle)) selected.delete(target.dataset.sourceToggle);
    else selected.add(target.dataset.sourceToggle);
    state.selectedKnowledgeIds = [...selected];
    state.run = emptyRun();
    return render();
  }
  if (target.dataset.sourceView) {
    state.modalSourceId = target.dataset.sourceView;
    state.downloadModalOpen = false;
    state.downloadPayload = null;
    return render();
  }
  if (target.dataset.runQuestion) return startRun(target.dataset.runQuestion);
  if (target.dataset.runCustom !== undefined) return startRun("", state.customQuestion.trim());
  if (target.dataset.addLeader !== undefined) return addLeaderboard();
  if (target.dataset.downloadQr !== undefined) return openDownloadModal(rowPayloadFromButton(target));
  if (target.dataset.download) return download(target.dataset.download, rowPayloadFromButton(target));
  if (target.dataset.workbookUploadTrigger !== undefined) return document.getElementById("workbookUpload")?.click();
  if (target.dataset.contentUploadTrigger !== undefined) return document.getElementById("contentUpload")?.click();
});

function resetExperience() {
  if (runTimer) window.clearInterval(runTimer);
  runTimer = null;
  state.screen = "register";
  state.name = "Harry";
  state.personaId = "";
  state.experience = "Explore";
  state.experienceSelected = false;
  state.workerName = "";
  state.patternId = "";
  state.selectedKnowledgeIds = [];
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.customQuestion = "";
  state.run = emptyRun();
}

document.addEventListener("input", (event) => {
  if (event.target.id === "nameInput") {
    state.name = event.target.value;
  }
  if (event.target.id === "workerName") {
    state.workerName = event.target.value;
  }
  if (event.target.id === "customQuestion") {
    state.customQuestion = event.target.value;
  }
});

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
