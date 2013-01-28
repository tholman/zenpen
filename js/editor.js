var editor = (function() {

	var headerField, contentField, cleanSlate, textOptions, boldButton, italicButton, lastType;

	function init() {

		lastRange = 0;
		bindElements();
		
		// Something is being passed via URL
		if ( !isCleanSlate() ) {

			inflate( window.location.hash.substr(1) );

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
			document.onkeyup = function() {
				checkTextHighlighting();
				saveState();
			}

		} else {
			document.onkeyup = checkTextHighlighting;
		}

		document.onmousedown = checkTextHighlighting;

		// Debounce mouse up event.
		document.onmouseup = function( event ) {

			setTimeout( function() {
				checkTextHighlighting();
			}, 1);
		};
	}

	function checkTextHighlighting( event ) {

		var selection = window.getSelection();

		// Check selections exist
		if ( selection.type === "Caret" && lastType === "Range" ) {

			onSelectorBlur();
		}
		
		// Text is selected
		if ( selection.type === "Range" && hasNode( findNodes( selection.focusNode ), 'ARTICLE' ) ) {

			// Find if highlighting is in the editable area
			var range = selection.getRangeAt(0);
			var boundary = range.getBoundingClientRect();
			
			// Insert
			textOptions.style.top = boundary.top - 5 + document.body.scrollTop + "px";
			textOptions.style.left = (boundary.left + boundary.right)/2 + "px";
		}

		lastType = selection.type;

	}

	function onSelectorBlur() {
		
		textOptions.style.top = '-999px';
		textOptions.style.left = '-999px';
	}

	function findNodes( element ) {

		var nodeNames = [];

		while ( element.parentNode ) {

			nodeNames.push( element.nodeName );
			element = element.parentNode;
		}

		return nodeNames;
	}

	function hasNode( nodeList, name ) {

		var i;
		for( i = 0; i < nodeList.length; i++ ) {
			if ( nodeList[i] === name ){
				return true
			}
		}
		return false;
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

	function bindElements() {

		headerField = document.querySelector( '.header' );
		contentField = document.querySelector( '.content' );
		textOptions = document.querySelector( '.text-options' );

		boldButton = textOptions.querySelector( '.bold' );
		boldButton.onclick = onBoldClick;

		italicButton = textOptions.querySelector( '.italic' );
		italicButton.onclick = onItalicClick;

		quoteButton = textOptions.querySelector( '.quote' );
		quoteButton.onclick = onQuoteClick;
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
		return get_text(contentField).split(/\s+/).length;
	}

	return {
		init: init,
		deflate: deflate,
		saveState: saveState,
		getWordCount: getWordCount
	}

})();