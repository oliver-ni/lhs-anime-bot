const Discord = require("discord.js");

module.exports = {
    name: "hug",
    description: "Hug.",
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!hug [something]`")
    },
    execute: async (client, message, args) => {
        message.channel.startTyping();
        const embed = new Discord.RichEmbed().setImage("https://i.imgur.com/CpCl9hM.gif").setColor(0xF1C40F);
        if (args.length > 0) message.channel.send(`${message.author} hugged ${args.join(" ")}`, {
            file: "https://i.imgur.com/CpCl9hM.gif"
        });
        else message.channel.send({
            file: "https://i.imgur.com/CpCl9hM.gif"
        });
        message.channel.stopTyping();
        return true;
    }
}