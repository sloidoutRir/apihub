module.exports = function(){
	switch(process.env.NODE_ENV){
        case 'test':
            return {
            	"log4js": {
		             "appenders": [
		                { "type": "console" },
		                { 
		                    "type": "file", 
		                    "filename": "logs/server.log",
		                    "maxLogSize": 20480,
		                    "backups": 3 
		                }
		            ],
		            replaceConsole: false
		        }
		        , accountCookie: {
		        	name: 'sid_test'
		        }
		        , cookie: {
		        	maxAge: 3600,
		        	secure: false
		        }
		        , jwt: {
		        	secret: 'thisisatestjwttoken' //The hash secret should be changed in Production environment
		        }
		        , express: {
		        	trustProxy: true
		        }
            };

        case 'production':
            return {
            	"log4js": {
		             "appenders": [
		                { 
		                    "type": "file", 
		                    "filename": "logs/cheese.log",
		                    "maxLogSize": 20480,
		                    "backups": 3, 
		                    "category": "cheese" 
		                }
		            ]
		            
		        }
		        , cookie: {
		        	maxAge: 3600,
		        	secure: true
		        }
		        , express: {
		        	trustProxy: true
		        }
		    };

        default: //development
            return {
            	"log4js": {
		             "appenders": [
		                { "type": "console" },
		                { 
		                    "type": "file", 
		                    "filename": "logs/cheese.log",
		                    "maxLogSize": 20480,
		                    "backups": 3, 
		                    "category": "cheese" 
		                }
		            ],
		            replaceConsole: false
		        },
		        accountCookie: {
		        	name: 'sid_dev'
		        },
		        cookie: {
		        	maxAge: 3600,
		        	secure: false
		        },
		        jwt: {
		        	secret: 'thisisatestjwttoken' //The hash secret should be changed in Production environment
		        }
		        , express: {
		        	trustProxy: false
		        }
            };
    }
}
