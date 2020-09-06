from discord.ext import commands
from dotenv import load_dotenv
import mongoengine
import os


# Setup

load_dotenv()
mongoengine.connect("lhs_moe")

# Instantiate Discord Bot

bot = commands.Bot(
    command_prefix=os.getenv("COMMAND_PREFIX"),
    help_command=commands.MinimalHelpCommand(),
)

bot.load_extension("jishaku")
bot.load_extension("cogs.actions")
bot.load_extension("cogs.administration")
bot.load_extension("cogs.bell")
bot.load_extension("cogs.bot")
bot.load_extension("cogs.bracket")
bot.load_extension("cogs.database")
bot.load_extension("cogs.fun")
bot.load_extension("cogs.logs")
bot.load_extension("cogs.roles")
bot.load_extension("cogs.welcome")


@bot.event
async def on_message(message):
    ctx = await bot.get_context(message)

    if ctx.guild:
        ignore = False
        delete = False

        for cog in bot.cogs.values():
            try:
                i, d = await cog.check_message(ctx)
                ignore, delete = ignore or i, delete or d
            except AttributeError:
                continue

        if delete:
            await message.delete()
            return

        if not ignore:
            await bot.process_commands(message)
    else:
        await bot.process_commands(message)


# Run Discord Bot

try:
    bot.run(os.getenv("BOT_TOKEN"))
except KeyboardInterrupt:
    bot.logout()
