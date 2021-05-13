//Keep thread local variables in the whole callback chain
// Ref https://datahero.com/blog/2014/05/22/node-js-preserving-data-across-async-callbacks/
// Ref https://github.com/othiym23/node-continuation-local-storage
// Ref http://stackoverflow.com/questions/12575858/is-it-possible-to-get-the-current-request-that-is-being-served-by-node-js

var cls = require('continuation-local-storage');

function ContinualLocalStorage(namespace){
	if(!(this instanceof ContinualLocalStorage) ){
		var instance = new ContinualLocalStorage(namespace);
		
		instance.namespace = namespace;

		return instance;
	}
	return this;
}


ContinualLocalStorage.prototype.createNamespace = function(){
	return cls.createNamespace(this.namespace);
}

ContinualLocalStorage.prototype.getNamespace = function(){
	return cls.getNamespace(this.namespace);
}



//Here I make the namespace value fixed just for simplicity
//Maybe can be read from config file
module.exports = ContinualLocalStorage("com.ccmengine");