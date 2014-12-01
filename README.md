# Joomla migrator

Migrate your blog from Joomla to [Hexo].

## Install

``` bash
$ npm install hexo-migrator-joomla --save
```

## Usage

Export your Joomla articles with [J2XML](http://extensions.joomla.org/extensions/migration-a-conversion/data-import-a-export/12816?qh=YToxOntpOjA7czo1OiJqMnhtbCI7fQ%3D%3D) component.

Execute the following command after installed. `source` is the file path or URL of Joomla export file.

``` bash
$ hexo migrate joomla <source>
```

[Hexo]: http://zespia.tw/hexo

#License

MIT