var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var unsubscribe = "&ei=C3EPLI7HWJA23L7YFBZG3GV7JM";
var landingPages = ["landing/", "landing2/", "landing5/"];

var homePage = {
	"sectionName": "Home Page",
    "pre": "www",
    "sub": "",
    "endPoints": [
        "",
		"responsive/homepage.php"
	]
 };

var homePageLinks = {
	"sectionName": "Home Pages Links",
    "pre": "www",
    "sub": "",
    "scope": 'test',
    "endPoints": [
        "coupon-codes",
        "giftcards",
        "printable",
        "freeshipping",
        "exclusives",
        "rebates",
        "categories",
        "mobile",
        "favorites",
        "saved",
        "blog",
        "coupons/gifts"
      ]
 };

 var homePageLinksStage = {
	"sectionName": "Home Pages Links (Stage only)",
    "pre": "www",
    "sub": "",
    "scope": 'stage',
    "endPoints": [
        "coupon-codes",
        "giftcards",
        "printable",
        "freeshipping",
        "exclusives",
        "rebates",
        "categories",
        "mobile",
        "favorites",
        "saved",
        "blog",
        "coupons/gifts"
      ]
 };

var footerLinks = {
	"sectionName": "Footer Links",
    "pre": "www",
    "sub": "",
    "endPoints": [
        "sitemap",
		"static/terms",
		"static/privacy"
	]
 };

var storePages = {
	"sectionName": "Store Pages",
    "pre": "www",
    "sub": "view/",
    "endPoints": [
        "%E2%88%86%C2%A5%E2%88%91.com",
		"target.com",
		"macys.com",
		"poopingpuppies.com",
		"sears.com",
		"kmart.com",
		"bestbuy.com",
		"kohls.com",
		"lowes.com",
		"victoriassecret.com",
		"bathandbodyworks.com",
		"walgreens.com",
		"sizzler.com",
		"travelocity.com",
		"amazon.com",
		"biglots.com",
		"walmart.com",
		"citibank.com"]
 };

var ideaPages = {
	"sectionName": "Ideas Pages",
    "pre": "www",
    "sub": "ideas/",
    "endPoints": [
        "hot-products",
		"halloween"
	]
 };

var dealsPages = {
	"sectionName": "Deals Pages",
    "pre": "www",
    "sub": "deals/",
    "endPoints": [
        "halloween",
		"blackfriday",
		"cybermonday",
		"christmas"
	]
 };

var testEnvPages = {
	"sectionName": "Test Stores (test only)",
    "pre": "www",
    "sub": "view/",
    "scope": "test",
    "endPoints": [
        "discounttypes.com",
		"everykindofcoupon.com",
		"omnioffers.com",
		"outclicks.com",
		"utf-8.com"]
 };

var categoryPages = {
	"sectionName": "Category Pages",
    "pre": "www",
    "sub": "coupons/",
    "endPoints": [
        "",
		"clothing",
		"travel",
		"restaurants",
		"entertainment",
		"beauty",
		"adult",
		"pizza/" + pizzaroute,
		"pizza/" + pizzalocation]
 };

var giftcardPages = {
	"sectionName": "Gift Cards",
    "pre": "giftcards",
    "sub": "",
    "endPoints": [
        "rue21.com"]
 };

var searchPages = {
	"sectionName": "Search Pages",
    "pre": "www",
    "sub": "s/",
    "endPoints":[
        "bacon"
    ]
 };

var CostCoPages = {
	"sectionName": "CostCo Pages",
    "pre": "www",
    "sub": "",
    "endPoints": [
        "profile",
		"dashboard",
		"saved",
		"favorites",
		"justforyou",
		"join",
		"signup",
		"login"
	]
 };

var communityPages = {
	"sectionName": "Community Pages",
    "pre": "www",
    "sub": "community/",
    "endPoints": [
        "",
        "badges",
		"confirm_oauth",
		"login",
		"member/"+username,
		"signup",
		"submitted-coupons",
		"add-favorite-stores",
		"welcome" ]
 };

var communityPagesIe = {
	"sectionName": "Deprecated Community Pages",
    "pre": "www",
    "sub": "community/",
    "endPoints": [
        "unsubscribe",
		"forgotpassword",
		"inactive"]
 };

var studentAffinityPagesTest = {
	"sectionName": "Affinity Pages",
    "pre": "www",
    "sub": "student-discounts/",
    "endPoints": [
        "",
		"university-of-texas-austin",
		"mcgill-university",
		"the-ohio-state-university",
		"university-of-michigan",
		"texas-state-university"]
 };

var colorAffinityPagesTest = {
	"sectionName": "Color Affinity Pages (test only)",
    "pre": "www",
    "sub": "color-discounts/",
    "scope": "test",
    "endPoints": [	
		"",
		"FF0000",
		"FFFF00",
		"FF00FF",
		"FFFFFF",
		"00FF00",
		"00FFFF",
		"0000FF",
		"000000"
	]
 };

var miscPages = {
	"sectionName": "Misc Pages",
    "pre": "www",
    "sub": "",
    "endPoints": [
        "special/community",
		"quickSignUp",
		"submit",
		"showcoupon/" + cid,
		"blah404",
		"alerts",
		"contests",
		"profile",
		"settings",
		"subscribe",
		"weeklyads",
		"profile"]
 };

var deprecatedPages = {
	"sectionName": "Deprecated Pages",
    "pre": "www",
    "sub": "",
    "endPoints": [
        "dealfinder",
		"shoppinglist",
		"static/newsletter"
]
 };

 var pageList = [
	homePage,
	homePageLinks,
	homePageLinksStage,
	footerLinks,
	CostCoPages,
	communityPages,
	communityPagesIe,
	searchPages,
	storePages,
	testEnvPages,
	ideaPages,
	dealsPages,
	categoryPages,
	giftcardPages,
	miscPages,
	studentAffinityPagesTest,
	colorAffinityPagesTest,
	deprecatedPages];