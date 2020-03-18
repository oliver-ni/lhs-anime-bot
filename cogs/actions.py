from discord.ext import commands
import discord
import random


class Action:
    messages = {
        "nothing": [],
        "item": [],
        "self": [],
        "member": [],
        "bot": []
    }

    def __init__(self, target_type, user, target=None):
        self.target_type = target_type
        self.user = user
        self.target = target

    def compute(self):
        return random.choice(self.messages[self.target_type]).format(user=self.user, target=self.target)

    @classmethod
    async def convert(cls, ctx: commands.Context, argument: str):
        if argument is None:
            return cls(target_type="nothing", user=ctx.author)

        try:
            member = await commands.MemberConverter().convert(ctx, argument)
            if member.id == ctx.author.id:
                return cls(target_type="self", user=ctx.author)
            elif member.id == ctx.bot.user.id:
                return cls(target_type="bot", user=ctx.author, target=member)
            else:
                return cls(target_type="member", user=ctx.author, target=member)

        except commands.BadArgument:
            pass

        return cls(target_type="item", user=ctx.author, target=argument)


class Eat(Action):
    messages = {
        "nothing": [
            "{user.mention} sits down and eats **absolutely nothing**."
        ],
        "item": [
            "{user.mention} tries to eat **{target}**, but it falls to the ground."
        ],
        "self": [
            "{user.mention} might not be the smartest person here..."
        ],
        "member": [
            "{user.mention} takes a big bite out of **{target.mention}**. Yum."
        ],
        "bot": [
            "I'm a bot. You can't eat me."
        ]
    }


class Actions(commands.Cog):
    """Category for action messages"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    async def eat(self, ctx: commands.Context, *, target: str = None):
        action = await Eat.convert(ctx, target)
        await ctx.send(action.compute())
