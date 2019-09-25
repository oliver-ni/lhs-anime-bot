const Discord = require("discord.js");
const axios = require("axios");
const Entities = require("html-entities").AllHtmlEntities;
const config = require("./config.js");
const client = new Discord.Client();

client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

let after = ""

const fetchMeme = () => {
    return axios.get("https://www.reddit.com/r/Animemes/top/.json", {
        params: {
            t: "day",
            limit: 1,
            after: after
        }
    }).then((response) => {
        after = response.data.data.after;
        if (response.data.data.children[0].data.over_18) return [];
        return response.data.data.children[0].data.preview.images;
    });
}

client.on("message", async msg => {
    if (msg.content.startsWith("!animeme")) {
        const reply = await msg.reply("loading meme...");
        try {
            let img = await fetchMeme(); while (img.length == 0) img = await fetchMeme();
            reply.delete();
            msg.channel.send(
                new Discord.RichEmbed().setImage(Entities.decode(img[0].source.url))
            );
        } catch (e) {
            reply.edit("Unable to load meme.")
        }
    } else if (msg.content.startsWith("!trivia")) {
        const reply = await msg.reply("loading question...");
        try {
            const response = await axios.get("https://opentdb.com/api.php?amount=1&category=31&type=multiple");
            reply.delete();
            const embed = new Discord.RichEmbed()
                                .setTitle("**" + Entities.decode(response.data.results[0].question) + "**")
                                .setAuthor(msg.author.tag, msg.author.avatarURL);
            const answers = shuffle([
                response.data.results[0].correct_answer,
                ...response.data.results[0].incorrect_answers
            ]);
            for (let i = 0; i < answers.length; i++) {
                embed.addField("**" + "ABCD"[i] + "**", Entities.decode(answers[i]), true);
            }

            const question = await msg.channel.send(embed);

            const filter = (reaction, user) => {
                return ["🇦", "🇧", "🇨", "🇩"].includes(reaction.emoji.name) && user.id === msg.author.id;
            };
            
            question.awaitReactions(filter, {
                max: 1, time: 10000, errors: ["time"]
            }).then(collected => {
                const reaction = collected.first();
                const selected = react2idx[reaction.emoji.name];

                question.delete();
        
                if (answers[selected] == response.data.results[0].correct_answer) {
                    msg.reply("the answer **" + answers[selected] + "** is correct!");
                } else {
                    msg.reply("the answer **" + answers[selected] + "** is incorrect. The correct answer is **" + response.data.results[0].correct_answer + "**.");
                }
            }).catch(collected => {
                question.delete();
                msg.reply("you didn't answer in time!. The correct answer is **" + response.data.results[0].correct_answer + "**.");
            });

            await question.react("🇦");
            await question.react("🇧");
            await question.react("🇨");
            await question.react("🇩");

            const react2idx = {
                "🇦": 0,
                "🇧": 1,
                "🇨": 2,
                "🇩": 3
            }
        } catch (e) {
            reply.edit("Unable to load trivia.")
        }
    }
});

client.login(config.token);