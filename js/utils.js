// Utility functions
ZenPen = window.ZenPen || {};
ZenPen.util = {

	supportsHtmlStorage : function () {
		try {
		    return 'localStorage' in window && window['localStorage'] !== null;
		} catch (e) {
		    return false;
		}
	},

	get_text : function (el) {
		var ret = " ";
		var length = el.childNodes.length;
		for(var i = 0; i < length; i++) {
		    var node = el.childNodes[i];
		    if(node.nodeType != 8) {

			if ( node.nodeType != 1 ) {
			    // Strip white space.
			    ret += node.nodeValue;
			} else {
			    ret += get_text( node );
			}
		    }
		}
		return ZenPen.util.trim(ret);
	},

	trim : function(string) { 
		return string.replace(/^\s+|\s+$/g, ''); 
	}

}
