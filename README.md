# WHOA Adventure Calculator

A compact Flask web app for WHOA Adventure stat calculations, combat output
visualization, and class reference notes.

## Run locally

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

Open <http://127.0.0.1:5000> in a browser.

## Use the calculator

1. Select a class.
2. Enter the displayed in-game stats.
3. Use the calculator and visualization tabs to review results.
4. Use **CLEAR ALL STATS** to reset every numeric field.
5. Use the Visualization tab to review Noblesse's verified center-hit model from the unified calculator.
6. Open the Reference tab for class guidance and formula notes.

Warrior-only fields and survivability results appear when Warrior is selected.
The calculator also provides concise hover/focus tooltips for its inputs.

## Authoritative models

The verified models are based on the ASCENDANCY Combat Lab workbook:

<https://docs.google.com/spreadsheets/d/1HYeBoEnzPC1bRy30Nln9zD21KCUWjVXA/edit?gid=283237974#gid=283237974>

- Base damage core: `Attack + Penetration`
- Base healing: `Attack + Penetration + Hit`
- Critical rate: `Crit / (Attack + Penetration)`
- Healing critical rate: `Crit / Base Healing`
- Critical damage and healing: `Normal Output × 2`
- Damage bonus: direct multiplier, `1 + Damage Bonus%`
- Tested damage center: `(Attack + Pen) × Skill Rate × Damage Bonus × Inscription Layer`

Attack, Crit, Penetration, and Hit bonus percentages strengthen flat stat gains;
they do not directly multiply final damage. Artifacts, pets, temporary buffs,
and extra proc layers are outside the current model.

Combat models provided by **Noblesse's ASCENDANCY Combat Lab**.

The calculator uses `Attack + Penetration` for damage,
`Attack + Penetration + Hit` for Priest healing, Damage Bonus %, and a
fixed `×2.00` critical center hit.

## Tests

```powershell
python -m unittest test_calculator.py
```
