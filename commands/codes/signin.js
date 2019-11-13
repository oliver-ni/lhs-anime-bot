const moment = require('moment');

module.exports = {
    name: "signin",
    description: "Sign in for an event.",
    channelType: ["text", "dm"],
    usage: (client, message) => {
        message.channel.send("Usage: `!signin <code>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        if (message.channel.type != "dm") {
            message.delete();
            message.channel.send("This command may only be used in DMs.");
            return true;
        }

        const code = args.join(" ");

        client.dbI.ensure("activecodes", []);

        const activecodes = client.dbI.get("activecodes");

        if (!activecodes.some(m => m.code == code)) {
            message.channel.send("There is no active event with that code!");
            return true;
        }

        const activecode = activecodes.find(m => m.code == code);

        message.channel.send(`Successfully signed into event **${activecode.event}**.`); // 644074619556593667
        client.channels.get("644074619556593667").send(`${message.author} signed into event **${activecode.event}**`);

        return true;

    }
}