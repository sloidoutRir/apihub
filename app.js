var express         = require('express')
    , path          = require('path')
    , favicon       = require('serve-favicon')
    , cookieParser  = require('cookie-parser')
    , bodyParser    = require('body-parser')
    , config        = require('./config')()
    , debug         = require('debug')('http');


// Object that stores application level settings
// that are used by the routes
// This avoids the need to create global variables
// and also help in testing since you can inject
// any configuration you wish to test
//TODO: should put configuration into databases
var settings    = {
                    config: config
                };


//Connect to mongodb
// var db = require('./models/db')(config.mongodb.conn);

var app             = express()
    , consoleApp    = express()
    , admin         = express() //The sub app - administion
    , identity      = express() //The sub app - identity service provider 
    , api           = express();

// view engine setup
//app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.set('trust proxy', config.express.trustProxy); //Because it is always befind the proxy 

//app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser("oauth2isgreatforcloudapps", config.cookie));
app.use(express.static(path.join(__dirname, 'public')));


// app.use('/admin', admin);
// var adminRoutes = require('./admin')(admin, settings);

app.use('/console', consoleApp);
var consoleRoutes = require('./routes/console')(consoleApp, settings);

app.use('/identity', identity);
var accountRoutes = require('./routes/identity')(identity, settings);

app.use('/api', api);
var apiRoutes = require('./routes/api')(api, settings);


app.get('/', function(req, res, next){
    return res.render('index', { title: 'app hub'});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});



// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        debug("internal server error: ", err);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});


module.exports = app;
