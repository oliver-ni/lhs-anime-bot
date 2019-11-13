const moment = require('moment');

module.exports = {
    name: "!setcodetimer",
    description: "Set the amount of time a code can be used for.",
    channelType: ["text"],
    permissions: ["ADMINISTRATOR"],
    aliases: ["!activatecode"],
    usage: (client, message) => {
        message.channel.send("Usage: `!!setcodetimer <time>`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) {
            return false;
        }

        let duration = moment.duration(0);

        const str = args.join(" ");

        let seconds = 0;
        const days = str.match(/(\d+)\s*d/);
        const hours = str.match(/(\d+)\s*h/);
        const minutes = str.match(/(\d+)\s*m/);
        if (days) seconds += parseInt(days[1]) * 86400;
        if (hours) seconds += parseInt(hours[1]) * 3600;
        if (minutes) seconds += parseInt(minutes[1]) * 60;

        duration = moment.duration(seconds, "seconds");

        if (duration.asSeconds() < 60) {
            message.reply("mute duration must be minutes, hours, days. Seconds are not supported.");
            return true;
        }

        client.dbI.set("codetimer", seconds);

        message.channel.send(`Set sign-in timer to **${duration.humanize()}**.`);

        return true;

    }
}