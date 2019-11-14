module.exports = {
    name: "lmgtfy",
    description: "Generate a LMGTFY link.",
    channelType: ["text"],
    usage: (client, message) => {
        message.channel.send("Usage: `!lmgtfy <query>`")
    },
    execute: async (client, message, args) => {
        if (args.length == 0) return false;

        message.channel.send(encodeURI(`https://lmgtfy.com/?q=${args.join(" ")}&s=g`));

        return true;
    }
}