const moment = require('moment');

module.exports = {
    name: "!setcode",
    description: "Set a sign in code.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!setcode <event> | <code>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0 || !args.join("").includes("|")) {
            return false;
        }

        const t = args.join(" ").split("|");

        const key = t[0].trim();
        const value = t[1].trim();

        client.dbI.ensure("codes", {});

        for (const [okey, ocode] of Object.entries(client.dbI.get("codes"))) {
            if (ocode == value && okey != key) {
                message.channel.send(`There is already an event with the same code!`);
                return true;
            }
        }

        client.dbI.set("codes", value, key);

        message.channel.send(`Set code for **${key}** to **${value}**.`);

        return true;

    }
}