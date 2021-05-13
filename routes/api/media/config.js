module.exports = function(){
	switch(process.env.NODE_ENV){
        case 'uat':
            return {};

        case 'production':
            return {
            	ali_oss: {
		        	region: 'oss-cn-hangzhou',
					accessKeyId: 'G1SFrhsn80mT8HAZ',
					accessKeySecret: '57jhgA5Yg2F6Vh4GItSZxQ7wszFHAo',
					bucket: 'demo-aivics'
		        }
		    };

        default: //development
            return {
            	ali_oss: {
		        	region: 'oss-cn-hangzhou',
					accessKeyId: 'G1SFrhsn80mT8HAZ',
					accessKeySecret: '57jhgA5Yg2F6Vh4GItSZxQ7wszFHAo',
					bucket: 'demo-aivics'
		        }
            };
    }
}