function request(url, method, data, callback) {
    if(!callback && typeof data === 'function') {
        callback = data;
        data = '';
    }

    var xhr = buildXhr(callback);
    xhr.open(method, url, true);  
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.send(data);
}

function buildXhr(callback) {
    var xhr;  
    if(typeof XMLHttpRequest !== 'undefined') {
        xhr = new XMLHttpRequest();
    } else {  
        var versions = ["MSXML2.XmlHttp.5.0",  
                        "MSXML2.XmlHttp.4.0",  
                        "MSXML2.XmlHttp.3.0",  
                        "MSXML2.XmlHttp.2.0",  
                        "Microsoft.XmlHttp"];
         for(var i = 0, len = versions.length; i < len; i++) {  
            try {  
                xhr = new ActiveXObject(versions[i]);  
                break;  
            }  
            catch(e){
                callback(e);
                return;
            }  
         }
    }

    xhr.onreadystatechange = function () {  
        if(xhr.readyState < 4) {  
            return;  
        }  
        if(xhr.status !== 200) {  
            callback(new Error("Unsuccessful request. HTTP Code: "+xhr.status));
            return;
        }   
        if(xhr.readyState === 4) {  
            callback(null, xhr.responseText);  
        }
    };

    return xhr;   
}