from discord.ext import commands
import discord
import mongoengine
import datetime

from .utils import models


class Database(commands.Cog):
    """For database operations."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    def fetch_settings(self, guild: discord.Guild) -> models.GuildSettings:
        try:
            return models.GuildSettings.objects.get(id=guild.id)
        except mongoengine.DoesNotExist:
            return models.GuildSettings.objects.create(id=guild.id)

    def fetch_member(self, member: discord.Member) -> models.Member:
        try:
            return models.Member.objects.get(id=member.id)
        except mongoengine.DoesNotExist:
            return models.Member.objects.create(id=member.id)

    def update_member(self, member: discord.Member, **kwargs):
        models.Member.objects(id=member.id).update_one(upsert=True, **kwargs)

    def create_temp_action(
        self, member: discord.Member, action: str, duration: datetime.timedelta
    ) -> models.TempAction:
        data = models.TempAction(
            member=self.fetch_member(member),
            guild=member.guild.id,
            action=action,
            expires=datetime.datetime.now() + duration,
        )
        data.save()
        return data
