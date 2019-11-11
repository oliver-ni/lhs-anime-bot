const Discord = require("discord.js");
const moment = require('moment');

module.exports = {
    name: "getnote",
    description: "Retrieve a saved note.",
    aliases: ["gn"],
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!getnote <name>`");
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const key = args.join(" ").toLowerCase();

        client.dbI.ensure("saved", {});

        if (!client.dbI.has("saved", key)) {
            message.reply("there is no note with that name.");
            return true;
        }

        message.channel.send(`Note (**${key}**):

${client.dbI.get("saved", key)}`);

        return true;

    }
}