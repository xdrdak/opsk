const PATH_TO_DICTIONARIES = "./dictionaries";
const PATH_TO_FILE_RESTRICTIONS = "./prevent_access.txt";
const INDEX_PATH = "index.html";
const TRANSLATION_TAG_REGEX = /\{\{.*?(\}\})/mg;
const default_language = 'fr';

var http = require('http');
var urlManager = require('url');
var fileManager = require('fs');

http.createServer(function (req, res) {
	var errorCode = 200;
	var request =  urlManager.parse(req.url, true)['pathname'].substring(1);
	console.log('request made for: '+request);
	if(request.length == 0)
	{
		console.log('redirecting to: '+ INDEX_PATH);
		redirectTo(res, INDEX_PATH);
		return;
	}

	if(!isPathToIndex(request))
	{
		var relativePath = request;
		var data;
		try
		{
			if(accessAllowed(relativePath))
			{
				data = fileManager.readFileSync(relativePath);
				console.log('Getting file: '+urlManager.parse(req.url, true)['pathname']);
			}
			else
			{
				data = "You are not authorized to view this file.";
				errorCode = 403;
				console.log('Unauthorized request to file: '+urlManager.parse(req.url, true)['pathname']);
			}
	  		res.writeHead(errorCode);
			res.end(data);
			return;
		}
		catch(err)
		{
	  		res.writeHead(404);
			res.end('File not found');
		}
	}
	console.log('Connexion made from '+req.socket.remoteAddress+'\n');
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
	try
	{
		var dict = fileManager.readFileSync(PATH_TO_DICTIONARIES+'/'+language+'.js', {'encoding':'utf8'});
		console.log(dict);
		wordlist = JSON.parse(dict);
	}catch(err)
	{
		console.log('Request for unknown language: '+language);
	}

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
		return false;js
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

var accessAllowed = function(path)
{
	var realpath = fileManager.realpathSync(path);
	var rootpath = fileManager.realpathSync('.');

	if(realpath.indexOf(rootpath)!=0)
	{
		return false;
	}

	var list = fileManager.readFileSync(PATH_TO_FILE_RESTRICTIONS, {'encoding':'utf8'});
	var restr_files = list.split(/\s/);
	for(var i=0;i<restr_files.length;i++)
	{
		var pathToRestricted = fileManager.realpathSync(restr_files[i]);
		if(realpath == pathToRestricted)
			return false;
	}
	return true;
};

var isPathToIndex = function(path)
{
	try{
	var pathToIndex = fileManager.realpathSync(INDEX_PATH);
	var reqpath = fileManager.realpathSync(path);
	}
	catch(err)
	{
		return false;
	}
	return (reqpath == pathToIndex);
};

var redirectTo = function(response, url)
{
	response.writeHead(302, {
	  'Location': url
	});
	response.end();
}