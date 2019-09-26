const Discord = require("discord.js");

module.exports.run = (client, message, args) => {

    let user = message.author;

    if (args.length > 0 && args[0].startsWith('<@') && args[0].endsWith('>')) {
        let mention = args[0].slice(2, -1);
		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}
		user = client.users.get(mention);
    }

    const key = `${message.guild.id}-${user.id}`;

    const embed = new Discord.RichEmbed();
    embed.setThumbnail(user.avatarURL);
    embed.setAuthor(user.tag, user.avatarURL);

    const curLevel = client.points.get(key, "level");
    const curXP = client.points.get(key, "points");
    const xpMin = curLevel * curLevel * 100;
    const xpMax = (curLevel + 1) * (curLevel + 1) * 100;

    embed.addField("**Level**", curLevel, true);
    embed.addField("**XP**", curXP, true);
    embed.addField("**XP to next level**", xpMax - curXP, true);

    message.channel.send(embed);
}
