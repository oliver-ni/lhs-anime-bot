const Discord = require("discord.js");
const moment = require('moment');

exports.run = async (client, message, args) => {

    const key = `${message.guild.id}-${message.author.id}`;
    client.points.ensure(key, new Date(0), "suggest");

    console.log(client.points.get(key, "suggest"))

    const diff = moment.duration(moment(client.points.get(key, "suggest")).diff(moment()));

    if (Math.abs(diff.asHours()) < 10) {
        const wait = diff.add(10, "h");
        message.reply(`please wait **${wait.hours()}h ${wait.minutes()}m** before using this command again.`);
        return;
    }

    client.points.set(key, new Date(), "suggest");
    
    const embed = new Discord.RichEmbed();
    embed.setTitle("**Anime Suggestion**");
    embed.setDescription(args.join(" "));
    embed.setAuthor(message.author.tag, message.author.avatarURL)
    embed.setFooter('LHS Anime Club Bot', client.user.avatarURL);

    const suggestion = await client.channels.get("635695804488744991").send(embed);

    message.react("✅");

    await suggestion.react("👍");

};