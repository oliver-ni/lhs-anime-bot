const Discord = require("discord.js");

module.exports = {
    name: "xp",
    description: "View somebody's XP profile.",
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!xp [@user]`");
    },
    execute: async (client, message, args) => {

        let user = message.author;

        if (args.length > 0 && client.utils.isMention(args[0])) {
            user = client.utils.getMentionUser(args[0]);
        }

        const key = `${message.guild.id}-${user.id}`;

        client.dbM.ensure(key, {
            user: user.id,
            guild: message.guild.id,
            points: 0,
            level: 0
        });

        const embed = client.utils.getBaseEmbed(client, message.author);
        embed.setThumbnail(user.avatarURL);

        const curLevel = client.dbM.get(key, "level");
        const curXP = client.dbM.get(key, "points");
        const xpMin = curLevel * curLevel * 100;
        const xpMax = (curLevel + 1) * (curLevel + 1) * 100;

        embed.addField("**Level**", curLevel, true);
        embed.addField("**XP**", curXP, true);
        embed.addField("**XP to next level**", xpMax - curXP, true);

        message.channel.send(embed);

        return true;
    }
}