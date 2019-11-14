const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;

const fetchImage = () => {
    return axios.get("https://api.tenor.com/v1/random", {
        params: {
            q: "anime+lick",
            limit: 1,
            key: "KZ7Z2GJE8MWL"
        }
    }).then((response) => {
        return response.data.results[0].media[0].gif.url;
    });
}

module.exports = {
    name: "lick",
    description: "Lick.",
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!lick [something]`")
    },
    execute: async (client, message, args) => {
        message.channel.startTyping();
        try {
            let img = await fetchImage();
            const embed = new Discord.RichEmbed().setImage(img).setColor(0xF1C40F);
            if (args.length > 0) message.channel.send(`${message.author} licked ${args.join(" ")}`, embed);
            else message.channel.send(embed);
        } catch (err) {
            message.channel.send("Failed to lick.");
            console.error(err);
        }
        message.channel.stopTyping();
        return true;
    }
}