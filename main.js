const Discord = require('discord.js');
const axios = require('axios');
const decode = require('unescape');
const config = require('./config.js');
const client = new Discord.Client();

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

let after = ""

const fetchMeme = () => {
    return axios.get("https://www.reddit.com/r/Animemes/top/.json", {
        params: {
            t: "day",
            limit: 1,
            after: after
        }
    }).then((response) => {
        after = response.data.data.after;
        if (response.data.data.children[0].data.over_18) return [];
        return response.data.data.children[0].data.preview.images;
    });
}

client.on('message', async msg => {
    if (msg.content.startsWith("!animeme")) {
        let reply = await msg.reply("loading meme...");
        try {
            let img = await fetchMeme(); while (img.length == 0) img = await fetchMeme();
            reply.delete();
            msg.channel.send(
                new Discord.RichEmbed().setImage(decode(img[0].source.url))
            );
        } catch (e) {
            reply.edit("Unable to load meme.")
        }
    }
});

client.login(config.token);