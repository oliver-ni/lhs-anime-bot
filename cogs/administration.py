from discord.ext import tasks, commands
from profanity_filter import ProfanityFilter
import discord
import humanfriendly
import datetime
import asyncio
import math
import re

from . import models, database


class Administration(commands.Cog):
    """Commands for server admins."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.check_actions.start()

        self.pf = ProfanityFilter()

    @property
    def db(self) -> database.Database:
        return self.bot.get_cog("Database")

    async def check_message(self, ctx: commands.Context):
        ignore = False
        delete = False

        if self.db.fetch_member(ctx.author).muted:
            try:
                role = next(filter(lambda x: x.name ==
                                   "Muted", ctx.guild.roles))
                await ctx.author.add_roles(role)
            except StopIteration:
                pass

            ignore = True
            delete = True
        
        if not self.pf.is_clean(ctx.message.content):
            ignore = True
            delete = True

        return ignore, delete

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

    async def mute_member(self, member: discord.Member, duration: datetime.timedelta = None):
        try:
            role = next(filter(lambda x: x.name ==
                               "Muted", member.guild.roles))
        except StopIteration:
            raise Exception("Could not find a role named **Muted**.")

        if role in member.roles:
            raise Exception(f"**{member}** is already muted.")

        if duration is None:
            self.db.update_member(member, muted=True)
            await member.add_roles(role)
        else:
            self.db.create_temp_action(member, "mute", duration)
            self.db.update_member(member, muted=True)
            await member.add_roles(role)

    async def unmute_member(self, member: discord.Member):
        try:
            if (role := next(filter(lambda x: x.name == "Muted", member.guild.roles))) in member.roles:
                models.TempAction.objects(
                    member=self.db.fetch_member(member)).delete()
                self.db.update_member(member, muted=False)
                await member.remove_roles(role)
            else:
                raise Exception(f"**{member}** is not currently muted...")
        except StopIteration:
            raise Exception("Could not find a role named **Muted**.")

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def mute(self, ctx: commands.Context, member: discord.Member, *, duration: str = None):
        """Mute a member."""
        if duration is None:
            await self.mute_member(member)
            await ctx.send(f"**{member}** has been muted.")
            await member.send("You have been muted.")
        else:
            total = datetime.timedelta()

            if (r := re.search(r"(\d+)\s*d", duration)) is not None:
                total += datetime.timedelta(days=int(r.group(1)))
            if (r := re.search(r"(\d+)\s*h", duration)) is not None:
                total += datetime.timedelta(hours=int(r.group(1)))
            if (r := re.search(r"(\d+)\s*m", duration)) is not None:
                total += datetime.timedelta(minutes=int(r.group(1)))

            await self.mute_member(member, total)
            await ctx.send(f"**{member}** has been muted for **{humanfriendly.format_timespan(total)}.**")
            await member.send(f"You have been muted for **{humanfriendly.format_timespan(total)}.**")

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def unmute(self, ctx: commands.Context, member: discord.Member):
        """Unmute a member."""
        await self.unmute_member(member)
        await ctx.send(f"**{member}** has been unmuted.")
        await member.send("You have been unmuted.")

    @tasks.loop(seconds=5)
    async def check_actions(self):
        actions = models.TempAction.objects().order_by("expires")
        now = datetime.datetime.now()
        for action in actions:
            if action.action == "mute" and action.expires <= now:
                try:
                    guild = self.bot.get_guild(action.guild)
                    member = guild.get_member(action.member.id)
                    role = next(
                        filter(lambda x: x.name == "Muted", guild.roles))
                except AttributeError:
                    continue

                self.db.update_member(member, muted=False)
                await member.remove_roles(role)
                await member.send("You have been unmuted.")
                action.delete()
        pass

    @check_actions.before_loop
    async def before_check_actions(self):
        await self.bot.wait_until_ready()

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def kick(self, ctx: commands.Context, member: discord.Member, reason: str = None):
        """Kick a member."""
        if reason is None:
            await ctx.send(f"**{member}** has been kicked.")
            await member.send("You have been kicked.")
        else:
            await ctx.send(f"**{member}** has been kicked for **{reason}**.")
            await member.send(f"You have been kicked for **{reason}**.")
        await member.kick(reason=reason)

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def ban(self, ctx: commands.Context, member: discord.Member, reason: str = None):
        """Ban a member."""
        if reason is None:
            await ctx.send(f"**{member}** has been banned.")
            await member.send("You have been banned.")
        else:
            await ctx.send(f"**{member}** has been banned for **{reason}**.")
            await member.send(f"You have been banned for **{reason}**.")
        await member.ban(reason=reason)

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def unban(self, ctx: commands.Context, id: int):
        """Unban a member."""
        try:
            await ctx.guild.unban(user := next(filter(lambda x: x.user.id == id, await ctx.guild.bans())).user)
            await ctx.send(f"**{user}** has been unbanned.")
        except StopIteration:
            await ctx.send(f"That user is not banned...")
