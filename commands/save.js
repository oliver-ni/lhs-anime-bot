const Discord = require("discord.js");
const moment = require('moment');

exports.run = async (client, message, args) => {

    if (!args.includes("|")) {
        const embed = new Discord.RichEmbed();
        embed.setTitle("**!save**");
        embed.setDescription(`**!save name | text** — Save a server-wide note`);
        embed.setAuthor(message.author.tag, message.author.avatarURL)
        embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
        return message.channel.send(embed);
    }

    const t = args.join(" ").split("|");

    const key = t[0].trim().toLowerCase();
    const value = t[1].trim();

    client.dbI.ensure("saved", {});

    if (client.dbI.has("saved", key)) {
        return message.reply("there is already a note with that name.");
    }

    client.dbI.set("saved", value, key);

    message.reply("Saved note.")

};