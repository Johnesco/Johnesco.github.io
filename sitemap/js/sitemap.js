


var $links = $('#links'); 
// var $json = $('#json'); 
var slice = "control";
var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var affinityGroup = ["student-discount/","color-discount/"];
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"

var landingPages = ["landing/", "landing2/", "landing5/"];

var homePageLinks = [
	"/ideas",
	"giftcards",
	"printable",
	"freeshipping",
	"exclusives",
	"categories",
	"rebates",
	"mobile",
	"favorites",
	"saved",
	"blog"];

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

var storePages2 = [
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
	"",
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
	"blog",
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
]

// Main object that will hold entire set of links
var page = {};

// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	page[section] = {};
	page[section].security = $('input[name="http"]:checked').val(); // Assign security via radio button
	page[section].pre = pre;
	page[section].env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	page[section].sub = sub;
	page[section].list = list;
	page[section].slice = $('#slice').val();
}

// builds URL from security, prefix, environment, subdirectory, storelist
function buildURL(pageSection, list){
	link = 	pageSection.security +
			pageSection.pre + 
			pageSection.env +
			pageSection.sub +
			list;
			return link;
}

// Recieved url and optional lable, convernts to <a href="url">label</a>
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

function makeHeader(pageSection, slice){
	return "<h1>" + pageSection + " (slice: " + slice + ")" + "</h1>";
}

function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || slice;
	pages = {};

	// Add only if on TEST
	if ($('input[name="env"]:checked').val() == ".rmntest.com/"){
		addSection("www", "Test Env Only", "view/", testEnvPages);
		addSection("www", "CostCo (New Community)", "", CostCoPages);
	}

	// Always add these sections
	addSection("www", "Home Pages Links","",homePageLinks);
	addSection("www", "Store Pages","view/",storePages);
	addSection("www", "Ideas Pages","ideas/",ideaPages);
	addSection("www", "Category Pages", "coupons/", categoryPages);
	addSection("giftcards", "GiftCard Pages", "store/", giftcardPages);
	addSection("www", "Search Pages", "s/", searchPages);
	addSection("www", "Community Pages", "community/", communityPages);
	addSection("www", "Student Affinity Pages", "student-discounts/", studentAffinityPagesTest);
	addSection("www", "Misc Pages", "", miscPages);


	// Taverse Pages object, putting url arrays into pageSection
	for (pageSection in page){
		$links.append(makeHeader(pageSection,slice));


		// Traverse pageSection.list Array, turning urls into links + slice
		for (var i = 0; i < page[pageSection].list.length; i++){

			var link = buildURL(page[pageSection],page[pageSection].list[i]);


			if (pageSection == "Store Pages"){
				$links.append(makeLink(link,"",true));

				for (sub in landingPages){
					page[pageSection].sub = landingPages[sub];
					var link = buildURL(page[pageSection],page[pageSection].list[i]);
					$links.append(makeLink(link,landingPages[sub],true));
				}

				$links.append("<br>");
				page[pageSection].sub = "view/";
				
			} else {
				$links.append(makeLink(link));
			}
		};
	}
};

// Runs update() for the first time to initialize page
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

//debugging
function updateJSON(){
		console.log(JSON.stringify(pages, 1, '  '));
};

updateJSON();