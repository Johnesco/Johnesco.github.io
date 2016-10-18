


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

var storePages = [
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

var testEnv = [
	"discounttypes.com",
	"everykindofcoupon.com",
	"omnioffers.com",
	"outclicks.com"];

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



	//"clothing"]

var searchPages = [
	"" + search,
	"printable",
	"freeshipping",
	"clearance",
	"exclusives",
	"weekly+ads"]

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

var deprecatedPages = [
	"dealfinder",
	"shoppinglist",
	"static/newsletter"
]

var pages = {};


// Function to add arrays as sections to pages object
function addSection(pre,section,sub,list){
	pages[section] = {};
	pages[section].security = $('input[name="http"]:checked').val(); // Assign security via radio button
	pages[section].pre = pre;
	pages[section].env = $('input[name="env"]:checked').val(); // Assign evn via radio button
	pages[section].sub = sub;
	pages[section].list = list;
	pages[section].slice = $('#slice').val();
	
	
}


// function updateJSON(){
// 	$json.empty(); // Clear Existing Links
// 	$json.append(
// 		"<pre>" +
// 		JSON.stringify(pages, 1, '  ') +
// 		"</pre>"
// 		);
// };




function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || slice;
	pages = {};

	if ($('input[name="env"]:checked').val() == ".rmntest.com/"){
		console.log("This is on test");
		addSection("www", "Test Env Only", "view/", testEnv);
	}
	addSection("www", "Store Pages","view/",storePages);
	addSection("www", "Ideas Pages","ideas/",ideaPages);
	addSection("www", "Category Pages", "coupons/", categoryPages);
	addSection("giftcards", "GiftCard Pages", "store/", giftcardPages);
	addSection("www", "Search Pages", "s/", searchPages);
	addSection("www", "Community Pages", "community/", communityPages);
	addSection("www", "Student Affinity Pages", "student-discounts/", studentAffinityPagesTest);
	addSection("www", "Misc Pages", "", miscPages);


	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (slice: " +slice + ")" + 
		"</h1>"
		);



		// Traverse pageType Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].list.length; i++){
			
			var link =
			pages[pageType].security +
			pages[pageType].pre + 
			pages[pageType].env +
			pages[pageType].sub +
			pages[pageType].list[i];

			$links.append(
			"<a target=\"_blank\" href=\"" +
			link + "?refresh=1" +
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