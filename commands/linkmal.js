const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

exports.run = async (client, message, args) => {

    if (args.length == 0) {
        const embed = new Discord.RichEmbed();
        embed.setTitle("**!linkmal**");
        embed.setDescription(`**!linkmal malname** — Link your MAL account`);
        embed.setAuthor(message.author.tag, message.author.avatarURL)
        embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
        return message.channel.send(embed);
    }

    const code = client.hashids.encode(BigInt(message.author.id));

    const embed = new Discord.RichEmbed();

    embed.setColor(0xF1C40F);
    embed.setTitle("**Link MyAnimeList Account**");

    embed.setDescription(`To link your MAL account **${args[0]}** to your Discord account, please perform the following steps:

1. Login to your MyAnimeList account.
2. Navigate to your profile page.
3. Click **Edit Profile**.
4. Somewhere in the **About Me** section, add the text \`${code}\`.
5. Click the icon below to finish setting up your account.`);

    embed.setAuthor(message.author.tag, message.author.avatarURL)
    embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)

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
            client.points.set(key, args[0], "mal");
            
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
        console.log(e);
    }

    // try {
    //     const maluser = await client.mal.findUser(args[0]);

    //     const embed = new Discord.RichEmbed();

    //     embed.setTitle("**MyAnimeList Profile**");

    //     reply.delete();
    //     message.channel.send(embed);

    // } catch (e) {
    //     reply.edit("Unable to load MyAnimeList account.");
    //     console.log(e);
    // }

}