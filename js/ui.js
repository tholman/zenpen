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
		if ( localStorage['wordCount'] !== "0") {			
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
		
		console.log( "save state!" );
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
		window.open( 'file://localhost/Users/Qwiki/Documents/zen/index.html#4+IEgvDUnOT83FSFknyFqNS8gNQ8AA==#nVVdk6I4FH3e+RUp52Fry2kRFT96bWtR/EDbFlvx6y1AhLRAMAnQ+uv3ojNduw9b2zOWD0CSk3PvuffcL19+g1836XVFgmMk5CUkT6WQxuQhINQP5COqtSpa8v5nqTeh35D5e4S6tNfFyGWxJPD3qMROceiIQ0FKKODk+FQKpEweFUUGLIxwXHFZVOqtaYQmt/eugntdhfbQAzqQ2CIxogJhFFIpQ4JyQk4k9lDC2Rtx5TckGRIux9INYNOR5IjCIxHIRAHOYD+VAYqYR3iMJHmXqODEuKggHVAixglKMJfUTUPMwwvyiZQ09hGNAVgGWKKc09uXK4tJpasUqQB+kJRP5cWUKMIn4PMdRiCCxeXGOsCcfEMYaJAMooTvlPBixeUEy1+6S0DmoyQkkkAon9JBgBA+5Ch1Ch1+aKJcSZyQuNQDORk8IMFS7hLEYjS+by4UKpRCI0JCdOSE3JjDfZw6qYTAROpEVCInhZgZR5ycUyIkSIRlygkIYCIgw+4yYeRQHzSGDez4/8yPNCRAPGQuDgMmpGILwoWyzOmJKgZz0wjOiiIKhcYeea8EMgq/Nsrm0M+MYTad0sBdtUf6VlFfVvbe15++Hjdmx+nkuTFVW1njObcX6yVt1CJjyd3FtmmYoTUxkmpCnbF5SaZBdTfptKqZ1kqSubrtd6LJNTvty636Wnotj6p9PhP+a/OcT0eptZtk2jKo78q81Xbb0zhc2LVL3R8M8n1t2jy3ovmLs100X1h7r2ie5607rH9Ixzq2nunbtr9yh+rhMmiI/cIwakZtOX52knNfdfBiRc/nVCPN1AmydBDY7bHfELOqP/D0pt3akfGo6ph6Y68v6+Z+F88VdZOt+HU56Tf2vjhvV81sPDJnpD8a6qfQmrux/c5GRI3aqxxH17e1vnJOZPA26DD9IOeN6uDsmvRy7KwHuVtWzpv2caFN9+WlZWt2Z6T31RdfvR68iWVX83VtaF1UGfTbm1OztbG045BW1+Z4/vxi0izyO0NNfV0NYr5enGtNJkeL7YtvpVKzjq+aNanaqt4YdKSba1aq50yLdN9rmpvZ5ti+lLfc17LXy9wx9ol16GzKqT1987RWnM1O3DbKKyl42t+8j7b2MjLMjTk+Nq0oGCcDI5nNV9NsxDNvWe4faoZTr2s2kcvNfEeT+szwXW3cKDsKF9dolz893fogx0U5ftQv+tEBNEYuFgRdWPo7uEnOoOB4YRhvKVRzXlgIdAb2PPT4x0+39DogKIXaRuQ9AVQSQxMGWCCHFL4Yi4Ry4ORcoIE+a7sR9xi7d/t3ExVK0R53Y1RKvcLDwUg/OvxXfMQJma+o9VbnAXrw4bv3PRQ+fMuly1j4c/gFcVhOo/u4AAwg76VA/gOncFIJ+aKABhMDtDhyFiETDjAW/3Tq9ywFYWNIf4rD+2SALIM/eoVFRQRl9BNJjzANJXuUNGIyuFTyyt1g//KLhXssRb6HxetHSYFdAvC/hyUMMkn43aTzO0jpv+6+Qa7vJ35g/iP+L8Vc/xs=' );
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