const moment = require('moment');

module.exports = {
    name: "mute",
    description: "Mute a user.",
    channelType: ["text"],
    permissions: ["KICK_MEMBERS"],
    usage: (client, message) => {
        message.channel.send("Usage: `!mute <@user1> [@user2] ... [duration]`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) return false;

        const role = message.guild.roles.get("636807183358754816");

        let seconds = -1;
        let date = moment();
        let duration = moment.duration(0);

        const strArgs = args.filter(arg => !client.utils.isMention(arg));

        if (strArgs.length > 0) {
            const str = strArgs.join(" ");

            seconds = 0;
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
        }

        let members = message.mentions.members;

        date = date.add(duration);

        client.dbI.ensure("mutes", []);

        for (const [id, member] of members) {
            if (member.roles.has("636807183358754816")) {
                message.channel.send(`${member} is already muted.`);
                continue;
            }

            member.addRole(role);

            if (seconds > -1) {
                message.channel.send(`${member} has been muted for **${duration.humanize()}**.`);
                member.user.send(`You have been muted for **${duration.humanize()}**.`);

                client.dbI.push("mutes", {
                    user: id,
                    guild: message.guild.id,
                    end: date.toDate(),
                });
            } else {
                message.channel.send(`${member} has been muted.`);
                member.user.send("You have been muted.");
            }
        }

        return true;

    }
}