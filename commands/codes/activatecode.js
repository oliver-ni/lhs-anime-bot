const moment = require('moment');

module.exports = {
    name: "!activatecode",
    description: "Activates a sign in code.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!activatecode <event>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        const event = args.join(" ");

        client.dbI.ensure("codes", {});
        client.dbI.ensure("codetimer", 20 * 60);

        const codes = client.dbI.get("codes");
        const codetimer = moment.duration(client.dbI.get("codetimer"), "seconds");

        if (!codes.hasOwnProperty(event)) {
            message.channel.send("There is no event with that name!");
            return true;
        }

        const end = moment().add(codetimer);

        client.dbI.ensure("activecodes", []);
        client.dbI.push("activecodes", {
            event: event,
            code: codes[event],
            end: end.toDate(),
        });

        console.log(client.dbI.get("activecodes"));

        message.channel.send(`Activated code for event **${event}** for **${codetimer.humanize()}**.`);
        client.channels.get("644074619556593667").send(`Event **${event}** was activated by ${message.author}.`);

        return true;

    }
}