module.exports = function(app, settings){
	var log4js 		= require('log4js')
		, debug 	= require('debug')('http')
		, cls 		= require('../../../libs/continuationLocalStorage')
		, util 		= require('util')
		, express 	= require('express')
		, config 	= require('./config')()
		, multer 	= require('multer')
		, storage 	= require('./ossStreamStorage')(config.ali_oss);
		

	var logger 		= log4js.getLogger("account")
		, router 	= express.Router()
		, namespace = cls.getNamespace()
		, upload = multer({ storage: storage });

	//Upload media files
	//Client side ajax file upload features: 
	// http://abandon.ie/notebook/simple-file-uploads-using-jquery-ajax
	router.post('/upload', upload.single('media'), 
		function(req, res, next){
			debug("req.file : " + req.file);
			debug(" thread local : " + namespace.get("jwt").sub);

			//logger.debug("body: " + req.body);
			return res.json({
				success: true,
				content: req.file
			});
		}
	);

	app.use('/media', router);
}