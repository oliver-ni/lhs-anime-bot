const Discord = require("discord.js");
const Enmap = require("enmap");
const fs = require("fs");
const Jikan = require('jikan-node');
const Hashids = require('hashids/cjs')
const moment = require("moment");

const client = new Discord.Client();
const config = require("./config.js");

client.config = config;

client.dbM = new Enmap({name: "points"});
client.dbI = new Enmap({name: "db"});

client.mal = new Jikan();
client.hashids = new Hashids("LHS Anime Club");
client.after = "";

client.on("ready", () => {
    //console.log(`Logged in as ${client.user.tag}!`);
    client.channels.get(client.config.rolesChannelID).fetchMessage(client.config.rolesMessageID);
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
        //console.log(`Attempting to load command ${commandName}`);
        client.commands.set(commandName, props);
    });
});

client.login(config.token);