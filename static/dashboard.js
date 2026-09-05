const diminishingStats = new Set([
  "Critical_Rate_Percentage",
  "Evasion_Percentage",
  "Cooldown_Reduction_Percentage",
]);

function effectiveStat(statName, rawValue) {
  const threshold = 5000;
  const coefficient = 0.0002;
  if (!diminishingStats.has(statName) || rawValue <= threshold) {
    return { value: rawValue, diminished: false };
  }
  const excess = rawValue - threshold;
  return {
    value: threshold + excess / (1 + coefficient * excess),
    diminished: true,
  };
}

function readNumber(id) {
  const input = document.getElementById(id);
  const value = Number(input.value);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${input.labels[0].textContent} must be 0 or greater.`);
  }
  return value;
}

function readOptionalNumber(id) {
  const input = document.getElementById(id);
  const value = Number(input.value);
  if (input.value === "") return 0;
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`${input.labels[0].textContent} must be 0 or greater.`);
  }
  return value;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

const calculatorStorageKey = "whoa-adventure-calculator-stats";

function saveCalculatorState(form, classSelect) {
  const state = {
    className: classSelect.value,
    fields: Object.fromEntries(
      [...form.querySelectorAll('input[type="number"]')].map((input) => [input.id, input.value]),
    ),
  };
  localStorage.setItem(calculatorStorageKey, JSON.stringify(state));
}

function restoreCalculatorState(form, classSelect) {
  const saved = localStorage.getItem(calculatorStorageKey);
  if (!saved) return;
  const state = JSON.parse(saved);
  if (state.className) classSelect.value = state.className;
  Object.entries(state.fields || {}).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value;
  });
}

function format(value) {
  return Math.round(value).toLocaleString();
}

function setBar(id, value, maximum) {
  const bar = document.getElementById(id);
  if (bar) bar.style.width = `${maximum ? Math.min(100, (value / maximum) * 100) : 0}%`;
}

function updateCharts(rawOutput, normalOutput, criticalOutput, attack, defense, penetration, outputBonus, enemyDefense, mitigation, incomingDamage, damageReduction, damageReceived) {
  const outputMax = Math.max(rawOutput, criticalOutput, 1);
  setBar("bar-normal", normalOutput, outputMax);
  setBar("bar-critical", criticalOutput, outputMax);
  setText("bar-normal-value", format(normalOutput));
  setText("bar-critical-value", format(criticalOutput));
  const statMax = Math.max(attack, defense, penetration, 1);
  setBar("bar-attack", attack, statMax);
  setBar("bar-defense", defense, statMax);
  setBar("bar-penetration", penetration, statMax);
  setText("bar-attack-value", format(attack));
  setText("bar-defense-value", format(defense));
  setText("bar-penetration-value", format(penetration));
  setText("screen-normal", format(normalOutput));
  setText("screen-critical", format(criticalOutput));
  const graphMax = Math.max(criticalOutput, 1);
  const normalHeight = Math.max(4, (normalOutput / graphMax) * 86);
  const criticalHeight = Math.max(4, (criticalOutput / graphMax) * 86);
  const normalBar = document.getElementById("graph-normal");
  const criticalBar = document.getElementById("graph-critical");
  if (normalBar) {
    normalBar.setAttribute("y", 126 - normalHeight);
    normalBar.setAttribute("height", normalHeight);
  }
  if (criticalBar) {
    criticalBar.setAttribute("y", 126 - criticalHeight);
    criticalBar.setAttribute("height", criticalHeight);
  }
  setText("screen-attack", format(attack));
  setText("screen-penetration", format(penetration));
  setText("screen-bonus", `${(outputBonus * 100).toFixed(1)}%`);
}

function updateClassReference(className) {
  document.querySelectorAll("[data-reference-class]").forEach((reference) => {
    reference.hidden = reference.dataset.referenceClass !== className;
  });
}

function updatePriestOnly(className) {
  document.querySelectorAll(".priest-only").forEach((element) => {
    element.hidden = className !== "Priest";
  });
  const label = document.getElementById("critical-rate-label");
  const formula = document.getElementById("critical-rate-formula");
  if (label) label.textContent = className === "Priest" ? "Heal Crit" : "Critical Rate";
  if (formula) formula.textContent = className === "Priest"
    ? "Crit ÷ (Attack + Penetration + Hit)"
    : "Crit ÷ core output";
}

function updateComparison() {
  const current = {};
  const item = {};
  document.querySelectorAll(".compare-current").forEach((input) => {
    current[input.dataset.stat] = Number(input.value) || 0;
  });
  document.querySelectorAll(".compare-item").forEach((input) => {
    item[input.dataset.stat] = Number(input.value) || 0;
  });
  const output = document.getElementById("comparison-output");
  const labels = {
    base_attribute: "Attack",
    stat_hp: "HP",
    stat_crit: "Crit",
    stat_hit: "Hit Rating",
    stat_penetration: "Penetration",
    stat_defense_rating: "Defense Rating",
    stat_evasion: "Evasion",
    stat_crit_resistance: "Crit Res",
  };
  output.innerHTML = Object.entries(labels).map(([stat, label]) => {
    const before = current[stat] || 0;
    const gained = item[stat] || 0;
    const change = gained;
    return `<article class="metric"><span>${label}</span><strong>${format(before + change)}</strong><small>${change >= 0 ? "+" : ""}${format(change)} from equipment</small></article>`;
  }).join("");
}

function runRecalculationPipeline() {
  const error = document.getElementById("live-error");
  try {
  const baseAttribute = readNumber("base_attribute");
    const outputBonus = readNumber("bonus_percentage") / 100;
    const penetrationRating = readNumber("stat_penetration");
    const hitRating = readNumber("stat_hit");
    const critRating = readNumber("stat_crit");
    const isHealing = document.getElementById("class-select").value === "Priest";
    const coreOutput = baseAttribute + penetrationRating + (isHealing ? hitRating : 0);
    const rawOutput = coreOutput * (1 + outputBonus);
    const effectiveDefense = 0;
    const mitigation = 1;
    const criticalMultiplier = 2;
    const criticalRate = coreOutput ? (critRating / coreOutput) * 100 : 0;
    const estimatedAccuracy = Math.min(100, hitRating);
    const critEvaluation = effectiveStat("Critical_Rate_Percentage", critRating);

    setText("res-raw", format(rawOutput));
    setText("res-normal", format(rawOutput * mitigation));
    setText("res-crit", format(rawOutput * mitigation * criticalMultiplier));
    setText("res-critical-rate", `${criticalRate.toFixed(2)}%`);
    setText("res-heal-power", coreOutput.toFixed(2));
    setText("res-estimated-accuracy", `${estimatedAccuracy.toFixed(2)}%`);
    setText("log-mitigation", "Enemy Defense Unknown");
    setText("log-crit-mult", `×${criticalMultiplier.toFixed(2)} after resistance`);
    updateCharts(rawOutput, rawOutput, rawOutput * criticalMultiplier, baseAttribute, readNumber("stat_defense_rating"), penetrationRating, outputBonus, 0, mitigation, 0, 0, 0);
    document.getElementById("val-crit-bonus")?.classList.toggle("diminished", critEvaluation.diminished);
    error.hidden = true;
  } catch (validationError) {
    error.textContent = validationError.message;
    error.hidden = false;
  }
}

document.querySelectorAll(".screen-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    const screen = tab.closest(".calculator-screen");
    const target = tab.dataset.screenTab;
    screen.querySelectorAll(".screen-tab").forEach((button) => {
      const active = button === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });
    screen.querySelectorAll(".screen-panel").forEach((panel) => {
      panel.hidden = panel.dataset.screenPanel !== target;
      panel.classList.toggle("is-active", panel.dataset.screenPanel === target);
    });
  });
});

const appPages = document.querySelectorAll("[data-app-page]");
const pageLinks = document.querySelectorAll("[data-page-target]");
function showAppPage(pageName) {
  appPages.forEach((page) => {
    page.hidden = page.dataset.appPage !== pageName;
    page.classList.toggle("is-page-active", page.dataset.appPage === pageName);
  });
  pageLinks.forEach((link) => {
    link.classList.toggle("is-active", link.dataset.pageTarget === pageName);
  });
}

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    showAppPage(link.dataset.pageTarget);
    history.replaceState(null, "", link.hash);
  });
});

const initialPage = window.location.hash.slice(1);
showAppPage(["calculator-page", "compare", "visualization", "reference"].includes(initialPage)
  ? (initialPage === "calculator-page" ? "calculator" : initialPage)
  : "calculator");
document.querySelectorAll(".compare-current, .compare-item").forEach((input) => {
  input.addEventListener("input", updateComparison);
});
updateComparison();

const calculatorForm = document.querySelector(".stats-form");
if (calculatorForm) {
  const classSelect = document.getElementById("class-select");
  const clearStatsButton = document.getElementById("clear-stats");
  restoreCalculatorState(calculatorForm, classSelect);
  clearStatsButton.addEventListener("click", () => {
    if (!window.confirm("Clear all entered stats? This cannot be undone.")) return;
    calculatorForm.querySelectorAll('input[type="number"]').forEach((input) => {
      input.value = "";
    });
    localStorage.removeItem(calculatorStorageKey);
    document.getElementById("live-error").hidden = true;
  });
  classSelect.addEventListener("change", () => {
    saveCalculatorState(calculatorForm, classSelect);
    runRecalculationPipeline();
  });
  classSelect.addEventListener("change", () => updateClassReference(classSelect.value));
  classSelect.addEventListener("change", () => updatePriestOnly(classSelect.value));
  calculatorForm.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", () => {
      saveCalculatorState(calculatorForm, classSelect);
      runRecalculationPipeline();
    });
  });
  runRecalculationPipeline();
  updateClassReference(classSelect.value);
  updatePriestOnly(classSelect.value);
}
