from discord.ext import commands
import discord
import mongoengine

from . import models


class Bot(commands.Cog):
    """For basic bot operation."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print("Logged in.")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot:
            return

        models.Member.objects(id=message.author.id).update(
            upsert=True, inc__xp=1)

    @commands.Cog.listener()
    async def on_command_error(self, ctx, error):
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send_help(ctx.command)
        elif not isinstance(error, commands.CommandNotFound):
            await ctx.send(f"**Error:** {error}")
