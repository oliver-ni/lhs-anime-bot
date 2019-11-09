const Discord = require("discord.js");
const Enmap = require("enmap");
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
client.after = "";                                  // For meme command

client.utils = utils;

// On bot ready

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Fetch role assignment message
    client.channels.get(client.config.rolesChannelID).fetchMessage(client.config.rolesMessageID);

    // Check for mutes every 10 seconds
    setInterval(() => {
        const mutes = client.dbI.get("mutes");
        let idx = 0;
        for (const mute of mutes) {
            const date = moment(mute.end);
            const guild = client.guilds.get(mute.guild);
            const member = guild.members.get(mute.user);
            const mutedRole = guild.roles.get("636807183358754816");

            if (moment().diff(date) >= 0) {
                member.removeRole(mutedRole);
                mutes.splice(idx);
                idx--;
                member.user.send("You have been unmuted.");
            }

            idx++;
        }
        client.dbI.set("mutes", mutes);
    }, 10000);
});

// Load events

const eventFiles = fs.readdirSync('./events').filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const event = require(`./events/${file}`);
    let eventName = file.split(".")[0];
    client.on(eventName, event.bind(null, client));
}

// Load commands

client.commands = new Enmap();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
    console.log(`Attempting to load command file ${file}`);
	client.commands.set(command.name, command);
}

// Login with token

client.login(config.token);