from discord.ext import commands
import discord
import mongoengine

from . import models


class Database(commands.Cog):
    """For database operations."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def fetch_member(self, member: discord.Member):
        try:
            return models.Member.objects.get(id=member.id)
        except mongoengine.DoesNotExist:
            return models.Member.objects.create(id=member.id)

    def update_member(self, member: discord.Member, **kwargs):
        models.Member.objects(id=member.id).update_one(upsert=True, **kwargs)
