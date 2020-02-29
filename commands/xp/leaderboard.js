const Discord = require("discord.js");

module.exports = {
    name: "leaderboard",
    description: "View the server XP leaderboard",
    aliases: ["lb", "top"],
    channelType: ["text"],
    execute: async (client, message, args) => {
        let server = client.dbM.filter(p => p.guild === message.guild.id).array();
        server = server.sort((a, b) => b.points - a.points);

        const getEmbed = (start) => {
            const embed = new Discord.RichEmbed()
            embed.setTitle("**Leaderboard**")
            embed.setDescription("Most active users in the LHS Anime Club Discord server.")
            embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
            embed.setColor(0xF1C40F);

            for (let i = start; i < start + 5 && i < server.length; i++) {
                const user = server[i];
                if (client.users.get(user.user))
                    embed.addField(`**${i + 1}. ${client.users.get(user.user).tag}**`, `${user.points} (level ${user.level})`);
                else
                    embed.addField(`**${i + 1}. Unknown User ${user.user}**`, `${user.points} (level ${user.level})`);
            }
            return embed;
        }

        let current = 0;
        const lastPage = Math.floor(server.length / 5) * 5;

        const leaderboard = await message.channel.send(getEmbed(current));

        const filter = (reaction, user) => {
            return ["⏮", "◀", "▶", "⏭"].includes(reaction.emoji.name) && user.id !== client.user.id;
        };

        const collector = leaderboard.createReactionCollector(filter, { time: 30000 });

        collector.on('collect', (reaction, reactionCollector) => {

            for (const user of reaction.users) {
                //console.log(user);
                if (!user[1].bot) {
                    reaction.remove(user[0]);
                }
            }

            if (reaction.emoji.name == "⏮") current = 0;
            if (reaction.emoji.name == "◀") current -= 5;
            if (reaction.emoji.name == "▶") current += 5
            if (reaction.emoji.name == "⏭") current = lastPage;

            if (current < 0) current = lastPage;
            if (current > lastPage) current = 0;

            leaderboard.edit(getEmbed(current));
        });

        collector.on('end', collected => {
            leaderboard.clearReactions();
        });

        await leaderboard.react("⏮");
        await leaderboard.react("◀");
        await leaderboard.react("▶");
        await leaderboard.react("⏭");

        return true;
    }
}
