const moment = require('moment');

module.exports = {
    name: "!listcodes",
    description: "List all sign in codes.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!listcodes`")
    },
    execute: async (client, message, args) => {

        client.dbI.ensure("codes", {});
        client.dbI.ensure("activecodes", []);
        client.dbI.ensure("codetimer", 20 * 60);

        const codes = Object.entries(client.dbI.get("codes"));
        const activecodes = client.dbI.get("activecodes");
        const codetimer = client.dbI.get("codetimer");

        let msg = `Sign-in timer: **${moment.duration(codetimer, "seconds").humanize()}**`

        if (activecodes.length != 0) {
            msg += "\n\nActive Events: ";
            msg += activecodes.map(m => `**${m.event}**`).join(", ");
        }

        if (Object.keys(codes).length == 0) {
            msg += "\n\nNo codes.";
        } else {
            msg += "\n\n";
            msg += codes.map(([key, value]) => `**${key}** – ${value}`).join("\n");
        }

        message.channel.send(msg)

        return true;

    }
}