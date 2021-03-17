/*
 * hexo-migrator-joomla
 * https://github.com/welksonramos/hexo-migrator-joomla
 *
 * Copyright (c) 2015-present, Welkson Ramos
 * Licensed under the MIT license.
 */

"use strict";

const xml2js = require("xml2js");
const async = require("async");
const entities = require("entities");
const TurndownService = require("turndown");
const request = require("request");
const file = require("fs");

const tdS = new TurndownService({});

hexo.extend.migrator.register("joomla", (args, callback) => {
  const source = args._.shift();

  if (!source){
    const help = [
      `Usage: hexo migrate joomla <source>,
      For more help, you can check the docs: http://hexo.io/docs/migration.html`
    ];

    console.log(help.join("\n"));
    return callback();
  }

  const log = hexo.log;
  const post = hexo.post;

  log.i("Analyzing %s...", source);

  async.waterfall([
    function (next){
      // URL regular expression from: http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the
      if (source.match(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=\+\$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=\+\$,\w]+@)[A-Za-z0-9.-]+)((?:\/[\+~%\/.\w-_]*)?\??(?:[-\+=&;%@.\w_]*)#?(?:[.\!\/\\w]*))?)/)){

        request(source, (err, res, body) => {
          if (err) throw err;
          if (res.statusCode === 200) next(null, body);
        });
      } else {
        file.readFile(source, next);
      }
    },

    function (content, next){
      xml2js.parseString(content, next);
    },

    function (xml, next){
      let count = 0;

      async.each(xml.j2xml.content, (item, next) => {

        if (!item){
          return next();
        }

        let title = item.title;
        let id = item.id;
        let slug = item.alias;
        let date = item.created;
        let category = item.catid;
        let excerpt = item.introtext;
        let content = item.fulltext;
        let status = item.state;
        let categories = [];
        let tags = [];

        if (!title && !slug) return next();

        title = entities.decodeHTML(title),
        date = entities.decodeHTML(date),
        excerpt = entities.decodeHTML(excerpt),
        content = entities.decodeHTML(content),
        count++;

        if (typeof content !== "string" || typeof title !== "string") content = " ";

        const data = {
          title: title,
          categories: category || "uncategorized",
          id: +id,
          date: date,
          content: tdS.turndown(excerpt).replace("/\r\n/g", "\n") + tdS.turndown(content).replace("/\r\n/g", "\n"),
          layout: status === "0" ? "draft" : "post",
        };

        if (slug) data.slug = slug;

        log.i("Found: %s", title);
        post.create(data, next);
      }, err => {
        if (err) return next(err);

        log.i("%d posts migrated with success! ✔", count);
      });
    }
  ], callback);
});
