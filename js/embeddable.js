function Editor(elements){

	// Editor elements
	var headerField, contentField, cleanSlate, lastType, currentNodeList, savedSelection;

	// Editor Bubble elements
	var textOptions, optionsBox, boldButton, italicButton, quoteButton, urlButton, urlInput;



	// Initialization function.
	(function(){

		lastRange = 0;
		bindElements();

		// Set cursor position
		var range = document.createRange();
		var selection = window.getSelection();
		range.setStart(contentField, 1);
		selection.removeAllRanges();
		selection.addRange(range);

		createEventBindings();

		// Load state if storage is supported
		if ( supportsHtmlStorage() && elements.save != false ) {
			loadState();
		}

	})();

	function createEventBindings( on ) {

		// Key up bindings
		if ( supportsHtmlStorage() && elements.save != false ) {

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

		contentField = elements.content;
		textOptions = document.querySelector( elements.textOptions || '.text-options' );

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
			if (event.target.className === '') {
				onSelectorBlur();
				console.log('closing');
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

		textOptions.className = "text-options active";
		// textOptions.style.top = boundary.top - 5 + document.body.scrollTop + "px";

		
		textOptions.style.top = boundary.top - 5 + window.pageYOffset + "px";
		textOptions.style.left = (boundary.left + boundary.right)/2 + "px";
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
				nodeNames.url = element.href;
			}
		}

		return nodeNames;
	}

	function hasParent(e, parent){

		while(e = e.parentNode){

			if(e == parent) return true;
		}

		return false;
	}

	function hasNode( nodeList, name ) {

		return !!nodeList[ name ];
	}

	function saveState( event ) {
	
		localStorage[ 'content' ] = contentField.innerHTML;
	}

	function loadState() {

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
			document.execCommand( 'outdent' );
		} else {
			document.execCommand( 'formatBlock', false, 'blockquote' );
		}
		
		updateBubblePosition();
	}

	var oldWidth, oldMarginLeft;

	function onUrlClick() {

		if ( optionsBox.className == 'options' ) {

			oldWidth = optionsBox.style.width;
			oldMarginLeft = optionsBox.style.marginLeft;
			optionsBox.style.width = "275px";
			optionsBox.style.marginLeft = "-137px";

			optionsBox.className = 'options url-mode';

			// Set timeout here to debounce the focus action
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
				updateBubblePosition();
			}, 100)

		} else {

			optionsBox.className = 'options';
			optionsBox.style.width = oldWidth;
			optionsBox.style.marginLeft = oldMarginLeft;
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
		optionsBox.style.width = oldWidth;
		optionsBox.style.marginLeft = oldMarginLeft;
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
			// Insert HTTP if it doesn't exist.
			if ( !url.match("^(http|https)://") ) {
				url = "http://" + url;	
			} 
			
			document.execCommand( 'createLink', false, url );
		}
		
		updateBubblePosition();
	}

	function rehighlightLastSelection() {

		window.getSelection().addRange( lastSelection );
	}

	function getWordCount() {
		
		var text = get_text( contentField );

		if ( text === "" ) {
			return 0
		} else {
			return text.split(/\s+/).length;
		}
	}

	// Add some customization support.

	var childCount = 4;

	this.addButton = function(){

		var newButton = document.createElement("button");

		var newWidth = (++childCount * 29 + 9);
		optionsBox.style.width = newWidth + "px";
		optionsBox.style.marginLeft = (newWidth / -2) + "px";

		return optionsBox.querySelector(".ui-inputs").appendChild(newButton);
	};
}
