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
		window.open( 'file://localhost/Users/Qwiki/Documents/zen/index.html#4+IEgvDUnOT83FSFknyFqNS8gNQ8AA==#nVRNb9QwED3TXzHKpULqJgKEKpY0ggPQvXHohd6cZLJ264/InjTd/nqek7aIA+qWVVaKbGfevI/xyckb/OqxqdOoPCU5WL4orPG80Wz2Wrb0/rz8ON5/LppLc0a7U0e1aWpFXfDCeHojqs0fDcomLkhHHi4KLTJuq0p0sE75sguuaOq2uTKOLpelumqbulL4m4Y2dM3+J3syiRRZI2KZZuZb9j2NMdxwJ2ckgVIXlXQahwaeyeCVE+1IqzucN6LJhZ6jJ+F7odxaiKmkr6jiQmQaVRTTTVZFe6A9ixi/J+NRWLQSmqNZVh6C57KusiLoD9ocJc9OyKlb9PNYJhGrdFi61iryGSm0wXdgiXXDMe90kZX8F1aCAW60LAwqUBamhBG1U5hixxQ8/YAeU1suAme1vzNbGiLzAgz3omkngEM/OBdWERW1Zg8HklAYUPepjQHnN8v7FrIrazp0MavsP6xQMkUQzyjGU6cS0yFMp1B8Dh6GZFFvJtScs8yAV31P27evpn2lmaYE6fh+RFX2YKpVopZzdnwaTUQ/7QE0jk2oi30IbQ5o9Ri0VGlxdg1PVTQviYAgPmX5ONAE1P3qTUZtbdhX7z6cf9o8sN88ZmeTc7xMTBeCfV39TArbk3ueOhDrJxB7rpOTKNDSoBomDj4NMTja4YMQ/Ktt+RUmmO5hzaTsOllwAKPf5xA5pjtzhCFOGSthK8YF0YdyLte748s+b6xcXvLiWz5KTzRDzKB/30e4JITjIrzMK0Dxr75ehLtaq/25yp51O8nX6m8=' );
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