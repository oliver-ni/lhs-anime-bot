import datetime

import discord
import mongoengine
from discord.ext import commands

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

    def update_member(self, member: discord.Member, **kwargs):
        models.Member.objects(id=member.id).update_one(**kwargs, upsert=True)


def setup(bot):
    bot.add_cog(Database(bot))
