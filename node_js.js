const PATH_TO_DICTIONARIES = "./dictionaries";
const INDEX_PATH = "./index.html";
const TRANSLATION_TAG_REGEX = /\{\{.*?(\}\})/mg;
const default_language = 'fr';

var http = require('http');
var urlManager = require('url');
var fileManager = require('fs');

http.createServer(function (req, res) {
	if(urlManager.parse(req.url, true)['pathname']!='/')
	{

		var data = fileManager.readFileSync(urlManager.parse(req.url, true)['pathname'].substring(1));
		console.log('Getting file: '+urlManager.parse(req.url, true)['pathname']);
		res.end(data);
		return;
	}
	console.log('Connexion made from '+req.socket.remoteAddress+'\n');
  res.writeHead(200, {'Content-Type': 'text/html'});
  var data = run(req, res);
  res.end(data);
}).listen(80, '127.0.0.1');

var run = function(req, res)
{
	var urlString = req.url;
	var language = extractLanguageFromRequest(urlString);
	var wordlist;

	if(!language)
	{
		language='fr';
	}
	var dict = fileManager.readFileSync(PATH_TO_DICTIONARIES+'/'+language+'.js', {'encoding':'utf8'});
	console.log(dict);
	wordlist = JSON.parse(dict);

	if(typeof wordlist == 'undefined')
	{
		wordlist = {};
	}
	console.log(wordlist);
	var htmlData;
	try{
	htmlData = fileManager.readFileSync(INDEX_PATH, {'encoding': 'utf8'});
	}
	catch(err)
	{
		return '<h3>error occured!!</h3>'+err.message;
	}

	var translationTags = htmlData.match(TRANSLATION_TAG_REGEX);
	for(var i=0;i<translationTags.length;i++)
	{
		var baseText = translationTags[i].substring(2, translationTags[i].length-2);
		var translatedText = wordlist[baseText];
		if(typeof translatedText == 'undefined')
		{
			htmlData = htmlData.replace(translationTags[i], baseText);
		}
		else
		{
			htmlData = htmlData.replace(translationTags[i], translatedText);
		}
	}

	return htmlData;
};

var extractLanguageFromRequest = function(urlString)
{
	var url = urlManager.parse(urlString, true);
	var lang = url.query['lang'];
	if(typeof lang == 'undefined')
	{
		return false;
	}
	console.log(lang);
	console.log(lang.match(/^[a-zA-Z_]+$/));
	//make sure no hacking is done by using '/' or '..' to access different folders.
	if(lang.match(/^[a-zA-Z_]+$/))
	{
		//only contains letters
		return lang;
	}
	else
	{
		return false;
	}
};