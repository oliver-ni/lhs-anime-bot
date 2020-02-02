const Discord = require("discord.js");
const Enmap = require("enmap");
const file = require("file");
const fs = require("fs");
const Jikan = require('jikan-node');
const Hashids = require('hashids/cjs')
const moment = require("moment");

const client = new Discord.Client();
const config = require("./config.js");
const utils = require("./utils.js");

// Bind variables to client for easy access

client.config = config;

client.dbM = new Enmap({name: "points"});           // database of members
client.dbI = new Enmap({name: "db"});               // database of information

client.mal = new Jikan();                           // MyAnimeList API
client.hashids = new Hashids("LHS Anime Club");     // Unique id generator
client.after = {};                                  // For meme command

client.utils = utils;

// Load events

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
}

// Load commands

client.commands = new Enmap();

file.walk("./commands", (a, dirPath, dirs, files) => {
    for (const file of files) {
        console.log(`Attempting to load command file ./${file}`);
        const command = require(`./${file}`);
        if (command.hasOwnProperty("name")) {
            client.commands.set(command.name, command);
        }
    }
});

// Login with token

client.login(config.token);