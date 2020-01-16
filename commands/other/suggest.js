const Discord = require("discord.js");

module.exports = {
    name: "suggest",
    description: "Suggest an improvement for the server.",
    aliases: ["ar"],
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!suggest <suggestion>`");
    },
    execute: async (client, message, args) => {

        if (args.length == 0) return false;

        if (args.join("").toLowerCase().includes("oliver") && args.join(" ").toLowerCase().includes("pillow")) {
            message.channel.send("please don't")
            return true;
        }

        const embed = client.utils.getBaseEmbed(client, message.author);
        embed.setTitle("**Suggestion**");
        embed.setDescription(args.join(" "));

        const suggestion = await client.channels.get("630303882400104448").send(embed);

        message.react("✅");

        await suggestion.react("👍");
        await suggestion.react("👎");

        return true;

    }
}