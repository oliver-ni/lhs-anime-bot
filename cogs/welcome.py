import asyncio

import discord
from discord.ext import commands

from .utils import checks

GUILD_ID = 576586719999033374
GUEST_ROLE = 643303716568432659
VERIFIED_ROLE = 632830365337255955

GRADE_ROLES = {
    2024: 752033532381102221,
    2023: 752033587678675054,
    2022: 752033633434337290,
    2021: 752033673829810207,
}

ALL_ROLES = [GUEST_ROLE, VERIFIED_ROLE, *GRADE_ROLES.values()]


async def add_reactions(message, *emojis):
    for emoji in emojis:
        await message.add_reaction(emoji)


class Welcome(commands.Cog):
    """For welcoming new members."""

    def __init__(self, bot: commands.Bot):
        self.bot = bot
        self.tasks = {}

    @property
    def db(self):
        return self.bot.get_cog("Database")

    @commands.command()
    @checks.is_admin()
    async def whois(self, ctx: commands.Context, member: discord.Member):
        data = self.db.fetch_member(member)
        if data is None:
            return await ctx.send("That user is not verified!")

        embed = discord.Embed(title="Member Info", color=0x8E44AD)
        embed.set_author(name=str(member), icon_url=member.avatar_url)

        if not data.guest:
            embed.add_field(name="Class Of", value=data.classof)
            embed.add_field(name="Name", value=data.name or "No Name", inline=False)
            embed.add_field(name="Email", value=data.email or "No Email", inline=False)
        else:
            embed.description = "This user is a guest."

        await ctx.send(embed=embed)

    @commands.command()
    async def verify(self, ctx: commands.Context):
        guild = self.bot.get_guild(576586719999033374)
        member = guild.get_member(ctx.author.id)
        if ctx.author.id in self.tasks:
            self.tasks[ctx.author.id].cancel()
        if member is not None:
            await ctx.send("OK, restarting the verification process.")
            self.tasks[ctx.author.id] = self.bot.loop.create_task(
                self.verify_member(member)
            )
            # await self.verify_member(member)
        else:
            await ctx.send(
                "Looks like you left the server, so I can't verify you yet. Please join again! discord.gg/MZNBmwe"
            )

    @commands.Cog.listener()
    async def on_member_join(self, member):
        data = self.db.fetch_member(member)
        if data is not None:
            return

        if member.id != 138498458075136000:
            return

        self.tasks[member.id] = self.bot.loop.create_task(self.verify_member(member))

    async def verify_member(self, member):
        if member.guild.id != 576586719999033374:
            self.tasks.pop(member.id)

        await member.send(
            "Welcome to the **LHS Anime Club** Discord server! "
            "Here, you can talk with other students about all sorts of topics, including "
            "academics, politics, games, food, and (of course) anime!\n\n"
            "I'm your friendly neighborhood bot. "
            "Before you can talk, I will ask you a few questions so we know who you are.\n"
            "(You can restart this process at any time by typing `>verify` here.)"
        )

        await asyncio.sleep(2)

        try:

            # Lynbrook student or not

            message = await member.send(
                "First, do you go to Lynbrook High School? Click either ✅ or ❌ to tell me your answer."
            )
            self.bot.loop.create_task(add_reactions(message, "✅", "❌"))
            r, u = await self.bot.wait_for(
                "reaction_add",
                check=lambda r, u: u == member
                and r.message.id == message.id
                and r.emoji in ("✅", "❌"),
                timeout=60,
            )
            if r.emoji == "❌":
                await member.add_roles(member.guild.get_role(GUEST_ROLE))
                await member.send(
                    "Great! I've given you the **Guest** role and you can now talk in the server. Have fun!"
                )
                self.db.update_member(member, guest=True)
                self.tasks.pop(member.id)
                return

            # Name

            message = await member.send(
                "Welcome! Next, what's your first and last name? We use this information "
                "to identify members and award points. Only the officers will have access to this information.\n"
                "Please answer in the format `Firstname Lastname`."
            )
            while True:
                m = await self.bot.wait_for(
                    "message",
                    check=lambda m: m.author == member and m.channel == message.channel,
                    timeout=60,
                )
                name = m.content
                message = await member.send(
                    f"Your name is **{name}**. Is that correct?"
                )
                self.bot.loop.create_task(add_reactions(message, "✅", "❌"))
                r, u = await self.bot.wait_for(
                    "reaction_add",
                    check=lambda r, u: u == member
                    and r.message.id == message.id
                    and r.emoji in ("✅", "❌"),
                    timeout=60,
                )
                if r.emoji == "✅":
                    break
                else:
                    message = await member.send(
                        f"Oops! Let's try that again. Please answer in the format `Firstname Lastname`."
                    )

            # Email

            message = await member.send(
                f"Nice to meet you, {name.split()[0]}! "
                "What's your email address (personal or school)? If you don't wish to tell us this, please say `none`."
            )
            while True:
                m = await self.bot.wait_for(
                    "message",
                    check=lambda m: m.author == member
                    and m.channel == message.channel
                    and "@" in m.content
                    or m.content.lower() == "none",
                    timeout=60,
                )
                email = m.content
                if email.lower() == "none":
                    email = None
                    break
                message = await member.send(
                    f"Your email address is **{email}**. Is that correct?"
                )
                self.bot.loop.create_task(add_reactions(message, "✅", "❌"))
                r, u = await self.bot.wait_for(
                    "reaction_add",
                    check=lambda r, u: u == member
                    and r.message.id == message.id
                    and r.emoji in ("✅", "❌"),
                    timeout=60,
                )
                if r.emoji == "✅":
                    break
                else:
                    message = await member.send(
                        f"Oops! Let's try that again. What's your email address?"
                    )

            # Grade

            message = await member.send(
                "Last question before I let you in: what grade are you in? "
                "Type `9`, `10`, `11`, or `12` to let me know."
            )

            m = await self.bot.wait_for(
                "message",
                check=lambda m: m.author == member
                and m.channel == message.channel
                and m.content in ("9", "10", "11", "12"),
                timeout=60,
            )

            grade = int(m.content)
            classof = 2033 - grade

            await member.add_roles(member.guild.get_role(VERIFIED_ROLE))
            await member.add_roles(member.guild.get_role(GRADE_ROLES[classof]))
            await member.send(
                "Welcome to Anime Club! I've given you some roles, so you can now talk in the server. "
                "If you have any questions, please let one of the officers know. Have fun!"
            )

            self.db.update_member(
                member, name=name, email=email, classof=classof, guest=False
            )
            self.tasks.pop(member.id)

        except asyncio.TimeoutError:
            await member.send(
                "Looks like you aren't quite ready yet. "
                "Type `>verify` in this channel when you want to restart the process!"
            )


def setup(bot):
    bot.add_cog(Welcome(bot))
