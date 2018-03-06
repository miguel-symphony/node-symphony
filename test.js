const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const symphony = require('./index.js');
var bot = symphony(require('./config.js'));

const availableCmds = Object.getOwnPropertyNames(bot).filter(function (p) {
    return typeof bot[p] == 'function' && !p.startsWith('_');
});

getUserInput('What do you want to do?\n');

function getUserInput(question) {
    rl.question(question, async function(question) {

        // split question by space
        var cmdList = question.split(/[ ]+/);
        
        var cmd = cmdList[0] || 'help';

        if (cmd == "exit"){
            rl.close();
        } else if(cmd == 'runtests') {
            await tests();
            getUserInput('That was fun. Now what?\n');
        } else if(availableCmds.includes(cmd)) {
            console.log('Processing command...');
            try {
                var result = await bot[cmd](cmdList[1],cmdList[2]);
                console.log(result);
            } catch(error) {
                console.log(error);
            }
            getUserInput('That was fun. Now what?\n');
        } else {
            console.log('Please try a valid command');
            console.log(availableCmds);
            getUserInput('');
        }
    });
}


async function tests() {
    console.log('Running tests...');

    var healthcheck = await bot.healthcheck();
    console.log(healthcheck);

    var sessioninfo = await bot.sessioninfo();
    console.log(sessioninfo);

    var echo = await bot.echo('hello');
    console.log(echo);

    var userstreams = await bot.userstreams();
    console.log(userstreams);

    console.log('finished.');
}