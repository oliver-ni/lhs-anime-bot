from discord.ext import commands
import discord


class Administration(commands.Cog):
    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def mute(self, ctx: commands.Context, *, member: discord.Member):
        """Mute a member."""
        try:
            if (role := next(filter(lambda x: x.name == "Muted", ctx.guild.roles))) not in member.roles:
                await ctx.send(f"**{member}** has been muted.")
                await member.send("You have been muted.")
                await member.add_roles(role)
            else:
                await ctx.send(f"**{member}** is already muted...")
        except StopIteration:
            await ctx.send("Could not find a role named **Muted**.")

    @commands.command()
    @commands.guild_only()
    @commands.check_any(commands.is_owner(), commands.has_permissions(administrator=True))
    async def unmute(self, ctx: commands.Context, *, member: discord.Member):
        """Unmute a member."""
        try:
            if (role := next(filter(lambda x: x.name == "Muted", ctx.guild.roles))) in member.roles:
                await ctx.send(f"**{member}** has been unmuted.")
                await member.send("You have been unmuted.")
                await member.remove_roles(role)
            else:
                await ctx.send(f"**{member}** is not currently muted...")
        except StopIteration:
            await ctx.send("Could not find a role named **Muted**.")

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

