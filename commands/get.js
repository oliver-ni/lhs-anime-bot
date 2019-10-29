const Discord = require("discord.js");
const moment = require('moment');

exports.run = async (client, message, args) => {

    if (args.length == 0) {
        const embed = new Discord.RichEmbed();
        embed.setTitle("**!get**");
        embed.setDescription(`**!get name** — Get a server-wide note`);
        embed.setAuthor(message.author.tag, message.author.avatarURL)
        embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
        return message.channel.send(embed);
    }

    const key = args.join(" ").toLowerCase();

    client.dbI.ensure("saved", {});

    if (!client.dbI.has("saved", key)) {
        return message.reply("there is no note with that name.");
    }

    message.channel.send(`Note (**${key}**):

${client.dbI.get("saved", key)}`);

};