# Amazon listing — kurta aur bottle ke fields kaise milenge?

<!-- Purpose: simple founder/developer guide. Examples are illustrative, not live category schemas. -->

Official docs checked: **13 September 2026**. No live seller API calls were made.

## Aap sahi soch rahe ho

**Kurta select → relevant kurta fields. Bottle select → relevant bottle fields.** Amazon ka **Product Type Definitions (PTD) API** product-type requirements ka JSON Schema deta hai. [Amazon overview](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/manage-product-listings-guide)

Lekin **requirements aur actual product values alag hain**:

| Question                                                | Answer kahan se aayega?                    |
| ------------------------------------------------------- | ------------------------------------------ |
| Fabric field required hai? Kaunse options allowed hain? | Amazon schema                              |
| Mere kurte ka fabric cotton hai ya polyester?           | Seller/supplier information                |
| Bottle ki capacity aur dimensions kya hain?             | Packaging/specification/actual measurement |

API questions aur constraints deta hai; seller ke facts answers dete hain. AI supplied data extract kare aur copy draft kare—unknown fabric, capacity ya measurements invent na kare.

## API ka flow: 6 steps

### 1. Seller authorize kare

Seller authorization aur app ka **Product Listing** role required hain. Calls backend se hongi; tokens frontend mein nahi. [Prerequisites](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/retrieve-a-product-type-definition)

### 2. Correct product type find karo

```http
GET /definitions/2020-09-01/productTypes
    ?marketplaceIds={INDIA_MARKETPLACE_ID}&keywords=kurta
```

Bottle ke liye `keywords=water%20bottle`. Alternatively `itemName` mein full product title bhejo; `keywords` aur `itemName` saath nahi bhejne. Returned type confirm karo—`KURTA`/`BOTTLE` ko assumed API codes mat banao. [Search API](https://developer-docs.amazon.com/sp-api/reference/searchdefinitionsproducttypes)

### 3. Us type ka schema download karo

```http
GET /definitions/2020-09-01/productTypes/{RETURNED_PRODUCT_TYPE}
    ?marketplaceIds={INDIA_MARKETPLACE_ID}
    &sellerId={AUTHORIZED_SELLER_ID}
    &requirements=LISTING
    &requirementsEnforced=ENFORCED
    &productTypeVersion=LATEST
```

These are conceptual relative URLs; regional host, authentication and placeholders configure karne hain. `LISTING` product + offer requirements deta hai; `sellerId` seller-specific requirements/options include kar sakta hai. [Definition API](https://developer-docs.amazon.com/sp-api/reference/getdefinitionsproducttype)

Response ke `schema.link.resource` se actual schema aur associated meta-schema download karo. Links seven days valid hain; downloaded schema/version cache karo. [Schema retrieval](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/retrieve-a-product-type-definition)

### 4. Schema se dynamic form banao

| Schema information                            | Frontend control                               |
| --------------------------------------------- | ---------------------------------------------- |
| Field type/title/description                  | Suitable input + label/help                    |
| `enum` / `enumNames`, when supplied           | Dropdown: label dikhao, enum value submit karo |
| Required + conditional rules                  | Required markers and relevant follow-up fields |
| Numeric limits, units, nested/repeated values | Number/unit controls and repeatable sections   |

Sirf top-level `required` list enough nahi. Nested rules, `$ref`, `allOf`, `if/then/else` aur Amazon custom keywords validate karne honge. Har string field dropdown nahi hota. [Amazon meta-schema](https://developer-docs.amazon.com/sp-api/docs/product-type-definition-meta-schema)

### 5. Facts fill → AI draft → validate → human review

Seller/supplier data prefill karo, missing facts seller se lo. Schema + brand validation run karo. Amazon-side `putListingsItem` with `mode=VALIDATION_PREVIEW` listing persist kiye bina errors preview kar sakta hai. [Submission API](https://developer-docs.amazon.com/sp-api/reference/putlistingsitem)

### 6. Approved revision submit karo

Individual SKU: `putListingsItem`; partial updates: `patchListingsItem`; bulk: `JSON_LISTINGS_FEED`. `ACCEPTED` means further processing, not immediately live. `getListingsItem`/notifications se issues and actual status track karo. [Workflow guide](https://developer-docs.amazon.com/sp-api/docs/building-listings-management-workflows-guide)

## Kurta vs bottle example

**Illustrative questions only—not verified mandatory lists or exact Amazon field names.**

| Selected product | Possible questions                                | Example verified answers                     |
| ---------------- | ------------------------------------------------- | -------------------------------------------- |
| Kurta            | Fabric, size, colour, sleeve, garment length      | Cotton, M, blue, measured length             |
| Bottle           | Material, capacity, colour, dimensions            | Stainless steel, 750 ml, measured dimensions |
| Both             | SKU, brand, price, stock, origin, package details | Seller's actual facts                        |

Garment length, bottle height aur **shipping-package length separate facts** hain. Photo se exact dimensions/fabric composition assume mat karo.

Category change → load new schema → preserve common facts → clear/remap incompatible answers → revalidate. Bottle form mein sleeve field nahi rehna chahiye.

## Existing Amazon product ho toh?

`searchCatalogItems`/`getCatalogItem` se **exact product** identify karo. Existing ASIN ke offer workflow mein eligibility checks and `PRODUCT` + `LISTING_OFFER_ONLY` schema use hote hain. Similar-looking product sufficient nahi. [Existing-product workflow](https://developer-docs.amazon.com/sp-api/docs/building-listings-management-workflows-guide)

## Hamare app mein implementation

**Recommendation; abhi implemented nahi:**

```text
Select marketplace + product type
→ fetch schema → render form → collect verified facts
→ generate copy → validate → approve → submit → track
```

- Common facts: existing Prisma Product/Variant. Category extras: structured attributes. Exact channel submission: revision-specific MarketplacePayload.
- Add seller-scoped schema cache with marketplace, type/version, locale, requirements and parentage context. Refresh changed definitions; retain raw schema for validation. Parent/child variants need the appropriate schema context.
- Har category ke liye new table/fixed 198 columns nahi. Start with verified kurta + bottle definitions; expand gradually.
- API schema is not an official spreadsheet template: file export needs separate verified mapping.

**Without an account — tested 2026-09-13:** India product-type search (`water bottle`) aur candidate `BOTTLE` definition dono unauthenticated requests ne HTTP 403 return kiya: “Access token is missing in the request header.” Search blocked tha, so `BOTTLE` type bhi confirmed nahi hai. [bottle.json](bottle.json) mein actual responses aur 29 proposed frontend fields saved hain; ye official Amazon requirements nahi hain.

**Clarification:** `sellerId` optional hai for a generic definition, but API authentication still required hai. Authorized calls se exact India product type/schema retrieve karna remaining hai; seller context se seller-specific requirements milte hain. [Official retrieval guide](https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/retrieve-a-product-type-definition)

Related roadmap: `TASK.md` MVP-10, MVP-20, MVP-24, MVP-27.
