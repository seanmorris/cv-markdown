'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.View = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _View = require('curvature/base/View');

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var hljs = require('highlightjs');

var View = exports.View = function (_BaseView) {
	_inherits(View, _BaseView);

	function View(args) {
		_classCallCheck(this, View);

		var _this = _possibleConstructorReturn(this, (View.__proto__ || Object.getPrototypeOf(View)).call(this, args));

		var md = require('markdown-it')({
			highlight: function highlight(str, lang) {
				if (lang && hljs.getLanguage(lang)) {
					var match = void 0;
					var spacing = 'tab=4';

					if (match = /\n#(tab=.+)/.exec(str)) {
						spacing = match[1];
					}

					try {
						return '<pre class="hljs" data-language="' + lang + '" data-spacing = "' + spacing + '"><code>' + hljs.highlight(lang, str, true).value + '</code></pre>';
					} catch (__) {}
				}

				return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
			}
		});

		md.renderer.rules.link_open = function (tokens, idx) {
			for (var i in tokens[idx].attrs) {
				if (tokens[idx].attrs[i][0] !== 'href') {
					continue;
				}

				if (tokens[idx].attrs[i][1].substr(0, 4) == 'http') {
					return '<a href = "' + tokens[idx].attrs[i][1] + '" target = "_blank">';
				} else {
					return '<a href = "' + tokens[idx].attrs[i][1] + '">';
				}
			}
		};

		md.renderer.rules.image = function (tokens, idx) {
			var src = void 0,
			    alt = void 0;
			for (var i in tokens[idx].attrs) {
				if (tokens[idx].attrs[i][0] == 'alt') {
					alt = tokens[idx].attrs[i][1];
				} else if (tokens[idx].attrs[i][0] == 'src') {
					src = tokens[idx].attrs[i][1];
				}
			}

			if (idx == 0) {
				// return `<span class="hero" style = "background-image:url(${src})"></span>`;
			}

			return '<img src = "' + src + '" alt = "' + alt + '" />';
		};

		_this.headingMenu = { children: [], level: 0 };
		_this.headingList = {};
		_this.currentLevel = _this.headingMenu;
		_this.headerNumber = 0;
		// let defaultHeadingRenderer = md.renderer.rules.heading_open;

		md.renderer.rules.heading_open = function (tokens, idx) {
			var token = tokens[idx];
			var level = token.tag.substr(1);
			var title = tokens[idx + 1].content;

			var newItem = {
				title: title,
				children: [],
				parent: null,
				level: level
			};

			if (level > _this.currentLevel.level) {
				newItem.parent = _this.currentLevel;
			} else if (level <= _this.currentLevel.level) {
				while (level <= _this.currentLevel.level) {
					_this.currentLevel = _this.currentLevel.parent;
				}

				newItem.parent = _this.currentLevel;
			}

			_this.currentLevel.children.push(newItem);

			_this.currentLevel = newItem;

			var anchorName = encodeURIComponent('' + title.replace(/\s/g, '_'));

			// console.log(anchorName);

			return '<' + token.tag + ' id = "' + anchorName + '">';

			// return defaultHeadingRenderer(tokens, idx);
		};

		_this.md = md;
		_this.args.attribution = 0;
		_this.args.articleId = 0;

		_this.args.source = _this.args.source || '';

		_this.template = _this.renderMarkdown(_this.args.source);
		return _this;
	}

	_createClass(View, [{
		key: 'renderMarkdown',
		value: function renderMarkdown(source) {
			this.headingMenu = { children: [], level: 0 };
			this.currentLevel = this.headingMenu;

			var match = void 0,
			    preRegex = /\{\{\{(.+)\}\}\}/,
			    postRegex = /\{\{(.+)\}\}/;

			while (match = preRegex.exec(source)) {
				// let replace = '!!!';
				var replace = match[0];

				// let splitMatch = match[1].split(/(?:(?:\\\\)+?):|(?<!\\):/);
				var splitMatch = match[1].split(/\:/);

				console.log(splitMatch);

				if (!this[splitMatch[0]]) {
					console.error(splitMatch[0], 'not defined on', this);
				} else {
					replace = this[splitMatch[0]].apply(this, _toConsumableArray(splitMatch.slice(1)));
				}

				source = source.replace(preRegex, replace);
			}

			var rendered = this.md.render(source);

			while (match = postRegex.exec(rendered)) {
				rendered = rendered.replace(postRegex, this.getComponent(match[1]));
			}

			var menuProcessor = function menuProcessor(level) {
				var headingList = {};

				for (var i in level.children) {
					var child = level.children[i];

					headingList[child.title] = child.title;

					if (child.children.length) {
						headingList[child.title] = menuProcessor(child);
					}
				}

				return headingList;
			};

			this.args.headingMenu = menuProcessor(this.headingMenu);

			// console.log(this.args.headingMenu);

			return rendered;
		}
	}, {
		key: 'getComponent',
		value: function getComponent(componentId) {
			// return `[ !!! ${componentId} !!! ]`;
			// this.args[componentId] = 1;

			var _componentId$split = componentId.split(':'),
			    _componentId$split2 = _slicedToArray(_componentId$split, 2),
			    className = _componentId$split2[0],
			    placeholder = _componentId$split2[1];

			if (!placeholder) {
				placeholder = className;
			}

			try {
				var classObj = this.stringToClass(className);

				// console.log(classObj);

				this.args[placeholder] = new classObj({
					parent: this
				});

				this.args[placeholder].parent = this;

				return '[[' + placeholder + ']]';
			} catch (error) {
				console.error(error);
				return '[ !!! ' + componentId + ' !!! ]';
			}
		}
	}, {
		key: 'loadRemote',
		value: function loadRemote(url) {
			console.log(url);
		}
	}]);

	return View;
}(_View.View);