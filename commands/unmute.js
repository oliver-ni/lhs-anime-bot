const moment = require('moment');

module.exports = {
    name: "unmute",
    description: "Unmute a user.",
    channelType: ["text"],
    permissions: ["KICK_MEMBERS"],
    usage: (client, message) => {
        message.channel.send("Usage: `!unmute <@user1> [@user2] ...`")
    },
    execute: async (client, message, args) => {

        if (args.length == 0) return false;

        const role = message.guild.roles.get("636807183358754816");

        client.dbI.ensure("mutes", []);

        const mutes = client.dbI.get("mutes").filter(m => !Array.from(message.mentions.members.keys()).some(x => x == m.user));

        for (const [id, member] of message.mentions.members) {
            if (!member.roles.has("636807183358754816")) {
                message.channel.send(`${member} is not currently muted.`);
                continue;
            }

            member.removeRole(role);
            message.channel.send(`${member} has been unmuted.`);
            member.user.send("You have been unmuted.");
        }

        client.dbI.set("mutes", mutes);

        return true;

    }
}