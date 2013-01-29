var ui = (function() {

	var body, screenSizeElement, colorLayoutElement, shareElement, targetElement, overlay, shareText, shareBox, aboutButton;

	var article, wordCountValue, wordCountBox, wordCountElement, wordCounter, wordCounterProgress;

	var expandScreenIcon = '&#xe006;';
	var shrinkScreenIcon = '&#xe005;';

	var darkLayout = false;

	function init() {
		
		bindElements();

		wordCountActive = false;

		if ( supportsHtmlStorage() && isCleanSlate() ) {
			loadState();
		}

		console.log( "Checkin out the source eh? We've probably got a lot in common. You should follow me on twitter - http://twitter.com/twholman" );
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
		
		localStorage[ 'darkLayout' ] = darkLayout;
		localStorage[ 'wordCount' ] = wordCountElement.value;
	}

	function bindElements() {

		// Body element for light/dark styles
		body = document.body;

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

		wordCounter = document.querySelector( '.word-counter' );
		wordCounterProgress = wordCounter.querySelector( '.progress' );

		aboutButton = document.querySelector( '.about' );
		aboutButton.onclick = onAboutButtonClick;
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
	}

	function onAboutButtonClick( event ) {
		window.open( 'http://www.zenpen.io/index.html#4+IEgvDUnOT83FSFknyFqNS8gNQ8AA==#nVRNj9MwED3TXzHKhUubCBBaUbIRHIDtjUMvcHOSSWzW9gR73I/99YybdgUHpHajHPz5/N6bZy8Wr+Srp6aOk/IQ+WjxvrDG40qjGTWv4e1d+X46fCyaB7OEzWsHtWlqBR15Rvl7w6rNmwZlIxagAw73hWae1lXFmqxTvuzIFc3WOHg49etKNXVlGljBT/Tf0YOJoMAaZouwR3xE38MU6Bd2vAQmiF1Q3GlZNOAejDQxwga02sl6wxoc9Rg8MB4YMicKsYTPguIoIEwqsOmSVcEeYURm40cwXoBZK4Z9MKeRJ/JY1lW2QviJKVf5smFw6lH4nGEioIrHE2utAi5BCQ3ciUoZNxjyTBdQ8YvOiuK8mywyipSr6hClEKN4lNpch0tNqif0E/qikXKSNCBSCh0Cefg2L84VypWCr4gWhoB4Yi7nBdMmFmExtc4wtEk0U4CAvxNGlhIpTgHj7fK2GiFFsQgPEwaDXghpFaHFnBEfJxOwh/YoObg2gi70RLPyc6BipdnZOSRV0eQ8S6ie1b7E09bSWL15d/dhJa6uzjlY5Uye/O2I7G34mbhMJzdfHcEQ8n0S8s84OVUsfhlBk9sjKR8COdjIBiJ/u/c/KEEni1JMys7XRGyWsPRAAziEnbnCdaeMZVqzccT6WO7LOW2fxjwxi8mGf8lduGiR7Ajwvy+H3GrGMCd2P4MU/zv7BLmdd1ww/zZgkV+5Pw==' );
	}

	function onWordCountChange( event ) {

		// Set wordcount ui to active
		if ( parseInt(this.value) > 0) {
			wordCountValue = parseInt(this.value);
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
			overlay.style.display = "none";
			shareBox.style.display = "none";
			wordCountBox.style.display = "none";
		}
	}

	function onShareClick() {

		shareText.value = window.location.href.split('#')[0] + '#' + editor.deflate();
		overlay.style.display = "block";
		shareBox.style.display = "block";
		shareText.focus();
   		shareText.select();
	}

	return {
		init: init
	}

})();