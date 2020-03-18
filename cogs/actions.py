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
            "{user.mention}, you sit down and eats **absolutely nothing**.",
            "No one:\nAbsolutely no one:\n{user.mention}: *eat*",
            "{user.mention} doesn't know what to eat...",
        ],
        "item": [
            "{user.mention} tries to eat **{target}**, but it falls to the ground.",
            "{user.mention}'s teeth sink into **{target}**. It tastes satisfying."
        ],
        "self": [
            "{user.mention} might not be the smartest person here...",
            "{user.mention}, you take a quick bite out of your own forearm—not surprisingly, it hurts."
        ],
        "member": [
            "{user.mention} takes a big bite out of {target.mention}. Yum.",
            "{user.mention}, you sneakily nibble on {target.mention}—they probably didn't even notice."
        ],
        "bot": [
            "I'm a bot. You can't eat me.",
            "{user.mention}, your jaw clamps down on... wait... nothing, because I'm digital!"
        ],
    }


class Drink(Action):
    messages = {
        "nothing": [
            "{user.mention}, are you sure you know what drinking is?",
            "{user.mention}, you stare at your glass full of **nothing**...",
        ],
        "item": [
            "{user.mention} tries to drink **{target}**, but fails.",
            "{user.mention}'s straw sinks into **{target}**. It tastes satisfying."
        ],
        "self": [
            "{user.mention}, you stab your straw into—wait, you're not a drink!",
            "{user.mention}, you try to fit yourself in a cup, but just can't do it."
        ],
        "member": [
            "{user.mention}, you grab your lucky straw and empty {target.mention} in one sip.",
            "{user.mention}, you stab your straw into {target.mention}—and run away as they run after you."
        ],
        "bot": [
            "{user.mention}, you try to drink *me*, but I dodge your straw..",
            "{user.mention}, you stab your straw into... wait... nothing, because I'm digital!"
        ],
    }


class Actions(commands.Cog):
    """Category for action messages"""

    def __init__(self, bot: commands.Bot):
        self.bot = bot

    @commands.command()
    async def eat(self, ctx: commands.Context, *, target: str = None):
        action = await Eat.convert(ctx, target)
        await ctx.send(action.compute())

    @commands.command()
    async def drink(self, ctx: commands.Context, *, target: str = None):
        action = await Drink.convert(ctx, target)
        await ctx.send(action.compute())
