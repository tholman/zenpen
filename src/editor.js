var editor = (function() {
	'use strict';
	// Editor elements
	var headerField, contentField, cleanSlate, lastType, currentNodeList, savedSelection, lastRange, lastSelection, oldSelection;

	// Editor Bubble elements
	var textOptions, optionsBox, boldButton, italicButton, quoteButton, urlButton, urlInput;


	function init() {
		lastRange = 0;
		bindElements();

		// Set cursor position
		var range = document.createRange();
		var selection = window.getSelection();
		range.setStart(headerField, 1);
		selection.removeAllRanges();
		selection.addRange(range);

		createEventBindings();

		// Load state if storage is supported
		if ( supportsHtmlStorage() ) {
			loadState();
		}
	}

	function createEventBindings( on ) {
		// Key up bindings
		if (supportsHtmlStorage()) {
			document.onkeyup = function( event ) {
				checkTextHighlighting( event );
				saveState();
			}

		} else {
			document.onkeyup = checkTextHighlighting;
		}

		// Mouse bindings
		document.onmousedown = checkTextHighlighting;
		document.onmouseup = function( event ) {
			setTimeout( function() {
				checkTextHighlighting( event );
			}, 1);
		};
		
		// Window bindings
		window.addEventListener( 'resize', function( event ) {
			updateBubblePosition();
		});

		// Scroll bindings. We limit the events, to free the ui
		// thread and prevent stuttering. See:
		// http://ejohn.org/blog/learning-from-twitter
		var scrollEnabled = true;
		document.body.addEventListener( 'scroll', function() {
			if ( !scrollEnabled ) {
				return;
			}
			
			scrollEnabled = true;			
			updateBubblePosition();
			
			return setTimeout((function() {
				scrollEnabled = true;
			}), 250);
		});
	}

	function bindElements() {
		headerField = document.querySelector( '.header' );
		contentField = document.querySelector( '.content' );
		textOptions = document.querySelector( '.text-options' );

		optionsBox = textOptions.querySelector( '.options' );

		boldButton = textOptions.querySelector( '.bold' );
		boldButton.onclick = onBoldClick;

		italicButton = textOptions.querySelector( '.italic' );
		italicButton.onclick = onItalicClick;

		quoteButton = textOptions.querySelector( '.quote' );
		quoteButton.onclick = onQuoteClick;

		urlButton = textOptions.querySelector( '.url' );
		urlButton.onmousedown = onUrlClick;

		urlInput = textOptions.querySelector( '.url-input' );
		urlInput.onblur = onUrlInputBlur;
		urlInput.onkeydown = onUrlInputKeyDown;
	}

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
			console.log(event.target.className, textOptions.className, textOptions.className.indexOf('active'));
			if (event.target.className === '' && textOptions.className.indexOf('active') > -1) {
				onSelectorBlur();
				console.log('close');
			}
		}
		
		oldSelection = selection;
		selection = tmpSel;
		updateBubbleStates();
		updateBubblePosition();
		
		return;
	}
	
	function updateBubblePosition() {
		var selection = window.getSelection();
		var range = selection.getRangeAt(0);
		var boundary = range.getBoundingClientRect();
		
		var newTop = parseFloat(boundary.top - 5 + window.pageYOffset);
		var newLft = parseFloat((boundary.left + boundary.right)/2 - 5);
		
		if (newTop >= 0 && newLft >= 0) {
			textOptions.style.top = boundary.top - 5 + window.pageYOffset + "px";
			textOptions.style.left = (boundary.left + boundary.right)/2 - 5 + "px";
		}
	}

	function updateBubbleStates() {

		// It would be possible to use classList here, but I feel that the
		// browser support isn't quite there, and this functionality doesn't
		// warrent a shim.

		if ( hasNode( currentNodeList, 'B') ) {
			boldButton.className = "bold active"
		} else {
			boldButton.className = "bold"
		}

		if ( hasNode( currentNodeList, 'I') ) {
			italicButton.className = "italic active"
		} else {
			italicButton.className = "italic"
		}

		if ( hasNode( currentNodeList, 'BLOCKQUOTE') ) {
			quoteButton.className = "quote active"
		} else {
			quoteButton.className = "quote"
		}

		if ( hasNode( currentNodeList, 'A') || optionsBox.className == 'options url-mode') {
			urlButton.className = "url useicons active"
		} else {
			urlButton.className = "url useicons"
		}
	}

	function onSelectorBlur() {
		textOptions.className = "text-options fade";
		/*
		textOptions.className = "text-options fade";
		
		setTimeout( function() {
			if (textOptions.className == "text-options fade") {
				textOptions.className = "text-options";
				textOptions.style.top = '-999px';
				textOptions.style.left = '-999px';
			}
		}, 260 ) */
	}

	function findNodes( element ) {

		var nodeNames = {};

		while ( element.parentNode ) {

			nodeNames[element.nodeName] = true;
			element = element.parentNode;

			if ( element.nodeName === 'A' ) {
				nodeNames.url = element.href;
			}
		}

		return nodeNames;
	}

	function hasNode( nodeList, name ) {

		return !!nodeList[ name ];
	}

	function saveState( event ) {
		
		localStorage[ 'header' ] = headerField.innerHTML;
		localStorage[ 'content' ] = contentField.innerHTML;
	}

	function loadState() {

		if ( localStorage[ 'header' ] ) {
			headerField.innerHTML = localStorage[ 'header' ];
		}

		if ( localStorage[ 'content' ] ) {
			contentField.innerHTML = localStorage[ 'content' ];
		}
	}

	function onBoldClick() {
		document.execCommand( 'bold', false );
		updateBubblePosition();
	}

	function onItalicClick() {
		document.execCommand( 'italic', false );
		updateBubblePosition();
	}

	function onQuoteClick() {
		var nodeNames = findNodes( window.getSelection().focusNode );

		if ( hasNode( nodeNames, 'BLOCKQUOTE' ) ) {
			document.execCommand( 'formatBlock', false, 'p' );
		} else {
			document.execCommand( 'formatBlock', false, 'blockquote' );
		}
		
		updateBubblePosition();
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
		window.getSelection().addRange(lastSelection);
	}

	function getWordCount() {
		
		var text = get_text( contentField );

		if ( text === "" ) {
			return 0
		} else {
			return text.split(/\s+/).length;
		}
	}

	return {
		init: init,
		saveState: saveState,
		getWordCount: getWordCount
	}

})();