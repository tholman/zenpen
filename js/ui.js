var ui = (function() {

	// Base elements
	var body, article, uiContainer, overlay, shareText, shareBox, aboutButton;

	// Buttons
	var screenSizeElement, colorLayoutElement, shareElement, targetElement, newButton, editButton;

	// Work Counter
	var wordCountValue, wordCountBox, wordCountElement, wordCounter, wordCounterProgress;


	var expandScreenIcon = '&#xe006;';
	var shrinkScreenIcon = '&#xe005;';

	var darkLayout = false;

	function init() {
		
		bindElements();

		wordCountActive = false;

		if ( supportsHtmlStorage() && isCleanSlate() ) {
			loadState();
		}

		console.log( "Checkin under the hood eh? We've probably got a lot in common. You should totally check out ZenPen on github! (https://github.com/tholman/zenpen)." );
	}

	function loadState() {

		// Activate word counter
		if ( localStorage['wordCount'] && localStorage['wordCount'] !== "0") {			
			wordCountValue = parseInt(localStorage['wordCount']);
			wordCountElement.value = localStorage['wordCount'];
			wordCounter.className = "word-counter active";
			updateWordCount();
		}

		// Activate color switch
		if ( localStorage['darkLayout'] === 'true' ) {
			if ( darkLayout === false ) {
				document.body.className = 'yang';
			} else {
				document.body.className = 'yin';
			}
			darkLayout = !darkLayout;
		}

	}

	function saveState() {

		if ( supportsHtmlStorage() ) {
			localStorage[ 'darkLayout' ] = darkLayout;
			localStorage[ 'wordCount' ] = wordCountElement.value;
		}
	}

	function bindElements() {

		// Body element for light/dark styles
		body = document.body;

		uiContainer = document.querySelector( '.ui' );

		// UI element for color flip
		colorLayoutElement = document.querySelector( '.color-flip' );
		colorLayoutElement.onclick = onColorLayoutClick;

		// UI element for full screen
		screenSizeElement = document.querySelector( '.fullscreen' );
		screenSizeElement.onclick = onScreenSizeClick;

		targetElement = document.querySelector( '.target ');
		targetElement.onclick = onTargetClick;

		document.addEventListener( "fullscreenchange", function () {
			if ( document.fullscreenEnabled === false ) {
				exitFullscreen();
			}
		}, false);

		// UI elements for save/share
		shareElement = document.querySelector( '.link' );
		shareElement.onclick = onShareClick;

		// Overlay when modals are active
		overlay = document.querySelector( '.overlay' );
		overlay.onclick = onOverlayClick;

		shareText = overlay.querySelector( 'input' );
		shareBox = overlay.querySelector( '.share' );

		article = document.querySelector( '.content' );
		article.onkeyup = onArticleKeyUp;

		wordCountBox = overlay.querySelector( '.wordcount' );
		wordCountElement = wordCountBox.querySelector( 'input' );
		wordCountElement.onchange = onWordCountChange;
		wordCountElement.onkeyup = onWordCountKeyUp;

		wordCounter = document.querySelector( '.word-counter' );
		wordCounterProgress = wordCounter.querySelector( '.progress' );

		aboutButton = document.querySelector( '.about' );
		aboutButton.onclick = onAboutButtonClick;

		header = document.querySelector( '.header' );
		header.onkeypress = onHeaderKeyPress;

		newButton = document.querySelector( '.new' );
		newButton.onclick = onNewButtonClick;

		editButton = document.querySelector( '.edit' );
		editButton.onclick = onEditButtonClick;
	}

	function onNewButtonClick( event ) {
		editor.setEditMode( true );
		editor.toggleEventBindings( true );
		editor.resetContent();
	}

	function onEditButtonClick( event ) {
		editor.toggleEventBindings( true )
		editor.setEditMode( true );
	}

	function onScreenSizeClick( event ) {

		if ( document.fullscreenEnabled === false ) {
			enterFullscreen();
		} else {
			exitFullscreen();
		}
	}

	function enterFullscreen() {
		document.body.requestFullscreen( Element.ALLOW_KEYBOARD_INPUT );
		screenSizeElement.innerHTML = shrinkScreenIcon;	
	}

	function exitFullscreen() {
		document.exitFullscreen();
		screenSizeElement.innerHTML = expandScreenIcon;	
	}

	function onColorLayoutClick( event ) {
		if ( darkLayout === false ) {
			document.body.className = 'yang';
		} else {
			document.body.className = 'yin';
		}
		darkLayout = !darkLayout;

		saveState();
	}

	function onTargetClick( event ) {
		overlay.style.display = "block";
		wordCountBox.style.display = "block";
		wordCountElement.focus();
	}

	function onAboutButtonClick( event ) {
		window.open( 'http://www.zenpen.io/index.html?h=4+IEgpCMzGIFIIpKzQtIzQMA&c=hVQ9b9swEJ3rX3Hw0C62haJDUccR2qFtvHXw1I2SzhYbkqcej3aUX9+jJAdBYKieBPH47n3Ji8U7/e268sGuYP/Bvw9V7O52ttwZaBmP98tWpNsWhbTkvAmbmnyxhCi9w/tlnTgSb6EjGwT5blkerIeHYXJXmHJX2HJEXMNvDL8wgI1gwFkRh3BBfMTQQMf0B2tZgRDEmo3UrQ4d8QJWHzHCHlpz1nkrLXhqkAMIPglgY4U4buCbonhihM6w2Do5w66HE4rYcAIlRyCtEbiwHd48U8DNruhKVb4X8OZRt0yHEdDEfuDSGsYVGAXHs3LX9xY5n9SMRl4hRFBfOoeCrp8sfO1fVANPSj5Vg3+Tl8Uzhg7DjJuaA+kEREpcI1CAnyNKNjYbPO76gejgyIgDNQrCtkqizGOqvBWokooiBsa/CaOos0YSY7zyP7QIKaoyfOqQLQbd1ZoIFebAQuwsYwNVD+aGNpXmuSEapU1RxqIV78Z45uqiAjXmqxqYM61ydCo+fvr8Za22raes1rkN8/g1kbu9IDNXisn/r9SKorqapLpekHIpRH2z6rdWWqt3ZPKwVyii8NKMI/SUxvaa0MPgv9Ubq5yHznoMWp48U5ugISTjxuLqB6AtaYCO4BHO9q313lgntBXrSdp+c9mMnfp6ygdZ0Lye73lsgpwkEd9OV/Sz03tjcy/jmnnww3jjCjyYsch/NP8A' );
	}

	function onHeaderKeyPress( event ) {

		if ( event.keyCode === 13 ) {
			event.preventDefault();
			article.focus();
		}
	}

	function onWordCountKeyUp( event ) {
		
		if ( event.keyCode === 13 ) {
			event.preventDefault();
			
			setWordCount( parseInt(this.value) );

			removeOverlay();

			article.focus();
		}
	}

	function onWordCountChange( event ) {

		setWordCount( parseInt(this.value) );
	}

	function setWordCount( count ) {

		// Set wordcount ui to active
		if ( count > 0) {
			wordCountValue = count;
			wordCounter.className = "word-counter active";
			updateWordCount();
		} else {
			wordCountValue = 0;
			wordCounter.className = "word-counter";
		}
		
		saveState();
	}

	function onArticleKeyUp( event ) {

		if ( wordCountValue > 0 ) {
			updateWordCount();
		}
	}

	function updateWordCount() {

		var wordCount = editor.getWordCount();
		var percentageComplete = wordCount / wordCountValue;
		wordCounterProgress.style.height = percentageComplete * 100 + '%';

		if ( percentageComplete >= 1 ) {
			wordCounterProgress.className = "progress complete";
		} else {
			wordCounterProgress.className = "progress";
		}
	}

	function onOverlayClick( event ) {

		if ( event.target.className === "overlay" ) {
			removeOverlay();
		}
	}

	function removeOverlay() {
		overlay.style.display = "none";
		shareBox.style.display = "none";
		wordCountBox.style.display = "none";
	}

	function onShareClick() {

		shareText.value = window.location.href.split('?')[0] + editor.deflate();
		overlay.style.display = "block";
		shareBox.style.display = "block";
		shareText.focus();
		shareText.select();
	}

	function setEditMode( value ) {

		// Turn edit mode on
		if ( value ) {
			uiContainer.className = 'ui edit-mode';
		// Turn edit mode off
		} else {
			uiContainer.className = 'ui view-mode';
		}
	}

	return {
		init: init,
		setEditMode: setEditMode
	}

})();