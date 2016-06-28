# ERIE Foosball
A Raspberry Pi wired Foosball table that uses the Watson IoT Foundation, Cloudant, and Node-RED.
Built on top of the Foosbuzz team's original code.
Developed and hosted on IBM Bluemix.  Cloned from jazz.net to github.

## Getting the Code Running
This is a demo application so the bulk of the code is a series of Node-RED flows.  It is recommended that 
this application is run in Bluemix, but you can easily run it in any environment with Cloudant(CouchDB) and Node-RED.  

Before you start to implement please review the instructions and bugs at the Foosbuzz documentation page: http://slkaczma.github.io/iot-foosball

#### Key Components
1. [**Node-RED**](https://github.com/node-red/node-red) - The app runs Node-RED embedded in an Express application. Refer to server.js.
2. [**Twitter App Credentials**](https://apps.twitter.com/) - You need to create an app with Twitter to use the Passport OAuth Login for users.
2. [**Twitter App Credentials**](https://developer.linkedin.com/) - You also need to create an app with LinkedIn to use the same Passport OAuth Login.
3. [**Cloudant**](https://cloudant.com/) - noSQL database that stores the game and player data.  The 'games' database should be populated with two initial files, 'totalGames' and '1' to avoid errors in gameplay. 


## Contributors
Version 2 of the Foosbuzz code is a collaboration between [Stefania Kaczmarczyk](https://github.com/slkaczma), [Oliver Rodriquez](https://github.com/odrodrig), and [Vance Morris](https://github.com/vmorris). The Foosbuzz code was modified by [Benjamin Chen](https://github.com/pentachen) for Erie Insurance.

