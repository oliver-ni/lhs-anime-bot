const Discord = require("discord.js");

exports.run = async (client, message, args) => {
    
    const embed = new Discord.RichEmbed();
    embed.setTitle("**Suggestion**");
    embed.setDescription(args.join(" "));
    embed.setAuthor(message.author.tag, message.author.avatarURL)
    embed.setFooter('LHS Anime Club Bot', client.user.avatarURL);

    const suggestion = await client.channels.get("630303882400104448").send(embed);

    message.react("✅");

    await suggestion.react("👍");
    await suggestion.react("👎");

};