var express = require('express');
var path = require('path');
var http = require('http');
const engine = require('ejs-mate');
var serveStatic = require('serve-static')
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var sessionStore = require('./libs/sessionStore');
var errorHandler = require('errorhandler');
var HttpError = require('error').HttpError;

var config = require('config');
var log = require('./libs/log')(module);

var index = require('./routes/index');

var app = express();
app.set('port', config.get('port') || 8000);

app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'template'));
app.set('view engine', 'ejs');

app.use(favicon(path.join(__dirname, 'public', 'images', 'favicon.ico')));
app.use(serveStatic(path.join(__dirname, 'public')));

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(session({
    secret: config.get('session:secret'),
    key: config.get('session:key'),
    cookie: config.get('session:cookie'),
    store: sessionStore
}));
app.use(require('./middleware/sendHttpError'));
app.use(require('./middleware/loadUser'));

require('routes')(app);

app.use(function(err, req, res, next) {
    if (typeof err == 'number') {
        err = new HttpError(err);
    }

    if (err instanceof HttpError) {
        res.sendHttpError(err);
    } else {
        if (app.get('env') == 'development') {
            app.use(errorHandler(err, req, res, next));
        } else {
            log.error(err);
            err = new HttpError(500);
            res.sendHttpError(err);
        }
    }
});

http.createServer(app).listen(app.get('port'), function() {
    log.info("Express server listening on port " + app.get('port'));
});
