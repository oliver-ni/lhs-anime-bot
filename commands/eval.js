const Discord = require("discord.js");

const clean = text => {
    if (typeof (text) === "string")
        return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
    else
        return text;
}

module.exports.run = async (client, message, args) => {

    if (message.author.id !== client.config.ownerID) return;

    try {
        let code = args.join(" ");
        code = code.replace(/•/g, "");
        let evaled = eval(code);

        if (typeof evaled !== "string")
            evaled = require("util").inspect(evaled);

        message.channel.send(clean(evaled), { code: "xl" });
    } catch (err) {
        message.channel.send(`\`ERROR\` \`\`\`xl\n${clean(err)}\n\`\`\``);
        console.log(err);
    }

}
