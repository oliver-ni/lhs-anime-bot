const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;

const fetchMeme = (client) => {
    return axios.get("https://www.reddit.com/r/animemes/top/.json", {
        params: {
            t: "day",
            limit: 1,
            after: client.after["animemes"]
        }
    }).then((response) => {
        client.after["animemes"] = response.data.data.after;
        return response.data.data.children[0].data;
    });
}

module.exports = {
    name: "meme",
    description: "Retrieve a meme from r/animemes",
    channelType: ["text"],
    execute: async (client, message, args) => {
        if (!client.after.hasOwnProperty("animemes")) client.after["animemes"] = ""
        message.channel.startTyping();
        try {
            let img = await fetchMeme(client);
            let count = 0;
            while ((img.is_self || img.over_18) && count < 20) {
                img = await fetchMeme(client);
                count++;
            }
            if (count == 20) throw "Timed out"
            message.channel.send(
                new Discord.RichEmbed().setTitle(img.title).setImage(Entities.decode(img.url)).setColor(0xF1C40F)
            );
        } catch (err) {
            message.channel.send("Unable to load meme.");
            console.error(err);
        }
        message.channel.stopTyping();
        return true;
    }
}