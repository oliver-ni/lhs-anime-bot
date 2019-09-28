const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");
const Jikan = require('jikan-node');
const Hashids = require('hashids/cjs')

const client = new Discord.Client();
const config = require("./config.js");

client.config = config;
client.points = new Enmap({name: "points"});
client.mal = new Jikan();
client.hashids = new Hashids("LHS Anime Club");
client.after = "";

client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
});

fs.readdir("./events/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        const event = require(`./events/${file}`);
        let eventName = file.split(".")[0];
        client.on(eventName, event.bind(null, client));
    });
}); 

client.commands = new Enmap();

fs.readdir("./commands/", (err, files) => {
    if (err) return console.error(err);
    files.forEach(file => {
        if (!file.endsWith(".js")) return;
        let props = require(`./commands/${file}`);
        let commandName = file.split(".")[0];
        console.log(`Attempting to load command ${commandName}`);
        client.commands.set(commandName, props);
    });
});

client.login(config.token);