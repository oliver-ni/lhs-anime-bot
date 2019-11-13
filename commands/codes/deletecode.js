const moment = require('moment');

module.exports = {
    name: "!deletecode",
    description: "Delete a sign in code.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    aliases: ["!delcode"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!deletecode <event>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const event = args.join(" ");

        client.dbI.ensure("codes", {});

        const codes = client.dbI.get("codes");

        if (!codes.hasOwnProperty(event)) {
            message.channel.send("There is no event with that name!");
            return true;
        }

        client.dbI.ensure("activecodes", []);

        const activecodes = client.dbI.get("activecodes");

        const newac = activecodes.filter(m => m.event != event);

        if (Object.keys(activecodes).length != Object.keys(newac).length) {
            message.channel.send(`Deactivated code for event **${event}**.`);
            client.dbI.set("activecodes", newac);
        }

        client.dbI.delete("codes", event);

        message.channel.send(`Deleted code for event **${event}**.`);

        return true;

    }
}