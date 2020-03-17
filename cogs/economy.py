from discord.ext import commands
import discord
import asyncio
import math

from . import models


class Economy(commands.Cog):
    """For xp and economy."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    def xp(self, member: discord.Member):
        return self.db.fetch_member(member).xp

    def balance(self, member: discord.Member):
        return self.db.fetch_member(member).balance

    def add_balance(self, member: discord.Member, amount: int):
        self.db.update_member(member, inc__balance=amount)

    def remove_balance(self, member: discord.Member, amount: int):
        self.db.update_member(member, inc__balance=-amount)

    @commands.command(aliases=["exp", "experience", "points"])
    async def xp(self, ctx: commands.Context, *, user: discord.Member = None):
        if (member := user) is None:
            member = ctx.author

        data = self.db.fetch_member(member)

        if user is None:
            await ctx.send(f"You have **{data.xp}** xp.")
        else:
            await ctx.send(f"**{member}** has **{data.xp}** xp.")

    @commands.command(aliases=["leaderboard", "lb"])
    async def top(self, ctx: commands.Context):
        top = models.Member.objects().order_by("-xp")

        def get_page(x: int):
            embed = discord.Embed(
                title="**XP Leaderboard (testing)**",
                description="Our server's most active members.",
                color=0x8E44AD
            )
            for idx, member in enumerate(top[x*5:x*5+5], start=x*5):
                embed.add_field(
                    name=f"**{idx + 1}. {ctx.guild.get_member(member.id)}**",
                    value=str(member.xp),
                    inline=False
                )
            return embed

        page = 0
        pages = math.ceil(len(top) / 5)
        response = await ctx.send(embed=get_page(page))

        await response.add_reaction("⏮")
        await response.add_reaction("◀")
        await response.add_reaction("▶")
        await response.add_reaction("⏭️")

        try:
            while True:
                reaction, user = await self.bot.wait_for("reaction_add", check=lambda r, u: r.message.id == response.id and not u.bot, timeout=120)
                page = {
                    "⏮": 0,
                    "◀": page - 1,
                    "▶": page + 1,
                    "⏭️": pages - 1,
                }[reaction.emoji] % pages
                await reaction.remove(user)
                await response.edit(embed=get_page(page))
        except asyncio.TimeoutError:
            await response.add_reaction("🛑")

    @commands.command(aliases=["balance"])
    async def bal(self, ctx: commands.Context, *, user: discord.Member = None):
        if (member := user) is None:
            member = ctx.author

        if user is None:
            await ctx.send(f"Your balance is **¥{self.balance(member)}**.")
        else:
            await ctx.send(f"**{member}**'s balance is **¥{self.balance(member)}**.")

    @commands.command()
    async def pay(self, ctx: commands.Context, member: discord.Member, amount: int):
        if member == ctx.author or amount == 0:
            await ctx.send("Nice try...")
            return

        if amount > self.balance(member):
            await ctx.send("You do not have enough money!")
            return

        self.remove_balance(ctx.author, amount)
        self.add_balance(member, amount)
        await ctx.send(f"**¥{amount}** was sent to {member}.")
