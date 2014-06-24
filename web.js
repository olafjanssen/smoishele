var express = require('express')
  , http = require('http')
  , passport = require('passport')
  , OAuth2Strategy = require('passport-oauth').OAuth2Strategy
  , request = require("request")
  , FacebookStrategy = require('passport-facebook').Strategy;
 
var app = express();

// configure Express
app.set('port', process.env.PORT || 5000);


passport.use(new FacebookStrategy({
    clientID: "715869205121101",
    clientSecret: "cb638b8d257fe9c2ada4da99028a68bf",
    callbackURL: "http://localhost:5000/auth/facebook/callback"
  },
  function(accessToken, refreshToken, profile, done) {

    request({
        uri: "https://graph.facebook.com/v2.0/me/photos?access_token=" + accessToken,
        method: "GET",
        timeout: 10000,
        followRedirect: true,
        maxRedirects: 10,
        headers: { 'x-li-format': 'json' },
      }, function(error, response, body) {
          var photos = JSON.parse(body);

          console.log(photos.data);
          for(var p = 0;p < photos.data.length; p++){
            console.log(photos.data[p].picture);
          }

          done(error, null);
      });

  }
));


app.get('/auth/facebook',
  passport.authenticate('facebook'),
  function(req, res){
  });

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

