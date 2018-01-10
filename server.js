// 
// Action on google to get the winners of the western state 100 mile race
// @author: Ido Green | @greenido
// @date: Nov 2017
// @see:
// https://github.com/greenido/bitcoin-info-action
// http://expressjs.com/en/starter/static-files.html
// 

// init project pkgs
const express = require('express');
const ApiAiAssistant = require('actions-on-google').ApiAiAssistant;
const bodyParser = require('body-parser');
const request = require('request');
const app = express();
const Map = require('es6-map');

// Pretty JSON output for logs
const prettyjson = require('prettyjson');
const toSentence = require('underscore.string/toSentence');

app.use(bodyParser.json({type: 'application/json'}));
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// Calling GA to make sure how many invocations we had on this skill
const GAurl = "https://ga-beacon.appspot.com/UA-65622529-1/western-state-100-glitch-server/?pixel=0";
request.get(GAurl, (error, response, body) => {
  console.log(" - Called the GA - " + new Date());
});

// Handle webhook requests
app.post('/', function(req, res, next) {
  
  //logObject('Request headers: ', req.headers);
  //logObject('Request body: ', req.body);
    
  // Instantiate a new API.AI assistant object.
  const assistant = new ApiAiAssistant({request: req, response: res});
  
  const year = parseInt(assistant.getArgument('date-period'));
  // Declare constants for your action and parameter names
  const WINNER_ACTION = 'winner'; 
  const currentYear = (new Date()).getFullYear();
  logObject('Got year ' , year);
  logObject('current year' , currentYear);
  
  // Create functions to handle intents here
  function getWinner(assistant) {
    console.log('** Handling action: ' + WINNER_ACTION);
    if (year > 1979 && year <= currentYear) {
      if (year == 2008) {
        assistant.ask("The 2008 race was cancelled due to numerous wildfires. What other year do you wish to check?");
      }
      else {
        let requestURL = 'http://www.wser.org/results/' + year + '-results/';
        request(requestURL, function(error, response) {
          if(error) {
            console.log("--Got an error: " + error);
            next(error);
          } else {        
            let resHtml = response.body;
            let inx1 = resHtml.indexOf("<table") + 10;
            let inx2 = resHtml.indexOf("row-2", inx1) + 10;
            let inx3 = resHtml.indexOf("column-2", inx2) + 10;
            let inx4 = resHtml.indexOf("</td>", inx3);
            let winnerTime = resHtml.substring(inx3, inx4);

            let inx5 = resHtml.indexOf("column-4", inx4) + 10;
            let inx6 = resHtml.indexOf("</td>", inx5);
            let winner = resHtml.substring(inx5, inx6);
            let inx7 = resHtml.indexOf("column-5", inx6) + 10;
            let inx8 = resHtml.indexOf("</td>", inx7);
            let winnerLastName = resHtml.substring(inx7, inx8);
            console.log("=== winner: " + winner + " " + winnerLastName + " time: " + winnerTime);
            
            if (winner.indexOf("<!DOCT") > 0) {
              assistant.ask("Seems like the race hasn't take place yet! Please check later after June 23rd " + currentYear);
            }
            else {
              let inx70 = resHtml.indexOf(">F<", inx6) - 180;
              let inx73 = resHtml.indexOf("column-2", inx70) + 10;
              let inx74 = resHtml.indexOf("</td>", inx73);
              let femWinnerTime = resHtml.substring(inx73, inx74);

              let inx75 = resHtml.indexOf("column-4", inx74) + 10;
              let inx76 = resHtml.indexOf("</td>", inx75);
              let femWinner = resHtml.substring(inx75, inx76);
              let inx77 = resHtml.indexOf("column-5", inx76) + 10;
              let inx78 = resHtml.indexOf("</td>", inx77);
              let femWinnerLastName = resHtml.substring(inx77, inx78);
              console.log("=== female winner: " + femWinner + " " + femWinnerLastName + " time: " + femWinnerTime);

              // Respond to the user with the current winner. 
              // Using 'ask' and not 'tell' as we don't wish to finish the conversation
              assistant.ask("The winner for " + year + " is " + winner + " " + winnerLastName + " with time of " + winnerTime +
                             " for male and " + femWinner + " " + femWinnerLastName + "  with time of " + femWinnerTime + " for female. What other year do you wish to check?");
            }
            
          }
        });
      }
    }
    else {
      // Using 'ask' and not 'tell' as we don't wish to finish the conversation
      assistant.ask("Sorry but there are no results for " + year + ". We have results from 1980 until " + currentYear + ". For which year do you wish to learn who is the winner?");
    }
    
  }
  
  // Add handler functions to the action router.
  let actionRouter = new Map();
  actionRouter.set(WINNER_ACTION, getWinner);
  
  // Route requests to the proper handler functions via the action router.
  assistant.handleRequest(actionRouter);
});

//
// Handle errors
//
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Oppss... could not check the western state results');
})

//
// Pretty print objects for logging
//
function logObject(message, object, options) {
  console.log(message);
  console.log(prettyjson.render(object, options));
}

//
// Listen for requests -- Start the party
//
let server = app.listen(process.env.PORT, function () {
  console.log('--> Our Webhook is listening on ' + JSON.stringify(server.address()));
});