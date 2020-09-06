from discord.ext import commands
import discord
import mongoengine
import datetime

from .utils import models


class Database(commands.Cog):
    """For database operations."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def fetch_member(self, member: discord.Member) -> models.Member:
        try:
            return models.Member.objects.get(id=member.id)
        except mongoengine.DoesNotExist:
            return None

    def create_member(
        self, member: discord.Member, name: str, classof: int
    ) -> models.Member:
        try:
            return models.Member.objects.get(id=member.id)
        except mongoengine.DoesNotExist:
            return models.Member.objects.create(
                id=member.id, name=name, classof=classof
            )

    def update_member(self, member: discord.Member, **kwargs):
        models.Member.objects(id=member.id).update_one(**kwargs)


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


def setup(bot):
    bot.add_cog(Bot(bot))


def setup(bot):
    bot.add_cog(Database(bot))
