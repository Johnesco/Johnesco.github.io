'use strict';

// Variables
var textBox = $('#textBox');
var kibanaLink = $('#kibanaLink');

// Beautify JSON in TextBox
function beautify() {
    var json_object = JSON.parse(textBox.val());
    textBox.val(JSON.stringify(json_object, 1, '  '));  
}

// Display JSON Tree
function viewJsonTree() {
  var jjson = textBox.val();
  $('#jjson').jJsonViewer(jjson);
}

// Search for "i:" parameter and make link to Kibana
function showKibanaLink() {
    if (textBox.val().includes('"i": ')){
        var KibanaUUID = ($.parseJSON(textBox.val()).j.e.i);
        var env = $('input[name="env"]:checked').val(); // radio button value
        var string = "Kibana Link: "
                    + "<a target=\"_blank\" href=\""
                    + "http://analytics-" + env + ".wsmeco.com/_plugin/kibana/#/discover?_g="
                    + "(refreshInterval:(display:Off,section:0,value:0),time:(from:now%2Fd,mode:quick,to:now%2Fd))&_a=(columns:!(_source),index:analytics,interval:auto,query:(query_string:(analyze_wildcard:!t,query:'"
                    + KibanaUUID
                    + "')),sort:!(owen.event.eventTimestamp,desc))\">"
                    + KibanaUUID
                    + "</a> "
                    + env;

        $(kibanaLink).html(string);
    } else { kibanaLink.text("Kibana Link: (none)"); }
}

// This function optionally recieves a function from the event
function modifyTextbox(funct) {
    if (typeof funct === 'function') {
        textBox.val(funct(textBox.val())); // modifies text box via function
    } 
    beautify();
    viewJsonTree();
}

// Functions Used By modifyTextbox

// Extract all and piece together
var extractAllFun = function (text) {
    text = decodeURIComponent(text); // decode text
    var JSON_object = $.parseJSON(text); // object
    var jString = $.parseJSON(text).j; // string from j: (unescaped)
    JSON_object.j = $.parseJSON(jString); // covert then insert j
    return JSON.stringify(JSON_object); // return string
};

// Decode URL encoded text
var decodeFun = function (text) {
    text = text.replace(/\+/g, ' ');
    return decodeURIComponent(text);
};

// decodes URL and populates table
var magicFormat = function (text) {
    text = decodeFun(text);
    text = stripKeysAndInsertIntoTable(text);

    return text;
};

var stripKeysAndInsertIntoTable = function (text) {
    var url = text.match(/http(s){0,1}:\/\/.*\/__wsm.gif\?/)[0];
    text = text.replace(url, '');

    var urlFields = $.deparam(text);
    urlFields.url = url;

    text = urlFields.j;
    delete urlFields.j;
    viewJsonTree();

    jPut.urlParams.data = [urlFields];

    return text;
};

// Parses the name-value pairs in a URL and formats them into JIRA markdown
var tablefyFun = function (text) {
    if (text.includes('/b.rmntest.com/')) {
        var uri = URI.parseQuery(text);
        var string = "";
        for (var key in uri) {
                   if ( uri.hasOwnProperty( key )) {
           string+=( "|*" + key + ":* | " + uri[key] + " | \n" );
          }
         }
         return (string.replace( 'http://b.rmntest.com/', '' ));
        }
    else return text;
};




// jQuery Event Listener
// http://api.jquery.com/on/

$('#extractAll').on('click', function(){modifyTextbox(extractAllFun);});
$('#decode').on('click', function(){modifyTextbox(decodeFun);});
$('#tablefy').on('click', function(){modifyTextbox(tablefyFun);});
$('#magicFormat').on('click', function(){modifyTextbox(magicFormat);});
$('#beautifyTree').on('click', modifyTextbox);
$('#textBox').on('mouseout', modifyTextbox);
$('#showKibanaLink').on('click', showKibanaLink);

// alternate method with bind
// $('#extractAll').on('click', modifyTextbox.bind(null, extractAllFun));
// $('#decode').on('click', modifyTextbox.bind(null, decodeFun));
// $('#tablefy').on('click', modifyTextbox.bind(null, tablefyFun));
// $('#beautifyTree').on('click', modifyTextbox);
// $('#textBox').on('mouseout', modifyTextbox.bind(null, null));
// $('#magicFormat').on('click', modifyTextbox.bind(null, magicFormat));
// $('#showKibanaLink').on('click', showKibanaLink);
