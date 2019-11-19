const moment = require('moment');

module.exports = {
    name: "realname",
    description: "Set your real name.",
    channelType: ["text", "dm"],
    usage: (client, message) => {
        message.channel.send("Usage: `!realname <name>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const key = `576586719999033374-${message.author.id}`;
        client.dbM.set(key, args.join(" "), "realname");

        message.channel.send(`Set your real name to **${args.join(" ")}**.`);

        return true;

    }
}