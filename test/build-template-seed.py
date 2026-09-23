"""Build fictional demo products from verified Amazon template field definitions.

The XLSM files contain blank listing templates, not real product rows. Keep these
sample facts explicit and visibly labeled; never infer a seller's facts from examples.
"""

import json
import runpy
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CATALOG = ROOT / "test/amazon-templates/catalog"
OUTPUT = ROOT / "test/seed-data.json"
apply_examples = runpy.run_path(str(ROOT / "test/workbook-examples.py"))["apply_examples"]
SPECS = [
    dict(id="sample-kurta", type="KURTA", node="Women > Ethnic Wear > Kurtas", name="Anokhi Sample Cotton Anarkali Kurta", material="Cotton", style="Anarkali", fit="Regular", size_attribute="apparel_size", weight=0.35, mrp=1999, price=1499, colors=[("Navy Blue", "Blue", "38"), ("Maroon", "Red", "40")]),
    dict(id="sample-pants", type="PANTS", node="Men > Jeans", name="Anokhi Sample Cotton Blend Jeans", material="Cotton Blend", style="Classic", fit="Regular", size_attribute="bottoms_size", weight=0.62, mrp=2499, price=1799, colors=[("Indigo Blue", "Blue", "32"), ("Black", "Black", "34")]),
    dict(id="sample-shirt", type="SHIRT", node="Men > T-shirts, Polos & Shirts > Shirts", name="Anokhi Sample Cotton Casual Shirt", material="Cotton", style="Classic", fit="Regular", size_attribute="shirt_size", weight=0.28, mrp=1899, price=1299, colors=[("Sky Blue", "Blue", "38"), ("White", "White", "40")]),
    dict(id="sample-shorts", type="SHORTS", node="Women > Western Wear > Skirts & Shorts > Shorts", name="Anokhi Sample Cotton Bermuda Shorts", material="Cotton", style="Bermuda Shorts", fit="Regular", size_attribute="bottoms_size", weight=0.23, mrp=1499, price=999, colors=[("Beige", "Beige", "32"), ("Black", "Black", "34")]),
]


def field_for(fields, attribute, suffix):
    matches = [f for f in fields if f["attribute"] == attribute and f["key"].endswith(suffix)]
    if len(matches) != 1:
        raise ValueError(f"Expected one field for {attribute} {suffix}, found {len(matches)}")
    return matches[0]


def put(answers, fields, attribute, suffix, value):
    field = field_for(fields, attribute, suffix)
    choices = field.get("allowedValues", [])
    if choices and value not in choices:
        raise ValueError(f"{attribute}={value!r} is not allowed for {field['key']}")
    answers[field["key"]] = value


def main():
    catalogs = {}
    for path in CATALOG.glob("*.json"):
        item = json.loads(path.read_text())
        if item["productType"] in catalogs:
            raise ValueError(f"Multiple checked-in catalogs for {item['productType']}")
        catalogs[item["productType"]] = item
    products = []
    for spec in SPECS:
        catalog = catalogs[spec["type"]]
        nodes = [node for node in catalog["browseNodes"] if spec["node"] in node["path"]]
        if len(nodes) != 1:
            raise ValueError(f"Ambiguous browse node for {spec['type']}: {nodes}")
        variants = []
        for index, (color, color_map, size) in enumerate(spec["colors"], start=1):
            answers = {}
            put(answers, catalog["fields"], "material", "#1.value", spec["material"])
            put(answers, catalog["fields"], "fabric_type", "#1.value", spec["material"])
            put(answers, catalog["fields"], "fit_type", "#1.value", spec["fit"])
            put(answers, catalog["fields"], "style", "#1.value", spec["style"])
            put(answers, catalog["fields"], "color", "#1.standardized_values#1", color_map)
            put(answers, catalog["fields"], spec["size_attribute"], "#1.size_system", "IN")
            put(answers, catalog["fields"], spec["size_attribute"], "#1.size_class", "Numeric")
            put(answers, catalog["fields"], spec["size_attribute"], "#1.size", size)
            sku = f"DEMO-{spec['type']}-{index:02d}"
            variants.append(dict(id=f"v{index}", sku=sku, color=color, size=size, mrp=spec["mrp"], price=spec["price"], stock=12 + index * 4, channelAttributes=answers))
        demo_notice = "Fictional sample only. Confirm the brand, material, size, identity, claims, images and seller eligibility before creating a real Amazon listing."
        bullets = [
            f"Sample {spec['type'].lower()} record for catalog workflow testing; replace all claims with supplier-confirmed facts.",
            f"The selected material value is {spec['material']} in this fictional demonstration.",
            "Each displayed SKU has its own colour, size, price and inventory example.",
            "Confirm the size chart, fit and product identifiers for the actual item.",
            "Review country of origin, care, safety and compliance details before submission.",
        ]
        products.append(dict(
            id=spec["id"], sku=variants[0]["sku"], name=spec["name"], brand="Anokhi",
            category=nodes[0]["path"], marketplace="Amazon", productType=spec["type"],
            browseNodeId=nodes[0]["id"], templateSha256=catalog["schemaSha256"],
            status="Draft", score=0, updatedAt="2026-09-18T12:00:00.000Z",
            title=spec["name"], description=demo_notice, bullets=bullets,
            keywords=f"sample {spec['type'].lower()}, demo apparel, example catalog",
            rawText=demo_notice, image="", variants=variants, hsn="", origin="India",
            weight=spec["weight"], approved=False,
        ))
    products = [apply_examples(product, catalogs[product["productType"]]) for product in products]
    dataset = dict(
        version=3,
        description="Local form previews populated from each XLSM Data Definitions Example column. Generic examples can describe unrelated products; category, browse node and unique demo SKU are retained. No real product data or Amazon approval is implied.",
        profile=dict(username="sngram", name="Sangram", email="rajesh@example.com", type="Agency", workspace="Sharma Exports", team="Catalog team"),
        brand=dict(name="Anokhi", tone="Warm & authentic", glossary="Anarkali, handcrafted, everyday elegance", bannedTerms="100% guaranteed, best in the world, cure", painPoints="Comfortable ethnic wear for everyday moments and special occasions."),
        products=products,
    )
    OUTPUT.write_text(json.dumps(dataset, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {len(products)} sample product families and {sum(len(p['variants']) for p in products)} variants to {OUTPUT}")


if __name__ == "__main__":
    main()
