from flask import Flask, render_template, request

app = Flask(__name__)
ENEMY_DEFENSE_BASELINE = 5000.0
ENEMY_HIT_BASELINE = 5000.0
INCOMING_HIT_BASELINE = 5000.0

DIMINISHING_RETURNS_CONFIG = {
    "affected_stats": {
        "Critical_Rate_Percentage",
        "Evasion_Percentage",
        "Cooldown_Reduction_Percentage",
    },
    "unaffected_stats": {
        "Physical_Attack",
        "Magic_Attack",
        "Defense",
        "HP",
    },
    "threshold": 5000.0,
    "coefficient": 0.0002,
}

BUILD_GUIDANCE = {
    "Attack/Crit": "Best general DPS and healing balance. Prioritize Attack and Crit, then Hit.",
    "Hit/Crit": "Healing-focused option. Prioritize Hit and Crit, then Attack.",
    "Attack/Hit/Crit": "Late-game hybrid. Keep all three healthy and let Penetration accumulate naturally.",
}

CLASS_GUIDANCE = {
    "Priest": "Attack/Crit is the general healing and DPS direction. Around 75% healing crit, prioritize Attack > Hit ≈ Crit > Penetration.",
    "Warrior": "Team/Tank: DMG Reduction → Defense → Defense Bonus → Crit Resistance/Evasion. Solo: Physical ATK → Penetration → Crit Damage.",
    "Assassin": "Choose Attack-Penetration for high-defense bosses or Attack-Crit for Secret Realm speedfarming. Do not mix the two.",
    "Archer": "Strength (STR) → Agility (AGI) → Attack Speed (ASPD) → Physical Penetration.",
    "Mage": "Magic ATK → Cooldown Reduction (CDR) → Magic Penetration.",
}

CLASS_PROFILES = {
    "Priest": {
        "advancements": "Light / Shadow Priest",
        "base_attribute": "Attack and healing stats",
        "gems": "Attack + Crit, or Hit + Crit",
        "refinement": "Crit > Attack > Hit > Penetration",
        "notable": "Healing crit estimate targets roughly 75%; enemy Crit Resistance may reduce the result.",
    },
    "Warrior": {
        "advancements": "Gladiator / Paladin",
        "base_attribute": "Physical ATK",
        "gems": "DMG Red, Defense, and HP for team/tank; physical ATK and Penetration for solo",
        "refinement": "Prioritize flat DMG Reduction for team/tank builds",
        "notable": "Earth Strike scales at 280% ATK and stuns for 1.5 seconds; Valor Bastion absorbs 30% Max HP.",
    },
    "Assassin": {
        "advancements": "Night Walker / Ash Envoy",
        "base_attribute": "Physical ATK",
        "gems": "Physical ATK + Penetration, or Physical ATK + Crit Damage",
        "refinement": "Commit to one path; do not split Attack-Penetration and Attack-Crit",
        "notable": "Shadow Blade scales at 480% ATK and doubles below 30% target HP; Ambush unlocks at level 40.",
    },
    "Archer": {
        "advancements": "Tide Chaser / Wind Walker",
        "base_attribute": "Physical ATK",
        "gems": "Physical ATK, Attack Speed, and Penetration",
        "refinement": "Roll into Attack Speed pools to support projectile loops",
        "notable": "Piercing Arrow scales at 350% ATK and reduces armor by 20%; Arrow Rain fires 8 waves at 45% ATK each.",
    },
    "Mage": {
        "advancements": "Advancement names not confirmed",
        "base_attribute": "Magic ATK",
        "gems": "Magic ATK, CDR, and Magic Penetration",
        "refinement": "Prioritize Cooldown Reduction for reliable spell loops",
        "notable": "Astral Comet scales at 420% Magic ATK and applies a 5-second burn; Arcane Overload adds 8% per stack up to 4 stacks.",
    },
}

FORMULA_GUIDANCE = {
    "Base Damage": "ATK + Penetration",
    "Priest Base Healing": "ATK + Penetration + Hit",
    "Normal Damage/Healing": "Base output × (1 + Damage Bonus %); Priest healing is not defense-mitigated",
    "Critical Damage/Healing": "Normal output × 2.00",
    "Critical Rate": "Damage: Crit / (ATK + Penetration); Priest healing: Crit / (ATK + Penetration + Hit)",
    "HPS at 1 action/sec": "Normal healing per action × 1; five-minute total = HPS × 300",
    "DPS at 1 action/sec": "Normal damage per action × 1; five-minute total = DPS × 300",
    "Hit Percentage": "min(100, Hit Rating ÷ assumed enemy Evasion × 100), assuming 100 Evasion",
    "Warrior Effective HP": "HP ÷ ((1 ÷ (1 + Defense ÷ 2,000)) × (1 - Damage Reduction))",
    "Warrior HP Contribution": "HP ÷ Effective HP × 100",
    "Warrior Resilience": "Effective HP ÷ assumed incoming hit",
    "Warrior Dodge": "min(100, Evasion ÷ assumed enemy Hit × 100)",
    "Normalized Survivability Profile": "Each metric is scaled against the largest displayed metric from 0–100 for shape comparison; displayed values retain their original units",
}

ASCENDANCY_FORMULAS = {
    "Base Damage Core": "Attack + Penetration",
    "Base Healing": "Attack + Penetration + Hit",
    "Critical Rate (Damage)": "Crit / (Attack + Penetration)",
    "Healing Critical Rate": "Crit / Base Healing",
    "Damage Bonus Multiplier": "1 + Damage Bonus %",
    "Normal Center Hit": "(Attack + Pen) × Damage Bonus",
    "Critical Center Hit": "Normal Center Hit × 2.00",
    "Healing HPS": "(Attack + Penetration + Hit) × (1 + Damage Bonus %) at 1 action/sec",
    "Critical Healing HPS": "Healing HPS × 2.00",
}

SKILLS = {
    "Warrior": {
        "Earth Strike": (2.80, 0, "damage"),
    },
    "Assassin": {
        "Shadow Blade": (4.80, 0, "damage"),
    },
    "Archer": {
        "Piercing Arrow": (3.50, 0, "damage"),
        "Arrow Rain": (0.45, 0, "damage"),
    },
    "Mage": {
        "Astral Comet": (4.20, 0, "damage"),
    },
    "Priest": {
        "Sanctifying Light": (2.60, 0, "healing"),
    },
}

SKILL_EFFECTS = {
    ("Archer", "Arrow Rain"): {"hit_count": 8},
    ("Assassin", "Shadow Blade"): {"execute_threshold": 0.30, "execute_multiplier": 2.0},
}


def calculate_stats(values):
    attack = values["attack"]
    hit = values["hit"]
    penetration = values["penetration"]
    crit = values["crit"]
    hit_rate = min(100, (hit / 4057 * 90) if hit < 4057 else 90 + (hit - 4057) / (6000 - 4057) * 10)
    healing_crit = (crit / (attack + hit + penetration) * 100) if attack + hit + penetration else 0

    return {
        **values,
        "hit_rate": hit_rate,
        "healing_crit": healing_crit,
        "healing_multiplier": 1 + healing_crit / 100,
        "hit_target_gap": max(0, 4057 - hit),
        "healing_target_gap": max(0, 75 - healing_crit),
    }


def calculate_effective_stat(stat_name, raw_value):
    """Apply the verified diminishing-return curve only to secondary stats."""
    if stat_name not in DIMINISHING_RETURNS_CONFIG["affected_stats"]:
        return raw_value

    threshold = DIMINISHING_RETURNS_CONFIG["threshold"]
    if raw_value <= threshold:
        return raw_value

    coefficient = DIMINISHING_RETURNS_CONFIG["coefficient"]
    excess = raw_value - threshold
    return threshold + excess / (1 + coefficient * excess)


def calculate_universal(values):
    # Keep the function compatible with earlier callers while the web form
    # reports class-level base output rather than a skill-specific result.
    skill_scaling, flat_modifier, output_type = (1.0, 0, "damage")
    if values.get("skill"):
        skill_scaling, flat_modifier, output_type = SKILLS[values["class_name"]][values["skill"]]
    base_attribute = values["base_attribute"]
    attack_bonus = values.get("attack_bonus_percentage", 0) / 100
    raw_output = (
        (base_attribute * (1 + attack_bonus) * skill_scaling) + flat_modifier
    ) * (1 + values["bonus_percentage"] / 100)
    effective_defense = max(
        0,
        values["enemy_defense"] * (1 - values["penetration_percentage"] / 100) - values["flat_penetration"],
    )
    mitigation_multiplier = 1 / (1 + effective_defense / 2000)
    critical_multiplier = max(
        1.0,
        1.5
        + values["crit_damage_bonus_percentage"] / 100
        - values.get("target_crit_resistance_percentage", 0) / 100,
    )
    critical_output = raw_output * mitigation_multiplier * critical_multiplier
    damage_reduction = min(values["damage_reduction_percentage"], 90) / 100
    damage_received = (
        values["incoming_damage"] * (1 - damage_reduction)
        / (1 + values["defense_score"] * values["defense_bonus_percentage"] / 100)
    )
    result = {
        **values,
        "skill_scaling": skill_scaling,
        "flat_modifier": flat_modifier,
        "output_type": output_type,
        "raw_output": raw_output,
        "effective_defense": effective_defense,
        "mitigation_multiplier": mitigation_multiplier,
        "mitigated_output": raw_output * mitigation_multiplier,
        "critical_output": critical_output,
        "critical_multiplier": critical_multiplier,
        "damage_reduction_applied": damage_reduction * 100,
        "damage_received": damage_received,
    }
    effects = SKILL_EFFECTS.get((values["class_name"], values["skill"]), {}) if values.get("skill") else {}
    if "hit_count" in effects:
        result["hit_count"] = effects["hit_count"]
        result["combo_output"] = result["mitigated_output"] * effects["hit_count"]
    if "life_steal_ratio" in effects:
        result["life_steal_yield"] = result["mitigated_output"] * effects["life_steal_ratio"]
    return result


def calculate_ascendancy(values):
    attack = values["attack"]
    penetration = values["penetration"]
    hit = values["hit"]
    crit = values["crit"]
    damage_bonus_multiplier = 1 + values["damage_bonus_percentage"] / 100
    base_damage = attack + penetration
    base_healing = base_damage + hit
    is_healing = values["class_name"] == "Priest"
    core_output = base_healing if is_healing else base_damage
    normal_center_hit = core_output * damage_bonus_multiplier
    critical_center_hit = normal_center_hit * 2
    effective_enemy_defense = max(0, ENEMY_DEFENSE_BASELINE - penetration)
    mitigation_multiplier = 1 / (1 + effective_enemy_defense / 2000)
    defense_score = values.get("defense_score", 0)
    damage_reduction = min(90, values.get("damage_reduction_percentage", 0)) / 100
    defense_multiplier = 1 / (1 + defense_score / 2000)
    incoming_damage_multiplier = defense_multiplier * (1 - damage_reduction)
    hp = values.get("stat_hp", 0)
    critical_rate = (crit / core_output * 100) if core_output else 0
    estimated_accuracy = min(100, hit)
    result = {
        **values,
        "is_healing": is_healing,
        "base_damage": base_damage,
        "base_healing": base_healing,
        "heal_power": base_healing,
        "heal_crit": critical_rate,
        "core_output": core_output,
        "damage_bonus_multiplier": damage_bonus_multiplier,
        "normal_center_hit": normal_center_hit,
        "critical_center_hit": critical_center_hit,
        "critical_rate": critical_rate,
        "estimated_accuracy": estimated_accuracy,
        "raw_output": normal_center_hit,
        "mitigated_output": normal_center_hit * mitigation_multiplier,
        "critical_output": critical_center_hit * mitigation_multiplier,
        "mitigation_multiplier": mitigation_multiplier,
        "warrior_effective_hp": hp / incoming_damage_multiplier if incoming_damage_multiplier else hp,
        "warrior_resilience": (hp / incoming_damage_multiplier) / INCOMING_HIT_BASELINE if incoming_damage_multiplier else 0,
        "warrior_hp_contribution": incoming_damage_multiplier * 100,
        "warrior_dodge": min(100, values.get("stat_evasion", 0) / ENEMY_HIT_BASELINE * 100),
        "critical_multiplier": 2.0,
        "damage_received": 0.0,
        "damage_reduction_applied": 0.0,
    }
    return result


def read_stats(form):
    class_name = form.get("class_name", "Priest")
    if class_name not in CLASS_GUIDANCE:
        raise ValueError("Choose a valid class.")
    if class_name != "Priest":
        return {"class_name": class_name, "formula_available": False}

    build = form.get("build", "Attack/Crit")
    content = form.get("content", "General progression")
    values = {"build": build, "content": content, "class_name": class_name, "formula_available": True}

    for field in ("attack", "hit", "penetration", "crit"):
        value = form.get(field, type=float)
        if field == "incoming_damage" and value is None:
            value = 0.0
        if value is None or value < 0:
            raise ValueError(f"{field.title()} must be 0 or greater.")
        values[field] = value

    return calculate_stats(values)


def read_universal(form):
    class_name = form.get("class_name", "Warrior")
    if class_name not in CLASS_GUIDANCE:
        raise ValueError("Choose a valid class.")

    values = {"class_name": class_name}
    for field in (
        "base_attribute",
        "stat_attack_rating",
        "stat_defense_rating",
        "stat_hp",
        "stat_crit",
        "stat_crit_resistance",
        "stat_hit",
        "stat_evasion",
        "stat_penetration",
        "attack_bonus_percentage",
        "hp_bonus_percentage",
        "crit_bonus_percentage",
        "crit_res_bonus_percentage",
        "hit_bonus_percentage",
        "evasion_bonus_percentage",
        "penetration_bonus_percentage",
        "bonus_percentage",
        "damage_reduction_percentage",
    ):
        value = form.get(field, default=0, type=float)
        if value is None or value < 0:
            raise ValueError(f"{field.replace('_', ' ').title()} must be 0 or greater.")
        values[field] = value
    values["attack"] = values["base_attribute"]
    values["penetration"] = values["stat_penetration"]
    values["hit"] = values["stat_hit"]
    values["crit"] = values["stat_crit"]
    values["damage_bonus_percentage"] = values["bonus_percentage"]
    result = calculate_ascendancy(values)
    return result


def read_ascendancy(form):
    class_name = form.get("class_name", "Assassin")
    if class_name not in CLASS_GUIDANCE:
        raise ValueError("Choose a valid class.")
    fields = ("attack", "penetration", "hit", "crit", "damage_bonus_percentage")
    values = {"class_name": class_name}
    for field in fields:
        value = form.get(field, type=float)
        if value is None or value < 0:
            raise ValueError(f"{field.replace('_', ' ').title()} must be 0 or greater.")
        values[field] = value
    return calculate_ascendancy(values)


@app.route("/", methods=["GET", "POST"])
def index():
    stats = None
    error = None
    selected_class = request.values.get("class_name", "Assassin")
    calculator = request.values.get("calculator", "universal")
    if request.method == "POST":
        try:
            if calculator == "universal":
                stats = read_universal(request.form)
            else:
                stats = read_stats(request.form)
        except ValueError as exc:
            error = str(exc)
    return render_template(
        "index.html",
        stats=stats,
        error=error,
        guidance=BUILD_GUIDANCE,
        class_guidance=CLASS_GUIDANCE,
        selected_class=selected_class,
        formula_guidance=FORMULA_GUIDANCE,
        ascendancy_formulas=ASCENDANCY_FORMULAS,
        class_profiles=CLASS_PROFILES,
        skills=SKILLS,
        calculator=calculator,
    )


if __name__ == "__main__":
    app.run(debug=True)
