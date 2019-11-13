const Discord = require("discord.js");
const moment = require('moment');

const alphabet = ['🇦', '🇧', '🇨', '🇩', '🇪', '🇫', '🇬', '🇭', '🇮', '🇯', '🇰', '🇱', '🇲', '🇳', '🇴', '🇵', '🇶', '🇷', '🇸', '🇹', '🇺', '🇻', '🇼', '🇽', '🇾', '🇿'];

module.exports = {
    name: "!poll",
    description: "Create a poll.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!poll <title> | <description | [choice1] | [choice2] | [choice3] ...`");
    },
    execute: async (client, message, args) => {

        let choices = args.join(" ").split("|").map(e => e.trim());
        const title = choices[0];
        const description = choices[1];
        choices = choices.slice(2);

        const embed = client.utils.getBaseEmbed(client);
        embed.setTitle(`**${title}**`);
        embed.setDescription(description + "\n\n" + choices.map((val, idx) => `${alphabet[idx]} ${val}`).join("\n"));

        const poll = await message.channel.send(embed);

        for (let i = 0; i < choices.length; i++) {
            await poll.react(alphabet[i])
        }

        return true;

    }
}