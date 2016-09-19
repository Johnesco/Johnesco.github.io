


var $links = $('#links'); 
var slice = "control";
var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var search = "bacon";
var affinityGroup = ["student-discount/","color-discount/"];
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"
var storePrefixes = ["view/", "landing/", "landing2/", "landing5/"]
var store = [
	"target.com",
	"macys.com",
	"poopingpuppies.com",
	"sears.com",
	"bestbuy.com",
	"kohls.com",
	"lowes.com",
	"victoriassecret.com"]

var store_long = [
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



var testEnv = [
	"discounttypes.com",
	"everykindofcoupon.com",
	"omnioffers.com"
]

var category = [
	"",
	"clothing",
	"travel",
	"restaurants",
	"entertainment",
	"beauty",
	"adult",
	"pizza/" + pizzaroute,
	"pizza/" + pizzalocation];

var searchPages = [
	"" + search,
	"printable",
	"freeshipping",
	"clearance",
	"exclusives",
	"weekly+ads"]

var ideaPages = [
	"hot-products",
	"halloween"
];



var community = [
	"",
	"badges",
	"confirm_oauth",
	"forgotpassword",
	"inactive",
	"login",
	"member/"+username,
	"signup",
	"submitted-coupons",
	"add-favorite-stores",
	"unsubscribe",
	"welcome"];

var affinity = [
	["student-discounts/",""],
	["student-discounts/","university-of-texas-austin"],
	["student-discounts/","mcgill-university"],
	["student-discounts/","the-ohio-state-university"],
	["student-discounts/","university-of-michigan"],
	["color-discounts/",""],
	["color-discounts/","FF0000"],
];

var misc = [
	"blog",
	"quickSignUp",
	"submit",
	"showcoupon/" + cid,
	"blah404",
	"alerts",
	"contests",
	"deals/blackfriday",
	"favorites",
	"join",
	"justforyou",
	"login",
	"mobile",
	"profile",
	"saved",
	"settings",
	"sitemap",
	"static/privacy",
	"static/terms",
	"subscribe",
	"weeklyads",
	"profile",];

var deprecated = [
	"dealfinder",
	"shoppinglist",
	"static/newsletter"
]

var pages = {};

// Function to add arrays as sections to pages object
function addSection(list,section,prefix){
	pages[section] = [];
	for (var i = 0; i < list.length; i++){
		pages[section].push(prefix + list[i])
	}	
}

function addSectionMulti(list,section,prefixes){
	pages[section] = [];
	for (var i = 0; i < list.length; i++){
		for (var j = 0; j < prefixes.length; j++){
			pages[section].push(prefixes[j] + list[i]) 
		}
	}	
	pages[section].push("");
}

function addSectionArray(list,section,prefix){
	pages[section] = [];
	for (var i = 0; i < list.length; i++){
		pages[section].push(prefix + list[i][0] + list[i][1])
	}	
}

// Go though 
addSectionMulti(store,"Store Pages",storePrefixes)
addSectionMulti(testEnv, "TEST env ONLY",storePrefixes);
addSection(category,"Category Pages","coupons/");
addSection(searchPages, "Search Pages (some redirect to special pages)", "s/")
addSection(ideaPages, "Idea Pages", "ideas/")
addSection(community,"Community Pages","");
addSectionArray(affinity,"Affinity Pages","")
addSection(misc,"Redirects and Misc Pages","");
addSection(deprecated,"Deprecated or Inactive","");



// Misc additions
pages["Category Pages"].push('categories/');



function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || "control"; // Assign slice via input (default to control)
	var env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	var security = $('input[name="http"]:checked').val(); // Assign security via radio button
	

	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (slice: " +slice + ")" + 
		"</h1>"
		);

		// Traverse pageType Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].length; i++){
			var link = security + env + pages[pageType][i];
			$links.append(
			"<a target=\"_blank\" href=\"" + link + "?refresh=1" +
			"&slice=" + slice + "\">" + link +
			"</a><br>");
		}
	}
}

update();

// buttons
$('#update').on('click', update);

// Prevent enter from submitting form, run update() instead
$('#env').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    return false;
  }
});


	


