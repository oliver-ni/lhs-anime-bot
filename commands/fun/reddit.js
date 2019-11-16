const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;

const fetchMeme = (client, subreddit) => {
    return axios.get(`https://www.reddit.com/r/${subreddit}/top/.json`, {
        params: {
            t: "day",
            limit: 1,
            after: client.after[subreddit]
        }
    }).then((response) => {
        client.after[subreddit] = response.data.data.after;
        return response.data.data.children[0].data;
    });
}

module.exports = {
    name: "reddit",
    description: "Retrieve an image from reddit.",
    channelType: ["text"],
    execute: async (client, message, args) => {
        if (args.length == 0) return false;
        args[0] = args[0].toLowerCase();
        if (!client.after.hasOwnProperty(args[0])) client.after[args[0]] = ""
        message.channel.startTyping();
        try {
            let img = await fetchMeme(client, args[0]);
            while (img.is_self || img.over_18) img = await fetchMeme(client, args[0]);
            message.channel.send(
                new Discord.RichEmbed().setTitle(img.title).setImage(Entities.decode(img.url)).setColor(0xF1C40F)
            );
        } catch (err) {
            message.channel.send("Unable to load image.");
            console.error(err);
        }
        message.channel.stopTyping();
        return true;
    }
}

