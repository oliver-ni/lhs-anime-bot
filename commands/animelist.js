const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

const utils = require("../utils.js");

// Statuses from MAL API

const statuses = {
    1: "Watching",
    2: "Completed",
    3: "On Hold",
    4: "Dropped",
    6: "Plan to Watch"
}

module.exports = {
    name: "animelist",
    description: "View somebody's Anime List on MyAnimeList.",
    aliases: ["al"],
    channelType: ["text"],
    usage: (client, message) => {
        const helpembed = client.utils.getBaseEmbed(client, message.author);
    
        helpembed.setTitle("**!animelist**");
        helpembed.setDescription(`
    
        **!animelist** – View your own MAL profile
        **!animelist <@user>** – View MAL profile of Discord user
        **!animelist malname** — View MAL user from MAL username
    
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

            user = client.utils.getMentionUser(client, args[0]);

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

        try {
            const maluser = await client.mal.findUser(malname, "animelist");

            const anime = maluser.anime.sort((a, b) => {
                if (b.watching_status > a.watching_status) return -1;
                if (a.watching_status > b.watching_status) return 1;
                if (b.title > a.title) return -1;
                if (a.title > b.title) return 1;
                return 0;
            });

            const pages = [];
            let page = [];
            let chunk = [];
            let status = 0;
            let length = 0;
            for (const item of anime) {
                if (item.watching_status > status) {
                    page.push({
                        status: status,
                        items: chunk
                    });
                    status = item.watching_status;
                    chunk = []
                }
                if (length == 15) {
                    page.push({
                        status: status,
                        items: chunk
                    });
                    pages.push(page);
                    length = 0;
                    chunk = [];
                    page = [];
                }
                chunk.push(item);
                length++;
            }
            page.push({
                status: status,
                items: chunk
            });
            pages.push(page);

            const getEmbed = (curPage, maxPage) => {

                const embed = new Discord.RichEmbed();

                if (type == "mention") {
                    embed.setAuthor(user.tag, user.avatarURL);
                } else if (type == "self") {
                    embed.setAuthor(message.author.tag, message.author.avatarURL);
                } else if (type == "malname") {
                    embed.setAuthor(malname);
                }

                embed.setURL(`https://myanimelist.net/animelist/${malname}`);
                embed.setTitle("Anime List");
                embed.setFooter(`LHS Anime Club Bot | Page ${curPage + 1}/${maxPage + 1}`, client.user.avatarURL)
                embed.setColor(0xF1C40F);

                for (const chunk of pages[curPage]) {
                    if (chunk.items.length == 0) continue
                    const txt = chunk.items.map(e => {
                        let name = e.title;
                        if (e.score > 0) name += ` **${e.score}**`
                        return name;
                    }).join("\n")
                    embed.addField(`**${statuses[chunk.status]}**`, txt)
                }

                return embed;
            }

            let curPage = 0;
            const lastPage = pages.length - 1;

            reply.delete();
            const animelist = await message.channel.send(getEmbed(curPage, lastPage));

            const filter = (reaction, user) => {
                return ["⏮", "◀", "▶", "⏭"].includes(reaction.emoji.name) && user.id !== client.user.id;
            };

            const collector = animelist.createReactionCollector(filter, { time: 120000 });

            collector.on('collect', (reaction, reactionCollector) => {

                for (const user of reaction.users) {
                    if (!user[1].bot) {
                        reaction.remove(user[0]);
                    }
                }

                if (reaction.emoji.name == "⏮") curPage = 0;
                if (reaction.emoji.name == "◀") curPage -= 1;
                if (reaction.emoji.name == "▶") curPage += 1;
                if (reaction.emoji.name == "⏭") curPage = lastPage;

                if (curPage < 0) curPage = lastPage;
                if (curPage > lastPage) curPage = 0;

                animelist.edit(getEmbed(curPage, lastPage));
            });

            collector.on('end', collected => {
                animelist.clearReactions();
            });

            await animelist.react("⏮");
            await animelist.react("◀");
            await animelist.react("▶");
            await animelist.react("⏭");

        } catch (e) {
            reply.edit("Unable to load MyAnimeList account.");
        }

        return true;
    }
}