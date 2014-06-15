var express = require('express')
  , http = require('http')
  , passport = require('passport')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , request = require("request");
 
var app = express();

// configure Express
app.set('port', process.env.PORT || 3000);

var LINKEDIN_API_KEY = "77o5utzfrab1wz";
var LINKEDIN_SECRET_KEY = "S1NTOHbq5juFqFFj";
var LINKEDIN_CONSUMER_KEY = "f7037e9e-2db3-48be-87cf-0f175b5fc391";
var LINKEDIN_CONSUMER_SECRET = "72ce6c51-4402-4232-b7ca-ae65c3bca933";
var LINKEDIN_CALLBACK_URL = "https://sleepy-lowlands-2774.herokuapp.com/auth/linkedin/callback";
//var LINKEDIN_CALLBACK_URL = "http://localhost:5000/auth/linkedin/callback";


passport.use('linkedin', new OAuth2Strategy({
    authorizationURL: 'https://www.linkedin.com/uas/oauth2/authorization?response_type=code&state=BFEDDCAF45453sdffef424',
    tokenURL: 'https://www.linkedin.com/uas/oauth2/accessToken',
    clientID: LINKEDIN_API_KEY,
    clientSecret: LINKEDIN_SECRET_KEY,
    callbackURL: LINKEDIN_CALLBACK_URL
  },
  function(accessToken, refreshToken, profile, done) {
    request({
	  uri: "https://api.linkedin.com/v1/people/~/connections",
	  method: "GET",
	  timeout: 10000,
	  followRedirect: true,
	  maxRedirects: 10,
	  headers: { 'x-li-format': 'json' },
	  qs: { oauth2_access_token: accessToken }
	}, function(error, response, body) {
	  console.log(body);
      done(error, null);
	});
  }
));

app.get('/auth/linkedin',
  passport.authenticate('linkedin'),
  function(req, res){
  });

app.get('/auth/linkedin/callback',
  passport.authenticate('linkedin', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

