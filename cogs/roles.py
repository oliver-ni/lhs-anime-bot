from discord.ext import commands
from collections import Counter
import mongoengine
import requests
import asyncio
import discord

from .utils import models, checks


class Roles(commands.Cog):
    """For adding roles utility."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.command()
    @checks.is_admin()
    async def give(self, ctx: commands.Context, member: discord.Member, role: str):
        try:
            role = next(
                filter(lambda x: x.name.lower() == role.lower(), member.guild.roles)
            )
            await member.add_roles(role)
        except StopIteration:
            await ctx.send("**Error:** Could not find role named **{role}**.")

    @commands.command()
    @checks.is_admin()
    async def take(self, ctx: commands.Context, member: discord.Member, role: str):
        try:
            role = next(
                filter(lambda x: x.name.lower() == role.lower(), member.guild.roles)
            )
            await member.remove_roles(role)
        except StopIteration:
            await ctx.send("**Error:** Could not find role named **{role}**.")

    @commands.group(invoke_without_command=True, aliases=["rr"])
    async def rolereact(self, ctx: commands.Context):
        await ctx.send_help(self.rolereact)

    @rolereact.command(name="create")
    @checks.is_admin()
    async def rolereact_create(
        self, ctx: commands.Context, message_link: discord.Message, *, name: str
    ):
        if message_link.guild.id != ctx.guild.id:
            await ctx.send(
                "**Error:** Cannot create reaction role manager in different guild."
            )
            return

        models.RoleReact.objects.create(
            message=message_link.id,
            channel=message_link.channel.id,
            guild=message_link.guild.id,
            name=name,
        )
        await ctx.send(
            f"Created reaction role manager in {message_link.channel.mention}"
        )

    @rolereact.command(name="list")
    @checks.is_admin()
    async def rolereact_list(self, ctx: commands.Context):
        rr = models.RoleReact.objects(guild=ctx.guild.id)
        await ctx.send(
            f"Reaction Role Managers:\n\n" + "\n".join(f"**{r.name}**" for r in rr)
        )

    @rolereact.command(name="delete")
    @checks.is_admin()
    async def rolereact_delete(self, ctx: commands.Context, name: str):
        try:
            obj = models.RoleReact.objects.get(name=name, guild=ctx.guild.id).delete()
            await ctx.send(f"Deleted reaction role manager **{name}**.")
        except mongoengine.DoesNotExist:
            await ctx.send("Could not find role reaction manager with that name.")

    @rolereact.command(name="view")
    @checks.is_admin()
    async def rolereact_view(self, ctx: commands.Context, name: str):
        try:
            obj = models.RoleReact.objects.get(name=name, guild=ctx.guild.id)
        except mongoengine.DoesNotExist:
            await ctx.send("Could not find role reaction manager with that name.")
            return

        options = obj.options.items()
        message = []

        for emoji, role in options:
            role = ctx.guild.get_role(role)

            try:
                emoji = self.bot.get_emoji(int(emoji))
            except ValueError:
                pass

            message.append(f"{emoji} for **{role}**")

        await ctx.send(f"Role Reaction Manager **{name}**\n\n" + "\n".join(message))

    @rolereact.command(name="add")
    @checks.is_admin()
    async def rolereact_add(
        self, ctx: commands.Context, emoji: str, role: discord.Role, name: str
    ):
        try:
            obj = models.RoleReact.objects.get(name=name, guild=ctx.guild.id)
        except mongoengine.DoesNotExist:
            await ctx.send("Could not find role reaction manager with that name.")
            return

        custom = False

        try:
            emoji = await commands.EmojiConverter().convert(ctx, emoji)
            custom = True
        except commands.BadArgument:
            pass

        message = await self.bot.get_channel(obj.channel).fetch_message(obj.message)

        try:
            await message.add_reaction(emoji)
        except commands.CommandInvokeError:
            await ctx.send("**Error:** Please enter a valid emoji.")
            return

        if custom:
            obj.options[str(emoji.id)] = role.id
        else:
            obj.options[emoji] = role.id

        obj.save()

        await ctx.send(
            f"Added {emoji} linking to role **{role}** to reaction role manager in {message.channel.mention}"
        )

    @rolereact.command(name="remove")
    @checks.is_admin()
    async def rolereact_remove(self, ctx: commands.Context, emoji: str, name: str):
        try:
            obj = models.RoleReact.objects.get(name=name, guild=ctx.guild.id)
        except mongoengine.DoesNotExist:
            await ctx.send("Could not find role reaction manager with that name.")
            return

        custom = False

        try:
            emoji = await commands.EmojiConverter().convert(ctx, emoji)
            custom = True
        except commands.BadArgument:
            pass

        message = await self.bot.get_channel(obj.channel).fetch_message(obj.message)

        try:
            await message.remove_reaction(emoji, self.bot.user)
        except commands.CommandInvokeError:
            await ctx.send("**Error:** Please enter a valid emoji.")
            return

        if custom:
            role = obj.options[str(emoji.id)]
            del obj.options[str(emoji.id)]
        else:
            role = obj.options[emoji]
            del obj.options[emoji]

        obj.save()

        await ctx.send(
            f"Removed {emoji} linking to role **{ctx.guild.get_role(role)}** to reaction role manager in {message.channel.mention}"
        )

    @commands.Cog.listener()
    async def on_raw_reaction_add(self, payload: discord.RawReactionActionEvent):
        if payload.user_id == self.bot.user.id:
            return

        try:
            rr = models.RoleReact.objects.get(
                message=payload.message_id,
                channel=payload.channel_id,
                guild=payload.guild_id,
            )
        except mongoengine.DoesNotExist:
            return

        emoji = (
            str(payload.emoji.id)
            if payload.emoji.is_custom_emoji()
            else payload.emoji.name
        )

        if emoji in rr.options:
            guild = self.bot.get_guild(payload.guild_id)
            role = guild.get_role(rr.options[emoji])
            await guild.get_member(payload.user_id).add_roles(role)

    @commands.Cog.listener()
    async def on_raw_reaction_remove(self, payload: discord.RawReactionActionEvent):
        if payload.user_id == self.bot.user.id:
            return

        try:
            rr = models.RoleReact.objects.get(
                message=payload.message_id,
                channel=payload.channel_id,
                guild=payload.guild_id,
            )
        except mongoengine.DoesNotExist:
            return

        emoji = (
            str(payload.emoji.id)
            if payload.emoji.is_custom_emoji()
            else payload.emoji.name
        )

        if emoji in rr.options:
            guild = self.bot.get_guild(payload.guild_id)
            role = guild.get_role(rr.options[emoji])
            await guild.get_member(payload.user_id).remove_roles(role)


def setup(bot):
    bot.add_cog(Roles(bot))
