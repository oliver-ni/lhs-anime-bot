from discord.ext import commands
from dotenv import load_dotenv
import mongoengine
import os

from cogs import *

# Setup

load_dotenv()
mongoengine.connect("lhs_moe")

# Instantiate Discord Bot

bot = commands.Bot(command_prefix='>',
                   help_command=commands.MinimalHelpCommand())

bot.add_cog(Administration(bot))
bot.add_cog(Bot(bot))
bot.add_cog(Database(bot))
bot.add_cog(Economy(bot))
bot.add_cog(Fun(bot))

# Run Discord Bot

try:
    bot.run(os.getenv("BOT_TOKEN"))
except KeyboardInterrupt:
    bot.logout()
