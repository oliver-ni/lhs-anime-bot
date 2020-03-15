from discord.ext import commands
import discord
import mongoengine

from . import models


class Economy(commands.Cog):
    """For xp and economy."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    async def xp(self, ctx: commands.Context, *, user: discord.Member = None):
        if (member := user) is None:
            member = ctx.author

        try:
            data = models.Member.objects.get(id=member.id)
        except mongoengine.DoesNotExist:
            data = models.Member.objects.create(id=member.id)

        if user is None:
            await ctx.send(f"You have **{data.xp}** xp.")
        else:
            await ctx.send(f"**{member}** has **{data.xp}** xp.")

    @commands.command(aliases=["top", "lp"])
    async def leaderboard(self, ctx: commands.Context):
        top = models.Member.objects().order_by("-xp")
        embed = discord.Embed(
            title="**XP Leaderboard**",
            description="Our most active members.",
            color=0x8E44AD
        )
        for idx, member in enumerate(top):
            embed.add_field(
                name=f"**{idx + 1}. {ctx.guild.get_member(member.id)}**",
                value=str(member.xp),
                inline=False
            )
        await ctx.send(embed=embed)
