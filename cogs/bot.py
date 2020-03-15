from discord.ext import commands
import pymongo
import discord


class Bot(commands.Cog):
    """For basic bot operation."""

    def __init__(self, bot: commands.Bot, db: pymongo.database.Database):
        self.bot = bot

    @commands.Cog.listener()
    async def on_ready(self):
        print("Logged in.")

    @commands.Cog.listener()
    async def on_command_error(self, ctx, error):
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send_help(ctx.command)
        elif not isinstance(error, commands.CommandNotFound):
            await ctx.send(f"**Error:** {error}")
