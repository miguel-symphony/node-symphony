const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const symphony = require('./node-symphony');
var bot = symphony(require('./config.q.preview.js'));

const availableCmds = Object.getOwnPropertyNames(bot).filter(function (p) {
    return typeof bot[p] == 'function' && !p.startsWith('_');
});

getUserInput('What do you want to do?\n');

function getUserInput(question) {
    rl.question(question, async function(cmd) {
        if (cmd == "exit"){
            rl.close();
        } else if(cmd == 'runtests') {
            await tests();
            getUserInput('That was fun. Now what?\n');
        } else if(availableCmds.includes(cmd)) {
            console.log('Processing command...');
            var result = await bot[cmd]();
            console.log(result.body);
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
    console.log(healthcheck.body);

    var sessioninfo = await bot.sessioninfo();
    console.log(sessioninfo.body);

    var echo = await bot.echo('hello');
    console.log(echo.body);

    var userstreams = await bot.userstreams();
    console.log(userstreams.body);

    console.log('finished.');
}