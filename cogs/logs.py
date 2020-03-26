from discord.ext import commands
import discord
import datetime

from . import models


class Logs(commands.Cog):
    """For accessing bot logs."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.Cog.listener()
    async def on_message_delete(self, message):
        data = models.LoggedAction(member=self.db.fetch_member(message.author), guild=message.guild.id, channel=message.channel.id,
                                   action="delete", time=datetime.datetime.now(), before=message.content)
        data.save()

    @commands.Cog.listener()
    async def on_message_edit(self, before, after):
        data = models.LoggedAction(member=self.db.fetch_member(before.author), guild=before.guild.id, channel=before.channel.id,
                                   action="edit", time=datetime.datetime.now(), before=before.content, after=after.content)
        data.save()

    @commands.command()
    @commands.guild_only()
    async def audit(self, ctx: commands.Context, member: discord.Member):
        data = models.LoggedAction.objects(
            member=self.db.fetch_member(member)).order_by("-time")

        def get_page(x: int, pages: int):
            embed = discord.Embed(
                title=f"**Auditing {member}**",
                description="Recently deleted and edited messages",
                color=0x8E44AD
            )
            embed.set_footer(text=f"Page {x + 1}/{pages}")
            for idx, action in enumerate(data[x*5:x*5+5], start=x*5):
                if action.action == "edit":
                    embed.add_field(
                        name=f"**Edited message in #{self.bot.get_channel(action.channel)}**",
                        value=f"– **Before:** {action.before}\n– **After:** {action.after}\n– at *{action.time:%m-%d-%y %I:%M %p}*",
                        inline=False
                    )
                elif action.action == "delete":
                    embed.add_field(
                        name=f"**Deleted message in #{self.bot.get_channel(action.channel)}**",
                        value=f"– **Message:** {action.before}\n– at *{action.time:%m-%d-%y %I:%M %p}*",
                        inline=False
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
                reaction, user = await self.bot.wait_for("reaction_add", check=lambda r, u: r.message.id == response.id and not u.bot, timeout=120)
                page = {
                    "⏮": 0,
                    "◀": page - 1,
                    "▶": page + 1,
                    "⏭️": pages - 1,
                }[reaction.emoji] % pages
                await reaction.remove(user)
                await response.edit(embed=get_page(page, pages))
        except asyncio.TimeoutError:
            await response.add_reaction("🛑")
