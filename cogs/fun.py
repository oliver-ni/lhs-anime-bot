from discord.ext import commands
import discord
import requests
import asyncio
import random
import html


class Fun(commands.Cog):
    """Fun stuff!"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.after = ""

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.command(aliases=["animeme"])
    async def meme(self, ctx: commands.Context):
        def fetch_meme():
            data = requests.get(
                "https://www.reddit.com/r/goodanimemes.json",
                params={"limit": 1, "after": self.after},
                headers={"user-agent": "lhs-moe/rewrite"},
            ).json()
            self.after = data["data"]["after"]
            return data["data"]["children"][0]["data"]

        async with ctx.typing():
            meme = fetch_meme()

            count = 0
            while (
                meme["is_self"]
                or meme["is_video"]
                or meme["over_18"]
                and (count := count + 1) <= 20
            ):
                meme = fetch_meme()

            embed = discord.Embed(title=meme["title"], color=0x8E44AD)
            embed.set_image(url=meme["url"])

        await ctx.send(embed=embed)

    @commands.command()
    async def trivia(self, ctx: commands.Context):
        def fetch_trivia():
            data = requests.get(
                "https://opentdb.com/api.php?amount=1&category=31"
            ).json()
            return data["results"][0]

        async with ctx.typing():
            trivia = fetch_trivia()

            answers = [trivia["correct_answer"], *trivia["incorrect_answers"]]
            random.shuffle(answers)

            embed = discord.Embed(
                title=html.unescape(trivia["question"]), color=0x8E44AD
            )
            embed.set_author(name=str(ctx.author), icon_url=ctx.author.avatar_url)

            for idx, choice in enumerate(answers):
                embed.add_field(name=f"**{'ABCD'[idx]}**", value=html.unescape(choice))

        response = await ctx.send(embed=embed)

        async def add_reactions():
            r = "🇦", "🇧", "🇨", "🇩"
            for idx, choice in enumerate(answers):
                await response.add_reaction(r[idx])

        async def wait_for_reactions():
            try:

                def check(r, u):
                    return (
                        r.message.id == response.id
                        and u.id == ctx.author.id
                        and r.emoji in "🇦 🇧 🇨 🇩"
                    )

                reaction, _ = await self.bot.wait_for(
                    "reaction_add", check=check, timeout=10
                )
                idx = {"🇦": 0, "🇧": 1, "🇨": 2, "🇩": 3}[reaction.emoji]

                if answers[idx] == trivia["correct_answer"]:
                    await ctx.send(
                        f"{ctx.author.mention}, the answer **{html.unescape(answers[idx])}** is correct!"
                    )
                else:
                    await ctx.send(
                        f"{ctx.author.mention}, the answer **{html.unescape(answers[idx])}** is incorrect! The correct answer is **{html.unescape(trivia['correct_answer'])}**."
                    )

            except asyncio.TimeoutError:
                await ctx.send(
                    f"{ctx.author.mention}, you ran out of time! The correct answer is **{html.unescape(trivia['correct_answer'])}**."
                )

        await asyncio.gather(add_reactions(), wait_for_reactions())


def setup(bot):
    bot.add_cog(Fun(bot))
