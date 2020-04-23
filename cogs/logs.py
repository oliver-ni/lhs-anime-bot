from discord.ext import commands
import discord
import datetime
import asyncio
import math

from .utils import models


class Logs(commands.Cog):
    """For accessing bot logs."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.Cog.listener()
    async def on_message_delete(self, message):
        content_and_image = message.content

        if (num := len(message.attachments)) > 0:
            content_and_image += "\n\n" + f"+ {num} attachment(s)"
            print(message.attachments[0].proxy_url)

        data = models.LoggedAction(
            member=self.db.fetch_member(message.author),
            guild=message.guild.id,
            channel=message.channel.id,
            action="delete",
            time=datetime.datetime.now(),
            before=content_and_image.strip(),
        )
        data.save()

    @commands.Cog.listener()
    async def on_message_edit(self, before, after):
        if before.content == after.content:
            return

        before_content_and_image = before.content
        after_content_and_image = after.content

        if (num := len(before.attachments)) > 0:
            before_content_and_image += "\n\n" + f"+ {num} attachment(s)"

        if (num := len(after.attachments)) > 0:
            after_content_and_image += "\n\n" + f"+ {num} attachment(s)"

        data = models.LoggedAction(
            member=self.db.fetch_member(before.author),
            guild=before.guild.id,
            channel=before.channel.id,
            action="edit",
            time=datetime.datetime.now(),
            before=before_content_and_image.strip(),
            after=after_content_and_image.strip(),
        )
        data.save()

    @commands.command()
    @commands.guild_only()
    async def audit(self, ctx: commands.Context, *, argument: str = None):

        query_dict = {
            "guild": ctx.guild.id
        }

        value = "server"
        field = None

        if argument is not None:

            try:
                value = await commands.MemberConverter().convert(ctx, argument)
                field = "member"
            except commands.BadArgument as e:
                try:
                    value = await commands.TextChannelConverter().convert(ctx, argument)
                    field = "channel"
                except commands.BadArgument:
                    raise e

            query_dict[field] = value.id

        data = models.LoggedAction.objects(**query_dict).order_by("-time")

        def get_page(x: int, pages: int):

            embed = discord.Embed(
                title=f"**Auditing {value}**",
                description="Recently deleted and edited messages",
                color=0x8E44AD,
            )
            embed.set_footer(text=f"Page {x + 1}/{pages}")

            for idx, action in enumerate(data[x * 5 : x * 5 + 5], start=x * 5):

                print(action.channel, action.member)

                if field == "member":
                    description = f"in #{ctx.guild.get_channel(action.channel)}"
                elif field == "channel":
                    description = f"by {ctx.guild.get_member(action.member.id)}"
                else:
                    description = f"in #{ctx.guild.get_channel(action.channel)} by {ctx.guild.get_member(action.member.id)}"

                if action.action == "edit":
                    embed.add_field(
                        name=f"**Edited message {description}**",
                        value=f"– **Before:** {action.before}\n– **After:** {action.after}\n– at *{action.time:%m-%d-%y %I:%M %p}*"[:1024],
                        inline=False,
                    )
                elif action.action == "delete":
                    embed.add_field(
                        name=f"**Deleted message {description}**",
                        value=f"– **Message:** {action.before}\n– at *{action.time:%m-%d-%y %I:%M %p}*"[:1024],
                        inline=False,
                    )

            return embed

        page = 0
        pages = math.ceil(len(data) / 5)
        response = await ctx.send(embed=get_page(page, pages))

        await response.add_reaction("⏮")
        await response.add_reaction("◀")
        await response.add_reaction("▶")
        await response.add_reaction("⏭️")

        try:
            while True:
                reaction, user = await self.bot.wait_for(
                    "reaction_add",
                    check=lambda r, u: r.message.id == response.id and not u.bot,
                    timeout=120,
                )
                page = {"⏮": 0, "◀": page - 1, "▶": page + 1, "⏭️": pages - 1,}[
                    reaction.emoji
                ] % pages
                await reaction.remove(user)
                await response.edit(embed=get_page(page, pages))
        except asyncio.TimeoutError:
            await response.add_reaction("🛑")
