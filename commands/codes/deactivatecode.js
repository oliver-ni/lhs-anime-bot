const moment = require('moment');

module.exports = {
    name: "!deactivatecode",
    description: "Activates a sign in code.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!deactivatecode <event>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const event = args.join(" ");

        client.dbI.ensure("activecodes", []);

        const activecodes = client.dbI.get("activecodes");

        const newac = activecodes.filter(m => m.event != event);

        if (Object.keys(activecodes).length == Object.keys(newac).length) {
            message.channel.send("There is no active event with that name.");
        } else {
            message.channel.send(`Deactivated code for event **${event}**.`);
            client.channels.get("644074619556593667").send(`Event **${event}** was deactivated by ${message.author}.`);
            client.dbI.set("activecodes", newac);
        }

        return true;

    }
}