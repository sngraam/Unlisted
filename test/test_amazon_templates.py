"""Acceptance checks against the four seller-downloaded category catalogs."""

import json
import sys
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend/modules/data_bridge"))
from amazon_row import prepare_row  # noqa: E402


class AmazonTemplateCatalogTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.catalogs = {}
        for path in (ROOT / "test/amazon-templates/catalog").glob("*.json"):
            value = json.loads(path.read_text())
            cls.catalogs[value["productType"]] = value

    def test_four_distinct_product_types_and_exact_headers(self):
        self.assertTrue({"KURTA", "PANTS", "SHIRT", "SHORTS"}.issubset(self.catalogs))
        for name, catalog in self.catalogs.items():
            self.assertEqual(catalog["fieldCount"], len(catalog["fields"]))
            self.assertEqual(len({field["key"] for field in catalog["fields"]}), len(catalog["fields"]))
            self.assertEqual(catalog["marketplaceId"], "A21TJRUUN4KGV")
            self.assertEqual(catalog["language"], "en_IN")
            type_field = next(field for field in catalog["fields"] if field["attribute"] == "product_type")
            self.assertEqual(type_field["allowedValues"], [name])

    def test_repeated_headers_map_one_semantic_field_to_distinct_values(self):
        catalog = self.catalogs["KURTA"]
        facts = {
            "listing": {"productType": "KURTA", "browseNodeId": catalog["browseNodes"][0]["id"]},
            "variant": {"sellerSku": "K-01"},
            "revision": {"title": "Cotton kurta", "bulletPoints": ["Soft fabric", "Machine washable"]},
        }
        result = prepare_row(catalog, facts)
        browse = next(field for field in catalog["fields"] if field["attribute"] == "recommended_browse_nodes")
        self.assertIn(result["row"][browse["key"]], browse["allowedValues"])
        bullets = [field for field in catalog["fields"] if field["attribute"] == "bullet_point"]
        self.assertEqual(result["row"][bullets[0]["key"]], "Soft fabric")
        self.assertEqual(result["row"][bullets[1]["key"]], "Machine washable")
        self.assertEqual(result["row"][next(field["key"] for field in catalog["fields"] if field["attribute"] == "product_type")], "KURTA")
        self.assertTrue(result["errors"])
        self.assertTrue(result["review"])

    def test_category_specific_values_cannot_silently_enter_another_template(self):
        catalog = self.catalogs["KURTA"]
        with self.assertRaisesRegex(ValueError, "does not match template"):
            prepare_row(catalog, {"listing": {"productType": "PANTS"}})
        with self.assertRaisesRegex(ValueError, "Unknown headers"):
            prepare_row(catalog, {}, {"invented_field#1.value": "x"})
        type_key = next(field["key"] for field in catalog["fields"] if field["attribute"] == "product_type")
        with self.assertRaisesRegex(ValueError, "mapped core"):
            prepare_row(catalog, {}, {type_key: "SHIRT"})
        identifier_key = next(field["key"] for field in catalog["fields"] if field["attribute"] == "amzn1.volt.ca.product_id_type")
        result = prepare_row(catalog, {}, {identifier_key: "INVALID"})
        self.assertIn("value_not_in_template_choices", [error["reason"] for error in result["errors"]])

    def test_typed_brand_is_authoritative_and_repeat_keys_are_preserved(self):
        catalog = self.catalogs["KURTA"]
        result = prepare_row(catalog, {"product": {"brandName": "Current brand", "canonicalData": {"brand": "Legacy brand"}}})
        key = next(field["key"] for field in catalog["fields"] if field["attribute"] == "brand")
        self.assertEqual(result["row"][key], "Current brand")

    def test_definitions_examples_and_suggested_price_choices(self):
        counts = {"KURTA": 186, "PANTS": 197, "SHIRT": 190, "SHORTS": 217}
        for name, count in counts.items():
            catalog = self.catalogs[name]
            self.assertEqual(len(catalog["sourceMetadata"]["definitions"]), count)
            self.assertEqual({d["pattern"] for d in catalog["sourceMetadata"]["definitions"]}, {f["pattern"] for f in catalog["fields"]})
            self.assertTrue(all(d["example"] for d in catalog["sourceMetadata"]["definitions"]))
            price = next(f for f in catalog["fields"] if f["attribute"] == "purchasable_offer" and f["key"].endswith(".value_with_tax"))
            result = prepare_row(catalog, {}, {price["key"]: "259.99"})
            self.assertFalse(any(e["key"] == price["key"] for e in result["errors"]))

    def test_requiredness_belongs_to_the_definition_not_each_repeat_slot(self):
        catalog = self.catalogs["SHORTS"]
        cells = [f for f in catalog["fields"] if f["attribute"] == "supplier_declared_dg_hz_regulation"]
        result = prepare_row(catalog, {"revision": {"bulletPoints": ["One example"]}}, {cells[0]["key"]: cells[0]["allowedValues"][0]})
        self.assertFalse(any(e["key"].startswith(("bullet_point", "supplier_declared_dg_hz_regulation")) for e in result["errors"]))
        blank = prepare_row(catalog, {})
        self.assertEqual(sum(e["key"].startswith("bullet_point") for e in blank["errors"]), 1)
        self.assertEqual(sum(e["key"].startswith("supplier_declared_dg_hz_regulation") for e in blank["errors"]), 1)

    def test_reported_example_errors_are_blocked_without_inventing_compliance(self):
        catalog = self.catalogs["PANTS"]
        fields = {f["label"]: f for f in catalog["fields"]}
        answers = {fields["Rise Height"]["key"]: "5, 4", fields["External Product Information Entity"]["key"]: "HSN Code", fields["External Product Information"]["key"]: "QUJ85, 610510, 61051010", fields["Regulatory Identification"]["key"]: "1AB1331-121A"}
        reasons = {e["reason"] for e in prepare_row(catalog, {}, answers)["errors"]}
        self.assertTrue({"single_nonnegative_number_required", "single_hsn_code_required", "regulation_type_required_for_id"}.issubset(reasons))
        seed = json.loads((ROOT / "test/seed-data.json").read_text())
        for product in seed["products"]:
            for variant in product["variants"]:
                result = prepare_row(self.catalogs[product["productType"]], {}, variant["channelAttributes"])
                self.assertFalse(any(e["reason"] in reasons - {"required_value_missing"} for e in result["errors"]))


if __name__ == "__main__":
    unittest.main()
