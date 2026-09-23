"""Project reviewed merchant facts onto one exact Amazon XLSM template version.

This prepares a candidate flat-file row and actionable gaps. It does not claim
Amazon acceptance: conditional logic, seller eligibility, media and account-level
restrictions must still be checked by Amazon's live validation/processing result.
"""

from __future__ import annotations

import re
from typing import Any


def _get_path(value: dict, path: str) -> Any:
    current: Any = value
    for part in path.split("."):
        if not isinstance(current, dict):
            return None
        current = current.get(part)
    return current


def _cell(value: Any) -> str:
    if value is None:
        return ""
    if isinstance(value, bool):
        return "true" if value else "false"
    return str(value).strip()


def _managed(field: dict) -> bool:
    if field["attribute"] == "bullet_point":
        return bool(re.search(r"#\d+\.value$", field["key"]))
    return field["key"].endswith("#1.value") and field["attribute"] in {
        "contribution_sku", "product_type", "recommended_browse_nodes", "item_name",
        "brand", "product_description", "country_of_origin", "color",
    }


def prepare_row(template: dict, facts: dict, exact_attributes: dict[str, Any] | None = None) -> dict:
    """Return ordered Amazon header/value pairs plus blocking errors and review items.

    `facts` mirrors Product/Variant/Listing/Revision. `exact_attributes` contains
    category-only answers keyed by the XLSM row-5 header, not a guessed column name.
    Category answers cannot override mapped core facts. They are retained separately
    in MarketplacePayload.rawAttributes when a revision is saved.
    """
    exact_attributes = exact_attributes or {}
    fields = template["fields"]
    keys = {field["key"] for field in fields}
    unknown = sorted(set(exact_attributes) - keys)
    if unknown:
        raise ValueError(f"Unknown headers for {template['productType']}: {unknown}")
    if any(_managed(field) and field["key"] in exact_attributes for field in fields):
        raise ValueError("Category attributes cannot override mapped core product facts")
    selected_type = _get_path(facts, "listing.productType")
    if selected_type and selected_type != template["productType"]:
        raise ValueError(f"Listing product type {selected_type} does not match template {template['productType']}")
    row = {}
    errors = []
    review = []
    for field in fields:
        key = field["key"]
        value = exact_attributes.get(key)
        if field["attribute"] == "brand" and _managed(field):
            value = _get_path(facts, "product.brandName")
        if value is None and field["attribute"] == "product_type":
            value = template["productType"]
        if value is None and field.get("canonicalPath"):
            value = _get_path(facts, field["canonicalPath"])
            if isinstance(value, list):
                match = re.search(r"#(\d+)", key)
                index = int(match.group(1)) - 1 if match else 0
                value = value[index] if index < len(value) else None
            elif re.search(r"#([2-9]|\d{2,})", key):
                # A single shared fact fills only the first repeated column.
                value = None
        if value and field["attribute"] == "recommended_browse_nodes":
            node = next((item for item in template["browseNodes"] if item["id"] == str(value)), None)
            if node:
                value = f"{node['path']} ({node['id']})"
        cell = _cell(value)
        row[key] = cell
        allowed = field.get("allowedValues")
        suggested = key in template.get("sourceMetadata", {}).get("suggestedChoiceKeys", [])
        if cell and allowed and not suggested and cell not in allowed:
            errors.append({"key": key, "label": field["label"], "reason": "value_not_in_template_choices", "value": cell})
        if not cell and field["requirement"] == "CONDITIONAL":
            review.append({"key": key, "label": field["label"], "reason": "conditional_requirement_not_evaluated"})
    definitions = {}
    for field in fields:
        definitions.setdefault(field.get("pattern") or re.sub(r"#\d+", "#*", field["key"]), []).append(field)
    for cells in definitions.values():
        first = cells[0]
        if first["requirement"] == "REQUIRED" and not any(row[f["key"]] for f in cells):
            errors.append({"key": first["key"], "label": first["label"], "reason": "required_value_missing"})
    by_key = {field["key"]: field for field in fields}
    def issue(field, reason):
        errors.append({"key": field["key"], "label": field["label"], "reason": reason})
    for field in fields:
        key, value = field["key"], row[field["key"]]
        if field["attribute"] == "rise" and re.search(r"\.height#\d+\.value$", key) and value and not re.fullmatch(r"\d+(?:\.\d+)?", value):
            issue(field, "single_nonnegative_number_required")
        if field["attribute"] == "external_product_information" and key.endswith(".value"):
            entity = by_key.get(key.removesuffix(".value") + ".entity")
            if entity:
                entity_value = row[entity["key"]]
                if value and not entity_value:
                    issue(entity, "external_information_entity_required")
                if entity_value and not value:
                    issue(field, "external_information_value_required")
                if value and template["marketplaceId"] == "A21TJRUUN4KGV" and entity_value in {"HSN Code", "HSN"} and not re.fullmatch(r"\d{6,8}", value):
                    issue(field, "single_hsn_code_required")
        if field["attribute"] == "regulatory_compliance_certification" and key.endswith(".value"):
            regulation = by_key.get(key.removesuffix(".value") + ".regulation_type")
            if regulation:
                if value and not row[regulation["key"]]:
                    issue(regulation, "regulation_type_required_for_id")
                if row[regulation["key"]] and not value:
                    issue(field, "regulatory_id_required_for_type")
    return {"row": row, "errors": errors, "review": review, "templateVersion": template["schemaSha256"]}
