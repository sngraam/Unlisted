"""Fetch a verified Amazon India bottle product type schema into bottle.json.

Read LWA credentials from environment variables or the ignored backend/.env file.
This script calls the production Product Type Definitions API because its hosted
sandbox returns static LUGGAGE mocks rather than India bottle requirements.
"""

import argparse
import json
import os
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, quote
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
MARKETPLACE_ID = "A21TJRUUN4KGV"
BASE = "https://sellingpartnerapi-eu.amazon.com"


def load_ignored_env():
    """Load local credentials without ever printing or committing their values."""
    env_file = ROOT / "backend" / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        if key.startswith("AMAZON_LWA_"):
            os.environ.setdefault(key, value.strip().strip('"').strip("'"))


def request_json(url, *, data=None, access_token=None):
    headers = {"Accept": "application/json", "User-Agent": "UnlistedBottleSchema/1.0"}
    if data is not None:
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    if access_token:
        headers["x-amz-access-token"] = access_token
    with urlopen(Request(url, data=data, headers=headers), timeout=30) as response:
        return json.load(response)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--product-type", help="Select an exact product type from the search results")
    parser.add_argument("--seller-id", help="Optional authorized seller ID for seller-specific schema")
    parser.add_argument("--query", default="water bottle", help="Product type search keywords")
    args = parser.parse_args()

    load_ignored_env()
    names = ("AMAZON_LWA_CLIENT_ID", "AMAZON_LWA_CLIENT_SECRET", "AMAZON_LWA_REFRESH_TOKEN")
    missing = [name for name in names if not os.environ.get(name)]
    if missing:
        print("Missing credentials in environment or backend/.env: " + ", ".join(missing), file=sys.stderr)
        return 2

    token_body = urlencode({
        "grant_type": "refresh_token",
        "refresh_token": os.environ["AMAZON_LWA_REFRESH_TOKEN"],
        "client_id": os.environ["AMAZON_LWA_CLIENT_ID"],
        "client_secret": os.environ["AMAZON_LWA_CLIENT_SECRET"],
    }).encode("utf-8")

    try:
        token = request_json("https://api.amazon.com/auth/o2/token", data=token_body)["access_token"]
        search_url = BASE + "/definitions/2020-09-01/productTypes?" + urlencode({
            "marketplaceIds": MARKETPLACE_ID,
            "keywords": args.query,
        })
        search = request_json(search_url, access_token=token)
        types = search.get("productTypes", [])
        matches = {item["name"]: item for item in types if isinstance(item, dict) and item.get("name")}

        if not args.product_type:
            print("Amazon returned these product types for India:")
            for name, item in matches.items():
                print("  " + name + " — " + str(item.get("displayName", "")))
            print("Review them, then rerun with --product-type EXACT_NAME. No schema was overwritten.")
            return 3
        if args.product_type not in matches:
            print("Selected product type was not found in the search results; bottle.json unchanged.", file=sys.stderr)
            return 4

        params = {
            "marketplaceIds": MARKETPLACE_ID,
            "requirements": "LISTING",
            "requirementsEnforced": "ENFORCED",
            "productTypeVersion": "LATEST",
            "parentageLevel": "NONE",
        }
        if args.seller_id:
            params["sellerId"] = args.seller_id
        definition_url = BASE + "/definitions/2020-09-01/productTypes/" + quote(args.product_type, safe="") + "?" + urlencode(params)
        definition = request_json(definition_url, access_token=token)
        schema_url = definition.get("schema", {}).get("link", {}).get("resource")
        if not schema_url or not schema_url.startswith("https://"):
            raise ValueError("Amazon did not provide an HTTPS schema resource link")
        schema = request_json(schema_url)

        properties = schema.get("properties", {})
        result = {
            "marketplace": "amazon.in",
            "marketplaceId": MARKETPLACE_ID,
            "query": args.query,
            "status": "verified_production_definition",
            "verifiedProductType": definition.get("productType", args.product_type),
            "displayName": definition.get("displayName", matches[args.product_type].get("displayName")),
            "productTypeVersion": definition.get("productTypeVersion"),
            "requirements": "LISTING",
            "requirementsEnforced": "ENFORCED",
            "parentageLevel": "NONE",
            "sellerSpecific": bool(args.seller_id),
            "officialAttributes": [
                {"name": key, "title": value.get("title"), "description": value.get("description"),
                 "requiredAtRoot": key in schema.get("required", [])}
                for key, value in properties.items() if isinstance(value, dict)
            ],
            "officialAttributesNote": "This is a navigation summary. Use officialSchema for nested and conditional requirements, valid values, units, and validation.",
            "officialSchema": schema,
            "sources": [
                "https://developer-docs.amazon.com/sp-api/reference/searchdefinitionsproducttypes",
                "https://developer-docs.amazon.com/sp-api/reference/getdefinitionsproducttype",
            ],
        }
        destination = ROOT / "bottle.json"
        temporary = destination.with_suffix(".json.tmp")
        temporary.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        temporary.replace(destination)
        print(f"Saved {len(result['officialAttributes'])} top-level attributes and the complete schema to {destination}")
        return 0
    except HTTPError as error:
        print(f"Amazon request failed with HTTP {error.code}; bottle.json unchanged.", file=sys.stderr)
        return 1
    except (URLError, KeyError, ValueError, json.JSONDecodeError) as error:
        print(f"Could not retrieve a verified schema ({type(error).__name__}); bottle.json unchanged.", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
