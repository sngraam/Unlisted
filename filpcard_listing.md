# Flipkart listing — category fields aur listing API

<!-- Purpose: short companion to amazon_listing.md. Filename follows the user's request. -->

Official docs checked: **13 September 2026**. No live seller API calls were made.

## Category ke hisaab se form change hona chahiye

Kurta ke fabric/size/sleeve aur bottle ke material/capacity/dimensions different facts hain. Flipkart product ko sub-category ke predefined attributes se define karta hai. Product ID **FSN** hai; seller listing ka separate listing ID/SKU relationship hota hai. [Official concepts](https://seller.flipkart.com/api-docs/FMPlatOverview.html)

These fields are examples, not verified mandatory lists. Actual values seller/supplier se aayengi; AI measurements ya material invent nahi karega.

## Public listing API kya karti hai?

```http
POST /listings/v3
```

Is create request mein **`product_id` mandatory** hai. Seller SKU ke against price, tax, fulfillment, locations/inventory and packaging bhejte hain. Isko “fabric + title bhejo aur new FSN mil jayega” API assume mat karo. [Create listing](https://seller.flipkart.com/api-docs/listing-api-docs/v3/CreateListingsAPI.html)

```text
Correct existing product / FSN
→ seller SKU + price + stock + logistics
→ create/update listing
→ inspect each SKU's result and actual state
```

HTTP success ke andar individual SKU failures ho sakte hain. Existing SKU par create call listing overwrite kar sakti hai. Package length shipping-box length hai, garment length nahi. [Request/response details](https://seller.flipkart.com/api-docs/listing-api-docs/v3/CreateListingsAPI.html)

## Required fabric/capacity fields kahan se milenge?

**Finding:** reviewed public Marketplace Seller docs mein Amazon PTD jaisa “vertical select → complete required-attribute schema” endpoint verify nahi hua. Yeh **unverified** hai; “koi partner API exist nahi karti” wala conclusion nahi. Listing search mein `vertical` milna complete category schema milne ke equivalent nahi. [API index](https://seller.flipkart.com/api-docs/index.html), [Search response](https://seller.flipkart.com/api-docs/listing-api-docs/v3/GetProductListAPI.html)

**Our recommended approach:**

1. Authorized Seller Hub mein target category ka current form and available official upload template inspect karo. Mandatory fields, allowed values, units and instructions ko versioned local definition mein capture karo. Exact account screens/template availability still need verification.
2. Flipkart integration/support se confirm karo: **“Does our app have catalog-creation and vertical-attribute metadata API access? Please provide endpoints, permissions and schemas.”**
3. Enabled metadata API ho toh definitions fetch karo. Otherwise verified template definition se our dynamic form banao and label catalog creation/upload as a manual step.
4. Correct FSN available hone par documented listing-management flow connect karo. New-product direct creation tabhi promise karo jab capability verified ho.

Flipkart Commerce Cloud ki catalog APIs ko automatically Marketplace Seller API access mat samjho; it has its own product documentation. [Commerce Cloud docs](https://docs.flipkartcommercecloud.com/)

## Hamare app ka flow

```text
Select Flipkart + category
→ verified template definition / enabled metadata API
→ relevant form fields → verified facts → AI copy
→ validate + human review
→ supported catalog creation/upload, if needed
→ FSN-linked seller listing API → per-SKU result
```

Same reusable form engine as Amazon, but **separate Flipkart mapping and requirements source**. Common facts existing Product/Variant models mein; category extras structured attributes mein; channel submission MarketplacePayload mein. Definition version aur approval revision retain karo.

**Decision:** Amazon dynamic requirements ke liye documented PTD use karo. Flipkart ke liye first verified category template or partner metadata contract obtain karo. Amazon fields reuse karke compliance assume mat karo, aur undocumented endpoints invent mat karo.

Read [amazon_listing.md](amazon_listing.md) for the fuller example. Related roadmap: `TASK.md` MVP-10, MVP-24, MVP-26, MVP-28. Integration is still pending.
