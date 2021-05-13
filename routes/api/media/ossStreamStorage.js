var co = require('co');
var OSS = require('ali-oss');
var util = require('util');

function getDestination (req, file, cb) {
  cb(null, '/dev/null')
}

var client = null;

//OSS Stream Storage - Parameters:
//	OSS RAM AccessKey	- accessKeyId
//	OSS RAM AccessSecret - accessKeySecret
//	OSS Bucket - bucket
function OssStreamStorage (opts) {
	this.getDestination = (opts.destination || getDestination);

	client = new OSS({
		region: opts.region,
		accessKeyId: opts.accessKeyId,
		accessKeySecret: opts.accessKeySecret,
		bucket: opts.bucket
	});
}


OssStreamStorage.prototype._handleFile = function _handleFile(req, file, cb) {
	co(function* () {
		var result = yield client.put(file.originalname, file.stream);
		console.log(result);

		return cb(null, result);
	}).catch(function (err) {
	  	console.log(err);
	  	return cb(err);
	});
}

//Remove file from OSS Storage
OssStreamStorage.prototype._removeFile = function _removeFile (req, file, cb) {
	console.log("delete file");

	delete file.buffer
	cb(null)
}

module.exports = function (opts) {
  return new OssStreamStorage(opts)
}