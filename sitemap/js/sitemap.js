
var $links = $('#links'); 

var slice = "control";
var username = "test";
var pizzaroute = "a/78745";
var pizzalocation = "ma/papajohns.com/78745";
var ideas = "hot-products";
var cid = "7450931";
var search = "bacon";
var unsubscribe = "&unsubscribe=U2PEHPOV6BB5NHU4SLPTCYNS7Q&ei=U2PEHPOV6BB5NHU4SLPTCYNS7Q&mailingid=18561&ESP=2&utm_medium=email&utm_campaign=2015_10_28&ch=newsl&utm_source=newsletter&utm_term=maleproductdeals&cus.ptp=flagship"


var store = ["target.com","macys.com","poopingpuppies.com","sears.com","kmart.com","bestbuy.com","kohls.com","lowes.com","victoriassecret.com","bathandbodyworks.com","walgreens.com","sizzler.com","travelocity.com","amazon.com","biglots.com","walmart.com"]
var ccpage = ["citibank.com"];
var community = ["","add-favorite-stores","badges","confirm_oauth","forgotpassword","inactive","login","member/"+username,"signup","submitted-coupons","unsubscribe.php","welcome"];
var category = ["", "clothing","travel", "restaurants", "entertainment","beauty"];
var misc = [
	"submit",
	"alerts",
	"clearance",
	"contests",
	"coupons/adult",
	"coupons/pizza/" + pizzaroute,
	"coupons/pizza/" + pizzalocation,
	"dealfinder",
	"exclusives",
	"favorites",
	"freeshipping",
	"ideas/" + ideas,
	"join",
	"justforyou",
	"login",
	"mobile",
	"printable",
	"profile",
	"s/" + search,
	"saved",
	"settings",
	"showcoupon/" + cid,
	"sitemap",
	"static/newsletter",
	"static/privacy",
	"static/terms",
	"submit",
	"subscribe"]

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

addSection(store,"Store Pages","view/");
addSection(ccpage,"CC Pages","view/");
addSection(category,"Category Pages","coupons/");
addSection(community,"Community Pages","community/");
addSection(misc,"Misc Pages","");



// Misc additions
pages["Category Pages"].push('categories/');



function update(){
	slice = $('#slice').val();
	$links.empty();
	// env = $('input[name="env"]:checked').val();
	

	// Taverse Pages object, putting url arrays into pageType
	for (pageType in pages){
		$links.append(
		"<h1>" +
		pageType + " (" +slice + ")" + 
		"</h1>"
		);

		// Traverse pageType Array, turning urls into links + slice
		for (var i = 0; i < pages[pageType].length; i++){
			env = $('input[name="env"]:checked').val();
			var link = env + pages[pageType][i];
			$links.append(
			"<a href=\"" + link + "?refresh=1" +
			"&slice=" + slice + "\">" + link +
			"</a><br>");
		}
	}
}

update();

// buttons
$('#update').on('click', update);


	


