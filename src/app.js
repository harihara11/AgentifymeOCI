const BASE_WORKBOOK = window.OCI_AI_FACTORY_WORKBOOK || { sheets: {}, blueprintNodeTemplates: {}, runtimeTemplates: {} };
const BASE_MANIFEST = window.OCI_AI_FACTORY_CONTENT_MANIFEST || [];

let WORKBOOK = clone(BASE_WORKBOOK);
let CONTENT_MANIFEST = clone(BASE_MANIFEST);
let runTimer = null;

const state = {
  screen: "register",
  name: "Harry",
  personaId: "",
  experience: "Engineer",
  experienceSelected: true,
  workerName: "",
  patternId: "",
  selectedKnowledgeIds: [],
  knowledgeContext: "",
  modalSourceId: "",
  docViewerSourceId: "",
  settingsOpen: false,
  downloadModalOpen: false,
  downloadPayload: null,
  customQuestion: "",
  traceOpen: false,
  sourceRailOpen: false,
  flowOrientation: "horizontal",
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

function runElapsed() {
  if (!state.run.startedAt) return state.run.response ? RUN_TOTAL_MS : 0;
  return state.run.running ? Date.now() - state.run.startedAt : state.run.durationMs || RUN_TOTAL_MS;
}

const RUN_TOTAL_MS = 5400;
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
  if (!state.workerName) state.workerName = suggestedWorkerNames()[0] || `${persona.PersonaName.replace(/\s+(Specialist|Agent)$/i, "")} Worker`;
  state.experience = "Engineer";
  state.experienceSelected = true;
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
  if (screen === "pattern") return canEnter("persona") && Boolean(state.personaId) && Boolean(state.workerName.trim());
  if (screen === "blueprint") return canEnter("pattern") && Boolean(state.patternId);
  if (screen === "leaderboard") return canEnter("blueprint");
  return false;
}

function go(screen) {
  ensureDefaults();
  if (!canEnter(screen)) return;
  state.screen = screen;
  render();
}

function next() {
  if (state.screen === "register") return go("persona");
  if (state.screen === "persona") {
    if (!state.workerName.trim()) return render();
    ensureDefaults(true);
    return go("pattern");
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
  if (state.screen === "pattern") return go("persona");
  if (state.screen === "blueprint") return go("pattern");
  if (state.screen === "leaderboard") return go("blueprint");
  return go("register");
}

function canMoveNext() {
  if (state.screen === "persona") return canEnter("pattern");
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
  if (step === "leaderboard") return state.screen === "leaderboard" || state.run.response ? `Score ${computeScore()}` : fallback;
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
            <button class="action primary" data-route-next>Start</button>
          </div>
        </div>
      </section>
    </section>
  `;
}

function renderPersona() {
  const suggestions = suggestedWorkerNames();
  return `
    <section class="page journeyPanel">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Persona Selection</div>
          <h1>Select a persona and name your digital worker</h1>
        </div>
      </div>
      <div class="grid three">
        ${personas().map((persona) => renderPersonaCard(persona)).join("")}
      </div>
      ${state.personaId ? `
        <section class="workerNamePanel">
          <div class="field">
            <label class="label" for="workerName">Digital worker name</label>
            <input id="workerName" class="input" value="${esc(state.workerName)}" placeholder="Name your digital worker" autocomplete="off" />
          </div>
          <div class="suggestionRow compactSuggestions">
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
    <button class="choice ${selected ? "selected" : ""}" data-persona="${esc(persona.PersonaID)}">
      <h3>${esc(persona.PersonaName)}</h3>
      <p>${esc(persona.Description)}</p>
    </button>
  `;
}

function renderPattern() {
  return `
    <section class="page journeyPanel patternPage">
      <div class="pageHead">
        <div>
          <div class="eyebrow">Agent capability</div>
          <h1>What your agent should do ?</h1>
        </div>
      </div>
      <div class="grid four capabilityGrid">
        ${patterns().map((pattern) => renderPatternCard(pattern)).join("")}
      </div>
      ${state.patternId ? renderPatternConfigurator() : renderPatternEmptyPreview()}
      ${renderRouteActions("Run Agent", "&rarr;")}
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

function renderPatternEmptyPreview() {
  return `
    <section class="patternEmptyPreview">
      <div>
        <strong>Select a capability to preview the blueprint</strong>
        <span>The Knowledge Base and blueprint map will appear here as soon as you choose an agent capability.</span>
      </div>
    </section>
  `;
}

function renderPatternConfigurator() {
  const blueprint = blueprintFor();
  const sources = availableSourcesFor();
  const selected = new Set(state.selectedKnowledgeIds);
  return `
    <section class="patternConfigurator" aria-label="Capability blueprint configuration">
      <aside class="patternKnowledgePanel">
        <div class="patternPanelHead">
          <div>
            <span>Knowledge Base</span>
            <strong>Select sources</strong>
          </div>
          <b>${selectedSources().length}/${sources.length || 0}</b>
        </div>
        <div class="sourceList patternSourceList">
          ${sources.map((source) => renderSourceRow(source, selected.has(source.KnowledgeID), true)).join("") || `<div class="empty miniEmpty">No workbook sources mapped for this persona and capability.</div>`}
        </div>
      </aside>
      <section class="patternBlueprintPreview">
        <div class="patternPreviewHead">
          <div>
            <span>Blueprint Preview</span>
            <strong>${esc(patternById()?.PatternName || "Selected capability")}</strong>
            <small>${esc(blueprint?.BlueprintTheme || "Workbook mapped architecture")}</small>
          </div>
          <div class="patternPreviewActions">
            ${renderFlowOrientationToggle()}
            <span class="pill red">${esc(patternById()?.PatternName || "Capability")}</span>
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
          <button class="action primary" data-add-leader>${uiIcon("award", "iconBox")}<span>Add to Leaderboard</span></button>
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
  const chatbotName = state.workerName.trim() || "Digital Worker";
  return `
    <section class="page agentRunPage">
      <div class="runTopLine">
        <button class="action secondary" data-route-prev>&larr; Back</button>
        <div class="runAgentTitle">
          <span class="chatHeaderIcon">${esc(shortCode(chatbotName))}</span>
          <div>
            <h1>${esc(chatbotName)}</h1>
            <small>${esc(patternById()?.PatternName || "Selected capability")} agent test</small>
          </div>
        </div>
        <div class="btnRow runTopActions">
          <button class="action secondary" data-download-qr>${uiIcon("download", "iconBox")}<span>Download Blueprint</span></button>
          <button class="action primary" data-route-next>Complete &rarr;</button>
        </div>
      </div>
      <div class="agentRunWorkspace">
        ${renderAgentChatSurface(chatbotName)}
        ${renderAgentThinkingPanel()}
      </div>
    </section>
  `;
}

function renderAgentChatSurface(chatbotName) {
  const qs = questionsFor();
  const hasRun = Boolean(state.run.question);
  return `
    <section class="agentChatSurface" aria-label="${esc(chatbotName)} chat">
      <div class="agentChatBody">
        ${hasRun ? renderRunConversation(chatbotName) : renderRunEmptyState(chatbotName)}
      </div>
      <div class="runSuggested">
        <div class="suggestedTitle">${hasRun ? "Follow-up questions" : "Suggested questions"}</div>
        <div class="runQuestionStrip">
          ${qs.map((q) => `<button class="runQuestion" data-run-question="${esc(q.QnAID)}">${esc(q.Question)}</button>`).join("") || `<div class="empty miniEmpty">No workbook questions mapped for this scenario.</div>`}
        </div>
      </div>
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

function renderRunEmptyState(chatbotName) {
  return `
    <div class="runEmptyState">
      <span class="runHalo">${esc(shortCode(chatbotName))}</span>
      <h2>What should ${esc(chatbotName)} answer?</h2>
      <p>Ask a workbook question or type your own prompt. The execution trace will show orchestration, evidence retrieval, sub-agent work, and final response grounding.</p>
    </div>
  `;
}

function renderRunConversation(chatbotName) {
  return `
    <div class="runConversation">
      <article class="runBubbleRow user">
        <div class="runBubble user">${esc(state.run.question)}</div>
      </article>
      <article class="runBubbleRow agent">
        <span class="chatAvatar">${esc(shortCode(chatbotName))}</span>
        <div>
          <div class="runBubble agent">
            ${state.run.response ? esc(state.run.response) : `<span class="thinkingDots"><i></i><i></i><i></i></span><span>Thinking through the agent flow...</span>`}
          </div>
          ${state.run.response ? renderReasoning() : ""}
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
  const sources = selectedSources();
  return `
    <section class="thinkingBlock">
      <h3>Evidence</h3>
      <div class="thinkingSourceList">
        ${sources.map((source) => `
          <div class="thinkingSource ${runStageStatus(2)}">
            <span class="bpIcon">${esc(shortCode(source.KnowledgeSource))}</span>
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
  if (value.includes("vector")) return "vector";
  if (value.includes("genai") || value.includes("llm") || value.includes("reason")) return "brain";
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
            ${renderFlowOrientationToggle()}
            <span class="pill red">${esc(patternById()?.PatternName)}</span>
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

function renderFlowOrientationToggle() {
  return `
    <div class="flowToggle" role="group" aria-label="Blueprint layout">
      <button type="button" class="${state.flowOrientation === "horizontal" ? "active" : ""}" data-flow-orientation="horizontal" aria-pressed="${state.flowOrientation === "horizontal" ? "true" : "false"}">Horizontal</button>
      <button type="button" class="${state.flowOrientation === "vertical" ? "active" : ""}" data-flow-orientation="vertical" aria-pressed="${state.flowOrientation === "vertical" ? "true" : "false"}">Vertical</button>
    </div>
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
    <div class="branchFlow ${esc(state.flowOrientation)}">
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
      <span class="bpIcon">${esc(shortCode(node.label))}</span>
      <span><strong>${esc(node.label)}</strong><small>${esc(node.detail)}</small></span>
    </div>
  `;
}

function renderSourceBranch(source, stage) {
  const status = sourceVisualStatus(stage);
  return `
    <div class="branchCard sourceBranch ${flowStageClass(stage)}">
      <span class="bpIcon">${esc(shortCode(source.KnowledgeSource))}</span>
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
        ${sources.map((source) => renderSourceBranch(source, stage)).join("") || `<div class="empty miniEmpty">No workbook items selected</div>`}
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
        ${cards || `<div class="empty miniEmpty">No workbook items selected</div>`}
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
  const qs = questionsFor();
  const hasRun = Boolean(state.run.question);
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
        <div class="suggestedTitle">${hasRun ? "Follow-up questions" : "Suggested questions"}</div>
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
      <p class="small">Capability: ${esc(patternById()?.PatternName)}.</p>
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
            <th>User</th><th>Persona</th><th>Capability</th><th>Blueprint Name</th><th>Score</th><th>Downloads</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map((row, index) => `
            <tr>
              <td>${esc(row.user)}</td>
              <td>${esc(row.persona)}</td>
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
              <p>${esc(payload.persona || personaById()?.PersonaName || "Selected persona")} - Score ${esc(payload.score || computeScore())}</p>
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
  const qna = qnaId ? sheet("08_Scenario_QnA").find((row) => row.QnAID === qnaId) : null;
  const question = customQuestion || qna?.Question || "";
  if (!question.trim()) return;
  if (runTimer) window.clearInterval(runTimer);
  state.customQuestion = "";
  state.run = {
    ...emptyRun(),
    running: true,
    currentStep: 0,
    visualTick: 0,
    qnaId: qnaId || "",
    question,
    startedAt: Date.now(),
    isCustom: Boolean(customQuestion),
  };
  render();
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
    }
    render();
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
  const values = {
    "Blueprint completeness": state.personaId && state.patternId && state.workerName ? 1 : 0,
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
    experience: "Engineer",
    pattern: pattern?.PatternName || "",
    digitalWorkerName: state.workerName,
    blueprintName: pattern?.PatternName || blueprint?.BlueprintType || "Selected capability",
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
  ctx.fillText(`${data.persona} | ${data.pattern} | Score ${data.score}`, 40, 150);
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
  state.experience = "Engineer";
  state.experienceSelected = true;
  state.selectedKnowledgeIds = [];
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.traceOpen = false;
  state.sourceRailOpen = false;
  state.flowOrientation = "horizontal";
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
  const target = event.target.closest("[data-settings-open], [data-doc-close], [data-trace-toggle], [data-source-rail-toggle], button, [data-modal-close]");
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
  if (target.dataset.flowOrientation) {
    event.preventDefault();
    state.flowOrientation = target.dataset.flowOrientation === "vertical" ? "vertical" : "horizontal";
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
    return render();
  }
  if (target.dataset.modalClose !== undefined) {
    if (event.target === target || target.matches("button")) {
      state.modalSourceId = "";
      state.docViewerSourceId = "";
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
    state.experience = "Engineer";
    state.experienceSelected = true;
    state.patternId = "";
    state.selectedKnowledgeIds = [];
    state.knowledgeContext = "";
    state.run = emptyRun();
    state.traceOpen = false;
    state.sourceRailOpen = false;
    state.workerName = "";
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
    state.traceOpen = false;
    state.sourceRailOpen = false;
    ensureDefaults(true);
    return render();
  }
  if (target.dataset.sourceToggle) {
    const selected = new Set(state.selectedKnowledgeIds);
    if (selected.has(target.dataset.sourceToggle)) selected.delete(target.dataset.sourceToggle);
    else selected.add(target.dataset.sourceToggle);
    state.selectedKnowledgeIds = [...selected];
    state.run = emptyRun();
    state.traceOpen = false;
    return render();
  }
  if (target.dataset.sourceView) {
    state.docViewerSourceId = target.dataset.sourceView;
    state.modalSourceId = "";
    state.downloadModalOpen = false;
    state.downloadPayload = null;
    state.settingsOpen = false;
    return render();
  }
  if (target.dataset.docOpen) {
    state.docViewerSourceId = target.dataset.docOpen;
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
  state.experience = "Engineer";
  state.experienceSelected = true;
  state.workerName = "";
  state.patternId = "";
  state.selectedKnowledgeIds = [];
  state.knowledgeContext = "";
  state.modalSourceId = "";
  state.docViewerSourceId = "";
  state.settingsOpen = false;
  state.downloadModalOpen = false;
  state.downloadPayload = null;
  state.customQuestion = "";
  state.traceOpen = false;
  state.sourceRailOpen = false;
  state.flowOrientation = "horizontal";
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
    updateTypingRecommendations();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.target.id === "customQuestion" && event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    startRun("", state.customQuestion.trim());
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
