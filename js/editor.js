var editor = (function() {

	// Editor elements
	var headerField, contentField, cleanSlate, lastType, currentNodeList, savedSelection;

	// Editor Bubble elements
	var textOptions, optionsBox, boldButton, italicButton, quoteButton, urlButton, urlInput;

	function init() {

		lastRange = 0;
		bindElements();
		
		// Something is being passed via URL
		if ( !isCleanSlate() ) {

			inflate( window.location.hash.replace('%23', '#').substr(1) );

		} else {

			// Set caret start position
			var range = document.createRange();
			var selection = window.getSelection();
			range.setStart(headerField, 1);
			selection.removeAllRanges();
			selection.addRange(range);
		}

		// Local saving if supported and user is on the root domain
		if ( supportsHtmlStorage() && isCleanSlate() ) {

			loadState();
			document.onkeyup = function( event ) {
				checkTextHighlighting( event );
				saveState();
			}

		} else {
			document.onkeyup = checkTextHighlighting;
		}

		document.onmousedown = checkTextHighlighting;

		// Debounce mouse up event.
		document.onmouseup = function( event ) {

			setTimeout( function() {
				checkTextHighlighting( event );
			}, 1);
		};
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
		urlButton.onclick = onUrlClick;

		urlInput = textOptions.querySelector( '.url-input' );
		urlInput.onblur = onUrlInputBlur;
		urlInput.onkeydown = onUrlInputKeyDown;
	}

	function checkTextHighlighting( event ) {

		var selection = window.getSelection();

		if ( event.target.className === "url-input" ) {
			return;
		}

		// Check selections exist
		if ( selection.isCollapsed === true && lastType === false ) {

			onSelectorBlur();
		}
		
		// Text is selected
		if ( selection.isCollapsed === false ) {

			currentNodeList = findNodes( selection.focusNode );

			// Find if highlighting is in the editable area
			if ( hasNode( currentNodeList, "ARTICLE") ) {

				var range = selection.getRangeAt(0);
				var boundary = range.getBoundingClientRect();
				
				updateBubbleStates();

				// Show the ui bubble
				textOptions.className = "text-options active";
				textOptions.style.top = boundary.top - 5 + document.body.scrollTop + "px";
				textOptions.style.left = (boundary.left + boundary.right)/2 + "px";
			}
		}

		lastType = selection.isCollapsed;
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

		if ( hasNode( currentNodeList, 'A') ) {
			urlButton.className = "url useicons active"
		} else {
			urlButton.className = "url useicons"
		}

		console.log( currentNodeList );
	}

	function onSelectorBlur() {
		
		textOptions.className = "text-options fade";
		setTimeout( function() {

			if (textOptions.className == "text-options fade") {

				textOptions.className = "text-options";
				textOptions.style.top = '-999px';
				textOptions.style.left = '-999px';
			}
		}, 260 )
	}

	function findNodes( element ) {

		var nodeNames = {};

		while ( element.parentNode ) {

			nodeNames[element.nodeName] = true;
			element = element.parentNode;

			if ( element.nodeName === 'A' ) {
				console.log( element.href );
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
			contentField.innerHTML = localStorage[ 'content' ];
		}
	}

	function onBoldClick() {
		document.execCommand( 'bold', false );
	}

	function onItalicClick() {
		document.execCommand( 'italic', false );
	}

	function onQuoteClick() {

		var nodeNames = findNodes( window.getSelection().focusNode );
		
		if ( hasNode( nodeNames, 'BLOCKQUOTE' ) ) {
			document.execCommand( 'formatBlock', false, 'p' );
		} else {
			document.execCommand( 'formatBlock', false, 'blockquote' );
		}
	}

	function onUrlClick() {

		if ( optionsBox.className == 'options' ) {	

			optionsBox.className = 'options url-mode';

			setTimeout( function() {

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

				urlInput.focus();
					
			}, 1)
			
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
	}

	function applyURL( url ) {

		rehighlightLastSelection();

		// Unlink any current links
		document.execCommand( 'unlink', false );

		if (url !== "") {
			document.execCommand( 'createLink', false, url );
		}
	}

	function rehighlightLastSelection() {

		window.getSelection().addRange( lastSelection );
	}

	function inflate( string ) {

		// Seperate header and content
		var stringData = string.split( '#' );

		// Set contents from URL
		headerField.innerHTML = RawDeflate.inflate( window.atob( stringData[0] ) );
		contentField.innerHTML = RawDeflate.inflate( window.atob( stringData[1] ) );
	}

	function deflate() {

		var deflatedHeader, deflatedContent;

		deflatedHeader = window.btoa( RawDeflate.deflate( headerField.innerHTML ) );
		deflatedContent = window.btoa( RawDeflate.deflate( contentField.innerHTML ) );
		return deflatedHeader + '#' + deflatedContent;
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
		deflate: deflate,
		saveState: saveState,
		getWordCount: getWordCount
	}

})();