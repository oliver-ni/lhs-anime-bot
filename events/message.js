module.exports = (client, message) => {

    if (message.author.bot) return;

    // XP

    if (message.guild) {
        const key = `${message.guild.id}-${message.author.id}`;
        client.points.ensure(key, {
            user: message.author.id,
            guild: message.guild.id,
            points: 0,
            level: 0
        });

        client.points.inc(key, "points");

        const curLevel = Math.floor(0.1 * Math.sqrt(client.points.get(key, "points")));

        if (client.points.get(key, "level") < curLevel) {
          message.reply(`you are now level **${curLevel}**!`);
          client.points.set(key, curLevel, "level");
        }
    }

    // COMMANDS
  
    if (message.content.startsWith(client.config.prefix)) {
  
        const args = message.content.slice(client.config.prefix.length).trim().split(/ +/g);
        const command = args.shift().toLowerCase();
    
        const cmd = client.commands.get(command);
    
        if (cmd) return cmd.run(client, message, args);

    }

};