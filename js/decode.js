'use strict';

// Variables
var textBox = $('#textBox');
var kibanaLink = $('#kibanaLink');

// Beautify JSON in TextBox
function beautify() {
    var json_object = JSON.parse(textBox.val()) || '{"none":"none"}';
    textBox.val(JSON.stringify(json_object, 1, '  '));  
}

// Display JSON Tree
function viewJsonTree() {
  var jjson = textBox.val() || '{"none":"none"}';
  $('#jjson').jJsonViewer(jjson);
}

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
                    + "</a> " + env;

        $(kibanaLink).html(string);
    } else { kibanaLink.text("Kibana Link: (none)"); }
}

// This function is run from each button press, uses the functions below to process text.
function modifyTextbox(fun) {
    if (fun) {
        textBox.val(fun(textBox.val())); // modifies text box via function
    }
    beautify();
    viewJsonTree();
    showKibanaLink();
}

// Functions Used By modifyTextbox

// Decode URL encoded text
var decodeFun = function (text) {
    text = text.replace(/\+/g, ' ');
    return decodeURIComponent(text);
};

// Extract all and piece together
var extractAllFun = function (text) {
    text = decodeURIComponent(text); // decode text
    var JSON_object = $.parseJSON(text); // object
    var jString = $.parseJSON(text).j; // string from j: (unescaped)
    JSON_object.j = $.parseJSON(jString); // covert then insert j
    return JSON.stringify(JSON_object); // return string
};

// Extract j: and show alone (Deprecated, will be removed)
var extractJFun = function (text) {
    var JSON_object = $.parseJSON(text); // object
    var jString = $.parseJSON(text).j; // string from j: (unescaped)
    JSON_object.j = $.parseJSON(jString); // covert then insert j
    return JSON.stringify(JSON_object); // return string
};

// Extract query.payload portion of JSON
var extractPayloadFun = function (text) {
  return ($.parseJSON(text).query.payload);
};

// Extract metadata.requestBody portion of JSON then decode it
var extractRequestBodyFun = function (text) {
  var coded = ($.parseJSON(text).metadata.requestBody);
    return decodeFun(coded);
};

// Parses the name-value pairs in a URL and formats them into JIRA markdown
var tablefyFun = function (text) {
    if (text.includes('http://b.rmntest.com/')) {
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
}

var magicFormat = function (text) {
    text = decodeFun(text);
    text = stripKeysAndInsertIntoTable(text);

    return text;
}

// jQuery Event Listener
// http://api.jquery.com/on/

$('#extractAll').on('click', modifyTextbox.bind(null, extractAllFun));

// $('#extractAll').on('click', function () {
//     modifyTextbox(extractAllFun);
// });
// Deprecated: $('#extractJ').on('click', function() {modifyTextbox(extractJFun);});
$('#decode').on('click', modifyTextbox.bind(null, decodeFun));
$('#extractPayload').on('click', modifyTextbox.bind(null, extractPayloadFun));
$('#extractRequestBody').on('click', modifyTextbox.bind(null, extractRequestBodyFun));
$('#tablefy').on('click', modifyTextbox.bind(null, tablefyFun));
$('#beautifyTree').on('click', modifyTextbox.bind(null, null));
$('#textBox').on('mouseout', modifyTextbox.bind(null, null));
$('#magicFormat').on('click', modifyTextbox.bind(null, magicFormat));
