var editor = (function() {
	'use strict';

	String.prototype.trim = function(){ return this.replace(/^\s+|\s+$/g, ''); };
	
	function get_text(el) {
		var ret = " ";
		var length = el.childNodes.length;
		for (var i = 0; i < length; i++) {
			var node = el.childNodes[i];
			if (node.nodeType != 8) {
				if (node.nodeType != 1) {
					// Strip white space.
					ret += node.nodeValue;
				} else {
					ret += get_text(node);
				}
			}
		}
		return ret.trim();
	}

	function hasParent(element, parent) {
		if (element.tagName.toLowerCase() == 'html') {
			return false; }
	
		if (element.parentNode.tagName.toLowerCase() == parent.toLowerCase()) {
			return true;
		} else {
			return hasParent(element.parentNode, parent);
		}
	}
	
	function hasParentWithID(element, parent) {
		if (element.tagName.toLowerCase() == 'html') {
			return false; }
	
		if (element.parentNode.id.toLowerCase() == parent.toLowerCase()) {
			return true;
		} else {
			return hasParentWithID(element.parentNode, parent);
		}
	}
	
	function hasNode(nodeList, name) {
		return !!nodeList[name];
	}
	
	function findNodes(element) {
		var nodeNames = {};
	
		while (element.parentNode) {
			nodeNames[element.nodeName] = true;
			element = element.parentNode;
	
			if (element.nodeName === 'A') {
				nodeNames.url = element.href;
			}
		}
	
		return nodeNames;
	}
	
	function supportsHtmlStorage() {
		try {
			return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
			return false;
		}
	}

	//
	// ToolTip Element
	//
	var ToolTip = function(id, editor) {
		this.id = id;
		this.el = document.getElementById(this.id);
		this.timeoutClose = null;
		this.setMode('buttons');
		this.isOpen = false;
		this.url = null;
		this.linkSelection = null;
		this.editor = editor;
		
		var that = this;
		this.el.addEventListener('click', function(event) {
			event.stopPropagation();
			event.stopImmediatePropagation();
			
			if (event.target.attributes['data-action'] && ['link', 'bold', 'italic', 'quote'].indexOf(event.target.attributes['data-action'].value) > -1) {
				var action = event.target.attributes['data-action'].value;
				
				if (action != 'link') {
					that.actionToggle(action); }
				that.runAction(action);
				that.updatePosition();
			}
			
			if (event.target.tagName.toLowerCase() == 'input') {				
				event.target.focus();
				event.target.select();
			}
		});
	};
	
	ToolTip.prototype.runAction = function(action) {
		switch (action) {
			case 'bold':
			case 'italic':
				document.execCommand(action, false);
				break;
			case 'quote':
				var nodeNames = findNodes(window.getSelection().focusNode);
				
				if (hasNode(nodeNames, 'BLOCKQUOTE')) {
					document.execCommand('formatBlock', false, 'p');
				} else {
					document.execCommand('formatBlock', false, 'blockquote');
				}
				break;
			case 'link':
				if (this.getMode() === 'buttons') {
					this.setMode('url');
					this.actionOn(action);
				} else if (this.getMode() === 'url') {
					this.setMode('buttons');
					this.restoreSelection();
					
					document.execCommand( 'createLink', false, '' );
					
					if (this.el.querySelector('input').value === '') {
						this.actionOff(action);
					} else {
						this.actionOn(action);
					}
				}
				
				break;
		}
		
		this.editor.writeStorage();
	};
	
	ToolTip.prototype.restoreSelection = function() {
		window.getSelection().addRange(this.lastSelection);
	};
	
	ToolTip.prototype.preserveSelection = function() {
		this.lastSelection = window.getSelection();
	};
	
	ToolTip.prototype.setMode = function(mode) {
		this.el.setAttribute('data-mode', mode);
		
		if (mode == 'url') {
			this.el.querySelector('input').select();
		}
	}
	
	ToolTip.prototype.getMode = function() {
		return this.el.attributes['data-mode'].value;
	}
	
	ToolTip.prototype.actionToggle = function(action) {
		if (this.actionStatus(action)) {
			this.actionOff(action);
		} else {
			this.actionOn(action);
		}
	}
	
	ToolTip.prototype.actionStatus = function(action) {
		return document.querySelector('button[data-action="' + action + '"]').className === 'active';
	};
	
	ToolTip.prototype.actionOn = function(action) {
		var item = document.querySelector('button[data-action="' + action + '"]');
		item.className = 'active';
	}
	
	ToolTip.prototype.actionOff = function(action) {
		var item = document.querySelector('button[data-action="' + action + '"]');
		item.className = '';
	}
	
	ToolTip.prototype.updateButtonStates = function() {
		var currentNodeList = findNodes(window.getSelection().focusNode);
		var nodeMapping = {b: 'bold', i: 'italic', blockquote: 'quote', a: 'link'};
		
		for (var n in nodeMapping) {
			if (hasNode(currentNodeList, n.toUpperCase())) {
				this.actionOn(nodeMapping[n]);
			} else {
				this.actionOff(nodeMapping[n]);
			}
		}	
	};
	
	ToolTip.prototype.show = function() {
		if (this.timeoutClose) {
			clearTimeout(this.timeoutClose); }
		
		this.el.querySelector('input').value = '';
		this.updatePosition();
		this.updateButtonStates();
		this.el.className = "text-options active";
		this.isOpen = true;
	}
	
	ToolTip.prototype.close = function() {
		if (this.timeoutClose) {
			clearTimeout(this.timeoutClose); }
		
		this.setMode('buttons');
		this.el.className = "text-options fade";
		
		var that = this;
		// Maybe set to display: none?
		this.timeoutClose = setTimeout(function() {
			that.el.style.top = "100%";
			that.el.style.left = "100%";
		}, 260);
		
		this.isOpen = false;
	}
	
	ToolTip.prototype.updatePosition = function() {
		var selection = window.getSelection();
		var range = selection.getRangeAt(0);
		var boundary = range.getBoundingClientRect();
		
		var newTop = parseFloat(boundary.top - 5 + window.pageYOffset);
		var newLft = parseFloat((boundary.left + boundary.right)/2 - 5);
		
		if (newTop == -5 && newLft == -5) {
			return;
		}
		
		this.el.style.top = newTop + "px";
		this.el.style.left = newLft + "px";
	}
	
	//
	// ZenPen Editor
	//
	var ZenPen = function(id) {
		this.id = id;
		this.lastSelection = null;
		this.downOnOption = false;
		
		
		this.headline = document.getElementById(this.id).querySelector('[data-type="headline"]');
		this.content  = document.getElementById(this.id).querySelector('[data-type="content"]');
		
		this.bar = new ToolTip(this.id + '-bar', this);
		
		this.watchForSelection();
	};
	
	ZenPen.prototype.countWords = function() {
		var text = get_text(this.content);
	
		if (text === "") {
			return 0;
		}
		
		return text.split(/\s+/).length;
	}
	
	ZenPen.prototype.updatePosition = function() {
		this.bar.updatePosition();
	};
	
	ZenPen.prototype.watchForSelection = function() {
		var that = this;
		
		document.addEventListener("mousedown", function(ev) {
			if (that.clickIsOnBar(ev)) {
				ev.preventDefault();
			}
		});
		
		this.content.addEventListener("selectstart", function(ev) {
			that.bar.close();
		});
		
		this.headline.addEventListener("selectstart", function(ev) {
			that.bar.close();
		});
		
		this.content.addEventListener("selectionchange", function(e) {
			
		});
		
		window.addEventListener("mouseup", function(event) {
			setTimeout(function() {
				if (that.clickIsOnBar(event)) {
						
					} else if (that.hasSelection()) {
						that.selectedText(); 
					} else {
						that.bar.close();
					}
			}, 10);
		});
		
		this.content.addEventListener("keydown", function(event) {
			// TODO: Just close if content is chanegd
			that.bar.close();
			that.writeStorage();
		});
		
		window.addEventListener( 'resize', function( event ) {
			that.bar.updatePosition();
		});
		
		var scrollEnabled = true;
		document.body.addEventListener( 'scroll', function() {
			if ( !scrollEnabled ) {
				return;
			}
			
			scrollEnabled = true;			
			that.bar.updatePosition();
			
			return setTimeout((function() {
				scrollEnabled = true;
			}), 250);
		});

	};
	
	ZenPen.prototype.selectedText = function() {
		this.bar.show();
		this.bar.preserveSelection();
	}
	
	ZenPen.prototype.clickIsInside = function(event) {
		return event.target.tagName.toLowerCase() == 'article' || hasParent(event.target, 'article');
	};
	
	ZenPen.prototype.clickIsOnBar = function(event) {
		return event.target.id.toLowerCase() == 'article' || hasParentWithID(event.target, this.bar.id);
	}
	
	ZenPen.prototype.sameSelection = function(selection) {
		return JSON.stringify(this.lastSelection) === JSON.stringify(selection);
	};
	
	ZenPen.prototype.focus = function() {
		var range = document.createRange();
		var selection = window.getSelection();
		range.setStart(this.headline, 1);
		selection.removeAllRanges();
		selection.addRange(range);
	}
	
	ZenPen.prototype.hasSelection = function() {
		return Math.abs(window.getSelection().focusOffset - window.getSelection().baseOffset) > 0;
		
		/* var tempSelection = {
			type: window.getSelection().type, 
			focusOffset: window.getSelection().focusOffset, 
			baseOffset: window.getSelection().baseOffset, 
			length: Math.abs(window.getSelection().focusOffset - window.getSelection().baseOffset)
		};
		
		return tempSelection.length > 0 && !this.sameSelection(tempSelection); */
	};
	
	ZenPen.prototype.checkStorage = function() {
		if (!supportsHtmlStorage()) {
			return; }

		if (localStorage.header) {
			this.headline.innerHTML = localStorage.header;
		}
		
		if (localStorage.content) {
			this.content.innerHTML = localStorage.content;
		}
	};
	
	ZenPen.prototype.writeStorage = function() {
		if (!supportsHtmlStorage()) {
			return; }
		
		localStorage.header = this.headline.innerHTML;
		localStorage.content = this.content.innerHTML;
	}
		
	

	//
	// Old Codes
	//
	
	
	
	/*
	function checkTextHighlighting( event ) {
		
		// var selection = JSON.parse(JSON.stringify(window.getSelection()));
		var selection = {type: window.getSelection().type, focusOffset: window.getSelection().focusOffset, baseOffset: window.getSelection().baseOffset};
		currentNodeList = findNodes( window.getSelection().focusNode );
		
		if (selection && selection.type == 'Range' && parseInt(selection.focusOffset - selection.baseOffset, 10) !== 0 && JSON.stringify(selection) !== JSON.stringify(oldSelection)) {
			var tmpSel = window.getSelection();
			
			// Text is selected
			if ( tmpSel.isCollapsed === false ) {
				// Find if highlighting is in the editable area
				if ( hasNode( currentNodeList, "ARTICLE") ) {
					// Show the ui bubble
					textOptions.className = "text-options active";
				}
			}
		} else {
			if (event.target.className === '' && textOptions.className.indexOf('active') > -1) {
				onSelectorBlur();
			}
		}
		
		oldSelection = selection;
		selection = tmpSel;
		
		updateBubbleStates();
		updateBubblePosition();
		
		return;
	}
	


	function onUrlClick() {
		if ( optionsBox.className == 'options' ) {
			optionsBox.className = 'options url-mode';
			var nodeNames = findNodes( window.getSelection().focusNode );
			
			if ( hasNode( nodeNames , "A" ) ) {
				urlInput.value = nodeNames.url;
			} else {
				// Symbolize text turning into a link, which is temporary, and will never be seen.
				document.execCommand( 'createLink', false, '/' );
			}
			
			// Since typing in the input box kills the highlighted text we need
			// to save this selection, to add the url link if it is provided.
			lastSelection = window.getSelection().getRangeAt(0);
			lastType = false;

			updateBubblePosition();
			
			setTimeout(function() {
				urlInput.focus();
			}, 300);
		} else {
			optionsBox.className = 'options';
		}
	}

	function onUrlInputKeyDown( event ) {
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			applyURL( urlInput.value );
			urlInput.blur();
		}
	}

	function onUrlInputBlur( event ) {
		optionsBox.className = 'options';
		applyURL( urlInput.value );
		urlInput.value = '';

		currentNodeList = findNodes( window.getSelection().focusNode );
		updateBubbleStates();
	}

	function applyURL( url ) {
		rehighlightLastSelection();

		// Unlink any current links
		document.execCommand( 'unlink', false );

		if (url !== "") {
		
			if(url[0].match(/[A-z0-9]/i) && url[0] != "h") url = "http://" + url;

			document.execCommand( 'createLink', false, url );
		}
		
		updateBubblePosition();
	}

	function rehighlightLastSelection() {
		rehighlightSelection(lastSelection);
	}
	
	function rehighlightSelection(sel) {
		window.getSelection().addRange(sel);
	}

	function getWordCount() {
		
		var text = get_text( contentField );

		if ( text === "" ) {
			return 0
		} else {
			return text.split(/\s+/).length;
		}
	} */

	var ZPEditor = null;

	return {
		init: function(ID) {
			ZPEditor = new ZenPen(ID);
			ZPEditor.focus();
			ZPEditor.checkStorage();
		},
		getWordCount: function() {
			return ZPEditor.countWords();
		}  /*,
		saveState: saveState,
		getWordCount: getWordCount */
	}
})();