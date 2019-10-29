const moment = require('moment');

exports.run = async (client, message, args) => {

    if (args.length == 0) return;

    const role = message.guild.roles.get("636807183358754816");

    client.dbI.ensure("mutes", []);

    const mutes = client.dbI.get("mutes").filter(m => !Array.from(message.mentions.members.keys()).some(x => x == m.user));

    for (const member of message.mentions.members) {
        if (!member[1].roles.has("636807183358754816")) {
            message.channel.send(`${member[1]} is not currently muted.`);
            continue;
        }

        member[1].removeRole(role);
        message.channel.send(`${member[1]} has been unmuted.`);
        member[1].user.send("You have been unmuted.");
    }

    client.dbI.set("mutes", mutes);

    //console.log(client.dbI.get("mutes"));

};