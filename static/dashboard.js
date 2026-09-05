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

function format(value) {
  return Math.round(value).toLocaleString();
}

function setBar(id, value, maximum) {
  document.getElementById(id).style.width = `${maximum ? Math.min(100, (value / maximum) * 100) : 0}%`;
}

function updateCharts(rawOutput, normalOutput, criticalOutput, attack, defense, penetration, outputBonus, enemyDefense, mitigation, incomingDamage, damageReduction, damageReceived) {
  const outputMax = Math.max(rawOutput, criticalOutput, 1);
  setBar("bar-normal", normalOutput, outputMax);
  setBar("bar-critical", criticalOutput, outputMax);
  document.getElementById("bar-normal-value").textContent = format(normalOutput);
  document.getElementById("bar-critical-value").textContent = format(criticalOutput);
  const statMax = Math.max(attack, defense, penetration, 1);
  setBar("bar-attack", attack, statMax);
  setBar("bar-defense", defense, statMax);
  setBar("bar-penetration", penetration, statMax);
  document.getElementById("bar-attack-value").textContent = format(attack);
  document.getElementById("bar-defense-value").textContent = format(defense);
  document.getElementById("bar-penetration-value").textContent = format(penetration);
  document.getElementById("screen-normal").textContent = format(normalOutput);
  document.getElementById("screen-critical").textContent = format(criticalOutput);
  const graphMax = Math.max(criticalOutput, 1);
  const normalHeight = Math.max(4, (normalOutput / graphMax) * 86);
  const criticalHeight = Math.max(4, (criticalOutput / graphMax) * 86);
  const normalBar = document.getElementById("graph-normal");
  const criticalBar = document.getElementById("graph-critical");
  normalBar.setAttribute("y", 126 - normalHeight);
  normalBar.setAttribute("height", normalHeight);
  criticalBar.setAttribute("y", 126 - criticalHeight);
  criticalBar.setAttribute("height", criticalHeight);
  document.getElementById("screen-attack").textContent = format(attack);
  document.getElementById("screen-penetration").textContent = format(penetration);
  document.getElementById("screen-bonus").textContent = `${(outputBonus * 100).toFixed(1)}%`;
  document.getElementById("screen-incoming").textContent = format(incomingDamage);
  document.getElementById("screen-damage-reduction").textContent = `${(damageReduction * 100).toFixed(1)}%`;
  document.getElementById("screen-taken").textContent = format(damageReceived);
}

function updateClassReference(className) {
  document.querySelectorAll("[data-reference-class]").forEach((reference) => {
    reference.hidden = reference.dataset.referenceClass !== className;
  });
}

function updateWarriorOnly(className) {
  document.querySelectorAll(".warrior-only").forEach((element) => {
    if (element.dataset.screenPanel) {
      if (className !== "Warrior") element.hidden = true;
    } else {
      element.hidden = className !== "Warrior";
    }
  });
  if (className !== "Warrior") {
    const outputTab = document.querySelector('[data-screen-tab="output"]');
    const outputPanel = document.querySelector('[data-screen-panel="output"]');
    document.querySelectorAll(".screen-tab").forEach((tab) => {
      const active = tab === outputTab;
      tab.classList.toggle("is-active", active);
      tab.setAttribute("aria-selected", active ? "true" : "false");
    });
    document.querySelectorAll(".screen-panel").forEach((panel) => {
      const active = panel === outputPanel;
      panel.classList.toggle("is-active", active);
      panel.hidden = !active;
    });
    document.querySelectorAll('[data-screen-panel="survival"]').forEach((panel) => {
      panel.hidden = true;
    });
    document.querySelectorAll('[data-screen-tab="survival"]').forEach((tab) => {
      tab.setAttribute("aria-selected", "false");
    });
  }
}

function runRecalculationPipeline() {
  const error = document.getElementById("live-error");
  try {
  const baseAttribute = readNumber("base_attribute");
    const outputBonus = readNumber("bonus_percentage") / 100;
    const penetrationRating = readNumber("stat_penetration");
    const hitRating = readNumber("stat_hit");
    const critRating = readNumber("stat_crit");
    const skillRate = readNumber("skill_damage_rate_percentage") / 100;
    const inscriptionLayer = 1 + readNumber("inscription_damage_percentage") / 100;
    const incomingDamage = readOptionalNumber("incoming_damage");
    const damageReduction = Math.min(readNumber("damage_reduction_percentage"), 90) / 100;
    const defenseScore = readNumber("defense_score");
    const defenseBonus = readNumber("defense_bonus_percentage") / 100;
    const hp = readNumber("stat_hp") * (1 + readNumber("hp_bonus_percentage") / 100);
    const defense = defenseScore * (1 + defenseBonus);
    const evasion = readNumber("stat_evasion") * (1 + readNumber("evasion_bonus_percentage") / 100);
    const critResistance = readNumber("stat_crit_resistance") * (1 + readNumber("crit_res_bonus_percentage") / 100);
    const survivalDamageReduction = Math.min(99.99, readNumber("damage_reduction_percentage"));
    const contributions = {
      hp: hp * 0.0023,
      defense,
      evasion,
      critResistance,
    };
    const weightedScore = Object.values(contributions).reduce((sum, value) => sum + value, 0);
    const effectiveHp = hp / (1 - survivalDamageReduction / 100);
    const upgradeHp = readOptionalNumber("upgrade_hp");
    const upgradeDefense = readOptionalNumber("upgrade_defense");
    const upgradeEvasion = readOptionalNumber("upgrade_evasion");
    const upgradeCritResistance = readOptionalNumber("upgrade_crit_resistance");
    const upgradeDamageReduction = readOptionalNumber("upgrade_damage_reduction");
    const upgradedScore = (hp + upgradeHp) * 0.0023 + defense + upgradeDefense +
      evasion + upgradeEvasion + critResistance + upgradeCritResistance;
    const upgradedDamageReduction = Math.min(99.99, survivalDamageReduction + upgradeDamageReduction);
    const upgradedEffectiveHp = (hp + upgradeHp) / (1 - upgradedDamageReduction / 100);
    const isHealing = document.getElementById("class-select").value === "Priest";
    const coreOutput = baseAttribute + penetrationRating + (isHealing ? hitRating : 0);
    const rawOutput = coreOutput * skillRate * (1 + outputBonus) * inscriptionLayer;
    const effectiveDefense = 0;
    const mitigation = 1;
    const criticalMultiplier = 2;
    const damageReceived = (incomingDamage * (1 - damageReduction)) /
      (1 + defenseScore * defenseBonus);
    const critEvaluation = effectiveStat("Critical_Rate_Percentage", critRating);

    document.getElementById("res-raw").textContent = format(rawOutput);
    document.getElementById("res-normal").textContent = format(rawOutput * mitigation);
    document.getElementById("res-crit").textContent = format(rawOutput * mitigation * criticalMultiplier);
    const tankResult = document.getElementById("res-tank");
    if (tankResult) tankResult.textContent = format(damageReceived);
    document.getElementById("log-mitigation").textContent = `×${mitigation.toFixed(3)}`;
    document.getElementById("log-crit-mult").textContent = `×${criticalMultiplier.toFixed(2)} after resistance`;
    document.getElementById("log-mitigation").textContent = "Enemy defense not entered";
    setText("res-effective-hp", format(effectiveHp));
    setText("res-weighted-score", format(weightedScore));
    setText("res-hp-contribution", format(contributions.hp));
    setText("res-defense-contribution", format(contributions.defense));
    setText("res-evasion-contribution", format(contributions.evasion));
    setText("res-crit-res-contribution", format(contributions.critResistance));
    setText("res-upgrade-score", `${upgradedScore - weightedScore >= 0 ? "+" : ""}${format(upgradedScore - weightedScore)}`);
    setText("res-upgrade-hp", `${upgradedEffectiveHp - effectiveHp >= 0 ? "+" : ""}${format(upgradedEffectiveHp - effectiveHp)}`);
    setText("mix-hp", `${((contributions.hp / weightedScore) * 100).toFixed(2)}%`);
    setText("mix-defense", `${((contributions.defense / weightedScore) * 100).toFixed(2)}%`);
    setText("mix-evasion", `${((contributions.evasion / weightedScore) * 100).toFixed(2)}%`);
    setText("mix-crit-res", `${((contributions.critResistance / weightedScore) * 100).toFixed(2)}%`);
    updateCharts(rawOutput, rawOutput, rawOutput * criticalMultiplier, baseAttribute, readNumber("stat_defense_rating"), penetrationRating, outputBonus, 0, mitigation, incomingDamage, damageReduction, damageReceived);
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

showAppPage("calculator");

const calculatorForm = document.querySelector(".stats-form");
if (calculatorForm) {
  const classSelect = document.getElementById("class-select");
  const clearStatsButton = document.getElementById("clear-stats");
  clearStatsButton.addEventListener("click", () => {
    calculatorForm.querySelectorAll('input[type="number"]').forEach((input) => {
      input.value = "";
    });
    document.getElementById("live-error").hidden = true;
  });
  classSelect.addEventListener("change", runRecalculationPipeline);
  classSelect.addEventListener("change", () => updateClassReference(classSelect.value));
  classSelect.addEventListener("change", () => updateWarriorOnly(classSelect.value));
  calculatorForm.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", runRecalculationPipeline);
  });
  runRecalculationPipeline();
  updateClassReference(classSelect.value);
  updateWarriorOnly(classSelect.value);
}
