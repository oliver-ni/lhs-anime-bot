from discord.ext import commands
from collections import Counter
import mongoengine
import requests
import asyncio
import discord

from . import models


class Bracket(commands.Cog):
    """For voting on brackets."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.group(invoke_without_command=True)
    async def bracket(self, ctx: commands.Context):
        await ctx.send_help(self.bracket)
        pass

    @bracket.command(name="create")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_create(self, ctx: commands.Context, json_url: str, *, name: str):
        r = requests.get(json_url)
        json_data = r.json()

        try:
            obj = models.BracketRound(name=name, active=False)

            for first, second in json_data["matches"]:
                obj.matches.create(first=first, second=second)

            obj.save()

            await ctx.send(f"Created bracket round **{name}**.")

        except mongoengine.NotUniqueError:
            await ctx.send(f"There is already a bracket round with that name.")

    @bracket.command(name="activate")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_activate(self, ctx: commands.Context, *, name: str):
        try:
            models.BracketRound.objects.get(name=name).update(active=True)
            await ctx.send(f"Activated bracket round **{name}**.")
        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="deactivate")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_deactivate(self, ctx: commands.Context, *, name: str):
        try:
            models.BracketRound.objects.get(name=name).update(active=False)
            await ctx.send(f"Deactivated bracket round **{name}**.")
        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="delete")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_delete(self, ctx: commands.Context, *, name: str):
        try:
            models.BracketRound.objects.get(name=name).delete()
            await ctx.send(f"Deleted bracket round **{name}**.")
        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="list")
    async def bracket_list(self, ctx: commands.Context):
        active_rounds = models.BracketRound.objects(active=True)
        inactive_rounds = models.BracketRound.objects(active=False)
        await ctx.send(f"Active bracket rounds:\n\n" + "\n".join(f"**{round.name}**" for round in active_rounds))
        await ctx.send(f"Inactive bracket rounds:\n\n" + "\n".join(f"**{round.name}**" for round in inactive_rounds))

    @bracket.command(name="view")
    async def bracket_view(self, ctx: commands.Context, *, name: str):
        try:
            matches = models.BracketRound.objects.get(name=name).matches

            await ctx.send(f"Bracket Round **{name}**\n\n" + "\n".join(f"**{match.first}** vs. **{match.second}**" for match in matches))

        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="scores")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_scores(self, ctx: commands.Context, *, name: str):
        try:
            matches = models.BracketRound.objects.get(name=name).matches

            votes = [(
                (match.first, (counter := Counter(
                    match.votes.values()))[False]),
                (match.second, counter[True]),
            ) for match in matches]

            await ctx.message.add_reaction("📫")
            await ctx.author.send(f"Bracket Round **{name}**\n\n" + "\n".join(f"**{match[0][0]} ({match[0][1]})** vs. **{match[1][0]} ({match[1][1]})**" for match in votes))

        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="votes")
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def bracket_votes(self, ctx: commands.Context, *, name: str):
        try:
            matches = models.BracketRound.objects.get(name=name).matches

            votes = [(
                (match.first, " ".join(
                    f"<@{key}>" for key, value in match.votes.items() if not value)),
                (match.second, " ".join(
                    f"<@{key}>" for key, value in match.votes.items() if value)),
            ) for match in matches]

            await ctx.message.add_reaction("📫")

            sections = [f"Bracket Round **{name}**"] + [
                f"**{match[0][0]}:** {match[0][1]}\n**{match[1][0]}:** {match[1][1]}" for match in votes]

            for section in sections:
                await ctx.author.send(section)

        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find bracket round with name **{name}**.")

    @bracket.command(name="vote")
    async def bracket_vote(self, ctx: commands.Context, *, name: str):
        try:
            bracket = models.BracketRound.objects.get(name=name, active=True)
        except mongoengine.DoesNotExist:
            await ctx.send(f"Could not find active bracket round with name **{name}**.")
            return

        await ctx.message.add_reaction("📫")
        await ctx.author.send(f"You are voting on bracket round **{name}**. Your votes will not be saved until you finish all matches.")

        def check(msg):
            return msg.author == ctx.author and isinstance(msg.channel, discord.DMChannel)

        for idx, match in enumerate(bracket.matches):
            await ctx.author.send(f"Match {idx + 1}: **{match.first}** vs. **{match.second}**. Please reply `left` or `right`.")

            try:
                vote = await self.bot.wait_for("message", check=check, timeout=60)
                while vote.content not in ["left", "right"]:
                    await ctx.author.send("Please write `left` or `right`.")
                    vote = await self.bot.wait_for("message", check=check, timeout=60)
            except asyncio.TimeoutError:
                await ctx.author.send("You took too long, and your vote was not saved. Please try again.")
                return

            if vote.content == "abstain":
                
                try:
                    del match.votes[str(ctx.author.id)]
                except KeyError:
                    pass
                await ctx.author.send(f"You abstained.")
                continue

            vote_bool = {"left": False, "right": True}[vote.content]

            match.votes[str(ctx.author.id)] = vote_bool

            await ctx.author.send(f"You voted for **{[match.first, match.second][vote_bool]}**.")

        bracket.save()
        await ctx.author.send(f"Your votes have been saved.")
