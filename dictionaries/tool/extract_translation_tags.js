const PATH_TO_DICTIONARIES = ".";
const INDEX_PATH = "../../index.html";
const RESULT_PATH = "../extractions.js";
const TRANSLATION_TAG_REGEX = /\{\{.*?(\}\})/mg;

var fileManager = require('fs');

var main = function(){
	var htmlData = fileManager.readFileSync(INDEX_PATH, {'encoding': 'utf8'});

	var translationTags = htmlData.match(TRANSLATION_TAG_REGEX);

	var out="";
	out+="{";
	out+="\r\n";
	var alreadyFoundStuff = {};
	for(var i=0;i<translationTags.length;i++)
	{
		var baseText = translationTags[i].substring(2, translationTags[i].length-2);
		if(typeof alreadyFoundStuff[baseText] == 'undefined')
		{
			out+='"';
			out+=baseText;
			out+='"';
			out+=':';
			out+='"';
			out+=baseText;
			out+='"';
			if(i != translationTags.length-1)
			{
				out+=',';
			}
			out+="\r\n";
			alreadyFoundStuff[baseText] = true;
		}
	}
	out+="}";

	fileManager.writeFileSync(RESULT_PATH, out);
};

main();