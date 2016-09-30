


var $links = $('#links'); 
var slice = "OfferBundlerV2";
var username = "letmeshowyou";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var search = "bacon";
var affinityGroup = "student";
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"

// var store = [
// 	"target.com",
// 	"macys.com",
// 	"poopingpuppies.com",
// 	"sears.com",
// 	"kmart.com",
// 	"bestbuy.com",
// 	"kohls.com",
// 	"lowes.com",
// 	"victoriassecret.com",
// 	"bathandbodyworks.com",
// 	"walgreens.com",
// 	"sizzler.com",
// 	"travelocity.com",
// 	"amazon.com",
// 	"biglots.com",
// 	"walmart.com",
// 	"citibank.com"]

var store = [
"ae.com",
"macys.com",
"barnesandnoble.com",
"babiesrus.com",
"bathandbodyworks.com",
"advanceautoparts.com",
"charlotterusse.com",
"gamestop.com",
"jcpenney.com",
"sears.com",
"express.com",
"kohls.com",
"lanebryant.com",
"michaels.com",
"oldnavy.com",
"staples.com",
"ulta.com",
"petsmart.com",
"walmart.com",
"eddiebauer.com",
"gap.com"]


var testEnv = [
	"discounttypes.com",
	"everykindofcoupon.com",
	"omnioffers.com"
]



var pages = {};

// Function to add arrays as sections to pages object
function addSection(list,section,prefix){
	pages[section] = [];
	for (var i = 0; i < list.length; i++){
		pages[section].push(prefix + list[i])
	}	
	// for (var i = 0; i < list.length; i++){
	// 	pages[section].push(prefix + list[i])
	// }
}

// Go though 
addSection(store,"Store Pages","view/");
// addSection(store,"Landing Pages","landing/");
// addSection(store,"Landing2 Pages","landing2/");
// addSection(store,"Landing5 Pages","landing5/");


function update(){
	$links.empty(); // Clear Existing Links
	slice = $('#slice').val() || "OfferBundlerV2"; // Assign slice via input (default to control)
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


	

