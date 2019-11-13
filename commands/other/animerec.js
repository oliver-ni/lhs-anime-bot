const Discord = require("discord.js");
const moment = require('moment');

module.exports = {
    name: "animerec",
    description: "Recommend an anime for us to watch.",
    aliases: ["ar"],
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!animerec <anime>`");
    },
    execute: async (client, message, args) => {

        if (args.length == 0) return false;

        const key = `${message.guild.id}-${message.author.id}`;
        client.dbM.ensure(key, new Date(0), "suggest");

        const diff = moment.duration(moment(client.dbM.get(key, "suggest")).diff(moment()));

        if (Math.abs(diff.asHours()) < 10) {
            const wait = diff.add(10, "h");
            message.reply(`please wait **${wait.hours()}h ${wait.minutes()}m** before using this command again.`);
            return true;
        }

        client.dbM.set(key, new Date(), "suggest");

        const embed = client.utils.getBaseEmbed(client, message.author);
        embed.setTitle("**Anime Suggestion**");
        embed.setDescription(args.join(" "));

        const suggestion = await client.channels.get("635695804488744991").send(embed);

        message.react("✅");

        await suggestion.react("👍");
        await suggestion.react("👎");

        return true;

    }
}