from discord.ext import commands
import discord
import requests
import pprint


class Fun(commands.Cog):
    """Fun stuff!"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.after = ""

    @property
    def db(self):
        return self.bot.get_cog("Database")

    def fetch_meme(self):
        data = requests.get("https://www.reddit.com/r/animemes.json", params={
            "limit": 1,
            "after": self.after
        }, headers={"user-agent": "lhs-moe/rewrite"}).json()
        self.after = data["data"]["after"]
        return data["data"]["children"][0]["data"]

    @commands.command(aliases=["animeme"])
    async def meme(self, ctx: commands.Context):
        async with ctx.typing():
            meme = self.fetch_meme()

            count = 0
            while meme["is_self"] or meme["is_video"] or meme["over_18"] and (count := count + 1) <= 20:
                meme = self.fetch_meme()

            embed = discord.Embed(
                title=meme["title"],
                color=0x8E44AD
            )
            embed.set_image(url=meme["url"])

        await ctx.send(embed=embed)
