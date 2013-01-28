// Utility functions

function supportsHtmlStorage() {
	try {
		return 'localStorage' in window && window['localStorage'] !== null;
	} catch (e) {
		return false;
	}
}

function get_text(el) {
    ret = "";
    var length = el.childNodes.length;
    for(var i = 0; i < length; i++) {
        var node = el.childNodes[i];
        if(node.nodeType != 8) {
            ret += node.nodeType != 1 ? node.nodeValue : get_text(node);
        }
    }
    return ret;
}

function isCleanSlate() {
	return ( window.location.hash === '' );
}