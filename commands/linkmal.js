const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

module.exports = {
    name: "linkmal",
    description: "Link your MyAnimeList account.",
    channelType: ["text"],
    usage: (client, message) => {
        const helpembed = client.utils.getBaseEmbed(client, message.author);

        helpembed.setTitle("**!linkmal**");
        helpembed.setDescription(`**!linkmal malname** — Link your MAL account`);

        message.channel.send(helpembed);
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const code = client.hashids.encode(BigInt(message.author.id));

        const embed = client.utils.getBaseEmbed(client, message.author);
        embed.setTitle("**Link MyAnimeList Account**");

        embed.setDescription(`To link your MAL account **${args[0]}** to your Discord account, please perform the following steps:

1. Login to your MyAnimeList account.
2. Navigate to your profile page.
3. Click **Edit Profile**.
4. Somewhere in the **About Me** section, add the text \`${code}\`.
5. Click the icon below to finish setting up your account.`);

        const question = await message.channel.send(embed);

        const filter = (reaction, user) => {
            return "✅" == reaction.emoji.name && user.id === message.author.id;
        };

        question.react("✅");

        try {
            const collected = await question.awaitReactions(filter, {
                max: 1, time: 120000, errors: ["time"]
            });

            const maluser = await client.mal.findUser(args[0]);
            question.delete();

            if (maluser.about.includes(code)) {

                const key = `${message.guild.id}-${message.author.id}`;
                client.dbM.set(key, args[0], "mal");

                const embed = new Discord.RichEmbed();
                embed.setTitle("**Success!**");
                embed.setDescription("You have successfully linked your MyAnimeList Account.");
                embed.setAuthor(message.author.tag, message.author.avatarURL)
                embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)

                message.channel.send(embed);

            } else {
                message.channel.send("Could not find verification code. Please try again. You may need to wait 10-20 seconds for it to update.");
            }

        } catch (e) {
            question.delete();
            message.channel.send("Unable to link MyAnimeList account.");
        }

        return true;

    }
}