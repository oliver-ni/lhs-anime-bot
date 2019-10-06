const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

exports.run = async (client, message, args) => {

    let reply;
    let malname;
    let type;
    let user;

    // !mal <@mention>
    if (args.length == 1 && args[0].startsWith('<@') && args[0].endsWith('>')) {

        let mention = args[0].slice(2, -1);
		if (mention.startsWith('!')) {
			mention = mention.slice(1);
		}
        user = client.users.get(mention);
        
        if (client.points.has(`${message.guild.id}-${user.id}`, "mal")) {
            malname = client.points.get(`${message.guild.id}-${user.id}`, "mal");
            reply = await message.reply(`loading MyAnimeList account of **${args[0]}**...`);
            type = "mention";
        } else {
            return message.reply(`${args[0]} does not have a MyAnimeList account linked!`);
        }

    }
    
    // !mal malname
    else if (args.length == 1 && args[0] != "help") {
        malname = args[0];
        reply = await message.reply(`loading MyAnimeList account **${args[0]}**...`);
        type = "malname";
    }
    
    // !mal
    else if (args.length == 0 && client.points.has(`${message.guild.id}-${message.author.id}`, "mal")) {
        malname = client.points.get(`${message.guild.id}-${message.author.id}`, "mal");
        reply = await message.reply(`loading your MyAnimeList account...`);
        type = "self";
    }

    // else
    else {
        const embed = new Discord.RichEmbed();
        embed.setTitle("**!mal**");
        embed.setDescription(`**!mal** – View your own MAL profile
**!mal @mention** – View MAL profile of Discord user
**!mal malname** — View MAL user from MAL username

Link your MAL account using **!linkmal**`);
        embed.setAuthor(message.author.tag, message.author.avatarURL)
        embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
        return message.channel.send(embed);
    }

    console.log(malname);

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
        embed.addField("**Anime Stats**",  `**Episodes:** ${maluser.anime_stats.episodes_watched}
**Days:** ${maluser.anime_stats.days_watched}
**Mean Score:** ${maluser.anime_stats.mean_score}
**Watching:** ${maluser.anime_stats.watching}
**Completed:** ${maluser.anime_stats.completed}
**On Hold:** ${maluser.anime_stats.on_hold}
**Dropped:** ${maluser.anime_stats.dropped}
**Planned:** ${maluser.anime_stats.plan_to_watch}`, true)

        embed.addField("**Manga Stats**",  `**Chapters:** ${maluser.manga_stats.chapters_read}
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
        console.log(e);
    }

}