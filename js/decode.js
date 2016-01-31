'use strict';

// Variables
var $textBox = $('#textBox');


// Functions

// Decodes a URL
function decode() {
	$textBox.val( decodeURIComponent( $textBox.val() ));
	beautify();
}

// Beautifies JSON
function beautify() {
	var json_object = JSON.parse( $textBox.val() ) || '{"none":"none"}';
	$textBox.val( JSON.stringify( json_object, 1, '  ' ));
}

// Parses the name-value pairs in a URL and formats them into JIRA markdown
function tablefy() {
	var uri = URI.parseQuery($textBox.val());
	var string = "";
	for (var key in uri) {
		if ( uri.hasOwnProperty( key )) {
			string+=( "|*" + key + ":* | " + uri[key] + " | \n" );
		}
	}
	$textBox.val( string.replace( 'http://b.rmntest.com/', '' ));
};

function extractPayload() {
	$textBox.val( $.parseJSON( $textBox.val() ).query.payload );
	beautify();
}

function extractJ() {
	$textBox.val( $.parseJSON( $textBox.val() ).j );
	beautify();
}

function extractRequestBody() {
	$textBox.val( $.parseJSON( $textBox.val() ).metadata.requestBody );
	decode();
	beautify();
}

function decodeJbeautify() {
	decode();
	extractJ();
	beautify();
}

function viewJsonTree() {
	var jjson = $textBox.val() || '{"none":"none"}';
	$('#jjson').jJsonViewer(jjson);
}

// jQuery Event Listener
// http://api.jquery.com/on/

$('#decode').on('click', decode);
$('#tablefy').on('click', tablefy);
$('#beautify').on('click', beautify);
$('#extractPayload').on('click', extractPayload)
$('#extractJ').on('click', extractJ);
$('#extractRequestBody').on('click', extractRequestBody);
$('#decodeJbeautify').on('click', decodeJbeautify);
$('#viewJsonTree').on('click', viewJsonTree);
