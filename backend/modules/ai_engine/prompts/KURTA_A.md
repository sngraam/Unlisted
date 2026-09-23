# Product Attribute — KURTA (Amazon India)

> Scope: Only attributes present in the KURTA Template tab are listed below.  
> Country of Origin is fixed to `India` for this category.  
> Valid values are sourced directly from the Valid Values sheet of the KURTA template.

---

## Listing Identity

1. SKU [Required]: The SKU number as assigned by the contributor.
   - Example: `ABC123`
   - Amazon field: `contribution_sku#1.value`

2. Product Type [Required]: Select the appropriate product type.
   - Valid values: `KURTA`
   - Amazon field: `product_type#1.value`

3. Listing Action [Optional]: Specify the operation type to be performed.
   - Valid values: `Create or Replace (Full Update)`, `Edit (Partial Update)`, `Delete`
   - Amazon field: `::record_action`

---

## Variations

4. Parentage Level [Optional]: Specify whether a SKU is a parent or child.
   - Valid values: `Parent`, `Child`
   - Amazon field: `parentage_level[marketplace_id=A21TJRUUN4KGV]#1.value`

5. Parent SKU [Conditionally Required]: The SKU of the parent item.
   - Example: `ABC123`
   - Amazon field: `child_parent_sku_relationship[marketplace_id=A21TJRUUN4KGV]#1.parent_sku`

6. Variation Theme Name [Conditionally Required]: The variation theme the product will use. All theme attributes must be populated for all items in the grouping.
   - Valid values: `COLOR`, `COLOR/NUMBER_OF_ITEMS`, `SIZE`, `SIZE/COLOR`, `SIZE/COLOR/NUMBER_OF_ITEMS`, `SIZE/NUMBER_OF_ITEMS`, `SPECIAL_SIZE_TYPE/SIZE/COLOR`
   - Amazon field: `variation_theme#1.name`

---

## Product Identity

7. Item Name [Required]: Name of the item including brand, color, fit and size if available.
   - Example: `Brand Men's Floral Kurta, Blue, XL`
   - Amazon field: `item_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

8. Item Highlight [Optional]: Product feature or benefit phrase (appears only when item name is under 75 characters). Do not repeat item name content.
   - Example: `Breathable cotton fabric`
   - Amazon field: `title_differentiation[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

9. Brand Name [Required]: The brand name of the product.
   - Example: `Fabindia`
   - Amazon field: `brand[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

10. Product Id Type [Required]: Type of external ID (barcode) or ASIN used to identify this product.
    - Valid values: `EAN`, `GTIN`, `UPC`, `ASIN`, `GTIN Exempt`
    - Amazon field: `amzn1.volt.ca.product_id_type`

11. Product Id [Conditionally Required]: The product ID value corresponding to the type selected above.
    - Example: `8901234567890`
    - Amazon field: `amzn1.volt.ca.product_id_value`

12. Recommended Browse Nodes [Optional] ×5: Browse node where the product will be assigned. Supports up to 5 values.
    - Valid values:
      - `Clothing & Accessories > Men > Ethnic Wear > Kurtas (1968250031)`
      - `Clothing & Accessories > Women > Ethnic Wear > Kurtas & Kurtis (1968255031)`
      - `Clothing & Accessories > Girls > Ethnic Wear > Kurtas & Kurtis (3723385031)`
      - `Clothing & Accessories > Boys > Ethnic Wear > Kurtas (3723392031)`
      - `Baby > Baby Clothing > Baby Boys > Ethnic Wear > Kurtas (16085633031)`
      - `Baby > Baby Clothing > Baby Girls > Ethnic Wear > Kurtas & Kurtis (16085641031)`
      - `Baby > Maternity > Clothing > Ethnic Wear > Maternity Kurtas & Kurtis (3723374031)`
    - Amazon fields: `recommended_browse_nodes[marketplace_id=A21TJRUUN4KGV]#1.value` … `#5.value`

13. Collar Style [Recommended] ×2: The style of collar used by the item. Supports up to 2 values.
    - Valid values: `Band Collar`, `Camp Collar`, `Collarless`, `Cutaway Collar`, `Flat Collar`, `Lapel Collar`, `Mandarin Collar`, `Notch Collar`, `Peter Pan Collar`, `Point Collar`, `Ruffle Collar`, `Sailor Collar`, `Shawl Collar`, `Spread Collar`, `Stand Collar`, `Turn Down Collar`, `Wing Collar`
    - Amazon fields: `collar_style[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`, `#2.value`

14. Model Name [Conditionally Required]: Model name as defined by the manufacturer, excluding item type, color, brand or size.
    - Example: `Angrakha Straight Kurta`
    - Amazon field: `model_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

15. Manufacturer [Conditionally Required]: The company that manufactures the product.
    - Example: `Fabindia Overseas Pvt Ltd`
    - Amazon field: `manufacturer[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

---

## Images

16. Main Image URL [Required]: URL for the product's main image (first image customers see on detail page).
    - Example: `https://www.yourbrand.com/images/kurta-main.jpg`
    - Amazon field: `main_product_image_locator[marketplace_id=A21TJRUUN4KGV]#1.media_location`

17. Other Image URL [Optional] ×8: URLs for additional product images (up to 8).
    - Example: `https://www.yourbrand.com/images/kurta-side.jpg`
    - Amazon fields: `other_product_image_locator_1[marketplace_id=A21TJRUUN4KGV]#1.media_location` … `other_product_image_locator_8`

18. Swatch Image URL [Optional]: URL for a color swatch image of the product.
    - Example: `https://www.yourbrand.com/images/kurta-swatch.jpg`
    - Amazon field: `swatch_product_image_locator[marketplace_id=A21TJRUUN4KGV]#1.media_location`

---

## Product Details

19. Product Description [Required]: Paragraph-form description on the detail page. Include unique features, product line details and specifications. Do not use all caps.
    - Example: `This classic cotton kurta features intricate Chikankari embroidery and a mandarin collar, perfect for festive occasions.`
    - Amazon field: `product_description[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

20. Bullet Point [Required] ×5: Brief feature callout displayed near the product photo. Do NOT use all caps, abbreviations, or include fabric content/care/country here. Up to 5 bullet points.
    - Example: `100% pure cotton for all-day comfort`
    - Amazon fields: `bullet_point[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

21. Generic Keywords [Optional]: Search terms relevant to this product. No repetition, no competitor brand names or ASINs.
    - Example: `ethnic wear; kurta; traditional; festive; Indian`
    - Amazon field: `generic_keyword[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

22. Lifestyle [Recommended]: The lifestyle category best describing the kurta's intended use.
    - Valid values: `Business Casual`, `Business Professional`, `Casual`, `Comfort`, `Dress`, `Evening`, `Formal`, `Themed`, `Work Utility`
    - Amazon field: `lifestyle[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

23. Style [Conditionally Required]: The design aesthetic or fashion category of the garment.
    - Valid values: `A-Line`, `Anarkali`, `Angrakha`, `Asymmetric`, `Empire`, `Layered and Tiered`, `Pathani`, `Pleated`, `Regular`, `Ruffled`
    - Amazon field: `style[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

24. Department Name [Conditionally Required]: Department category the item belongs to.
    - Valid values: `Baby Boys`, `Baby Girls`, `Boys`, `Girls`, `Mens`, `Unisex`, `Unisex Baby`, `Unisex Kids`, `Womens`
    - Amazon field: `department[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

25. Target Gender [Conditionally Required]: Target gender for the product.
    - Valid values: `Female`, `Male`, `Unisex`
    - Amazon field: `target_gender[marketplace_id=A21TJRUUN4KGV]#1.value`

26. Age Range Description [Conditionally Required]: Intended age group for the kurta.
    - Valid values: `Adult`, `Baby`, `Kid`
    - Amazon field: `age_range_description[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

27. Apparel Size System [Conditionally Required]: Sizing standard used for the kurta.
    - Valid values: `IN`
    - Amazon field: `apparel_size[marketplace_id=A21TJRUUN4KGV]#1.size_system`

28. Apparel Size Class [Conditionally Required]: The sizing representation system (alphabetical, numerical, or age-based).
    - Valid values: `Age`, `Alpha`, `Numeric`, `Numeric Height`, `Alpha JASPO`, `Numeric GO`
    - Amazon field: `apparel_size[marketplace_id=A21TJRUUN4KGV]#1.size_class`

29. Apparel Size Value [Conditionally Required]: The size value associated with the size system and class.
    - Example: `S`, `M`, `L`, `XL`, `2XL`, `38`, `40`, `Free Size`
    - Amazon field: `apparel_size[marketplace_id=A21TJRUUN4KGV]#1.size`

30. Apparel Size To Value [Conditionally Required]: Upper end of size range (if range applies); must be greater than the size value.
    - Example: `XL`, `42`
    - Amazon field: `apparel_size[marketplace_id=A21TJRUUN4KGV]#1.size_to`

31. Apparel Size Body Type [Conditionally Required]: Body type for the apparel. Use `Regular` if no special body type applies.
    - Valid values: `A`, `AB`, `B`, `BB`, `BE`, `Big`, `C`, `CB`, `E`, `EE`, `F`, `H`, `Husky`, `J`, `JJ`, `JY`, `K`, `KB`, `L`, `LL`, `M`, `Petite`, `Plus`, `Regular`, `S`, `Slim`, `Y`, `YA`
    - Amazon field: `apparel_size[marketplace_id=A21TJRUUN4KGV]#1.body_type`

32. Shirt Size System [Conditionally Required]: Size system for shirt sizing.
    - Valid values: `IN`
    - Amazon field: `shirt_size[marketplace_id=A21TJRUUN4KGV]#1.size_system`

33. Shirt Size Class [Conditionally Required]: Standardized sizing system used (alpha, numeric, etc.).
    - Valid values: `Age`, `Alpha`, `Numeric`, `Numeric Height`, `Alpha JASPO`, `Numeric GO`, `Neck`, `Neck Sleeve`
    - Amazon field: `shirt_size[marketplace_id=A21TJRUUN4KGV]#1.size_class`

34. Shirt Size Value [Conditionally Required]: Size value associated with the shirt size system and class.
    - Example: `S`, `M`, `L`, `38`, `40`
    - Amazon field: `shirt_size[marketplace_id=A21TJRUUN4KGV]#1.size`

35. Shirt Size To Range [Conditionally Required]: Maximum size in a shirt size range (e.g., if S-L, enter `L`).
    - Example: `L`, `42`
    - Amazon field: `shirt_size[marketplace_id=A21TJRUUN4KGV]#1.size_to`

36. Shirt Body Type [Conditionally Required]: Body type for the shirt. Use `Regular` if no special type applies.
    - Valid values: `A`, `AB`, `B`, `BB`, `BE`, `Big`, `E`, `Husky`, `J`, `JY`, `Plus`, `Regular`, `Slim`, `Y`, `YA`
    - Amazon field: `shirt_size[marketplace_id=A21TJRUUN4KGV]#1.body_type`

37. Material [Conditionally Required] ×3: Primary materials used to manufacture the item. Up to 3 values.
    - Valid values: `Acrylic`, `Art Silk`, `Art Silk Blend`, `Chanderi`, `Chiffon`, `Cotton`, `Cotton Blend`, `Crepe`, `Dupion Silk`, `Georgette`, `Jute Cotton`, `Jute Silk`, `Khadi`, `Linen`, `Linen Blend`, `Net`, `Nylon`, `Organza`, `Polycotton`, `Polyester`, `Polyester Blend`, `Polysilk`, `Raw Silk`, `Rayon`, `Rayon Blend`, `Satin`, `Silk`, `Silk Blend`, `Spandex`, `Synthetic`, `Tissue`, `Tussar Silk`, `Velvet`, `Voile`, `Wool`
    - Amazon fields: `material[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#3.value`

38. Fabric Type [Required]: Fiber composition of the garment textile.
    - Example: `75% Cotton, 25% Polyester`
    - Amazon field: `fabric_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

39. Number of Items [Conditionally Required]: Total products included (1 single kurta = 1; 1 set of 3 = 3).
    - Example: `1`
    - Amazon field: `number_of_items[marketplace_id=A21TJRUUN4KGV]#1.value`

40. Item Type Name [Conditionally Required]: Specific category/classification describing what kind of item this is.
    - Valid values: `Blouse`, `Button Down Shirt`, `Cami Shirt`, `Dress Shirt`, `Fashion Vest`, `Henley Shirt`, `Nursing Tunic`, `Polo Shirt`, `Shirt`, `T-Shirt`, `Tunic Shirt`, `Vest`, `Yoga Shirt` *(and others — see full list in template)*
    - Amazon field: `item_type_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

41. Special Size [Conditionally Required]: Non-standard sizing category for specific body types or age groups.
    - Valid values: `Baby`, `Baby Boys`, `Baby Girls`, `Big`, `Big & Tall`, `Big Boys`, `Big Girls`, `Husky Boys`, `Little Boys`, `Little Girls`, `Petite`, `Petite Plus Size`, `Plus Girls`, `Plus Size`, `Slim Boys`, `Slim Girls`, `Standard`, `Tall`, `Tall Plus Size`, `Toddler Boys`, `Toddler Girls`
    - Amazon field: `special_size_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

42. Color Map [Conditionally Required]: Most dominant standardized color of the kurta.
    - Valid values: `Beige`, `Black`, `Blue`, `Bronze`, `Brown`, `Clear`, `Gold`, `Green`, `Grey`, `Metallic`, `Multicolor`, `Off White`, `Orange`, `Pink`, `Purple`, `Red`, `Silver`, `Turquoise`, `White`, `Yellow`
    - Amazon field: `color[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.standardized_values#1`

43. Color [Conditionally Required]: The actual product color as described by the seller.
    - Example: `Indigo Blue`, `Mustard Yellow`, `Off White`
    - Amazon field: `color[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

44. Item Length Description [Recommended]: Textual description of the garment's length.
    - Valid values: `Waist Length`, `Hip Length`, `Mid Thigh Length`, `Thigh Length`, `Knee Length`, `Calf Length`, `Ankle Length`, `Floor Length`
    - Amazon field: `item_length_description[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

45. Occasion [Recommended] ×5: Events or celebrations the garment is designed for. Up to 5 values.
    - Valid values: `Anniversary`, `Bachelor Party`, `Bachelorette Party`, `Bihu`, `Birthday`, `Christmas`, `Diwali`, `Dussehra`, `Engagement`, `Father's Day`, `Funeral`, `Graduation`, `Gurubar`, `Haldi`, `Halloween`, `Holi`, `Honeymoon`, `Independence Day`, `Karwa Chauth`, `Manabasa Gurubara`, `Mother's Day`, `Navaratri`, `New Baby`, `New Year`, `Onam`, `Pongal`, `Prom Homecoming`, `Valentine's Day`, `Vasant Panchami`, `Wedding`
    - Amazon fields: `occasion_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

46. Part Number [Conditionally Required]: Part number as defined by the manufacturer (often same as model number).
    - Example: `FK-KRT-BL-XL`
    - Amazon field: `part_number[marketplace_id=A21TJRUUN4KGV]#1.value`

47. Theme [Optional]: High-level concept or motif that the item's design evokes.
    - Valid values: `Alphabet`, `Animal`, `Cartoon`, `Festive`, `Floral`, `Marble`, `Religious`, `Tie Dye`
    - Amazon field: `theme[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

48. Fit Type [Conditionally Required]: How loosely or tightly the kurta sits on the body.
    - Valid values: `Athletic`, `Boxy`, `Fitted`, `Flowy`, `Loose`, `Oversized`, `Regular`, `Relaxed`, `Skinny`, `Slim`, `Snug`, `Straight`, `Tailored`
    - Amazon field: `fit_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

49. Care Instructions [Conditionally Required]: How to care for the item.
    - Valid values: `Dry Clean Only`, `Hand Wash Only`, `Machine Wash`
    - Amazon field: `care_instructions[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

50. Manufacturer Contact Information [Conditionally Required]: Full contact details (name, address, pincode, phone, email) for the product's manufacturer.
    - Example: `Fabrics India Pvt Ltd, Plot 12, MIDC, Pune - 411018, Contact: +91-20-12345678, info@fabricsindia.com`
    - Amazon field: `rtip_manufacturer_contact_information#1.value`

51. Embroidery Type [Recommended]: Decorative stitching technique applied to the kurta.
    - Valid values: `Aari`, `Applique`, `Banjara`, `bead_work`, `Chamba Rumal`, `Chikankari`, `Dabka`, `Gota Patti`, `Kantha`, `Kashida`, `Kasuti`, `Phulkari`, `Resham`, `schiffli`, `Stone Work`, `Zardozi`, `Zari`
    - Amazon field: `embroidery_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

52. Design Name [Recommended]: Identifying name of the visual composition on the kurta.
    - Valid values: `Embellished`, `Embroidered`, `Printed`, `Solid`, `Woven`
    - Amazon field: `design_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

53. Pattern [Recommended]: Most prominent repeated decorative design of the item.
    - Valid values: `Animal Print`, `Argyle`, `Camouflage`, `Checkered`, `Chevron`, `Floral`, `Fruit`, `Geometric`, `Herringbone`, `Houndstooth`, `Moire`, `Paisley`, `Plaid`, `Polka Dot`, `Solid`, `Striped`, `Toile`
    - Amazon field: `pattern[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

54. Unit Count [Recommended]: Net quantity shipped per ASIN order (e.g., a set of 2 kurtas = 2).
    - Example: `1`
    - Amazon field: `unit_count[marketplace_id=A21TJRUUN4KGV]#1.value`

55. Unit Count Type [Recommended]: Unit of measure for the unit count.
    - Valid values: `count`
    - Amazon field: `unit_count[marketplace_id=A21TJRUUN4KGV]#1.type[language_tag=en_IN].value`

56. Product Site Launch Date [Optional]: Date product should first appear on Amazon (YYYY-MM-DD). Does not affect buyability.
    - Example: `2024-10-02`
    - Amazon field: `product_site_launch_date[marketplace_id=A21TJRUUN4KGV]#1.value`

57. Included Components [Recommended] ×5: Items included with the product. Up to 5 values.
    - Valid values: `Coat`, `Dupatta`, `Jacket`, `Koti`, `Shrug`, `Sweater`, `T-shirt`
    - Amazon fields: `included_components[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

58. League Name [Optional]: League name associated with this product (sports/licensed merchandise).
    - Example: `Indian Premier League`
    - Amazon field: `league_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

59. Team Name [Optional]: Sports team represented on the item.
    - Valid values: `Tennis` *(and specific team names — see full list in template)*
    - Amazon field: `team_name[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

60. Back Style [Recommended] ×5: Decorative or structural style on the back of the kurta. Up to 5 values.
    - Valid values: `Backless`, `Band Back`, `Keyhole Back`, `Racerback`, `Strappy Back`, `Tie Back`
    - Amazon fields: `back[marketplace_id=A21TJRUUN4KGV]#1.style[language_tag=en_IN]#1.value` … `#5.value`

61. Chest Size [Recommended]: Measurement around the fullest part of the chest.
    - Example: `40`
    - Amazon field: `chest[marketplace_id=A21TJRUUN4KGV]#1.size#1.value`

62. Chest Size Unit [Recommended]: Unit for the chest size measurement.
    - Valid values: `Millimetres`, `Centimetres`, `Metres`, `Inches`, `Feet`, `Yards`
    - Amazon field: `chest[marketplace_id=A21TJRUUN4KGV]#1.size#1.unit`

63. Embellishment Feature [Recommended] ×5: Decorative elements added to enhance the kurta's appearance. Up to 5 values.
    - Valid values: `Bead`, `Bow`, `Feather`, `Fringe`, `Glitter`, `Lace`, `Mirror Work`, `Piping`, `Rhinestone`, `Sequin`, `Tassel`
    - Amazon fields: `embellishment_feature[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

64. External Product Information Entity [Conditionally Required]: Type of external product information — use `HSN Code` for India marketplace.
    - Valid values: `HSN Code`
    - Amazon field: `external_product_information[marketplace_id=A21TJRUUN4KGV]#1.entity`

65. External Product Information [Conditionally Required]: The HSN code value (6–8 digits) for India marketplace.
    - Example: `610510`
    - Amazon field: `external_product_information[marketplace_id=A21TJRUUN4KGV]#1.value`

66. Neck Style [Recommended] ×5: Shape, cut, or design of the neck opening. Up to 5 values.
    - Valid values: `Asymmetric Neck`, `Boat Neck`, `Choker Neck`, `Collared Neck`, `Cowl Neck`, `Crew Neck`, `Halter Neck`, `Henley Neck`, `High Neck`, `Jewel Neck`, `Keyhole Neck`, `Leaf Neck`, `Mock Neck`, `Notch Neck`, `Off Shoulder Neck`, `One Shoulder Neck`, `Plunging Neck`, `Scallop Neck`, `Scoop Neck`, `Split Neck`, `Square Neck`, `Surplice Neck`, `Sweetheart Neck`, `Tie Neck`, `Turtle Neck`, `U-Neck`, `V-Neck`
    - Amazon fields: `neck[marketplace_id=A21TJRUUN4KGV]#1.neck_style[language_tag=en_IN]#1.value` … `#5.value`

67. Seasons [Optional] ×5: Season(s) most appropriate for wearing the product. Up to 5 values.
    - Valid values: `All`, `Spring`, `Summer`, `Autumn`, `Winter`
    - Amazon fields: `seasons[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

68. Number of Pockets [Recommended]: Total count of pockets on the product.
    - Example: `2`
    - Amazon field: `number_of_pockets[marketplace_id=A21TJRUUN4KGV]#1.value`

69. Importer Contact Information [Conditionally Required] ×5: Full contact details of the importer (name, address, pincode, phone, email). Up to 5 entries.
    - Example: `Importer Pvt Ltd, Shop 5, Linking Road, Mumbai - 400050, Contact: +91-22-98765432, import@example.com`
    - Amazon fields: `importer_contact_information[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

70. Packer Contact Information [Conditionally Required] ×5: Full contact details of the packer when different from manufacturer. Up to 5 entries.
    - Example: `Packer Pvt Ltd, Unit 3, Industrial Area, Delhi - 110020, Contact: +91-11-23456789, pack@example.com`
    - Amazon fields: `packer_contact_information[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#5.value`

71. Sleeve Length Description [Optional]: Description of the sleeve length.
    - Valid values: `Sleeveless`, `Short Sleeve`, `Half Sleeve`, `3/4 Sleeve`, `Bracelet Sleeve`, `Long Sleeve`
    - Amazon field: `sleeve[marketplace_id=A21TJRUUN4KGV]#1.length_description#1.value`

72. Sleeve Type [Recommended]: Style or shape of the sleeve design.
    - Valid values: `Balloon Sleeve`, `Batwing Sleeve`, `Bell Sleeve`, `Bishop Sleeve`, `Butterfly Sleeve`, `Cap Sleeve`, `Cape Sleeve`, `Cold Shoulder Sleeve`, `Cuff Sleeve`, `Dolman Sleeve`, `Flutter Sleeve`, `Gathered Sleeve`, `Kimono Sleeve`, `Lantern Sleeve`, `Leg Of Mutton Sleeve`, `Puff Sleeve`, `Raglan Sleeve`, `Roll Up Sleeve`, `Ruffle Sleeve`, `Split Sleeve`, `Tulip Sleeve`
    - Amazon field: `sleeve[marketplace_id=A21TJRUUN4KGV]#1.type[language_tag=en_IN]#1.value`

73. Closure Type [Recommended] ×2: The closing mechanism used on the kurta. Up to 2 values.
    - Valid values: `Belted`, `Button`, `Drawstring`, `Hook and Eye`, `Pull On`, `Snap`, `Zipper`
    - Amazon fields: `closure[marketplace_id=A21TJRUUN4KGV]#1.type[language_tag=en_IN]#1.value`, `#2.value`

74. Item Length Longer Edge [Conditionally Required]: Length of the item measured along the longer/vertical edge.
    - Example: `45`
    - Amazon field: `item_length[marketplace_id=A21TJRUUN4KGV]#1.value`

75. Item Length Unit [Conditionally Required]: Unit for the item length measurement.
    - Valid values: `Centimeters`
    - Amazon field: `item_length[marketplace_id=A21TJRUUN4KGV]#1.unit`

76. Hemline Form [Optional] ×5: The style/shape of the garment's bottom edge. Up to 5 values.
    - Valid values: `Banded`, `Bubble`, `Curved`, `Elastic`, `Fishtail`, `Flared`, `Handkerchief`, `High Low`, `Polo`, `Raw Edge`, `Ribbed`, `Ruffled`, `Sharkbite`, `Shirttail`, `Slant`, `Slit`, `Step`, `Straight`, `Tie`, `Tiered Bottom`
    - Amazon fields: `hemline_form[marketplace_id=A21TJRUUN4KGV]#1.value` … `#5.value`

77. Ultraviolet Protection Factor [Optional]: UPF value as labeled after testing.
    - Valid values: `UPF 15`, `UPF 20`, `UPF 25`, `UPF 30`, `UPF 35`, `UPF 40`, `UPF 45`, `UPF 50`, `UPF 50+`
    - Amazon field: `ultraviolet_protection_factor[marketplace_id=A21TJRUUN4KGV]#1.value`

78. Weave Method [Optional]: Technique used to weave the fabric.
    - Valid values: `Handloom`, `Powerloom`
    - Amazon field: `weave_method[marketplace_id=A21TJRUUN4KGV]#1.value`

79. Slit Type [Optional]: Type of slit in the kurta that improves ease of movement.
    - Valid values: `Back Slit`, `Front Slit`, `No Slit`, `Side Slit`
    - Amazon field: `kurta_slit_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

80. Apparel Fabric Weight Class [Optional]: Weight class describing fabric thickness, density or feel.
    - Valid values: `Heavyweight`, `Lightweight`, `Medium Weight`
    - Amazon field: `apparel_fabric_weight_class[marketplace_id=A21TJRUUN4KGV]#1.value`

81. Garment Size Country [Optional]: Country where the garment's brand originates (determines initial size system).
    - Example: `India`
    - Amazon field: `garment_size_country[marketplace_id=A21TJRUUN4KGV]#1.value`

82. Shoulder to Bottom Hem Length [Optional]: Vertical measurement from shoulder seam at the neck to the bottom hem.
    - Example: `46`
    - Amazon field: `shoulder_to_bottom_hem_length[marketplace_id=A21TJRUUN4KGV]#1.value`

83. Shoulder to Bottom Hem Length Unit [Optional]: Unit for the shoulder-to-hem measurement.
    - Valid values: `Millimetres`, `Centimetres`, `Metres`, `Inches`, `Feet`, `Yards`
    - Amazon field: `shoulder_to_bottom_hem_length[marketplace_id=A21TJRUUN4KGV]#1.unit`

84. Apparel Fabric Stretch [Optional]: How much the material extends and recovers when worn.
    - Valid values: `High Stretch`, `Low Stretch`, `Medium Stretch`, `No Stretch`
    - Amazon field: `apparel_fabric_stretch[marketplace_id=A21TJRUUN4KGV]#1.value`

85. Fit to Size Sentiment [Optional]: Whether the item fits true to size or needs size adjustment.
    - Valid values: `Fits True To Size`, `Runs Large`, `Runs Slightly Large`, `Runs Slightly Small`, `Runs Small`
    - Amazon field: `fit_to_size_sentiment[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

86. Holiday Type [Optional] ×3: Holiday(s) the item is associated with. Up to 3 values.
    - Valid values: `Christmas`, `Diwali`, `Easter`, `Father's Day`, `Halloween`, `Hanukkah`, `Independence Day`, `Kwanzaa`, `Mother's Day`, `New Year`, `Passover`, `St. Patrick's Day`, `Thanksgiving`, `Valentine's Day`
    - Amazon fields: `holiday_type[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#3.value`

87. Life Event [Optional] ×3: Personal life milestone or event the item is intended for. Up to 3 values.
    - Valid values: `Anniversary`, `Baby Shower`, `Bachelor Party`, `Bachelorette Party`, `Baptism`, `Bar Mitzvah`, `Bat Mitzvah`, `Birthday`, `Bridal Shower`, `Confirmation`, `Engagement Party`, `First Communion`, `Funeral`, `Graduation`, `Homecoming`, `Honeymoon`, `New Baby`, `Prom`, `Quinceañera`, `Retirement`, `Wedding`
    - Amazon fields: `life_event[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value` … `#3.value`

88. Formality Level [Optional] ×2: Degree of formality the item represents. Up to 2 values.
    - Valid values: `Casual`, `Business Casual`, `Business Formal`, `Semi Formal`, `Formal`
    - Amazon fields: `formality_level[marketplace_id=A21TJRUUN4KGV]#1.value`, `#2.value`

89. Item Weight [Conditionally Required]: Weight of the item excluding packaging.
    - Example: `250`
    - Amazon field: `item_weight[marketplace_id=A21TJRUUN4KGV]#1.value`

90. Item Weight Unit [Conditionally Required]: Unit for item weight.
    - Valid values: `Milligrams`, `Grams`, `Kilograms`, `Ounces`, `Pounds`
    - Amazon field: `item_weight[marketplace_id=A21TJRUUN4KGV]#1.unit`

---

## Offer

91. Skip Offer [Optional]: Set to `Yes` if no buyable offer should be created.
    - Valid values: `Yes`, `No`
    - Amazon field: `skip_offer[marketplace_id=A21TJRUUN4KGV]#1.value`

92. Item Condition [Conditionally Required]: Actual condition type of the product.
    - Valid values: `New`
    - Amazon field: `condition_type[marketplace_id=A21TJRUUN4KGV]#1.value`

93. Offer Condition Note [Optional]: Descriptive text explaining the item's actual condition.
    - Example: `Minor thread pull on left sleeve, otherwise unused.`
    - Amazon field: `condition_note[marketplace_id=A21TJRUUN4KGV][language_tag=en_IN]#1.value`

94. Product Tax Code [Optional]: Tax code supplied by Amazon.
    - Valid values: `A_GEN_EXEMPT`, `A_GEN_HIGHPEAK`, `A_GEN_JEWELLERY`, `A_GEN_PEAK`, `A_GEN_PEAK_CESS12`, `A_GEN_PEAK_CESS60`, `A_GEN_REDUCED`, `A_GEN_REDUCEDtoEXEMPT2025`, `A_GEN_REDUCEDtoSTANDARD2025`, `A_GEN_SPECIAL`, `A_GEN_STANDARD`, `A_GEN_STANDARDtoEXEMPT2025`, `A_GEN_STANDARDtoHIGHPEAK2025`, `A_GEN_STANDARDtoREDUCED2025`, `A_GEN_SUPERREDUCED`, `A_GEN_SUPERREDUCEDtoEXEMPT2025`
    - Amazon field: `product_tax_code#1.value`

95. Merchant Release Date [Optional]: Date the offer becomes active (YYYY-MM-DD).
    - Example: `2024-10-02`
    - Amazon field: `merchant_release_date[marketplace_id=A21TJRUUN4KGV]#1.value`

96. Maximum Order Quantity [Optional]: Maximum number of units purchasable in a single order.
    - Example: `5`
    - Amazon field: `max_order_quantity[marketplace_id=A21TJRUUN4KGV]#1.value`

97. Offering Can Be Gift Messaged [Optional]: Whether a gift message can be printed with the item. Defaults to `No` if blank.
    - Valid values: `Yes`, `No`
    - Amazon field: `gift_options[marketplace_id=A21TJRUUN4KGV]#1.can_be_messaged`

98. Is Gift Wrap Available [Optional]: Whether gift wrapping is available. Defaults to `No` if blank.
    - Valid values: `Yes`, `No`
    - Amazon field: `gift_options[marketplace_id=A21TJRUUN4KGV]#1.can_be_wrapped`

99. Main Image Location [Optional]: URL for the main offer-specific image.
    - Example: `https://www.yourbrand.com/images/kurta-offer-main.jpg`
    - Amazon field: `main_offer_image_locator[marketplace_id=A21TJRUUN4KGV]#1.media_location`

100. Other Image Location [Optional] ×5: URLs for additional offer images. Up to 5 values.
     - Example: `https://www.yourbrand.com/images/kurta-offer-side.jpg`
     - Amazon fields: `other_offer_image_locator_1[marketplace_id=A21TJRUUN4KGV]#1.media_location` … `other_offer_image_locator_5`

101. Accessories [Optional]: Type of accessory included with a non-new product.
     - Valid values: `Generic`, `Not Applicable`, `Not Included`, `OEM`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.accessories`

102. Battery Life Percentage [Optional]: Battery health of the non-new product (if applicable).
     - Valid values: `No Battery`, `>90%`, `>80%`, `>70%`, `>60%`, `=<60%`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.battery_life_percentage`

103. Cosmetic [Optional]: Overall cosmetic condition of a non-new product.
     - Valid values: `Unknown`, `No Sign Of Use`, `Almost No Sign Of Use`, `Light Sign Of Use`, `Moderately Visible Sign Of Use`, `Highly Visible Sign Of Use`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.cosmetic`

104. Features [Optional] ×5: Refurbishment type of a non-new product. Up to 5 values.
     - Valid values: `Green Refurbishment`, `Parts Inspected`, `Parts Replaced`, `With Tags`
     - Amazon fields: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.features#1` … `#5`

105. Functional Condition [Optional]: Functional state of a non-new product.
     - Valid values: `Unknown`, `Fully Functional`, `Partly Functional`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.functional_condition`

106. Packaging [Optional]: Packaging type of a non-new product.
     - Valid values: `Amazon`, `Generic`, `Not Applicable`, `OEM Original`, `OEM Pre-Owned`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.packaging`

107. Renewed Grade [Optional]: Grade of a renewed/refurbished product.
     - Valid values: `Refurbished - Premium`, `Refurbished - Excellent`, `Refurbished - Good`, `Refurbished - Acceptable`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.renewed_grade`

108. Source Type [Optional]: How the non-new product was sourced.
     - Valid values: `No Data`, `Returned Never Used`, `Returned Used`, `Refurbished OEM`, `CPO`, `Refurbished Third Party`, `Refurbished Amazon`, `As Is`
     - Amazon field: `supplemental_condition_information[marketplace_id=A21TJRUUN4KGV]#1.source_type`

---

## Offer (IN) — Sell on Amazon

109. Fulfillment Channel Code (IN) [Conditionally Required]: Fulfillment network to be used. Specifying a value other than DEFAULT cancels merchant-fulfilled offering.
     - Valid values: `Fulfillment by Merchant (Default)`
     - Amazon field: `fulfillment_availability#1.fulfillment_channel_code`

110. Quantity (IN) [Conditionally Required]: Current inventory available for sale (whole number).
     - Example: `50`
     - Amazon field: `fulfillment_availability#1.quantity`

111. Handling Time (IN) [Optional]: Days between order receipt and shipment.
     - Example: `2`
     - Amazon field: `fulfillment_availability#1.lead_time_to_ship_max_days`

112. Restock Date (IN) [Optional]: Date product will be restocked (YYYY-MM-DD).
     - Example: `2024-11-01`
     - Amazon field: `fulfillment_availability#1.restock_date`

113. Inventory Always Available (IN) [Conditionally Required]: Toggle always-available inventory (cannot be combined with a quantity value).
     - Valid values: `Enabled`, `Disabled`
     - Amazon field: `fulfillment_availability#1.is_inventory_available`

114. Your Price INR (Sell on Amazon, IN) [Optional]: Base selling price offered to customers.
     - Example: `599`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.our_price#1.schedule#1.value_with_tax`

115. Maximum Retail Price (Sell on Amazon, IN) [Optional]: MRP physically printed on pre-packaged product per Legal Metrology Act (IN only).
     - Example: `799`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.maximum_retail_price#1.schedule#1.value_with_tax`

116. Pricing Rule (Sell on Amazon, IN) [Optional]: Automated pricing rule for this offer.
     - Valid values: `Best Price Rule by Amazon`, `Competitive Price Rule by Amazon`, `No Price Rule`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.automated_pricing_merchandising_rule_plan#1.merchandising_rule.rule_id`

117. Minimum Seller Allowed Price (Sell on Amazon, IN) [Optional]: Minimum price you permit for automated pricing rules.
     - Example: `499`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.minimum_seller_allowed_price#1.schedule#1.value_with_tax`

118. Maximum Seller Allowed Price (Sell on Amazon, IN) [Optional]: Maximum price you permit for automated pricing rules.
     - Example: `899`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.maximum_seller_allowed_price#1.schedule#1.value_with_tax`

119. Sale Price INR (Sell on Amazon, IN) [Optional]: Discounted sale price.
     - Example: `499`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.discounted_price#1.schedule#1.value_with_tax`

120. Sale Start Date (Sell on Amazon, IN) [Optional]: Date from which sale price overrides standard price (YYYY-MM-DD).
     - Example: `2024-10-15`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.discounted_price#1.schedule#1.start_at`

121. Sale End Date (Sell on Amazon, IN) [Optional]: Last date sale price is active (YYYY-MM-DD).
     - Example: `2024-10-31`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.discounted_price#1.schedule#1.end_at`

122. Offering Release Date (Sell on Amazon, IN) [Optional]: Price start / offer activation date (YYYY-MM-DD).
     - Example: `2024-10-01`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.start_at.value`

123. Stop Selling Date (Sell on Amazon, IN) [Optional]: Date after which the offer ends (YYYY-MM-DD).
     - Example: `2025-03-31`
     - Amazon field: `purchasable_offer[marketplace_id=A21TJRUUN4KGV][audience=ALL]#1.end_at.value`

124. Shipping Template (IN) [Conditionally Required]: Shipping template defining regions and fees assigned to this listing.
     - Valid values: `Migrated Template` *(or your configured template name)*
     - Amazon field: `merchant_shipping_group[marketplace_id=A21TJRUUN4KGV]#1.value`

---

## Shipping

125. Package Length [Conditionally Required]: Package length as a numeric value.
     - Example: `35`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.length.value`

126. Package Length Unit [Conditionally Required]: Unit for package length.
     - Valid values: `Centimeters`, `Inches`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.length.unit`

127. Package Width [Conditionally Required]: Package width as a numeric value.
     - Example: `25`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.width.value`

128. Package Width Unit [Conditionally Required]: Unit for package width.
     - Valid values: `Centimeters`, `Inches`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.width.unit`

129. Package Height [Conditionally Required]: Package height as a numeric value.
     - Example: `5`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.height.value`

130. Package Height Unit [Conditionally Required]: Unit for package height.
     - Valid values: `Centimeters`, `Inches`
     - Amazon field: `item_package_dimensions[marketplace_id=A21TJRUUN4KGV]#1.height.unit`

131. Package Weight [Conditionally Required]: Total weight of item plus packaging.
     - Example: `350`
     - Amazon field: `item_package_weight[marketplace_id=A21TJRUUN4KGV]#1.value`

132. Package Weight Unit [Conditionally Required]: Unit for package weight.
     - Valid values: `Grams`, `Kilograms`, `Ounces`, `Pounds`
     - Amazon field: `item_package_weight[marketplace_id=A21TJRUUN4KGV]#1.unit`

---

## Safety & Compliance

133. Country of Origin [Required]: Country where the product was manufactured.
     - Fixed value for KURTA: `India`
     - Amazon field: `country_of_origin[marketplace_id=A21TJRUUN4KGV]#1.value`

134. Is This Product Subject To Buyer Age Restrictions [Optional]: Whether the product has age-based purchase or delivery restrictions.
     - Valid values: `Yes`, `No`
     - Amazon field: `is_this_product_subject_to_buyer_age_restrictions[marketplace_id=A21TJRUUN4KGV]#1.value`

135. Compliance Regulation Type [Optional] ×5 (paired): Select applicable regulation type. Up to 5 pairs with Regulatory Identification.
     - Valid values: `3B Registration Number`
     - Amazon fields: `regulatory_compliance_certification[marketplace_id=A21TJRUUN4KGV]#1.regulation_type` … `#5.regulation_type`

136. Regulatory Identification [Optional] ×5 (paired): Regulatory ID corresponding to the Compliance Regulation Type above.
     - Example: `REG123456`
     - Amazon fields: `regulatory_compliance_certification[marketplace_id=A21TJRUUN4KGV]#1.value` … `#5.value`

137. Responsible Person's Email or Electronic Address [Optional]: Email or URL of the EU Responsible Person.
     - Example: `rsp@example.com`
     - Amazon field: `dsa_responsible_party_address[marketplace_id=A21TJRUUN4KGV]#1.value`

138. Compliance Media Source Location [Optional] ×25: Direct download URL for compliance documents. Available document types:
     - `Application Guide`, `ECGT - Bio-based & Biodegradable Claims`, `Certificate of Analysis`, `Certificate of Compliance`, `Compatibility Guide`, `Data Act Transparency Declaration`, `Emergency Use Authorization`, `Emergency Use Authorization Amendment`, `ECGT - Energy Efficiency Claims`, `Installation Manual`, `Instructions for Use`, `Patient Fact Sheet`, `ECGT - PFAS-Free Claims`, `Product Certificate of Conformity`, `Provider Fact Sheet`, `ECGT - Recyclability Claims`, `ECGT - Durability & Repairability Claims`, `Repairability Index Calculation Sheet`, `Safety Data Sheet`, `Safety Information`, `Specification Sheet`, `Troubleshooting Guide`, `User Guide`, `User Manual`, `Warranty`
     - Example: `https://example.com/compliance/certificate.pdf`
     - Amazon fields: `compliance_media[marketplace_id=A21TJRUUN4KGV][content_language=en_IN][content_type=<type>]#1.source_location`

139. Safety Attestation [Optional]: Confirm `Yes` if the product has no warning/safety information and can be used safely as intended.
     - Valid values: `Yes`, `No`
     - Amazon field: `gpsr_safety_attestation[marketplace_id=A21TJRUUN4KGV]#1.value`

140. Manufacturer's Email or Electronic Address [Optional]: Email or URL of the product manufacturer.
     - Example: `manufacturer@example.com`
     - Amazon field: `gpsr_manufacturer_reference[marketplace_id=A21TJRUUN4KGV]#1.gpsr_manufacturer_email_address`

141. Ships Globally [Optional]: Whether Amazon can ship this item globally.
     - Valid values: `Yes`, `No`
     - Amazon field: `ships_globally[marketplace_id=A21TJRUUN4KGV]#1.value`

142. Compliance - Chest Size [Optional]: Chest circumference measurement for compliance purposes.
     - Valid values: `86 cm or More`, `Less Than 86 cm`
     - Amazon field: `compliance_chest_size[marketplace_id=A21TJRUUN4KGV]#1.value`

143. Compliance - Is Handmade [Optional]: Whether the item was made by hand, for compliance purposes.
     - Valid values: `Yes`, `No`
     - Amazon field: `compliance_is_handmade[marketplace_id=A21TJRUUN4KGV]#1.value`

144. Compliance - Printing Method [Optional]: Printing style used on the item, for compliance purposes.
     - Valid values: `Hand Printed - Batik`, `Other`, `Other Hand Printed`
     - Amazon field: `compliance_printing_method[marketplace_id=A21TJRUUN4KGV]#1.value`

145. Compliance - Age Range [Optional]: Age group the item is intended for, for compliance purposes.
     - Valid values: `Baby/Infant`, `Boy`, `Girl`, `Men`, `Women`
     - Amazon field: `compliance_age_range[marketplace_id=A21TJRUUN4KGV]#1.value`

146. Compliance Weave Type [Conditionally Required]: Type of weave used in manufacturing, for compliance purposes.
     - Valid values: `Crocheted`, `Knitted`, `Woven`
     - Amazon field: `compliance_weave_type[marketplace_id=A21TJRUUN4KGV]#1.value`

147. Compliance - Warp Or Filling Coloring [Optional]: Count of colors in the warp/filling, for compliance purposes.
     - Valid values: `2 or More`, `Less Than 2`
     - Amazon field: `compliance_warp_or_filling_coloring[marketplace_id=A21TJRUUN4KGV]#1.value`

148. Compliance - T-Shirt Design [Optional]: Design type of the item, for compliance purposes.
     - Valid values: `Close-Fitting Long Sleeve`, `Cross-Over Neckband`, `Embroidered`, `Longer Panel or Tail`, `Printed Design`, `Shoulder Pads`, `Side Slit`, `Sweat Patch`
     - Amazon field: `compliance_t_shirt_design[marketplace_id=A21TJRUUN4KGV]#1.value`

149. Compliance - Shirt Type [Conditionally Required]: Intended occasion/use of the item, for compliance purposes.
     - Valid values: `Dress/Formal`, `Folklore`, `Napped`, `Other`, `Playsuit`, `Polo`, `Sports`, `T-Shirt`
     - Amazon field: `compliance_shirt_type[marketplace_id=A21TJRUUN4KGV]#1.value`

150. Compliance - Collar Type [Optional]: Type of collar on the item, for compliance purposes.
     - Valid values: `Other`, `Specially Made Collar`, `Tailored`
     - Amazon field: `compliance_collar_type[marketplace_id=A21TJRUUN4KGV]#1.value`

151. GHS Chemical H Code [Optional] ×5: GHS chemical hazard codes to display warnings to customers. Up to 5 values.
     - Example values: `H200`, `H201`, `H202` *(see full list of EUH/H codes in template)*
     - Amazon fields: `ghs_chemical_h_code[marketplace_id=A21TJRUUN4KGV]#1.value` … `#5.value`
