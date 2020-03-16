from discord.ext import commands
from dotenv import load_dotenv
import mongoengine
import os

from cogs import *

# Load environment variables

load_dotenv()

# Load MongoDB

mongoengine.connect("lhs_moe")

# Instantiate Discord Bot

bot = commands.Bot(command_prefix='>',
                   help_command=commands.MinimalHelpCommand())

bot.add_cog(Administration(bot))
bot.add_cog(Bot(bot))
bot.add_cog(Database(bot))
bot.add_cog(Economy(bot))

# Run Discord Bot

try:
    bot.run(os.getenv("BOT_TOKEN"))
except KeyboardInterrupt:
    bot.logout()
