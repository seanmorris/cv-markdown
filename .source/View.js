import { View as BaseView } from 'curvature/base/View';

let hljs = require('highlightjs');

export class View extends BaseView
{
	constructor(args)
	{
		super(args);

		let md = require('markdown-it')({
			highlight: function (str, lang)
			{
				if (lang && hljs.getLanguage(lang))
				{
					let match;
					let spacing = 'tab=4';

					if(match = /\n#(tab=.+)/.exec(str))
					{
						spacing = match[1];
					}

					try
					{
						return `<pre class="hljs" data-language="${lang}" data-spacing = "${spacing}"><code>${
							hljs.highlight(lang, str, true).value
						}</code></pre>`;
					}
					catch (__){}
				}
				
				return '<pre class="hljs"><code>'
					+ md.utils.escapeHtml(str)
					+ '</code></pre>';
			}
		});


		md.renderer.rules.link_open = (tokens, idx) => {
			for(let i in tokens[idx].attrs)
			{
				if(tokens[idx].attrs[i][0] !== 'href')
				{
					continue;
				}

				if(tokens[idx].attrs[i][1].substr(0, 4) == 'http')
				{
					return `<a href = "${tokens[idx].attrs[i][1]}" target = "_blank">`
				}
				else
				{
					return `<a href = "${tokens[idx].attrs[i][1]}">`
				}
			}
		};

		md.renderer.rules.image = (tokens, idx) => {
			let src, alt;
			for(let i in tokens[idx].attrs)
			{
				if(tokens[idx].attrs[i][0] == 'alt')
				{
					alt = tokens[idx].attrs[i][1];
				}
				else if(tokens[idx].attrs[i][0] == 'src')
				{
					src = tokens[idx].attrs[i][1];
				}
			}

			if(idx == 0)
			{
				return `<div class="hero" style = "background-image:url(${src})"></div>`;
			}

			return `<img src = "${src}" alt = "${alt}" />`;
		};

		this.headingMenu  = {children: [], level: 0};
		this.headingList  = {};
		this.currentLevel = this.headingMenu;
		this.headerNumber = 0;
		// let defaultHeadingRenderer = md.renderer.rules.heading_open;

		md.renderer.rules.heading_open = (tokens, idx) => {
			let token = tokens[idx];
			let level = token.tag.substr(1);
			let title = tokens[idx+1].content;

			let newItem = {
				title
				, children: []
				, parent: null
				, level
			};

			if(level > this.currentLevel.level)
			{
				newItem.parent = this.currentLevel;
			}
			else if(level <= this.currentLevel.level)
			{
				while(level <= this.currentLevel.level)
				{
					this.currentLevel = this.currentLevel.parent;
				}

				newItem.parent = this.currentLevel;
			}

			this.currentLevel.children.push(newItem);

			this.currentLevel = newItem;

			let anchorName = encodeURIComponent(
				`${title.replace(/\s/g, '_')}`
			);

			// console.log(anchorName);
			
			return `<${token.tag} id = "${anchorName}">`;

			// return defaultHeadingRenderer(tokens, idx);
		};

		this.md = md;
		this.args.attribution = 0;
		this.args.articleId = 0;

		this.args.source = this.args.source || '';

		this.template = this.renderMarkdown(this.args.source);
	}

	renderMarkdown(source)
	{
		this.headingMenu  = {children: [], level: 0};
		this.currentLevel = this.headingMenu;
		
		let match
			, preRegex = /\{\{\{(.+)\}\}\}/
			, postRegex = /\{\{(.+)\}\}/;

		while(match = preRegex.exec(source))
		{
			// let replace = '!!!';
			let replace = match[0];

			let splitMatch = match[1].split(/(?:(?:\\\\)+?):|(?<!\\):/);

			console.log(splitMatch);

			if(!this[splitMatch[0]])
			{
				console.error(splitMatch[0], 'not defined on', this);				
			}
			else
			{
				replace = this[splitMatch[0]](...splitMatch.slice(1));
			}

			source = source.replace(preRegex, replace);
		}

		let rendered = this.md.render(source);

		while(match = postRegex.exec(rendered))
		{
			rendered = rendered.replace(postRegex, this.getComponent(match[1]));
		}

		let menuProcessor = level => {
			let headingList = {};

			for(let i in level.children)
			{
				let child = level.children[i];

				headingList[ child.title ] = child.title;

				if(child.children.length)
				{
					headingList[ child.title ] = menuProcessor(child);
				}
			}

			return headingList;
		};

		this.args.headingMenu = menuProcessor(this.headingMenu);

		// console.log(this.args.headingMenu);

		return rendered;
	}

	getComponent(componentId)
	{
		return `[ !!! ${componentId} !!! ]`;
		// this.args[componentId] = 1;

		let [className, placeholder] = componentId.split(':');

		if(!placeholder)
		{
			placeholder = className;
		}

		try {
			let classObj = this.stringToClass(className);
		
			// console.log(classObj);
			
			this.args[placeholder] = new classObj({
				parent: this
			});

			this.args[placeholder].parent = this;

			return `[[${placeholder}]]`;			
		}
		catch (error) {
			console.error(error);
			return `[ !!! ${componentId} !!! ]`;
		}
	}

	loadRemote(url)
	{
		console.log(url);
	}
}
