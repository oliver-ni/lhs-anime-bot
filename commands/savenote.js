const Discord = require("discord.js");
const moment = require('moment');

module.exports = {
    name: "savenote",
    description: "Save a note.",
    aliases: ["sn"],
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!savenote <name> | <text>`");
    },
    execute: async (client, message, args) => {

        if (args.length == 0 || !args.join("").includes("|")) {
            return false;
        }

        const t = args.join(" ").split("|");

        const key = t[0].trim().toLowerCase();
        const value = t[1].trim();

        client.dbI.ensure("saved", {});

        if (client.dbI.has("saved", key)) {
            message.reply("there is already a note with that name.");
            return true;
        }

        client.dbI.set("saved", value, key);

        message.reply("Saved note.");

        return true;

    }
}