const Discord = require("discord.js");

const getBaseEmbed = (client, user) => {
    const embed = new Discord.RichEmbed()
    embed.setColor(0xF1C40F);
    embed.setFooter('LHS Anime Club Bot', client.user.avatarURL);
    if (user) {
        embed.setAuthor(user.tag, user.avatarURL);
    }
    return embed;
}

const isMention = (text) => {
    return text.startsWith('<@') && text.endsWith('>');
}

const getMentionUser = (client, text) => {
    let mention = text.slice(2, -1);
    if (mention.startsWith('!')) mention = mention.slice(1);
    return client.users.get(mention);
}

module.exports = {
    getBaseEmbed,
    isMention,
    getMentionUser,
}