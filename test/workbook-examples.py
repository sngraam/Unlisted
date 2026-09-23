"""Example-column data for explicit local demos, never automatic seller defaults."""
from collections import defaultdict
import re

CORE = {"contribution_sku", "product_type", "recommended_browse_nodes", "item_name", "brand", "product_description", "country_of_origin", "color"}


def apply_examples(product, catalog):
    metadata = catalog["sourceMetadata"]
    definitions = {d["pattern"]: d for d in metadata["definitions"]}
    groups = defaultdict(list)
    for field in catalog["fields"]:
        groups[field["pattern"]].append(field)
    suggested = set(metadata["suggestedChoiceKeys"])
    answers, skipped = {}, []
    for pattern, cells in groups.items():
        field = cells[0]
        if field["attribute"] == "bullet_point" or any(f["attribute"] in CORE and f["key"].endswith("#1.value") for f in cells):
            continue
        example = definitions[pattern]["example"]
        allowed = field.get("allowedValues", [])
        # Only split a comma list when each token is actually a workbook choice.
        tokens = [s.strip() for s in example.split(",")]
        matches = [next((a for a in allowed if a.casefold() == s.casefold()), None) for s in tokens]
        if len(cells) > 1 and allowed and all(matches):
            values = matches[:len(cells)]
        elif not allowed or field["key"] in suggested or example in allowed:
            values = [example]
        else:
            match = next((a for a in allowed if a.casefold() == example.casefold()), None)
            match = match or next((m for m in matches if m), None)
            values = [match] if match else []
        # These Example cells contain alternatives, not one legal scalar value.
        if field["attribute"] == "rise" and re.search(r"\.height#\d+\.value$", field["key"]):
            values = [next((s for s in tokens if re.fullmatch(r"\d+(?:\.\d+)?", s)), "")]
        if field["attribute"] == "external_product_information" and field["key"].endswith(".value") and catalog["marketplaceId"] == "A21TJRUUN4KGV":
            values = [next((s for s in tokens if re.fullmatch(r"\d{6,8}", s)), "")]
        if not values:
            skipped.append({"label": field["label"], "pattern": pattern, "example": example, "reason": "Example is not an allowed value for this category"})
        for cell, value in zip(cells, values):
            if value:
                answers[cell["key"]] = value

    # An incompatible regulation-type example must not leave an orphan sample ID
    # that makes the missing type conditionally mandatory during submission.
    for field in catalog["fields"]:
        if field["attribute"] == "regulatory_compliance_certification" and field["key"].endswith(".value"):
            type_key = field["key"].removesuffix(".value") + ".regulation_type"
            if answers.get(field["key"]) and not answers.get(type_key):
                answers.pop(field["key"])
                skipped.append({"label": field["label"], "pattern": field["pattern"], "example": definitions[field["pattern"]]["example"], "reason": "No compatible regulation-type example; leave the optional type and ID pair blank"})

    def example(attribute, suffix="#1.value"):
        field = next((f for f in catalog["fields"] if f["attribute"] == attribute and f["key"].endswith(suffix)), None)
        return definitions[field["pattern"]]["example"] if field else ""

    product.update(
        name=f"{catalog['productType']} Sample · Workbook Examples",
        title=example("item_name"), brand=example("brand"), description=example("product_description"),
        bullets=[example("bullet_point")] * len([f for f in catalog["fields"] if f["attribute"] == "bullet_point"]),
        origin=example("country_of_origin"), keywords=example("generic_keyword"),
        rawText="Workbook examples for form preview only. These generic examples can describe unrelated products. The selected category, browse node and unique demo SKU are retained. No real seller facts or marketplace readiness are implied.",
        approved=False, status="Draft", score=0,
        workbookExample={"sourceFilename": catalog["sourceFilename"], "sourceSha256": catalog["sourceSha256"], "definitionCount": len(definitions), "skipped": skipped},
    )
    for variant in product["variants"]:
        variant.update(color=example("color"), countryOfOrigin=product["origin"], channelAttributes=dict(answers),
                       mrp=float(example("purchasable_offer", ".maximum_retail_price#1.schedule#1.value_with_tax")),
                       price=float(example("purchasable_offer", ".our_price#1.schedule#1.value_with_tax")),
                       stock=int(example("fulfillment_availability", "#1.quantity")))
    return product
