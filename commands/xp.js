const Discord = require("discord.js");

module.exports.run = (client, message, args) => {

    const key = `${message.guild.id}-${message.author.id}`;

    const embed = new Discord.RichEmbed();
    embed.setThumbnail(message.author.avatarURL);
    embed.setAuthor(message.author.tag, message.author.avatarURL);

    const curLevel = client.points.get(key, "level");
    const curXP = client.points.get(key, "points");
    const xpMin = curLevel * curLevel * 100;
    const xpMax = (curLevel + 1) * (curLevel + 1) * 100;

    embed.addField("**Level**", curLevel, true);
    embed.addField("**XP**", curXP, true);
    embed.addField("**XP to next level**", xpMax - curXP, true);

    message.channel.send(embed);
}
