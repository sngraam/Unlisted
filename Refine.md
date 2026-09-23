# P1
# we find new user 
user can create -> own brand (user-  admin)
when user enter new id pass with we provided into user email we see is user done "user_onbording" before 

if not and user is admin:
- frist user not bording 
onbording have 4 slides 
1. get user "display name", email, accountType, 

2nd slide brand context
2. get brand detaiels like 
    - brandname, tone, glossary, bannedTerms, painPoints
    addinial detaiels 
    - brand revenus , brand competitior, brand target(age, country)

3rd slide connect  marktplace 
3. 
    - we give 3 options like this ui
    ----
    connect amazon, connect flipkard, 
                skip
    ----

4th slide is "how you find us"
google, cold call, facebook, cold email, instgram, other


if user is invited:
    get only display name and email
    and show dashbord and acces to assed role

if yes:
- show dashbord

-------------------

# P2
# in dash bord user create add sku 

user click "add new sku" then start product onbording 

this divied 3 slids

1. product deaitals  

product category , 
Product Images
Product Name
Variants & pricing
 - Selling Price
 - MRP
Brand Name

in PD user upload imags in JPG, JPEG, PNG

2nd slide product data

in Pdata user can upload files like 
- .md, .txt, .csv, .xlms files to get product listing data
- addinal messiy text info  about product (Raw product information)


3rd slide 

markplace , Product Id Type, Describe materials, measurements, features, and category-specific facts. like this reqred 3-4 ONLY 


when user click "Create Product Draft" the this data go to backend and show processing in frntend (Task Queue)
- while procesing user not enter that page or cancel or anythink 
----

# P3 backend process 

so all this files go to there workplace folder and this start the 

$$ AGENT 0
- Keyword agnt 
accoding to product and images and other info extract market place (assume amazon) seo titiles 
- titile, descrbtition, Generic Keywords , Bullet Point, 

AGENT 0 data also go to ->  AGENT 1

$$ AGENT 1
- Catalog Agent (Title, Bullets, Desc 5M) 

- so frist catalog agent extract all relevent information about relevent feilds that get the ".md, .txt, .csv, .xlms", Raw product information , product category , 
Product Images
Product Name
Variants & pricing
 - Selling Price
 - MRP
Brand Name 

this all feild correct fix them to market place selected (assume amazon) accoding there reqements and rules and match the feild 
then see with filed are missing and need to add (requrement & condinally requrements) and add also this feilds 

2. in last create whole json file with there correct values accoding to rules and save to id 


$$ AGENT 2
- Validation AGENt

3. full fill the xlms file and temple values correctly fill and check is any worng or attrbutue erros and give us a full uploadedblle 
xlms file of product 

if anythink wrong this model allow to edit correctlly and check properly 


also matching templet formate to extarct or save the correct downloed version and formate is logic need to handel correctly 
----

# P4 

user review and approve

when this ready the frontend show ready and then user accese to reviiew checking allow values and aallow to re-ganrate or fix the 
model and manually 

then user cick approve button and show downlaod xlsm version easy uploed in market place or direct uploed api need 
connect marketplace 

-----------

more imp point is 
-  extraction data point and give the models is more advance and easy for model to fill values 
- creating json file that then use validation to fill themplete 
- creating filiong logic more advance and correct so alsomest not error get 

- in revew stage easy download final version xslm file to upload market place 
- ininally we foucus only amazon and filpcark 
- optimaing token usage and making no mistake 

