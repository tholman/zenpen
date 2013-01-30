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

		console.log( "Checkin under the hood eh? We've probably got a lot in common. ZenPen is open source on github (https://github.com/tholman/zenpen)." );
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

		header = document.querySelector( '.header' );
		header.onkeypress = onHeaderKeyPress;
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
		window.open( 'http://www.zenpen.io/index.html#4+IEgvDUnOT83FSFknyFqNS8gNQ8AA==#nVRNb9QwED3TXzHKhcvuRoBQRUkjOADdG4eeuDnJZD3U9gR73G366xknbVUOSNtGOTj+eH7z3pucnb3Rp5naJk0mQJLZ4WXlKODWIh2sXMD7893H6e5z1V7RBvZvPTTUNgZ6DoL6DiSmK4dG4xJWYCOOl5UVmS7qWiw7b8KuZ1+11+ThavluatM2NbWwhV8YfmIASmDAkYhDOCLeYBhgivwbe9mAMKQ+GumtbhrxCKRDTLAHa251P4kFzwPGAIJ3AoUTx7SDr4riOSJMJgr12ZnoZjigCIUDUFBgsUbgGGmZueeAu6YuUig/FeUkXfYC3twonweYBGjSvLC2JuIGjNLAW61S5wljWekjGnnVXUmV95NDQS3lJB+SGnFQjXJXfHj0pL7HMGGoWrWTdQCJc+wROMCPdXNxqDgF3xEdjBFxYa73ReqyaGEpd54Euqw1c4SIfzImUYuM5Ijp5eVdW4ScVCK8mzASBiVkTYIOS0ZCmijiAN2sOTg1gj4OzGvlD4FKtRXv1pDUVVvyrKF6qvY1mnaOD/W7D+eftqrq9iEH25LJRd+e2b0MvxDX5ezX1lEMJT9kJf+EU1IlqhcpmnaPpnyM7GGvB5jDK6I1wsx5bSkTZli8JMXeFG8V1SvltOzpFSunbNzaTeqGZmoAHsEj3NIJ5nhDTvhCyLPYeXfcraH8cigLa83Fl2/lEx5LVhoK/O8PRptfMK7BPq4g1f/uXiCv1xOPmM91Ois/w78=' );
	}

	function onHeaderKeyPress( event ) {

		if ( event.keyCode === 13 ) {
			event.preventDefault();
			article.focus();
		}
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