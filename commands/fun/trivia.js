const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;

const shuffle = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

module.exports = {
    name: "trivia",
    description: "Load a trivia question.",
    channelType: ["text"],
    execute: async (client, message, args) => {
        message.channel.startTyping();
        try {
            const response = await axios.get("https://opentdb.com/api.php?amount=1&category=31&type=multiple");

            const embed = client.utils.getBaseEmbed(client, message.author);
            embed.setTitle("**" + Entities.decode(response.data.results[0].question) + "**")

            const answers = shuffle([
                response.data.results[0].correct_answer,
                ...response.data.results[0].incorrect_answers
            ]);
            for (let i = 0; i < answers.length; i++) {
                embed.addField("**" + "ABCD"[i] + "**", Entities.decode(answers[i]), true);
            }

            const question = await message.channel.send(embed);

            const filter = (reaction, user) => {
                return ["🇦", "🇧", "🇨", "🇩"].includes(reaction.emoji.name) && user.id === message.author.id;
            };

            const react2idx = {
                "🇦": 0,
                "🇧": 1,
                "🇨": 2,
                "🇩": 3
            }

            question.awaitReactions(filter, {
                max: 1, time: 10000, errors: ["time"]
            }).then(collected => {
                const reaction = collected.first();
                const selected = react2idx[reaction.emoji.name];

                question.delete();

                if (answers[selected] == response.data.results[0].correct_answer) {
                    message.reply("the answer **" + Entities.decode(answers[selected]) + "** is correct!");
                } else {
                    message.reply("the answer **" + Entities.decode(answers[selected]) + "** is incorrect. The correct answer is **" + Entities.decode(response.data.results[0].correct_answer) + "**.");
                }
            }).catch(collected => {
                //console.log(collected);
                question.delete();
                message.reply("you didn't answer in time!. The correct answer is **" + Entities.decode(response.data.results[0].correct_answer) + "**.");
            });

            await question.react("🇦");
            await question.react("🇧");
            await question.react("🇨");
            await question.react("🇩");
        } catch (err) {
            message.channel.send("Unable to load trivia.")
            console.error(err);
        }

        message.channel.stopTyping();
        return true;
    }
}