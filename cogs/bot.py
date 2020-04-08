from discord.ext import commands
import discord


class Bot(commands.Cog):
    """For basic bot operation."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.Cog.listener()
    async def on_ready(self):
        print("Logged in.")

    @commands.Cog.listener()
    async def on_message(self, message: discord.Message):
        if message.author.bot:
            return

        self.db.update_member(message.author, inc__xp=1)

    @commands.Cog.listener()
    async def on_command_error(self, ctx, error):
        if isinstance(error, commands.MissingRequiredArgument):
            await ctx.send_help(ctx.command)
        elif not isinstance(error, commands.CommandNotFound):
            await ctx.send(f"**Error:** {error}")

        raise error
