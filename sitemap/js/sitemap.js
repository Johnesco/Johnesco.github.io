


var $sections = $('#sections'); 
// var $json = $('#json'); 

// Environment Variables
var slice = "control";
var env = "rmntest.com";
var security = "https://";

var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var affinityGroup = ["student-discount/","color-discount/"];
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"

var landingPages = ["landing/", "landing2/", "landing5/"];

var homePageLinks = [
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
	"coupons/gifts"];

var storePages = [
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
	"citibank.com"];

var ideaPages = [
	"hot-products",
	"halloween"];

var testEnvPages = [
	"discounttypes.com",
	"everykindofcoupon.com",
	"omnioffers.com",
	"outclicks.com"];

var CostCoPages = [
	"dashboard",
	"saved",
	"favorites",
	"justforyou",
	"join",
	"signup",
	"login",
	"profile"];

var categoryPages = [
	"",
	"clothing",
	"travel",
	"restaurants",
	"entertainment",
	"beauty",
	"adult",
	"pizza/" + pizzaroute,
	"pizza/" + pizzalocation];

var giftcardPages = [
	"rue21.com"];

var searchPages = [
	"bacon"];

var communityPages = [
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

var studentAffinityPagesTest = [
	"",
	"university-of-texas-austin",
	"mcgill-university",
	"the-ohio-state-university",
	"university-of-michigan",
	"texas-state-university"];

var colorAffinityPagesTest = [	
	"",
	"FF0000"];

var miscPages = [
	"quickSignUp",
	"submit",
	"showcoupon/" + cid,
	"blah404",
	"alerts",
	"contests",
	"deals/blackfriday",
	"profile",
	"settings",
	"sitemap",
	"static/privacy",
	"static/terms",
	"subscribe",
	"weeklyads",
	"profile",];

var deprecatedPages = [
	"dealfinder",
	"shoppinglist",
	"static/newsletter"
];

// Main object that will hold entire set of links
var page = {sections:{}};

// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	page.sections[section] = {};
	page.sections[section].pre = pre;
	page.sections[section].sub = sub;
	page.sections[section].list = list;
}

// Creates a URL from security, prefix, environment, subdirectory, storelist
function buildURL(pageSection, list){
	var link = 	security +
			pageSection.pre + 
			env +
			pageSection.sub +
			list;
			return link;
}

// Creates HTML for a link from a URL
function makeLink(url,label,nobr){
	var label = label || url;
	var url = "<a target=\"_blank\" href=\"" +
			url + "?refresh=1" +
			"&slice=" + slice + "\">" +
			label +
			"</a> ";
			if (!nobr) url+= "<br>";
			return url;
}

// Creates HTML for a Header Section
function makeHeader(pageSection, slice){
	return "<h2>" + pageSection + " (slice: " + slice + ")" + "</h2>";
}


// Add these sections into page object
addSection("www", "Home Pages Links","",homePageLinks);
addSection("www", "CostCo (New Community)", "", CostCoPages);
addSection("www", "Community Pages", "community/", communityPages);
addSection("www", "Store Pages","view/",storePages);
addSection("www", "Ideas Pages","ideas/",ideaPages);
addSection("www", "Category Pages", "coupons/", categoryPages);
addSection("giftcards", "GiftCard Pages", "store/", giftcardPages);
addSection("www", "Search Pages", "s/", searchPages);
addSection("www", "Student Affinity Pages", "student-discounts/", studentAffinityPagesTest);
addSection("www", "Misc Pages", "", miscPages);
addSection("www", "Test Env Only", "view/", testEnvPages);


function update(){
	$sections.empty(); // Clear Existing Links

	// Check form and adjust properties
	slice = $('#slice').val() || slice;
	env = $('input[name="environment"]:checked').val(); // Assign evn via radio button
	security = $('input[name="http"]:checked').val(); // Assign security via radio button

	// Taverse Pages.sections object, putting url arrays into pageSection
	for (pageSection in page.sections){
		$sections.append(makeHeader(pageSection,slice));

		// Traverse pageSection.list Array, turning urls into links + slice
		for (var i = 0; i < page.sections[pageSection].list.length; i++){

			var url = buildURL(page.sections[pageSection],page.sections[pageSection].list[i]);

			// Special Case for 'view/' pages (add landing pages)
			if (page.sections[pageSection].sub == "view/"){
				$sections.append(makeLink(url,"",true));

				for (sub in landingPages){
					page.sections[pageSection].sub = landingPages[sub];
					var url = buildURL(page.sections[pageSection],page.sections[pageSection].list[i]);
					$sections.append(makeLink(url,"("+landingPages[sub]+")",true));
				}

				$sections.append("<br>");
				page.sections[pageSection].sub = "view/";
			
			// else just add link 	
			} else {
				$sections.append(makeLink(url));
			}
		};
	}
};

// Runs update() for the first time to initialize page
update();

// buttons
//$('#update').on('click', update);
$('form').on('change', update);

// Prevent enter from submitting form, run update() instead
$('form').on('keyup keypress', function(e) {
  var keyCode = e.keyCode || e.which;
  if (keyCode === 13) { 
    e.preventDefault();
    update();
    return false;
  }
});

//debugging

// function updateJSON(){
// 		console.log(JSON.stringify(page, 1, '  '));
// };

// updateJSON();
