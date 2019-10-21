const Discord = require("discord.js");
const moment = require('moment');

exports.run = async (client, message, args) => {

    // const key = `${message.guild.id}-${message.author.id}`;
    // client.points.ensure(key, {
    //     user: message.author.id,
    //     guild: message.guild.id,
    //     suggest: moment(0),
    // });

    // console.log(client.points.get(key, "suggest"))

    // const diff = moment.duration(client.points.get(key, "suggest").diff(moment()));

    // if (diff.asHours() < 10) {
    //     message.reply(`please wait **${diff.hours()}h ${diff.minutes()}m** before using this command again.`);
    //     return;
    // }
    
    const embed = new Discord.RichEmbed();
    embed.setTitle("**Anime Suggestion**");
    embed.setDescription(args.join(" "));
    embed.setAuthor(message.author.tag, message.author.avatarURL)
    embed.setFooter('LHS Anime Club Bot', client.user.avatarURL);

    const suggestion = await client.channels.get("635695804488744991").send(embed);

    message.react("✅");

    await suggestion.react("👍");
    await suggestion.react("👎");

};