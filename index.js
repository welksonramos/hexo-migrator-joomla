var xml2js = require('xml2js'),
async = require('async'),
entities = require('entities'),
tomd = require('to-markdown').toMarkdown,
request = require('request'),
util = hexo.util,
file = util.file2;

hexo.extend.migrator.register('joomla', function(args, callback){
	var source = args._.shift();
	if (!source){
		var help = [
		'Usage: hexo migrate joomla <source>',
		'',
		'For more help, you can check the docs: http://hexo.io/docs/migration.html'
		];
		console.log(help.join('\n'));
		return callback();
	}
	var log = hexo.log,
	post = hexo.post;
	log.i('Analyzing %s...', source);
	async.waterfall([
		function(next){
// URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/)){
	request(source, function(err, res, body){
		if (err) throw err;
		if (res.statusCode == 200) next(null, body);
	});
} else {
	file.readFile(source, next);
}
},
function(content, next){
	xml2js.parseString(content, next);
},
function(xml, next){
	var count = 0;
	async.each(xml.j2xml.content, function(content, next){
		if (!content){
			return next();
		}
		var title = content.title,
		id = content.id,
		slug = content.alias,
		date = content.created,
		category = content.catid,
		excerpt = content.introtext,
		content = content.fulltext,
		status = content.state,
		categories = [],
		tags = [];

		if (!title && !slug) return next();
		if (typeof content !== 'string' || title !== 'string') content = ' ';

		title = entities.decodeHTML(title),
		date = entities.decodeHTML(date),
		excerpt = entities.decodeHTML(excerpt),
		content = entities.decodeHTML(content),
		count++;

		var data = {
			title: title,
			categories: category || 'uncategorized',
			id: +id,
			date: date,
			content: tomd(excerpt).replace('/\r\n/g', '\n') || tomd(content).replace('/\r\n/g', '\n'),
			layout: status === '0' ? 'draft' : 'post',
		};

		if (slug) data.slug = slug;

		log.i('Found: %s', title);
		post.create(data, next);
	}, function(err){
		if (err) return next(err);
		log.i('%d posts migrated with success.', count);
	});
}
], callback);
});