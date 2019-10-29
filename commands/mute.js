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

    date = date.add(duration);

    client.dbI.ensure("mutes", []);

    for (const member of message.mentions.members) {
        if (member[1].roles.has("636807183358754816")) {
            message.channel.send(`${member[1]} is already muted.`);
            continue;
        }

        member[1].addRole(role);

        if (seconds > -1) {
            message.channel.send(`${member[1]} has been muted for **${duration.humanize()}**.`);
            member[1].user.send(`You have been muted for **${duration.humanize()}**.`);

            client.dbI.push("mutes", {
                user: member[0],
                guild: message.guild.id,
                end: date.toDate(),
            });
        } else {
            message.channel.send(`${member[1]} has been muted.`);
            member[1].user.send("You have been muted.");
        }
    }

    //console.log(client.dbI.get("mutes"));

};