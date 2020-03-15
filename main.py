from discord.ext import commands
from dotenv import load_dotenv
from pymongo import MongoClient
import os

from cogs import Administration, Bot

# Instantiate MongoDB

client = MongoClient(
    host=os.getenv("DATABASE_HOST"),
    port=int(os.getenv("DATABASE_PORT"))
)

db = client[os.getenv("DATABASE_NAME")]

# Instantiate Discord Bot

bot = commands.Bot(command_prefix='>')

bot.add_cog(Administration(bot, db))
bot.add_cog(Bot(bot, db))

# Run Discord Bot

try:
    load_dotenv()
    bot.run(os.getenv("BOT_TOKEN"))
except KeyboardInterrupt:
    bot.logout()
