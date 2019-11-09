const Discord = require("discord.js");

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

module.exports = {
    name: "eval",
    description: "Run some code.",
    aliases: ["ar"],
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!eval <code>`");
    },
    execute: async (client, message, args) => {

        if (message.author.id !== client.config.ownerID) return true;

        if (args.length == 0) return false;

        try {
            let code = args.join(" ");
            code = code.replace(/•/g, "");
            let evaled = eval(code);

            if (typeof evaled !== "string")
                evaled = require("util").inspect(evaled);

            message.channel.send(clean(evaled), { code: "xl" });
        } catch (err) {
            message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
            console.error(err);
        }

        return true;

    }
}