from discord.ext import commands
from dotenv import load_dotenv
import mongoengine
import os

from cogs import *

# Setup

load_dotenv()
mongoengine.connect("lhs_moe")

# Instantiate Discord Bot

bot = commands.Bot(
    command_prefix=os.getenv("COMMAND_PREFIX"),
    help_command=commands.MinimalHelpCommand(),
)

bot.add_cog(Actions(bot))
bot.add_cog(Administration(bot))
bot.add_cog(Bot(bot))
bot.add_cog(Bracket(bot))
bot.add_cog(Database(bot))
bot.add_cog(Economy(bot))
bot.add_cog(Fun(bot))
bot.add_cog(Logs(bot))


@bot.event
async def on_message(message):
    ctx = await bot.get_context(message)

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


# Run Discord Bot

try:
    bot.run(os.getenv("BOT_TOKEN"))
except KeyboardInterrupt:
    bot.logout()
