from discord.ext import commands
from cogs import Administration
from dotenv import load_dotenv
import os

bot = commands.Bot(command_prefix='>')

@bot.event
async def on_ready():
    print("Logged in.")

@bot.event
async def on_command_error(ctx, error):
    if isinstance(error, commands.MissingRequiredArgument):
        await ctx.send_help(ctx.command)
    elif not isinstance(error, commands.CommandNotFound):
        await ctx.send(f"**Error:** {error}")

bot.add_cog(Administration(bot))

if __name__ == "__main__":
    try:
        load_dotenv()
        bot.run(os.getenv("BOT_TOKEN"))
    except KeyboardInterrupt:
        bot.logout()