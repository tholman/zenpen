(function() {
	var errorHandler = function() {
		// fail silently
	};

	var shorteners = {
		googl: function(url, callback) {

			request( 'https://www.googleapis.com/urlshortener/v1/url', 'POST', '{"longUrl": "' + url + '"}', function(err, response) {
				if( err ) {
					errorHandler( err );
				} else {
					var json = {};
					if( response ) {
						try {
							json = JSON.parse( response );
						} catch( e ) {
							errorHandler( e );
						}
						if( json.id ) {
							callback( json.id );
						}
					}
				}
			});
		}
	};

	if(! window.urlShorteners ) {
		window.urlShorteners = shorteners;
	}
})();