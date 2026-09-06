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
  const label = input.labels?.[0]?.textContent.trim() || input.name;
  if (!Number.isFinite(value) || value < 0) {
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "live-error");
    throw new Error(`${label} must be 0 or greater.`);
  }
  input.setAttribute("aria-invalid", "false");
  input.removeAttribute("aria-describedby");
  return value;
}

function readOptionalNumber(id) {
  const input = document.getElementById(id);
  const value = Number(input.value);
  if (input.value === "") {
    input.classList.remove("input-error");
    input.setAttribute("aria-invalid", "false");
    return 0;
  }
  if (!Number.isFinite(value) || value < 0) {
    input.classList.add("input-error");
    const label = input.labels?.[0]?.textContent.trim() || input.name;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", "live-error");
    input.title = `${label}: enter 0 or greater.`;
    throw new Error(`${label} must be 0 or greater.`);
  }
  input.classList.remove("input-error");
  input.setAttribute("aria-invalid", "false");
  input.removeAttribute("aria-describedby");
  return value;
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function setAllText(selector, value) {
  document.querySelectorAll(selector).forEach((element) => {
    element.textContent = value;
  });
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

function percentOf(value, total) {
  return total ? `${((value / total) * 100).toFixed(2)}%` : "0.00%";
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
  const colors = ["#fed7aa", "#f97316", "#c2410c"];
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
      `<span><i style="background:${colors[index]}"></i>${label} <strong>${format(value)} (${total ? ((value / total) * 100).toFixed(2) : "0.00"}%)</strong></span>`
    ).join("");
  }
}

function updateSurvivabilityGraph(values) {
  const maximum = Math.max(...values, 1);
  const xPositions = [35, 105, 175, 245, 315];
  const points = values.map((value, index) => `${xPositions[index]},${145 - (value / maximum) * 125}`);
  const colors = ["#c2410c", "#ea580c", "#f97316", "#f59e0b", "#fed7aa"];
  document.querySelectorAll("#survival-profile-lines").forEach((group) => {
    group.innerHTML = points.slice(0, -1).map((point, index) =>
      `<line x1="${point.split(",")[0]}" y1="${point.split(",")[1]}" x2="${points[index + 1].split(",")[0]}" y2="${points[index + 1].split(",")[1]}" stroke="${colors[index]}" class="survivability-segment"></line>`
    ).join("");
  });
  document.querySelectorAll("#survival-profile-points").forEach((group) => {
    group.innerHTML = points.map((point, index) => {
      const [x, y] = point.split(",");
      return `<circle cx="${x}" cy="${y}" r="4" fill="${colors[index]}" class="survivability-point"></circle>`;
    }).join("");
  });
  document.querySelectorAll("#survival-profile-values").forEach((container) => {
    container.innerHTML = values.map((value, index) => {
      const label = ["Raw HP", "Effective HP", "Hits", "Dodge", "Defense"][index];
      const display = index === 3 ? `${value.toFixed(2)}%` : index === 2 ? value.toFixed(2) : format(value);
      return `<span><i style="background:${colors[index]}"></i><b>${label}</b> ${display}</span>`;
    }).join("");
  });
}

function updateDpsRadar(values) {
  const angles = [-Math.PI / 2, -Math.PI / 2 + (2 * Math.PI / 5), -Math.PI / 2 + (4 * Math.PI / 5), -Math.PI / 2 + (6 * Math.PI / 5), -Math.PI / 2 + (8 * Math.PI / 5)];
  const maximumOutput = Math.max(values[0], 1);
  const labels = ["Output", "Critical Rate", "Accuracy", "Penetration", "Hit"];
  const colors = ["#fed7aa", "#f97316", "#c2410c", "#ea580c", "#9a3412"];
  const normalized = [
    values[0] / maximumOutput,
    values[1] / 100,
    values[2] / 100,
    values[3] / maximumOutput,
    values[4] / 100,
  ];
  document.querySelectorAll(".dps-radar-shape").forEach((shape) => {
    const points = normalized.map((value, index) => {
      const radius = Math.min(1, value) * 82;
      return `${110 + Math.cos(angles[index]) * radius},${100 + Math.sin(angles[index]) * radius}`;
    });
    shape.setAttribute("points", points.join(" "));
    const pointGroup = shape.parentElement.querySelector(".dps-radar-points");
    if (pointGroup) {
      pointGroup.innerHTML = points.map((point, index) => {
        const [x, y] = point.split(",");
        return `<circle cx="${x}" cy="${y}" r="5" fill="${colors[index]}" class="dps-radar-point"></circle>`;
      }).join("");
    }
  });
  document.querySelectorAll(".dps-radar-legend").forEach((legend) => {
    legend.innerHTML = labels.map((label, index) =>
      `<span><i style="background:${colors[index]}"></i><b>${label}</b><em>${index === 0 ? format(values[index]) : `${values[index].toFixed(2)}${index === 1 || index === 2 ? "%" : ""}`}</em></span>`
    ).join("");
  });
}

function updateHpsRateGraph(values) {
  const seconds = [0, 60, 120, 180, 240, 300];
  const xPositions = [40, 132, 224, 316, 408, 500];
  const maximum = Math.max(...values, 1) * 300;
  const colors = ["#f97316", "#c2410c", "#fed7aa"];
  document.querySelectorAll(".hps-line").forEach((line, index) => {
    const value = values[index] ?? values[0];
    const points = seconds.map((second, pointIndex) => ({
      x: xPositions[pointIndex],
      y: 126 - ((value * second) / maximum) * 92,
    }));
    line.innerHTML = `${points.slice(0, -1).map((point, pointIndex) =>
      `<line x1="${point.x}" y1="${point.y}" x2="${points[pointIndex + 1].x}" y2="${points[pointIndex + 1].y}" stroke="${colors[index]}" class="hps-line-segment"></line>`
    ).join("")}${points.map((point) =>
      `<circle cx="${point.x}" cy="${point.y}" r="3.5" fill="${colors[index]}" class="hps-line-point"></circle>`
    ).join("")}`;
  });
}

function updateClassFocus(className, values) {
  const [rawOutput, normalOutput, criticalOutput, penetration, defense, effectiveHp, damageReduction, criticalRate] = values;
  const configs = {
    Assassin: {
      title: "Crit vs Penetration Focus",
      note: "Comparison of the two recommended Assassin build directions.",
      labels: ["Normal", "Critical", "Penetration"],
      values: [normalOutput, criticalOutput, penetration],
      colors: ["#c2410c", "#fed7aa", "#f97316"],
    },
    Archer: {
      title: "Penetration Impact",
      note: "Estimated normal output compared with the raw attack core and Penetration.",
      labels: ["Raw", "Normal", "Penetration"],
      values: [rawOutput, normalOutput, penetration],
      colors: ["#c2410c", "#f97316", "#fed7aa"],
    },
    Mage: {
      title: "Defense Sensitivity",
      note: "Estimated output as enemy Defense rises, after applying your Penetration.",
      chartType: "line",
      legendBeside: true,
      labels: ["0", "2.5k", "5k", "7.5k", "10k"],
      values: [0, 2500, 5000, 7500, 10000].map((enemyDefense) =>
        rawOutput / (1 + Math.max(0, enemyDefense - penetration) / 2000)
      ),
      colors: ["#fed7aa", "#f97316", "#ea580c", "#c2410c", "#9a3412"],
    },
    Priest: {
      title: "Five-Minute HPS Projection",
      note: "Cumulative healing projection at one action per second.",
      chartType: "line",
      legendBeside: true,
      labels: ["60s", "180s", "300s"],
      values: [normalOutput * 60, normalOutput * 180, normalOutput * 300],
      colors: ["#c2410c", "#f97316", "#fed7aa"],
    },
    Warrior: {
      title: "Effective HP Contribution",
      note: "Relative contribution of HP, Defense, and Damage Reduction to survivability.",
      labels: ["HP", "Defense", "Reduction"],
      values: [effectiveHp, defense, damageReduction * 100],
      colors: ["#c2410c", "#f97316", "#fed7aa"],
    },
  };
  const config = configs[className] || configs.Assassin;
  const maximum = Math.max(...config.values, 1);
  document.querySelectorAll(".class-focus-panel").forEach((panel) => {
    const chart = panel.querySelector(".class-focus-chart");
    const legend = panel.querySelector(".class-focus-legend");
    panel.classList.toggle("focus-side-legend", Boolean(config.legendBeside));
    panel.classList.toggle("priest-focus-side-legend", className === "Priest");
    panel.querySelector("#class-focus-title").textContent = config.title;
    panel.querySelector("#class-focus-note").textContent = config.note;
    if (config.chartType === "line") {
      const xPositions = config.values.map((_, index) =>
        40 + (index * 290) / Math.max(config.values.length - 1, 1)
      );
      const points = config.values.map((value, index) => ({
        x: xPositions[index],
        y: 140 - (value / maximum) * 115,
      }));
      const segments = points.slice(0, -1).map((point, index) =>
        `<line x1="${point.x}" y1="${point.y}" x2="${points[index + 1].x}" y2="${points[index + 1].y}" stroke="${config.colors[index]}" class="class-focus-line"></line>`
      ).join("");
      chart.innerHTML = `<path d="M35 12V140H340" class="graph-axis"></path><path d="M35 50H340M35 95H340" class="graph-grid"></path>${segments}${points.map((point, index) =>
        `<circle cx="${point.x}" cy="${point.y}" r="4" fill="${config.colors[index]}" class="class-focus-point"></circle><text x="${point.x}" y="158" text-anchor="middle" class="graph-label">${config.labels[index]}</text>`
      ).join("")}`;
    } else {
      chart.innerHTML = `<path d="M35 12V140H340" class="graph-axis"></path><path d="M35 50H340M35 95H340" class="graph-grid"></path>${config.values.map((value, index) => {
        const height = Math.max(5, value / maximum * 105);
        const x = 58 + index * 105;
        return `<rect x="${x}" y="${140 - height}" width="62" height="${height}" fill="${config.colors[index]}" class="class-focus-bar"></rect><text x="${x + 31}" y="158" text-anchor="middle" class="graph-label">${config.labels[index]}</text>`;
      }).join("")}`;
    }
    legend.innerHTML = config.labels.map((label, index) =>
      `<span><i style="background:${config.colors[index]}"></i><b>${label}</b><em>${format(config.values[index])}</em></span>`
    ).join("");
  });
}

function updateCharts(rawOutput, normalOutput, criticalOutput, attack, defense, penetration, outputBonus, enemyDefense, mitigation, incomingDamage, damageReduction, damageReceived) {
  const isHealing = document.getElementById("class-select")?.value === "Priest";
  document.querySelectorAll('[data-screen-panel="rate"]').forEach((panel) => {
    panel.classList.toggle("dps-side-legend", !isHealing);
  });
  const outputMax = Math.max(rawOutput, criticalOutput, 1);
  setBar("bar-normal", normalOutput, outputMax);
  setBar("bar-critical", criticalOutput, outputMax);
  const outputTotal = normalOutput + criticalOutput;
  setText("bar-normal-value", `${format(normalOutput)} (${percentOf(normalOutput, outputTotal)})`);
  setText("bar-critical-value", `${format(criticalOutput)} (${percentOf(criticalOutput, outputTotal)})`);
  setAllText("#bar-normal-label", isHealing ? "Normal Heal" : "Normal");
  setAllText("#bar-critical-label", isHealing ? "Critical Heal" : "Critical");
  const statMax = Math.max(attack, defense, penetration, 1);
  setBar("bar-attack", attack, statMax);
  setBar("bar-defense", defense, statMax);
  setBar("bar-penetration", penetration, statMax);
  const statTotal = attack + defense + penetration;
  setText("bar-attack-value", `${format(attack)} (${percentOf(attack, statTotal)})`);
  setText("bar-defense-value", `${format(defense)} (${percentOf(defense, statTotal)})`);
  setText("bar-penetration-value", `${format(penetration)} (${percentOf(penetration, statTotal)})`);
  setText("screen-normal", format(normalOutput));
  setText("screen-critical", format(criticalOutput));
  document.querySelectorAll("#output-graph-legend").forEach((legend) => {
    const labels = isHealing
      ? [["Heal", normalOutput, "#c2410c"], ["Crit Heal", criticalOutput, "#fed7aa"]]
      : [["Normal", normalOutput, "#c2410c"], ["Crit", criticalOutput, "#fed7aa"]];
    legend.innerHTML = [
      ...labels
    ].map(([label, value, color]) =>
      `<span><i style="background:${color}"></i>${label} <strong>${format(value)}</strong></span>`
    ).join("");
  });
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
  setAllText("#res-rate-label", className === "Priest" ? "HPS" : "DPS");
  setAllText("#res-five-minute-label", className === "Priest" ? "5-Minute Healing" : "5-Minute Damage");
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
  document.querySelectorAll(".class-focus-only").forEach((element) => { element.hidden = false; });
  const isHealing = className === "Priest";
  setAllText("#res-raw-label", isHealing ? "Raw Healing" : "Raw Damage");
  setAllText("#res-normal-label", isHealing ? "Normal Healing" : "Normal Damage");
  setAllText("#res-crit-label", isHealing ? "Critical Healing" : "Critical Damage");
  setAllText("#raw-output-note", isHealing ? "Healing before critical multiplier" : "Center hit before defense");
  setAllText("#log-mitigation", isHealing ? "One heal per second" : `Assumes ${enemyDefenseBaseline.toLocaleString()} enemy Defense`);
  setAllText("#log-crit-mult", isHealing ? "×2.00 critical healing" : "×2.00 after resistance");
  setAllText("#graph-normal-label", isHealing ? "Heal" : "Normal");
  setAllText("#graph-critical-label", isHealing ? "Crit Heal" : "Crit");
  document.querySelectorAll(".screen-graph").forEach((graph) => {
    graph.setAttribute("aria-label", isHealing ? "Normal and critical healing graph" : "Normal and critical damage graph");
  });
  document.querySelectorAll(".dps-radar").forEach((graph) => {
    graph.hidden = isHealing;
    graph.style.display = isHealing ? "none" : "";
    graph.setAttribute("aria-label", isHealing ? "Healing combat profile radar chart" : "DPS combat profile radar chart");
  });
  document.querySelectorAll(".dps-radar-legend").forEach((legend) => {
    legend.hidden = isHealing;
    legend.style.display = isHealing ? "none" : "";
  });
  document.querySelectorAll(".dps-radar-title").forEach((title) => {
    title.hidden = isHealing;
    title.style.display = isHealing ? "none" : "";
  });
  document.querySelectorAll(".hps-line-chart, .hps-lines-title, .hps-line-legend").forEach((element) => {
    element.hidden = !isHealing;
    element.style.display = isHealing
      ? element.classList.contains("hps-line-legend") ? "flex" : "block"
      : "none";
  });
  document.querySelectorAll(".dps-radar-title").forEach((title) => {
    title.textContent = `${isHealing ? "HPS" : "DPS"} Combat Profile`;
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
  const changeChart = document.getElementById("comparison-change-chart");
  const changeSummary = document.getElementById("comparison-change-summary");
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
  const hasEquipmentValue = {};
  document.querySelectorAll(".compare-item").forEach((input) => {
    hasEquipmentValue[input.dataset.stat] = input.value.trim() !== "";
  });
  output.innerHTML = Object.entries(labels).map(([stat, label]) => {
    const before = current[stat] || 0;
    const change = hasEquipmentValue[stat] ? (item[stat] || 0) - before : 0;
    const result = before + change;
    const changeLabel = change < 0
      ? `${format(Math.abs(change))} lost from new gear`
      : `+${format(change)} from new gear`;
    return `<article class="metric${change < 0 ? " loss" : ""}"><span>${label}</span><strong>${format(result)}</strong><small>${changeLabel}</small></article>`;
  }).join("");
  const changes = Object.entries(labels).map(([stat, label]) => ({
    label,
    change: hasEquipmentValue[stat] ? (item[stat] || 0) - (current[stat] || 0) : 0,
    before: current[stat] || 0,
  }));
  const maximum = Math.max(...changes.map(({ change }) => Math.abs(change)), 1);
  const gains = changes.filter(({ change }) => change > 0).length;
  const losses = changes.filter(({ change }) => change < 0).length;
  if (changeSummary) {
    changeSummary.textContent = `${gains} stat${gains === 1 ? "" : "s"} improved · ${losses} stat${losses === 1 ? "" : "s"} decreased`;
  }
  if (changeChart) {
    changeChart.innerHTML = changes.map(({ label, change, before }) => {
      const percentage = before ? (change / before) * 100 : 0;
      const width = Math.min(100, (Math.abs(change) / maximum) * 100);
      const direction = change < 0 ? "loss" : "gain";
      return `<div class="comparison-change-row ${direction}">
        <span>${label}</span>
        <div class="comparison-change-track"><i style="width:${width}%"></i></div>
        <strong>${change >= 0 ? "+" : ""}${format(change)}</strong>
        <small>${before ? `${change >= 0 ? "+" : ""}${percentage.toFixed(1)}%` : "new stat"}</small>
      </div>`;
    }).join("");
  }
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
    const mitigation = isHealing ? 1 : 1 / (1 + effectiveDefense / 2000);
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
    const classMitigation = isHealing ? 1 : mitigation;
    const normalRate = rawOutput * classMitigation;

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
    setText("res-rate", format(normalRate));
    setText("res-five-minute", format(normalRate * 300));
    setText("res-penetration-effectiveness", `${Math.max(0, (isHealing ? 0 : ((classMitigation / (1 / (1 + enemyDefenseBaseline / 2000))) - 1) * 100)).toFixed(2)}%`);
    setText("res-damage-bonus-gain", format(coreOutput * outputBonus));
    setText("res-critical-gain", format(normalRate * (criticalRate / 100)));
    updateDpsRadar([
      rawOutput * mitigation,
      criticalRate,
      estimatedAccuracy,
      penetrationRating,
      hitRating,
    ]);
    updateHpsRateGraph([rawOutput, rawOutput * mitigation, rawOutput * mitigation * criticalMultiplier]);
    updateClassFocus(
      document.getElementById("class-select").value,
      [rawOutput, rawOutput * mitigation, rawOutput * mitigation * criticalMultiplier, penetrationRating, enemyDefenseBaseline, effectiveHp, damageReduction, criticalRate],
    );
    updateSurvivabilityGraph([
      hp,
      effectiveHp,
      effectiveHp / incomingHitBaseline,
      Math.min(100, evasion / enemyHitBaseline * 100),
      defense,
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
    setText("log-mitigation", isHealing ? "One heal per second" : `Assumes ${enemyDefenseBaseline.toLocaleString()} enemy Defense`);
    setText("log-crit-mult", isHealing ? `×${criticalMultiplier.toFixed(2)} critical healing` : `×${criticalMultiplier.toFixed(2)} after resistance`);
    updateCharts(rawOutput, rawOutput * mitigation, rawOutput * mitigation * criticalMultiplier, baseAttribute, readOptionalNumber("stat_defense_rating"), penetrationRating, outputBonus, enemyDefenseBaseline, mitigation, 0, 0, 0);
    document.getElementById("val-crit-bonus")?.classList.toggle("diminished", critEvaluation.diminished);
    error.hidden = true;
    return true;
  } catch (validationError) {
    error.textContent = validationError.message;
    error.hidden = false;
    return false;
  }
}

function activateScreenTab(tab, moveFocus = false) {
  const screen = tab.closest(".calculator-screen");
  const target = tab.dataset.screenTab;
  screen.querySelectorAll(".screen-tab").forEach((button) => {
    const active = button === tab;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", active ? "true" : "false");
    button.tabIndex = active ? 0 : -1;
  });
  screen.querySelectorAll(".screen-panel").forEach((panel) => {
    const active = panel.dataset.screenPanel === target;
    panel.hidden = !active;
    panel.classList.toggle("is-active", active);
  });
  if (moveFocus) tab.focus();
}

document.querySelectorAll(".screen-tab").forEach((tab) => {
  tab.tabIndex = tab.getAttribute("aria-selected") === "true" ? 0 : -1;
  tab.addEventListener("click", () => {
    activateScreenTab(tab);
  });
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const tabs = [...tab.closest(".screen-tabs").querySelectorAll(".screen-tab:not([hidden])")];
    const index = tabs.indexOf(tab);
    const nextIndex = event.key === "Home"
      ? 0
      : event.key === "End"
        ? tabs.length - 1
        : (index + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
    activateScreenTab(tabs[nextIndex], true);
  });
});

document.querySelectorAll(".viz-help-button, .field-help-button").forEach((button) => {
  button.addEventListener("click", () => {
    const panel = button.closest(".screen-panel, .app-page, form");
    const help = panel?.querySelector(`#${button.getAttribute("aria-controls")}`);
    if (!panel || !help) return;
    const isOpen = button.getAttribute("aria-expanded") === "true";
    const buttonSelector = button.classList.contains("field-help-button")
      ? ".field-help-button"
      : ".viz-help-button";
    const helpSelector = button.classList.contains("field-help-button")
      ? ".field-help"
      : ".viz-help";
    panel.querySelectorAll(buttonSelector).forEach((otherButton) => {
      otherButton.setAttribute("aria-expanded", "false");
    });
    panel.querySelectorAll(helpSelector).forEach((otherHelp) => {
      otherHelp.hidden = true;
    });
    button.setAttribute("aria-expanded", String(!isOpen));
    help.hidden = isOpen;
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  document.querySelectorAll(".viz-help-button[aria-expanded=\"true\"], .field-help-button[aria-expanded=\"true\"]").forEach((button) => {
    button.setAttribute("aria-expanded", "false");
    const help = document.getElementById(button.getAttribute("aria-controls"));
    if (help) help.hidden = true;
    button.focus();
  });
});

const appPages = document.querySelectorAll("[data-app-page]");
const pageLinks = document.querySelectorAll("[data-page-target]");
function showAppPage(pageName) {
  appPages.forEach((page) => {
    const isActive = page.dataset.appPage === pageName;
    page.hidden = !isActive;
    page.setAttribute("aria-hidden", String(!isActive));
    page.classList.toggle("is-page-active", isActive);
  });
  pageLinks.forEach((link) => {
    const active = link.dataset.pageTarget === pageName;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function setPageActionStatus(actions, message) {
  const status = actions.querySelector(".page-action-status");
  if (!status) return;
  status.textContent = message;
  window.setTimeout(() => {
    if (status.textContent === message) status.textContent = "";
  }, 10000);
}

function isMobileBrowser() {
  return window.matchMedia("(max-width: 760px)").matches
    || /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function printCurrentPage(actions) {
  setPageActionStatus(actions, isMobileBrowser()
    ? "Opening print options..."
    : "Choose Save as PDF in the print dialog...");
  window.print();
}

async function shareCurrentPage(actions) {
  const page = actions.closest("[data-app-page]");
  const title = page?.querySelector(".eyebrow")?.textContent || document.title;
  const url = `${window.location.origin}${window.location.pathname}${window.location.hash}`;
  if (navigator.share) {
    await navigator.share({ title, text: "Whoa Adventure Stat Calculator", url });
    setPageActionStatus(actions, "Shared");
    return;
  }
  let copied = false;
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(url);
      copied = true;
    } catch {
      copied = false;
    }
  }
  if (!copied) {
    const fallback = document.createElement("textarea");
    fallback.value = url;
    fallback.setAttribute("readonly", "");
    fallback.style.position = "fixed";
    fallback.style.opacity = "0";
    document.body.appendChild(fallback);
    fallback.select();
    copied = document.execCommand("copy");
    fallback.remove();
  }
  if (!copied) {
    const manualCopy = window.prompt("Copy this calculator link:", url);
    if (manualCopy === null) throw new DOMException("Share cancelled.", "AbortError");
  }
  setPageActionStatus(actions, "Link copied - paste into email or chat");
}

document.querySelectorAll("[data-page-actions]").forEach((actions) => {
  actions.addEventListener("click", async (event) => {
    const button = event.target.closest("[data-page-action]");
    if (!button) return;
    const action = button.dataset.pageAction;
    if (action === "print-save") {
      const page = actions.closest("[data-app-page]");
      if (page?.id === "calculator" || page?.id === "visualization" || page?.id === "compare" || page?.id === "class-reference" || page?.id === "formula-guide") {
        const calculatorForm = document.querySelector(".stats-form");
        const classSelect = document.getElementById("class-select");
        if (calculatorForm && classSelect) saveCalculatorState(calculatorForm, classSelect);
        saveComparisonState();
        printCurrentPage(actions);
      }
    } else if (action === "share") {
      try {
        await shareCurrentPage(actions);
      } catch (error) {
        if (error.name !== "AbortError") setPageActionStatus(actions, "Share unavailable");
      }
    }
  });
});

pageLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    if (window.location.hash === link.hash) {
      syncPageFromHash();
      return;
    }
    window.location.hash = link.hash;
  });
});

function pageNameFromHash() {
  const hash = window.location.hash.slice(1);
  if (hash === "calculator-page") return "calculator";
  return ["compare", "visualization", "class-reference", "formula-guide"].includes(hash) ? hash : "calculator";
}

function syncPageFromHash() {
  showAppPage(pageNameFromHash());
}

syncPageFromHash();
window.addEventListener("hashchange", syncPageFromHash);
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
      input.classList.remove("input-error");
      input.setAttribute("aria-invalid", "false");
      input.removeAttribute("aria-describedby");
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
  calculatorForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (runRecalculationPipeline()) {
      window.location.hash = "#visualization";
    }
  });
  runRecalculationPipeline();
  updateClassReference(classSelect.value);
  updatePriestOnly(classSelect.value);
}
