"""Reproducible structural review of the actual seller XLSM inputs. Never runs VBA."""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "backend/modules/data_bridge"))
from amazon_template import extract_template

CORE = {
    "contribution_sku": "ProductVariant.sellerSku",
    "product_type": "ProductMarketplaceConfig.templateId -> MarketplaceTemplate.productType",
    "recommended_browse_nodes": "ProductMarketplaceConfig.browseNodeId",
    "item_name": "ListingRevision.title",
    "brand": "Product.brandName",
    "product_description": "ListingRevision.description",
    "bullet_point": "ListingRevision.bulletPoints",
    "country_of_origin": "ProductVariant.countryOfOrigin",
    "color": "ProductVariant.color",
}

def main():
    catalogs = [extract_template(path) for path in sorted((ROOT / "test/amazon-templates/inbox").glob("*.xlsm"))]
    if not catalogs:
        raise SystemExit("No XLSM inputs in test/amazon-templates/inbox")
    fields = {}
    for catalog in catalogs:
        for field in catalog["fields"]:
            key = field["key"]
            destination = CORE.get(field["attribute"])
            if field["attribute"] != "bullet_point" and not key.endswith("#1.value"):
                destination = None
            item = fields.setdefault(key, {"key": key, "pattern": field["pattern"], "label": field["label"],
                "storage": destination or "MarketplacePayload.rawAttributes", "categories": {}})
            item["categories"][catalog["productType"]] = {"column": field["column"], "requirement": field["requirement"], "allowedValueCount": len(field.get("allowedValues", []))}
    report = {
        "scope": "Seller-downloaded Amazon India apparel files only. Common does not mean universal across all Amazon categories.",
        "sourceFiles": [{"file": c["sourceFilename"], "sha256": c["sourceSha256"], "schemaSha256": c["schemaSha256"], "productType": c["productType"], "fieldCount": c["fieldCount"], "requirementCounts": c["requirementCounts"], "definitionCount": c["definitionCount"], "definitionRequirementCounts": c["definitionRequirementCounts"]} for c in catalogs],
        "sharedRequiredExactColumns": [key for key, f in fields.items() if len(f["categories"]) == len(catalogs) and all(c["requirement"] == "REQUIRED" for c in f["categories"].values())],
        "decisions": [
            "Requiredness belongs to the selected template, not SQL NOT NULL for every draft field.",
            "Fabric type is required in all four apparel files but remains category-specific JSONB.",
            "Amazon Product Id Type includes ASIN and GTIN Exempt. It is a channel answer, not a universal GTIN column.",
            "Preserve exact repeated keys. A typed scalar supplies only the first occurrence.",
            "Country of origin, price, HSN, weight and stock belong to each sellable SKU.",
            "Conditional descriptions are preserved; they are not executable dependency rules.",
        ],
        "fields": list(fields.values()),
    }
    output = ROOT / "test/amazon-templates/field-review.json"
    output.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    for c in catalogs:
        print(f"{c['productType']}: {c['definitionCount']} definitions, {c['fieldCount']} export columns, {c['definitionRequirementCounts']}")
    print(f"{len(report['sharedRequiredExactColumns'])} required exact columns shared; {len(fields)} distinct exact columns reviewed. Report: {output}")

if __name__ == "__main__":
    main()
