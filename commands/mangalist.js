const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const Jikan = require('jikan-node');

const statuses = {
    1: "Reading",
    2: "Completed",
    3: "On Hold",
    4: "Dropped",
    6: "Plan to Read"
}

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
        embed.setTitle("**!mangalist**");
        embed.setDescription(`**!mangalist** – View your own MAL profile
**!mangalist @mention** – View MAL profile of Discord user
**!mangalist malname** — View MAL user from MAL username

Link your MAL account using **!linkmal**`);
        embed.setAuthor(message.author.tag, message.author.avatarURL)
        embed.setFooter('LHS Anime Club Bot', client.user.avatarURL)
        return message.channel.send(embed);
    }

    try {
        const maluser = await client.mal.findUser(malname, "mangalist");

        const manga = maluser.manga.sort((a, b) => {
            return a.watching_status - b.watching_status;
        });

        const pages = [];
        let page = [];
        let chunk = [];
        let status = 0;
        let length = 0;
        for (const item of manga) {
            if (item.reading_status > status) {
                page.push({
                    status: status,
                    items: chunk
                });
                status = item.reading_status;
                chunk = []
                console.log();
                console.log(statuses[status]);
                console.log("=============");
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
                console.log("-------------");
            }
            chunk.push(item);
            console.log(item.title);
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
            embed.setURL(`https://myanimelist.net/mangalist/${malname}`);
            embed.setTitle("Manga List");
            embed.setFooter(`LHS Anime Club Bot | Page ${curPage + 1}/${maxPage + 1}`, client.user.avatarURL)
            embed.setColor(0xF1C40F);

            for (const chunk of pages[curPage]) {
                if (chunk.items.length == 0) continue
                embed.addField(`**${statuses[chunk.status]}**`, chunk.items.map(e => e.title).join("\n"))
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

        const collector = animelist.createReactionCollector(filter, { time: 30000 });

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
        console.log(e);
    }

}