'use strict';

// Variables
var $textBox = $('#textBox');


// Functions

// Beautifies JSON
function beautify() {
	var json_object = JSON.parse( $textBox.val() ) || '{"none":"none"}';
	$textBox.val( JSON.stringify( json_object, 1, '  ' ));
}

function viewJsonTree() {
	var jjson = $textBox.val() || '{"none":"none"}';
	$('#jjson').jJsonViewer(jjson);
}

// Beautififes and Displays JSON Tree
function beautifyTree() {
	beautify();
	viewJsonTree();
}

// Decodes a URL
function decode() {
	$textBox.val( decodeURIComponent( $textBox.val() ));
	beautifyTree();
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
	beautifyTree();
}

function extractJ() {
	$textBox.val( $.parseJSON( $textBox.val() ).j );
	beautifyTree();
}

function extractRequestBody() {
	$textBox.val( $.parseJSON( $textBox.val() ).metadata.requestBody );
	decode();
	// beautifyTree();
}

function decodeJbeautify() {
	decode();
	extractJ();
	beautifyTree();
}

function samplePayload() {
	$textBox.val("%7B%22k%22%3A%22analytics.common.discover.ViewPage%22%2C%22s%22%3A%22j-2.66.0%22%2C%22j%22%3A%22%7B%5C%22e%5C%22%3A%7B%5C%22p%5C%22%3A%5C%22www%5C%22%2C%5C%22i%5C%22%3A%5C%22RV6KLXKO7RAADB5BPQCMPHWAFI%5C%22%2C%5C%22ti%5C%22%3A%5C%222016-02-08T21%3A53%3A29.627Z%5C%22%7D%2C%5C%22c%5C%22%3A%7B%5C%22df%5C%22%3A%5C%22KNT4C7YC7ZHGLATR74W7HFAPKM%5C%22%2C%5C%22bs%5C%22%3A%5C%22bXLhNtc3AC56b90e587061d%5C%22%2C%5C%22li%5C%22%3Afalse%2C%5C%22up%5C%22%3A%5C%22%2F%5C%22%2C%5C%22pn%5C%22%3A%5C%22rmn%5C%22%2C%5C%22sh%5C%22%3A1080%2C%5C%22sw%5C%22%3A1920%2C%5C%22ab%5C%22%3A%5B%7B%5C%22tc%5C%22%3A%5C%22veg%5C%22%2C%5C%22tv%5C%22%3A%5C%22StackableGiftCardPostClickModal%5C%22%7D%5D%2C%5C%22f%5C%22%3A%5B%5C%22armssspcl%5C%22%2C%5C%22cnqst_pasv%5C%22%2C%5C%22dfpdstoldr%5C%22%2C%5C%22dfpdstolft%5C%22%2C%5C%22dfpmhpfeat%5C%22%2C%5C%22dfpmstobnr%5C%22%2C%5C%22instorefrm%5C%22%2C%5C%22mod_enbld%5C%22%2C%5C%22MwUseDHPF%5C%22%2C%5C%22outclickV2%5C%22%2C%5C%22overlord%5C%22%2C%5C%22ovo_vote%5C%22%2C%5C%22returnmdl%5C%22%2C%5C%22rmnapi_en%5C%22%2C%5C%22shoplisthd%5C%22%2C%5C%22sucomnionl%5C%22%2C%5C%22weeklyads%5C%22%5D%2C%5C%22ss%5C%22%3A%5C%22home%5C%22%2C%5C%22rf%5C%22%3A%5C%22null%5C%22%2C%5C%22bf%5C%22%3A%5C%22Chrome%5C%22%2C%5C%22bv%5C%22%3A%5C%2250.0.2644.0%5C%22%2C%5C%22l%5C%22%3A%5C%22en-US%5C%22%2C%5C%22pv%5C%22%3A%5C%222FQHIP4RXZGJLJC2IZFUDWSL2U%5C%22%7D%7D%22%2C%22v%22%3A%225.4.7%22%2C%22u%22%3A%222.0.0%22%7D")
}

function sampleBeacon() {
	$textBox.val("http:\/\/b.rmntest.com\/__wsm.gif?wsme=pageview&p_li=not+logged+in&p_lgi=&page=%2F&pg_d=nocoupons&chan=%2F&serv=www.rmntest.com&pg_t=&site=rmn&impr=7676952%3Ahome%3AKTGAQQ7EWBYUQSPHTF2QAAAAAA%2C7276000%3Ahome%2C5711009%3Ahome%2C6309005%3Ahome%2C6956919%3Ahome%2C7568752%3Ahome%2C7438261%3Ahome%2C6802024%3Ahome%2C6307024%3Ahome%2C6229985%3Ahome%2C7484300%3Ahome%2C6797342%3Ahome%2C7217046%3Afeat%2C3791083%3Afeat%2C7568752%3Afeat%2C7723767%3Astan%3AK24NOHPEWA5ZJEEMHB7AAAAAAA%2C7344351%3Astan%2C7178244%3Astan%2C6956919%3Astan%2C7522620%3Astan%2C6229985%3Astan&owenPageType=home&fruit=armssspcl%2Ccnqst_pasv%2Cdfpdstoldr%2Cdfpdstolft%2Cdfpmhpfeat%2Cdfpmstobnr%2Cinstorefrm%2Cmod_enbld%2CMwUseDHPF%2CoutclickV2%2Coverlord%2Covo_vote%2Creturnmdl%2Crmnapi_en%2Cshoplisthd%2Csucomnionl%2Cweeklyads&veg=StackableGiftCardPostClickModal&veg_vw=control&veg_cw=control&veg_cr=control&g=&opmz=&topsites=false&rca_m=false&v_id=bXLhNtc3AC&path=%2F&lang=en-US&pg_cp=12&camp=no_campaign&pg_l=1506&navigationStart=1454968408400&unloadEventStart=0&unloadEventEnd=0&redirectStart=0&redirectEnd=0&fetchStart=1454968408657&domainLookupStart=1454968408657&domainLookupEnd=1454968408657&connectStart=1454968408657&connectEnd=1454968408657&secureConnectionStart=0&requestStart=1454968408663&responseStart=1454968408881&responseEnd=1454968408932&domLoading=1454968408884&domInteractive=0&domContentLoadedEventStart=0&domContentLoadedEventEnd=0&domComplete=0&loadEventStart=0&loadEventEnd=0")
}

function sampleKibana() {
	$textBox.val("{\"schema\":{\"version\":\"5.4.7\",\"key\":\"analytics.common.discover.ViewPage\"},\"owen\":{\"event\":{\"eventVersion\":\"5.4.7\",\"eventPlatform\":\"www\",\"eventCategory\":\"discover\",\"eventAction\":\"view\",\"eventName\":\"page\",\"eventInstanceUuid\":\"CBN2XC3NABDZBAXSR4PJCUS64Q\",\"eventTimestamp\":\"2016-02-08T20:18:45Z\"},\"context\":{\"session\":\"bXLhNtc3AC56b8ebdb5a8ce\",\"loggedInFlag\":false,\"deviceFingerprint\":\"KNT4C7YC7ZHGLATR74W7HFAPKM\",\"userAgent\":\"Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/50.0.2644.0 Safari\/537.36\",\"screenWidth\":1920,\"featureFlags\":[\"armssspcl\",\"cnqst_pasv\",\"dfpdstoldr\",\"dfpdstolft\",\"dfpmhpfeat\",\"dfpmstobnr\",\"instorefrm\",\"mod_enbld\",\"MwUseDHPF\",\"outclickV2\",\"overlord\",\"ovo_vote\",\"returnmdl\",\"rmnapi_en\",\"shoplisthd\",\"sucomnionl\",\"weeklyads\"],\"city\":\"Wimberley\",\"propertyName\":\"rmn\",\"custom\":{\"legacy\":{\"GAPreviousSessionTimestamp\":1454959581,\"GAVisitorId\":30927669,\"GAInitialVisitTimestamp\":1454959581,\"GACurrentSessionTimestamp\":1454959581},\"kibana\":{\"location\":\"30.0279,-98.1179\"}},\"environment\":\"test\",\"experiment\":{\"0\":{\"variation\":\"StackableGiftCardPostClickModal\",\"campaign\":\"veg\"}},\"browserFamily\":\"Chrome\",\"latitude\":30.0279,\"performance\":{\"resourceTiming\":{\"0\":{\"entryType\":\"resource\"}}},\"marketing\":{\"source\":\"(direct)\",\"medium\":\"(none)\",\"campaign\":\"(direct)\"},\"viewInstanceUuid\":\"PGUQVSCHX5EXDGOS2FC5DNVHOI\",\"osFamily\":\"OS X\",\"pageType\":\"store\",\"osVersion\":\"10.10.5\",\"dma\":635,\"browserVersion\":\"50.0.2644.0\",\"language\":\"en-US\",\"deviceCategory\":\"personal computer\",\"referrer\":\"null\",\"region\":\"TX\",\"osName\":\"OS X 10.10 Yosemite\",\"longitude\":-98.1179,\"screenHeight\":1080,\"country\":\"US\",\"pageName\":\"\/view\/ihop.com\",\"ipAddress\":\"38.122.48.218\"}},\"cookie\":{\"out_originalLanding\":\"http:\/\/www.rmntest.com\/view\/applebees.com\",\"userFlashVersion\":\"bXLhNtc3AC\",\"visitor\":\"SnnZYaLjrV\",\"out_referrer\":\"null\",\"session\":\"bXLhNtc3AC56b8ebdb5a8ce\",\"knifeset\":\"Ydp:0\",\"country_code\":\"US\",\"deviceFingerprint\":\"KNT4C7YC7ZHGLATR74W7HFAPKM\",\"visit_count\":\"1\",\"quick_feedback_count\":\"2\",\"traceId\":\"56b8f822dda90\",\"__ssid\":\"e5cc6440-608c-4f60-b3b5-df0579d8c954\",\"rmn-fc\":\"bXLhNtc3AC56b8ebdb5a8ce56b8ee079f341\",\"dma_code\":\"635\",\"out_originalReferrer\":\"null\",\"__utmz\":\"224467097.1454959581.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none)\",\"userQualifier\":\"HI3K25ABEBHIZJNLSINFZ6XBBA\",\"s_camp\":\"no_campaign\",\"out_referrerLanding\":\"http:\/\/www.rmntest.com\/view\/ihop.com?refresh=1&slice=StackableGiftCardPostClickModal\",\"__utmt\":\"1\",\"slice\":\"StackableGiftCardPostClickModal\",\"f_out\":\"1454959599417\",\"overlord_viewInstanceUuid\":\"PGUQVSCHX5EXDGOS2FC5DNVHOI\",\"__utma\":\"224467097.30927669.1454959581.1454959581.1454959581.1\",\"__utmb\":\"224467097.57.9.1454960151327\",\"__utmc\":\"224467097\",\"__gads\":\"ID=3da38cb4fd791a62:T=1454959582:S=ALNI_MbJ1RPeZ7WSYiQjiGVdZnUaomxvsA\",\"rqid\":\"bXLhNtc3AC56b8ebdb5a8ce56b8f82312ed4\",\"qa_slice\":\"StackableGiftCardPostClickModal\"},\"query\":{\"uriVersion\":\"2.0.0\",\"schemaVersion\":\"5.4.7\",\"payload\":\"{\\\"e\\\":{\\\"p\\\":\\\"www\\\",\\\"i\\\":\\\"CBN2XC3NABDZBAXSR4PJCUS64Q\\\",\\\"ti\\\":\\\"2016-02-08T20:18:45.251Z\\\"},\\\"c\\\":{\\\"df\\\":\\\"KNT4C7YC7ZHGLATR74W7HFAPKM\\\",\\\"bs\\\":\\\"bXLhNtc3AC56b8ebdb5a8ce\\\",\\\"li\\\":false,\\\"up\\\":\\\"\/view\/ihop.com\\\",\\\"pn\\\":\\\"rmn\\\",\\\"sh\\\":1080,\\\"sw\\\":1920,\\\"ab\\\":[{\\\"tc\\\":\\\"veg\\\",\\\"tv\\\":\\\"StackableGiftCardPostClickModal\\\"}],\\\"f\\\":[\\\"armssspcl\\\",\\\"cnqst_pasv\\\",\\\"dfpdstoldr\\\",\\\"dfpdstolft\\\",\\\"dfpmhpfeat\\\",\\\"dfpmstobnr\\\",\\\"instorefrm\\\",\\\"mod_enbld\\\",\\\"MwUseDHPF\\\",\\\"outclickV2\\\",\\\"overlord\\\",\\\"ovo_vote\\\",\\\"returnmdl\\\",\\\"rmnapi_en\\\",\\\"shoplisthd\\\",\\\"sucomnionl\\\",\\\"weeklyads\\\"],\\\"ss\\\":\\\"store\\\",\\\"rf\\\":\\\"null\\\",\\\"bf\\\":\\\"Chrome\\\",\\\"bv\\\":\\\"50.0.2644.0\\\",\\\"l\\\":\\\"en-US\\\",\\\"pv\\\":\\\"PGUQVSCHX5EXDGOS2FC5DNVHOI\\\"}}\",\"sdkId\":\"j-2.66.0\",\"schemaKey\":\"analytics.common.discover.ViewPage\"},\"metadata\":{\"status\":\"200\",\"cookieString\":\"dma_code=635; __gads=ID=3da38cb4fd791a62:T=1454959582:S=ALNI_MbJ1RPeZ7WSYiQjiGVdZnUaomxvsA; country_code=US; out_originalLanding=http:\/\/www.rmntest.com\/view\/applebees.com; quick_feedback_count=2; f_out=1454959599417; __ssid=e5cc6440-608c-4f60-b3b5-df0579d8c954; rmn-fc=bXLhNtc3AC56b8ebdb5a8ce56b8ee079f341; s_camp=no_campaign; out_originalReferrer=null; out_referrer=null; userFlashVersion=bXLhNtc3AC; deviceFingerprint=KNT4C7YC7ZHGLATR74W7HFAPKM; userQualifier=HI3K25ABEBHIZJNLSINFZ6XBBA; visit_count=1; session=bXLhNtc3AC56b8ebdb5a8ce; knifeset=Ydp%3A0; traceId=56b8f822dda90; rqid=bXLhNtc3AC56b8ebdb5a8ce56b8f82312ed4; qa_slice=StackableGiftCardPostClickModal; slice=StackableGiftCardPostClickModal; __utmt=1; __utma=224467097.30927669.1454959581.1454959581.1454959581.1; __utmb=224467097.57.9.1454960151327; __utmc=224467097; __utmz=224467097.1454959581.1.1.utmcsr=(direct)|utmccn=(direct)|utmcmd=(none); overlord_viewInstanceUuid=PGUQVSCHX5EXDGOS2FC5DNVHOI; out_referrerLanding=http:\/\/www.rmntest.com\/view\/ihop.com?refresh=1&slice=StackableGiftCardPostClickModal; visitor=SnnZYaLjrV\",\"analyticsTopologyFinishTime\":\"2016-02-08T20:18:46.527Z\",\"requestMethod\":\"POST\",\"sequenceNumber\":\"49558137242392046909779546766017722178167446169234440226\",\"remoteAddress\":\"38.122.48.218\",\"serverAddress\":\"172.17.0.83\",\"xForwardedForHeader\":\"38.122.48.218, 10.203.239.215\",\"xRmnDate\":\"-\",\"queryString\":\"\",\"requestBody\":\"%7B%22k%22%3A%22analytics.common.discover.ViewPage%22%2C%22s%22%3A%22j-2.66.0%22%2C%22j%22%3A%22%7B%5C%22e%5C%22%3A%7B%5C%22p%5C%22%3A%5C%22www%5C%22%2C%5C%22i%5C%22%3A%5C%22CBN2XC3NABDZBAXSR4PJCUS64Q%5C%22%2C%5C%22ti%5C%22%3A%5C%222016-02-08T20%3A18%3A45.251Z%5C%22%7D%2C%5C%22c%5C%22%3A%7B%5C%22df%5C%22%3A%5C%22KNT4C7YC7ZHGLATR74W7HFAPKM%5C%22%2C%5C%22bs%5C%22%3A%5C%22bXLhNtc3AC56b8ebdb5a8ce%5C%22%2C%5C%22li%5C%22%3Afalse%2C%5C%22up%5C%22%3A%5C%22%2Fview%2Fihop.com%5C%22%2C%5C%22pn%5C%22%3A%5C%22rmn%5C%22%2C%5C%22sh%5C%22%3A1080%2C%5C%22sw%5C%22%3A1920%2C%5C%22ab%5C%22%3A%5B%7B%5C%22tc%5C%22%3A%5C%22veg%5C%22%2C%5C%22tv%5C%22%3A%5C%22StackableGiftCardPostClickModal%5C%22%7D%5D%2C%5C%22f%5C%22%3A%5B%5C%22armssspcl%5C%22%2C%5C%22cnqst_pasv%5C%22%2C%5C%22dfpdstoldr%5C%22%2C%5C%22dfpdstolft%5C%22%2C%5C%22dfpmhpfeat%5C%22%2C%5C%22dfpmstobnr%5C%22%2C%5C%22instorefrm%5C%22%2C%5C%22mod_enbld%5C%22%2C%5C%22MwUseDHPF%5C%22%2C%5C%22outclickV2%5C%22%2C%5C%22overlord%5C%22%2C%5C%22ovo_vote%5C%22%2C%5C%22returnmdl%5C%22%2C%5C%22rmnapi_en%5C%22%2C%5C%22shoplisthd%5C%22%2C%5C%22sucomnionl%5C%22%2C%5C%22weeklyads%5C%22%5D%2C%5C%22ss%5C%22%3A%5C%22store%5C%22%2C%5C%22rf%5C%22%3A%5C%22null%5C%22%2C%5C%22bf%5C%22%3A%5C%22Chrome%5C%22%2C%5C%22bv%5C%22%3A%5C%2250.0.2644.0%5C%22%2C%5C%22l%5C%22%3A%5C%22en-US%5C%22%2C%5C%22pv%5C%22%3A%5C%22PGUQVSCHX5EXDGOS2FC5DNVHOI%5C%22%7D%7D%22%2C%22v%22%3A%225.4.7%22%2C%22u%22%3A%222.0.0%22%7D\",\"derivedEventInstanceId\":\"2016-02-08T20:18:45Z_CBN2XC3NABDZBAXSR4PJCUS64Q\",\"host\":\"a.rmntest.com\",\"partitionKey\":\"2c9a45e9-83e3-4218-ba58-3f41c72307e3\",\"referer\":\"http:\/\/www.rmntest.com\/view\/ihop.com?refresh=1&slice=StackableGiftCardPostClickModal\",\"serviceTime\":\"0.001\",\"analyticsTopologyStartTime\":\"2016-02-08T20:18:46.525Z\",\"userAgent\":\"Mozilla\/5.0 (Macintosh; Intel Mac OS X 10_10_5) AppleWebKit\/537.36 (KHTML, like Gecko) Chrome\/50.0.2644.0 Safari\/537.36\",\"collectorTimestamp\":\"2016-02-08T20:18:45Z\",\"authorization\":\"-\",\"clientTimestamp\":\"2016-02-08T20:18:45.251Z\"},\"sdk\":{\"version\":\"2.66.0\",\"name\":\"javascript\"}}")
}


// jQuery Event Listener
// http://api.jquery.com/on/

$('#decode').on('click', decode);
$('#tablefy').on('click', tablefy);
$('#extractPayload').on('click', extractPayload)
$('#extractJ').on('click', extractJ);
$('#extractRequestBody').on('click', extractRequestBody);
$('#decodeJbeautify').on('click', decodeJbeautify);
$('#beautifyTree').on('click', beautifyTree);

// for testing
$('#post').on('click', samplePayload);
$('#beacon').on('click', sampleBeacon);
$('#kibana').on('click', sampleKibana);
