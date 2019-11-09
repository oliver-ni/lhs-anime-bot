const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

module.exports = {
    name: "myanimelist",
    description: "View somebody's profile on MyAnimeList.",
    aliases: ["mal"],
    channelType: ["text"],
    usage: (client, message) => {
        const helpembed = client.utils.getBaseEmbed(client, message.author);

        helpembed.setTitle("**!mal**");
        helpembed.setDescription(`
    
        **!mal** – View your own MyAnimeList profile
        **!mal <@user>** – View MyAnimeList profile of Discord user
        **!mal malname** — View MyAnimeList user from MAL username
    
        Link your MAL account using **!linkmal**
    
        `.trim());

        message.channel.send(helpembed);
    },
    execute: async (client, message, args) => {

        let reply;
        let malname;
        let type;
        let user;

        // !mal <@mention>
        if (args.length == 1 && client.utils.isMention(args[0])) {

            user = client.utils.getMentionUser(args[0]);

            if (client.dbM.has(`${message.guild.id}-${user.id}`, "mal")) {
                malname = client.dbM.get(`${message.guild.id}-${user.id}`, "mal");
                reply = await message.reply(`loading MyAnimeList account of **${args[0]}**...`);
                type = "mention";
            } else {
                message.reply(`${args[0]} does not have a MyAnimeList account linked!`);
                return true;
            }

        }

        // !mal malname
        else if (args.length == 1 && args[0] != "help") {
            malname = args[0];
            reply = await message.reply(`loading MyAnimeList account **${args[0]}**...`);
            type = "malname";
        }

        // !mal
        else if (args.length == 0 && client.dbM.has(`${message.guild.id}-${message.author.id}`, "mal")) {
            malname = client.dbM.get(`${message.guild.id}-${message.author.id}`, "mal");
            reply = await message.reply(`loading your MyAnimeList account...`);
            type = "self";
        }

        // else
        else {
            return false;
        }

        //console.log(malname);

        try {
            const maluser = await client.mal.findUser(malname);

            const embed = new Discord.RichEmbed();

            if (type == "mention") {
                embed.setAuthor(user.tag, user.avatarURL);
            } else if (type == "self") {
                embed.setAuthor(message.author.tag, message.author.avatarURL);
            } else if (type == "malname") {
                if (maluser.image_url) {
                    embed.setAuthor(maluser.username, maluser.image_url);
                } else {
                    embed.setAuthor(maluser.username);
                }
            }

            embed.setTitle("**MyAnimeList Profile**");
            embed.addField("**Anime Stats**", `**Episodes:** ${maluser.anime_stats.episodes_watched}
**Days:** ${maluser.anime_stats.days_watched}
**Mean Score:** ${maluser.anime_stats.mean_score}
**Watching:** ${maluser.anime_stats.watching}
**Completed:** ${maluser.anime_stats.completed}
**On Hold:** ${maluser.anime_stats.on_hold}
**Dropped:** ${maluser.anime_stats.dropped}
**Planned:** ${maluser.anime_stats.plan_to_watch}`, true)

            embed.addField("**Manga Stats**", `**Chapters:** ${maluser.manga_stats.chapters_read}
**Days:** ${maluser.manga_stats.days_read}
**Mean Score:** ${maluser.manga_stats.mean_score}
**Reading:** ${maluser.manga_stats.reading}
**Completed:** ${maluser.manga_stats.completed}
**On Hold:** ${maluser.manga_stats.on_hold}
**Dropped:** ${maluser.manga_stats.dropped}
**Planned:** ${maluser.manga_stats.plan_to_read}`, true)

            reply.delete();
            message.channel.send(embed);

        } catch (e) {
            reply.edit("Unable to load MyAnimeList account.");
        }

        return true;

    }
}