import re
import unittest
from html.parser import HTMLParser
from pathlib import Path

from app import app


class AccessibilityParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.elements = []
        self.labels = []
        self.text = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        self.elements.append((tag, attributes))
        if tag == "label":
            self.labels.append(attributes.get("for"))

    def handle_data(self, data):
        self.text.append(data)


class AccessibilityRegressionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.response = cls.client.get("/")
        cls.html = cls.response.get_data(as_text=True)
        cls.parser = AccessibilityParser()
        cls.parser.feed(cls.html)

    def test_document_has_landmarks_and_mobile_viewport(self):
        self.assertEqual(self.response.status_code, 200)
        html = next(attrs for tag, attrs in self.parser.elements if tag == "html")
        self.assertEqual(html.get("lang"), "en")
        self.assertIn('name="viewport"', self.html)
        self.assertIn("width=device-width", self.html)
        self.assertNotRegex(self.html, r"(maximum-scale|user-scalable)\s*=")
        self.assertTrue(re.search(r"<h1[^>]*>[^<]+</h1>", self.html))
        self.assertIn('aria-label="Quick navigation"', self.html)

    def test_form_controls_have_unique_ids_and_labels(self):
        ids = [attrs["id"] for _, attrs in self.parser.elements if attrs.get("id")]
        self.assertEqual(len(ids), len(set(ids)), "duplicate IDs break label and ARIA references")
        label_ids = {label_id for label_id in self.parser.labels if label_id}
        for tag, attrs in self.parser.elements:
            if tag not in {"input", "select", "textarea"}:
                continue
            if attrs.get("type") == "hidden":
                continue
            self.assertTrue(
                attrs.get("aria-label")
                or attrs.get("aria-labelledby")
                or attrs.get("id") in label_ids,
                f"{tag}#{attrs.get('id')} has no accessible name",
            )

    def test_tabs_have_complete_keyboard_semantics(self):
        ids = {attrs.get("id") for _, attrs in self.parser.elements}
        for tag, attrs in self.parser.elements:
            if attrs.get("role") != "tab":
                continue
            self.assertIn(attrs.get("aria-selected"), {"true", "false"})
            self.assertIn(attrs.get("aria-controls"), ids)
        for _, attrs in self.parser.elements:
            if attrs.get("role") == "tabpanel":
                self.assertIn(attrs.get("aria-labelledby"), ids)
                self.assertEqual(attrs.get("tabindex"), "0")

    def test_results_view_keeps_aria_references_valid(self):
        response = self.client.post(
            "/",
            data={"calculator": "universal", "class_name": "Assassin", "base_attribute": "1000"},
        )
        self.assertEqual(response.status_code, 200)
        parser = AccessibilityParser()
        parser.feed(response.get_data(as_text=True))
        ids = [attrs["id"] for _, attrs in parser.elements if attrs.get("id")]
        self.assertEqual(len(ids), len(set(ids)))
        tabpanels = [attrs for tag, attrs in parser.elements if attrs.get("role") == "tabpanel"]
        self.assertTrue(tabpanels)
        all_ids = set(ids)
        for attrs in tabpanels:
            self.assertIn(attrs.get("aria-labelledby"), all_ids)

    def test_focus_and_touch_target_regressions_are_present(self):
        styles = Path("static/styles.css").read_text(encoding="utf-8")
        script = Path("static/dashboard.js").read_text(encoding="utf-8")
        self.assertIn("button:focus-visible", styles)
        self.assertIn("min-height: 44px", styles)
        self.assertIn("ArrowRight", script)
        self.assertIn('aria-current", "page"', script)


if __name__ == "__main__":
    unittest.main()
