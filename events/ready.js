const Music = require("../helpers/music");
const moment = require("moment");

module.exports = async (client) => {

    console.log(`Logged in as ${client.user.tag}!`);

    // Fetch role assignment message
    client.channels.get(client.config.rolesChannelID).fetchMessage(client.config.rolesMessageID);
    client.dbI.ensure("mutes", []);
    client.dbI.ensure("activecodes", []);

    // Check for mutes every 10 seconds
    setInterval(() => {
        const mutes = client.dbI.get("mutes");
        let idx = 0;
        for (const mute of mutes) {
            const date = moment(mute.end);
            const guild = client.guilds.get(mute.guild);
            const member = guild.members.get(mute.user);
            const mutedRole = guild.roles.get("636807183358754816");

            if (moment().diff(date) >= 0) {
                member.removeRole(mutedRole);
                mutes.splice(idx);
                idx--;
                member.user.send("You have been unmuted.");
            }

            idx++;
        }
        client.dbI.set("mutes", mutes);
    }, 10000);

    // Check for codes every 1 minute
    setInterval(() => {
        const activecodes = client.dbI.get("activecodes");
        let idx = 0;
        for (const activecode of activecodes) {
            const date = moment(activecode.end);
            const event = activecode.event;

            if (moment().diff(date) >= 0) {
                activecodes.splice(idx);
                idx--;
                client.channels.get("644074619556593667").send(`Event **${event}** was deactivated after timer expired.`);
            }

            idx++;
        }
        client.dbI.set("activecodes", activecodes);
    }, 60000);

    // Join voice channel
    // const music = new Music(client);
    // await music.join();
    // music.play();
};
