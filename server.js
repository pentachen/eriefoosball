/*
*  
*
*    ______   ______     ______     ______     ______     __  __     ______     ______    
*   /\  ___\ /\  __ \   /\  __ \   /\  ___\   /\  == \   /\ \/\ \   /\___  \   /\___  \   
*   \ \  __\ \ \ \/\ \  \ \ \/\ \  \ \___  \  \ \  __<   \ \ \_\ \  \/_/  /__  \/_/  /__  
*    \ \_\    \ \_____\  \ \_____\  \/\_____\  \ \_____\  \ \_____\   /\_____\   /\_____\ 
*     \/_/     \/_____/   \/_____/   \/_____/   \/_____/   \/_____/   \/_____/   \/_____/ 
*
*       An IoT connected foosball table powered by Watson IoT, Cloudant, and Node-RED
*/
/*eslint-env node */
"use strict";  /* always for Node.JS, never global in the browser */

// Set the modules
var http    = require('http'),
    path    = require("path"),     
    express = require("express"),
    RED     = require("node-red"),
    passport = require('passport'),
    StrategyTwit = require('passport-twitter').Strategy,
    StrategyLink = require('passport-linkedin').Strategy
;

// Create an Express app
var app = express();

var cfenv = require("cfenv");
var appEnv = cfenv.getAppEnv();
var VCAP_APPLICATION = JSON.parse(process.env.VCAP_APPLICATION);

// Add a simple route for static content served from './public'
app.use( "/", express.static("public") );

// Create a server
var httpServer = http.createServer(app);
var port = process.env.VCAP_APP_PORT || 8080;

// Use application-level middleware for common functionality
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: true, saveUninitialized: true }));

// Set up the client for sending data to Node-RED
var Client = require('node-rest-client').Client;
var client = new Client();

/*
 * Passport for Twitter Authentication.  We want to verify a user exists and then send their profile
 * to Node-RED.  This session is not persisted. 
 */
var team = 1;

passport.use(new StrategyTwit({
    consumerKey: "lGFcVJeYXUsqP45SxzIiYpHKo",
    consumerSecret: "4nnFwklZD26xNCnIkpuMFosxLyuviqLPDrY2EoCD9z26ChVrVZ",
    callbackURL: "http://eriefoosball.mybluemix.net/login/twitter/return"
  },
  function(token, tokenSecret, player, cb) {
    
	// Grab the Twitter photo and strip out the minimizer  
    var photo = player.photos[0].value;
    photo = photo.replace("_normal", ""); 
    console.log(photo);
  	
  	// Let Node-RED know there has been a successful login and send the profile data for further processing
  	var args = {
	   data: {id:player.id,handle:player.username,name:player.displayName,photo:photo,chosenTeam:team},
	   headers: { "Content-Type": "application/json" }
	};
	   
	client.post("https://eriefoosball.mybluemix.net/player", args, function (data, response) {
		console.log(data);
		console.log(response);
	});
  	
    return cb(null, player);
}));

// Update the credentials with the information from your LinkedIn app 
passport.use(new StrategyLink({
    consumerKey: "778wb3k06jddgt",
    consumerSecret: "Ypiny4zUvf8l3axT",
    callbackURL: "https://eriefoosball.mybluemix.net/login/linkedin/return",
    profileFields: ['id', 'formatted-name', 'picture-urls::(original)']
  },
  function(token, tokenSecret, player, cb) {
	
	// Let Node-RED know there has been a successful login and send the profile data for further processing
  	var args = {
	   data: {id:player.id,handle:"N/A",name:player._json.formattedName,photo:player._json.pictureUrls.values[0],chosenTeam:team},
	   headers: { "Content-Type": "application/json" }
	};
	   
	client.post("https://eriefoosball.mybluemix.net/player", args, function (data, response) {
		console.log(data);
		console.log(response);
	});
  	
    return cb(null, player);
}));

// Configure Passport authenticated session persistence.
passport.serializeUser(function(user, cb) {
  cb(null, user);
});

passport.deserializeUser(function(obj, cb) {
  cb(null, obj);
}); 

// Initialize Passport and restore authentication state, if any, from the session.
app.use(passport.initialize());
app.use(passport.session());

//LINKEDIN
// Manually handling login for each side with a login1 and login2
app.get('/login1', function(req, res) {
	team = 1;
	res.redirect('/login/linkedin');
});

app.get('/login2', function(req, res) {
	team = 2;
	res.redirect('/login/linkedin');
});

//TWITTER
// Manually handling login for each side with a login1t and login2t
app.get('/login1t', function(req, res) {
	team = 1;
	res.redirect('/login/twitter');
});

app.get('/login2t', function(req, res) {
	team = 2;
	res.redirect('/login/twitter');
});

app.get('/login/twitter',passport.authenticate('twitter', { forceLogin: true }));
app.get('/login/linkedin',passport.authenticate('linkedin'));

app.get('/login/twitter/return', 
  passport.authenticate('twitter', { failureRedirect: '/' }),
  function(req, res) {
    req.logout();
    res.redirect('/');
  });

app.get('/login/linkedin/return', 
  passport.authenticate('linkedin', { failureRedirect: '/' }),
  function(req, res) {
//    req.logout();
    req.session.destroy(); //StackOverflow said to use this;
    res.redirect('/');
  });

 
/*
 * Begin set-up for the Node-RED directory.  There are a few key differences between a vanilla install of Node-RED
 * and embedding Node-RED in an Express app.  The settings variable has similar details to bluemix-settings.js.
 */

var settings = {
    httpAdminRoot:"/red",    
    httpNodeRoot: "/",               
    mqttReconnectTime: 4000,
    serialReconnectTime: 4000,
    debugMaxLength: 1000,
	
	// Basic flow protection, password is password using bcrypt algorithm 
	adminAuth: {
        type: "credentials",
        users: [{
            username: "admin",
            password: "$2a$08$zZWtXTja0fB1pzD4sHCMyOCMYz2Z6dNbM6tl8sJogENOMcxWV9DN.",
            permissions: "*"
        }]
    },

    // Add the bluemix-specific nodes in
    nodesDir: path.join(__dirname,"nodes"),

    // Blacklist the non-bluemix friendly nodes
    nodesExcludes:['66-mongodb.js','75-exec.js','35-arduino.js','36-rpi-gpio.js','25-serial.js','28-tail.js','50-file.js','31-tcpin.js','32-udp.js','23-watch.js'],

    // Enable module reinstalls on start-up; this ensures modules installed
    // post-deploy are restored after a restage
    autoInstallModules: true,
    
    functionGlobalContext: { // enables and pre-populates the context.global variable
    },

    storageModule: require("./couchstorage")
};
// Not used in embedded mode: uiHost, uiPort, httpAdminAuth, httpNodeAuth, httpStatic, httpStaticAuth, https

// Check to see if Cloudant service exists
settings.couchAppname = VCAP_APPLICATION['application_name'];

if (process.env.VCAP_SERVICES) {
// Running on Bluemix. Parse the port and host that we've been assigned.
    var env = JSON.parse(process.env.VCAP_SERVICES);
    console.log('VCAP_SERVICES: %s', process.env.VCAP_SERVICES);
    // Also parse Cloudant settings.
    var couchService = env['cloudantNoSQLDB'][0]['credentials'];    
}

if (!couchService) {
    console.log("Failed to find Cloudant service");
    if (process.env.NODE_RED_STORAGE_NAME) {
        console.log(" - using NODE_RED_STORAGE_NAME environment variable: "+process.env.NODE_RED_STORAGE_NAME);
    }
    throw new Error("No cloudant service found");
}    
settings.couchUrl = couchService.url;

// Initialise the runtime with a server and settings
RED.init( httpServer, settings );

// Serve the editor UI from /red
app.use( settings.httpAdminRoot, RED.httpAdmin );

// Serve the http nodes UI from /api
app.use( settings.httpNodeRoot, RED.httpNode );

httpServer.listen( port, function(){
  console.log('App listening on port: ', port);
});

// Start the runtime
RED.start();