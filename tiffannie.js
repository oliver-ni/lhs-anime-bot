const Discord = require("discord.js");

const client = new Discord.Client();

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (msg) => {

    if (msg.author.bot) return;

    if (msg.content.toLowerCase().includes("tiffannie")) {

        (async () => {
            await msg.react("🇹");
            await msg.react("🇮");
            await msg.react("🇫");
            await msg.react(client.emojis.find(emoji => emoji.name == 'regional_indicator_f_1'));
            await msg.react("🇦");
            await msg.react("🇳");
            await msg.react(client.emojis.find(emoji => emoji.name == 'regional_indicator_n_1'));
            await msg.react(client.emojis.find(emoji => emoji.name == 'regional_indicator_i_1'));
            await msg.react("🇪");
        })();

        msg.channel.send("TIFFANNIE");

    }

});

client.on("messageReactionAdd", async (reaction, user) => {
    if (reaction.message.content.toLowerCase().includes("tiffannie") && user.id != "666156461713260564") {
        reaction.remove(user);
    }
});

client.login("token");
