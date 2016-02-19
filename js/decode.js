'use strict';

// Variables
var textBox = $('#textBox');

// Beautify JSON in TextBox
function beautify() {
    var json_object = JSON.parse( textBox.val() ) || '{"none":"none"}';
    textBox.val( JSON.stringify( json_object, 1, '  ' ));
}

// Display JSON Tree
function viewJsonTree() {
	var jjson = textBox.val() || '{"none":"none"}';
	$('#jjson').jJsonViewer(jjson);
}

// Button press event
function modifyTextbox(fun) {
    if (fun) textBox.val(fun(textBox.val())); // modifies text box via function
    beautify();
    viewJsonTree();
}

// Functions Used By modifyTextbox

// Decode URL encoded text
var decodeFun = function(text) {
    return decodeURIComponent(text);
}

// Extract "j:" portion of JSON
var extractJFun = function(text) {
	return ($.parseJSON(text).j || text); // if no j:, return self
}

// Both Decode URL encoded text and Extract "j:" portion of JSON
var decodeExtractJFun = function(text) {
    return extractJFun(decodeFun(text));
}

// Extract query.payload portion of JSON
var extractPayloadFun = function (text) {
	return ($.parseJSON(text).query.payload);
}

// Extract metadata.requestBody portion of JSON then decode it
var extractRequestBodyFun = function (text) {
	var coded = ($.parseJSON(text).metadata.requestBody);
    return decodeFun(coded);
}

// Parses the name-value pairs in a URL and formats them into JIRA markdown
var tablefyFun = function (text) {
    if (text.includes('http://b.rmntest.com/'))
        {
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
$('#decodeJbeautify').on('click', function() {modifyTextbox(decodeExtractJFun);});
$('#decode').on('click', function() {modifyTextbox(decodeFun);});
$('#extractJ').on('click', function() {modifyTextbox(extractJFun);});
$('#extractPayload').on('click', function() {modifyTextbox(extractPayloadFun);});
$('#extractRequestBody').on('click', function() {modifyTextbox(extractRequestBodyFun);});
$('#tablefy').on('click', function() {modifyTextbox(tablefyFun);});
$('#beautifyTree').on('click', function() {modifyTextbox();});













