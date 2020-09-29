import asyncio

import discord
import mongoengine
from discord.ext import commands
from jikanpy import AioJikan, APIException

from .utils import checks, constants, models


async def add_reactions(message, *emojis):
    for emoji in emojis:
        await message.add_reaction(emoji)


class Suggestions(commands.Cog):
    """For suggestions."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.jikan = AioJikan()
        self.cd = commands.CooldownMapping.from_cooldown(
            1, 60, commands.BucketType.member
        )

    def cog_unload(self):
        self.bot.loop.create_task(self.jikan.close())

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.command()
    async def animerec(self, ctx: commands.Context, *, search):
        try:
            response = await self.jikan.search("anime", search)
        except APIException as e:
            if e.status_code == 429:
                return await ctx.send(
                    "We're being rate limited. Please wait a few seconds and try again."
                )
            return await ctx.send("An unexpected error occurred...")

        choices = response["results"][:5]

        embed = discord.Embed(
            title="Search Results",
            description="Please select the anime you would like to suggest.",
            color=0x8E44AD,
        )

        for idx, result in enumerate(choices):
            embed.add_field(
                name=f"{idx + 1}. {result['title']}",
                value=f"[MAL {result['mal_id']}]({result['url']})",
                inline=False,
            )

        reactions = constants.NUMBER_REACTIONS[1 : len(choices) + 1]

        message = await ctx.send(embed=embed)
        self.bot.loop.create_task(add_reactions(message, *reactions))

        try:
            r, u = await self.bot.wait_for(
                "reaction_add",
                check=lambda r, u: u == ctx.author
                and r.message.id == message.id
                and r.emoji in reactions,
                timeout=60,
            )
            idx = reactions.index(r.emoji)
            anime = choices[idx]

        except asyncio.TimeoutError:
            await ctx.send("You took too long. Aborted.")
            await message.add_reaction("❌")
            return

        try:
            suggestion = models.Suggestion.objects.get(mal_id=anime["mal_id"])
        except mongoengine.DoesNotExist:
            pass
        else:
            return await ctx.send(
                "That anime has already been suggested! Vote for it here: "
                f"https://canary.discordapp.com/channels/576586719999033374/758046326842851368/{suggestion.message}"
            )

        bucket = self.cd.get_bucket(ctx.message)
        retry_after = bucket.update_rate_limit()
        if retry_after:
            raise commands.CommandOnCooldown(self.cd._cooldown, retry_after)

        await ctx.send(f"You suggested **{anime['title']}**")

        channel = ctx.guild.get_channel(758046326842851368)

        embed = discord.Embed(
            title=anime["title"],
            url=anime["url"],
            description=anime["synopsis"],
            color=0x8E44AD,
        )
        embed.set_author(name=str(ctx.author), icon_url=ctx.author.avatar_url)
        embed.set_footer(text=f"MAL {anime['mal_id']}")

        message = await channel.send(embed=embed)
        self.bot.loop.create_task(
            add_reactions(
                message,
                self.bot.get_emoji(739670239305924668),
                self.bot.get_emoji(739670169458049054),
            )
        )

        models.Suggestion.objects.create(
            message=message.id, mal_id=anime["mal_id"], title=anime["title"]
        )

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.user_id == self.bot.user.id:
            return

        if payload.channel_id != 758046326842851368:
            return

        try:
            suggestion = models.Suggestion.objects.get(message=payload.message_id)
        except mongoengine.DoesNotExist:
            return

        vote_type = {739670239305924668: True, 739670169458049054: False}[
            payload.emoji.id
        ]

        update_dict = {f"votes__{payload.user_id}": vote_type}
        suggestion.update(**update_dict)

        user = self.bot.get_user(payload.user_id)

        channel = self.bot.get_channel(758046326842851368)
        message = await channel.fetch_message(suggestion.message)

        await message.remove_reaction(payload.emoji, user)
        await user.send(
            f"You {'upvoted' if vote_type else 'downvoted'} **{suggestion.title}**."
        )


def setup(bot):
    bot.add_cog(Suggestions(bot))
