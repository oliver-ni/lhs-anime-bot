import datetime
import random
import typing

import discord
import mongoengine
from discord.ext import commands

from .utils import checks, constants, models


class Polls(commands.Cog):
    """Make polls"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.group(invoke_without_command=True, aliases=["poll"])
    @checks.is_admin()
    async def polls(self, ctx: commands.Context):
        await ctx.send_help(self.polls)

    @polls.command(name="create")
    @checks.is_admin()
    async def polls_create(
        self,
        ctx: commands.Context,
        channel: typing.Optional[discord.TextChannel],
        title,
        *choices,
    ):
        channel = channel or ctx.channel

        embed = discord.Embed(color=0x8E44AD, title=title)
        embed.description = "\n".join(
            f"{constants.LETTER_REACTIONS[idx]} {choice}"
            for idx, choice in enumerate(choices)
        )
        embed.set_footer(text="Click on the reactions below to cast your vote!")

        message = await channel.send(embed=embed)

        models.Poll.objects.create(
            message=message.id, channel=channel.id, guild=ctx.guild.id, options=choices,
        )

        async def add_reactions():
            for idx in range(len(choices)):
                await message.add_reaction(constants.LETTER_REACTIONS[idx])

        self.bot.loop.create_task(add_reactions())

        if channel != ctx.channel:
            await ctx.send(f"Created poll in {channel.mention}")

    @polls.command(name="view")
    @checks.is_admin()
    async def polls_view(self, ctx: commands.Context, message_link: discord.Message):
        try:
            obj = models.Poll.objects.get(message=message_link.id, guild=ctx.guild.id)
        except mongoengine.DoesNotExist:
            await ctx.send("Could not find that poll.")
            return

        items = obj.options
        votes = list(obj.votes.values())
        message = []

        for idx, option in enumerate(items):
            num_votes = votes.count(idx)
            message.append(f"**{option}**: {num_votes} votes")

        await ctx.send("\n".join(message))

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.user_id == self.bot.user.id:
            return

        # Get poll

        def get_poll():
            return models.Poll.objects.get(
                message=payload.message_id,
                channel=payload.channel_id,
                guild=payload.guild_id,
            )

        try:
            poll = await self.bot.loop.run_in_executor(None, get_poll)
        except mongoengine.DoesNotExist:
            return

        # Validate emoji

        try:
            idx = constants.LETTER_REACTIONS.index(payload.emoji.name)
        except ValueError:
            return

        if idx >= len(poll.options):
            return

        # Update db

        def update_poll():
            update_dict = {f"votes__{payload.user_id}": idx}
            poll.update(**update_dict)

        await self.bot.loop.run_in_executor(None, update_poll)

        # Remove reaction & alert

        user = self.bot.get_user(payload.user_id)

        channel = self.bot.get_channel(poll.channel)
        message = await channel.fetch_message(poll.message)

        if user == self.bot.user:
            return

        await message.remove_reaction(payload.emoji, user)
        await user.send(f"You voted for **{poll.options[idx]}**.")

        # Update original message

        poll = await self.bot.loop.run_in_executor(None, get_poll)
        embed = message.embeds[0]
        embed.set_footer(
            text=f"{len(poll.votes)} votes • Click on the reactions below to cast your vote!"
        )
        await message.edit(embed=embed)


def setup(bot):
    bot.add_cog(Polls(bot))
