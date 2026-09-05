import unittest

from app import calculate_ascendancy, calculate_effective_stat, calculate_universal


def combat_values(**overrides):
    values = {
        "class_name": "Warrior",
        "skill": "Earth Strike",
        "base_attribute": 1000.0,
        "attack_bonus_percentage": 0.0,
        "bonus_percentage": 20.0,
        "enemy_defense": 1500.0,
        "penetration_percentage": 50.0,
        "flat_penetration": 800.0,
        "crit_damage_bonus_percentage": 0.0,
        "target_crit_resistance_percentage": 0.0,
        "incoming_damage": 0.0,
        "damage_reduction_percentage": 0.0,
        "defense_score": 0.0,
        "defense_bonus_percentage": 0.0,
    }
    values.update(overrides)
    return values


class UniversalCalculatorTests(unittest.TestCase):
    def test_true_damage_at_zero_armor_floor(self):
        result = calculate_universal(combat_values())

        self.assertEqual(result["effective_defense"], 0.0)
        self.assertEqual(result["mitigation_multiplier"], 1.0)
        self.assertEqual(result["mitigated_output"], 3360.0)

    def test_high_defense_mitigation_scaling(self):
        result = calculate_universal(combat_values(
            bonus_percentage=0.0,
            enemy_defense=4000.0,
            penetration_percentage=0.0,
            flat_penetration=0.0,
        ))

        self.assertEqual(result["effective_defense"], 4000.0)
        self.assertEqual(round(result["mitigation_multiplier"], 4), 0.3333)
        self.assertEqual(round(result["mitigated_output"], 2), 933.33)

    def test_assassin_shadow_blade_scaling(self):
        result = calculate_universal(
            combat_values(
                class_name="Assassin",
                skill="Shadow Blade",
                base_attribute=2000.0,
                bonus_percentage=50.0,
                enemy_defense=0.0,
            )
        )

        self.assertEqual(result["raw_output"], 14400.0)
        self.assertEqual(result["mitigated_output"], 14400.0)

    def test_attack_bonus_scales_before_skill_multiplier(self):
        result = calculate_universal(
            combat_values(
                attack_bonus_percentage=50.0,
                bonus_percentage=0.0,
                enemy_defense=0.0,
            )
        )

        self.assertEqual(result["raw_output"], 4200.0)

    def test_critical_resistance_reduces_damage_and_healing_criticals(self):
        result = calculate_universal(
            combat_values(
                class_name="Priest",
                skill="Sanctifying Light",
                base_attribute=1000.0,
                bonus_percentage=0.0,
                enemy_defense=0.0,
                crit_damage_bonus_percentage=50.0,
                target_crit_resistance_percentage=25.0,
            )
        )

        self.assertEqual(result["raw_output"], 2600.0)
        self.assertEqual(result["critical_multiplier"], 1.75)
        self.assertEqual(result["critical_output"], 4550.0)

    def test_damage_reduction_is_capped_at_ninety_percent(self):
        result = calculate_universal(
            combat_values(
                incoming_damage=1000.0,
                damage_reduction_percentage=125.0,
            )
        )

        self.assertEqual(result["damage_reduction_applied"], 90.0)
        self.assertAlmostEqual(result["damage_received"], 100.0)

    def test_secondary_stats_diminish_but_core_stats_remain_linear(self):
        self.assertEqual(calculate_effective_stat("Magic_Attack", 8000.0), 8000.0)
        self.assertAlmostEqual(
            calculate_effective_stat("Cooldown_Reduction_Percentage", 6000.0),
            5833.33,
            places=2,
        )


class AscendancyCalculatorTests(unittest.TestCase):
    def test_damage_model_uses_attack_plus_penetration_and_critical_double(self):
        result = calculate_ascendancy({
            "class_name": "Assassin",
            "attack": 1000.0,
            "penetration": 200.0,
            "hit": 50.0,
            "crit": 300.0,
            "damage_bonus_percentage": 25.0,
            "skill_damage_rate_percentage": 200.0,
            "inscription_damage_percentage": 10.0,
        })

        self.assertEqual(result["base_damage"], 1200.0)
        self.assertAlmostEqual(result["normal_center_hit"], 3300.0)
        self.assertAlmostEqual(result["critical_center_hit"], 6600.0)
        self.assertAlmostEqual(result["critical_rate"], 25.0)

    def test_priest_uses_attack_penetration_and_hit_for_healing(self):
        result = calculate_ascendancy({
            "class_name": "Priest",
            "attack": 1000.0,
            "penetration": 200.0,
            "hit": 300.0,
            "crit": 150.0,
            "damage_bonus_percentage": 0.0,
            "skill_damage_rate_percentage": 100.0,
            "inscription_damage_percentage": 0.0,
        })

        self.assertTrue(result["is_healing"])
        self.assertEqual(result["base_healing"], 1500.0)
        self.assertEqual(result["normal_center_hit"], 1500.0)
        self.assertEqual(result["critical_rate"], 10.0)


if __name__ == "__main__":
    unittest.main()
