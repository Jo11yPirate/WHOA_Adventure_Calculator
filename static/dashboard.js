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
  if (input.value === "") {
    input.classList.remove("input-error");
    return 0;
  }
  if (!Number.isFinite(value) || value < 0) {
    input.classList.add("input-error");
    input.title = `${input.labels[0].textContent}: enter 0 or greater.`;
    throw new Error(`${input.labels[0].textContent} must be 0 or greater.`);
  }
  input.classList.remove("input-error");
  return value;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

const calculatorStorageKey = "whoa-adventure-calculator-stats";
const comparisonStorageKey = "whoa-adventure-comparison-stats";
const enemyDefenseBaseline = 5000;
const enemyHitBaseline = 5000;
const incomingHitBaseline = 5000;

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

function saveComparisonState() {
  const fields = {};
  document.querySelectorAll(".compare-current, .compare-item").forEach((input) => {
    fields[`${input.classList.contains("compare-item") ? "item" : "current"}-${input.dataset.stat}`] = input.value;
  });
  localStorage.setItem(comparisonStorageKey, JSON.stringify(fields));
}

function restoreComparisonState() {
  const saved = localStorage.getItem(comparisonStorageKey);
  if (!saved) return;
  const fields = JSON.parse(saved);
  document.querySelectorAll(".compare-current, .compare-item").forEach((input) => {
    const key = `${input.classList.contains("compare-item") ? "item" : "current"}-${input.dataset.stat}`;
    if (Object.prototype.hasOwnProperty.call(fields, key)) input.value = fields[key];
  });
}

function clearComparisonFields(selector) {
  document.querySelectorAll(selector).forEach((input) => {
    input.value = "";
  });
  saveComparisonState();
  updateComparison();
}

function format(value) {
  return Math.round(value).toLocaleString();
}

function setBar(id, value, maximum) {
  const bar = document.getElementById(id);
  if (bar) bar.style.width = `${maximum ? Math.min(100, (value / maximum) * 100) : 0}%`;
}

function updateBreakdownPie(className, attack, penetration, hit, hp, defense, evasion) {
  const isWarrior = className === "Warrior";
  const entries = isWarrior
    ? [["HP", hp], ["Defense", defense], ["Evasion", evasion]]
    : className === "Priest"
      ? [["Attack", attack], ["Penetration", penetration], ["Hit", hit]]
      : [["Attack", attack], ["Penetration", penetration]];
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  const colors = ["#ffbd75", "#ff9f43", "#e97b3f"];
  let offset = 0;
  const stops = entries.map(([label, value], index) => {
    const start = offset;
    offset += total ? (value / total) * 100 : 0;
    return `${colors[index]} ${start}% ${offset}%`;
  });
  const pie = document.getElementById("breakdown-pie");
  const legend = document.getElementById("breakdown-pie-legend");
  if (pie) pie.style.background = `conic-gradient(${stops.join(", ")})`;
  if (legend) {
    legend.innerHTML = entries.map(([label, value], index) =>
      `<span><i style="background:${colors[index]}"></i>${label} <strong>${format(value)}</strong></span>`
    ).join("");
  }
}

function updateSurvivabilityGraph(values) {
  const maximum = Math.max(...values, 1);
  const xPositions = [40, 190, 340, 490];
  const points = values.map((value, index) => {
    const y = 126 - (value / maximum) * 92;
    return `${xPositions[index]},${y}`;
  });
  const line = document.getElementById("survivability-line");
  if (line) line.setAttribute("points", points.join(" "));
  values.forEach((value, index) => {
    const point = document.getElementById(`survivability-point-${index + 1}`);
    if (point) {
      point.setAttribute("cy", String(126 - (value / maximum) * 92));
    }
  });
}

function updateRateGraph(values) {
  const maximum = Math.max(...values, 1);
  const yValues = values.map((value) => 126 - (value / maximum) * 92);
  document.querySelectorAll(".rate-line").forEach((line) => {
    line.setAttribute("points", yValues.map((y, index) => `${[40, 265, 490][index]},${y}`).join(" "));
  });
  document.querySelectorAll(".rate-point").forEach((point, index) => {
    if (yValues[index] !== undefined) point.setAttribute("cy", String(yValues[index]));
  });
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
  document.querySelectorAll(".warrior-only").forEach((element) => {
    element.hidden = className !== "Warrior";
  });
  document.querySelectorAll(".combat-rate-only").forEach((element) => {
    element.hidden = className === "Warrior";
    if (element.matches("button")) {
      element.textContent = className === "Priest" ? "HPS" : "DPS";
    }
  });
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
  const baseAttribute = readOptionalNumber("base_attribute");
  const outputBonus = readOptionalNumber("bonus_percentage") / 100;
  const penetrationRating = readOptionalNumber("stat_penetration");
  const hitRating = readOptionalNumber("stat_hit");
  const critRating = readOptionalNumber("stat_crit");
    const isHealing = document.getElementById("class-select").value === "Priest";
    const coreOutput = baseAttribute + penetrationRating + (isHealing ? hitRating : 0);
    const rawOutput = coreOutput * (1 + outputBonus);
    const effectiveDefense = Math.max(0, enemyDefenseBaseline - penetrationRating);
    const mitigation = 1 / (1 + effectiveDefense / 2000);
    const criticalMultiplier = 2;
    const criticalRate = coreOutput ? (critRating / coreOutput) * 100 : 0;
    const estimatedAccuracy = Math.min(100, hitRating);
    const critEvaluation = effectiveStat("Critical_Rate_Percentage", critRating);
    const hp = readOptionalNumber("stat_hp");
    const defense = readOptionalNumber("defense_score");
    const evasion = readOptionalNumber("stat_evasion");
    const damageReduction = Math.min(90, readOptionalNumber("damage_reduction_percentage")) / 100;
    const defenseMultiplier = 1 / (1 + defense / 2000);
    const incomingDamageMultiplier = defenseMultiplier * (1 - damageReduction);
    const effectiveHp = incomingDamageMultiplier ? hp / incomingDamageMultiplier : hp;

    setText("res-raw", format(rawOutput));
    setText("res-normal", format(rawOutput * mitigation));
    setText("res-crit", format(rawOutput * mitigation * criticalMultiplier));
    setText("res-critical-rate", `${criticalRate.toFixed(2)}%`);
    setText("res-heal-power", coreOutput.toFixed(2));
    setText("res-estimated-accuracy", `${estimatedAccuracy.toFixed(2)}%`);
    setText("res-effective-hp", format(effectiveHp));
    setText("res-hp-contribution", `${(incomingDamageMultiplier * 100).toFixed(2)}%`);
    setText("res-resilience", (effectiveHp / incomingHitBaseline).toFixed(2));
    setText("res-dodge", `${Math.min(100, evasion / enemyHitBaseline * 100).toFixed(2)}%`);
    setText("res-damage-reduction", `${(damageReduction * 100).toFixed(2)}%`);
    updateRateGraph([
      coreOutput,
      rawOutput * mitigation,
      rawOutput * mitigation * criticalMultiplier,
    ]);
    updateSurvivabilityGraph([
      hp,
      effectiveHp,
      effectiveHp / incomingHitBaseline,
      Math.min(100, evasion / enemyHitBaseline * 100),
    ]);
    updateBreakdownPie(
      document.getElementById("class-select").value,
      baseAttribute,
      penetrationRating,
      hitRating,
      hp,
      defense,
      evasion,
    );
    setText("screen-normal", format(rawOutput * mitigation));
    setText("screen-critical", format(rawOutput * mitigation * criticalMultiplier));
    setText("log-mitigation", `Assumes ${enemyDefenseBaseline.toLocaleString()} enemy Defense`);
    setText("log-crit-mult", `×${criticalMultiplier.toFixed(2)} after resistance`);
    updateCharts(rawOutput, rawOutput * mitigation, rawOutput * mitigation * criticalMultiplier, baseAttribute, readOptionalNumber("stat_defense_rating"), penetrationRating, outputBonus, enemyDefenseBaseline, mitigation, 0, 0, 0);
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
  input.addEventListener("input", () => {
    saveComparisonState();
    updateComparison();
  });
});
restoreComparisonState();
updateComparison();

document.getElementById("compare-calculate")?.addEventListener("click", updateComparison);
document.getElementById("compare-clear-equipment")?.addEventListener("click", () => {
  clearComparisonFields(".compare-item");
});
document.getElementById("compare-clear-all")?.addEventListener("click", () => {
  if (!window.confirm("Clear all entered stats? This cannot be undone.")) return;
  clearComparisonFields(".compare-current, .compare-item");
  document.querySelectorAll('#calculator input[type="number"]').forEach((input) => {
    input.value = "";
  });
  localStorage.removeItem(calculatorStorageKey);
});

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
    clearComparisonFields(".compare-current, .compare-item");
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
