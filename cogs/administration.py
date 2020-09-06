from discord.ext import tasks, commands
import discord
import humanfriendly
import datetime
import asyncio
import math
import re

from .utils import models, checks


class AlreadyDoneError(Exception):
    pass


class Administration(commands.Cog):
    """Commands for server admins."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    async def check_message(self, ctx: commands.Context):
        ignore = False
        delete = False

        return ignore, delete

    @commands.command()
    @commands.guild_only()
    @checks.is_admin()
    async def purge(self, ctx: commands.Context, amount: int):
        await ctx.message.delete()
        deleted = await ctx.channel.purge(limit=amount)
        msg = await ctx.send(
            f"{ctx.author.mention}, **{len(deleted)}** message{'' if len(deleted) == 1 else 's'} have been deleted from {ctx.channel.mention}."
        )
        await asyncio.sleep(1)
        await msg.delete()


def setup(bot):
    bot.add_cog(Administration(bot))
