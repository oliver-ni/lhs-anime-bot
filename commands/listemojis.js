const Discord = require("discord.js");

module.exports.run = (client, message, args) => {

    const emojiList = message.guild.emojis.map((e, x) => (x + ' = ' + e) + ' | ' +e.name).join('\n');
    message.channel.send(emojiList);

}
