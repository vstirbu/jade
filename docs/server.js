'use strict';

var path = require('path');
var fs = require('fs');
var marked = require('marked');
var express = require('express');
var less = require('less-file');
var browserify = require('browserify-middleware');
var CodeMirror = require('highlight-codemirror');
var highlightJade = require('jade-highlighter');
var jade = require('../');

var app = express();

var filters = jade.filters;

CodeMirror.loadMode('xml');//dep of htmlmixed
CodeMirror.loadMode('htmlmixed');
CodeMirror.loadMode('javascript');
CodeMirror.loadMode('css');

filters.jadesrc = highlightJade
filters.htmlsrc = function (html) {
  return CodeMirror.highlight(html, {name: 'htmlmixed'});
};
filters.jssrc = function (js) {
  return CodeMirror.highlight(js, {name: 'javascript'});
};
filters.csssrc = function (css) {
  return CodeMirror.highlight(css, {name: 'css'});
};

app.engine('jade', jade.renderFile);
app.set('views', __dirname + '/views');

app.locals.doctypes = jade.doctypes;

app.get('/', function (req, res, next) {
  res.render('home.jade');
});
app.get('/reference', function (req, res, next) {
  res.render('reference.jade');
});
app.get('/reference/:name', function (req, res, next) {
  res.render('reference/' + req.params.name + '.jade', {
    currentDocumentation: req.params.name
  });
});
app.get('/history', function (req, res, next) {
  res.render('history.jade', {
    history: marked(fs.readFileSync(__dirname + '/../History.md', 'utf8'))
  });
});

app.get('/client.js', browserify(__dirname + '/client/index.js'));
app.use('/style', less(__dirname + '/style/index.less'));
app.use('/style', express.static(__dirname + '/style'));
app.use('/coverage', express.static(path.resolve(__dirname + '/../coverage/lcov-report')));

app.use(function (err, req, res, next) {
  var msg = err.stack || err.toString();
  console.error(msg);
  if (res.statusCode < 400) res.statusCode = 500;
  if (err.status) res.statusCode = err.status;
  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Length', Buffer.byteLength(msg));
  if ('HEAD' == req.method) return res.end();
  res.end(msg);
});

app.listen(3000);