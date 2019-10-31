const moment = require('moment');

exports.run = async (client, message, args) => {

    if (args.length == 0) return;

    const role = message.guild.roles.get("636807183358754816");

    let seconds = -1;
    let date = moment();
    let duration = moment.duration(0);

    if (!args[0].startsWith('<@') && !args[0].endsWith('>')) {
        const str = args.join(" ").split("<@")[0];

        seconds = 0;
        const days = str.match(/(\d+)\s*d/);
        const hours = str.match(/(\d+)\s*h/);
        const minutes = str.match(/(\d+)\s*m/);
        if (days) seconds += parseInt(days[1]) * 86400;
        if (hours) seconds += parseInt(hours[1]) * 3600;
        if (minutes) seconds += parseInt(minutes[1]) * 60;

        duration = moment.duration(seconds, "seconds");

        if (duration.asSeconds() < 60) {
            return message.reply("mute duration must be minutes, hours, days. Seconds are not supported.")
        }
    }

    let members = message.mentions.members;

    if (!message.member.hasPermission('KICK_MEMBERS')) {
        members = [[message.member.id, message.member]];
        message.reply("nice try.");
        seconds = 5*60;
        duration = moment.duration(5, "minutes");
    }

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

    //console.log(client.dbI.get("mutes"));

};