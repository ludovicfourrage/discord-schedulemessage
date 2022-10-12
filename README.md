# discord-schedulemessage

Schedule when you would like to send messages to any discord server and channel that you are a member off.
No BOT.
The is a beta / POC version, looking forward to see the community improve it!

This utility uses Puppeteer / Chromium to automate login into your personal Discord account, navigates to the channel and types the message on your behalf.

It uses node-cron to check every 5 minutes if a new message needs to be sent.

Messages are placed into an excel spredsheet, along with your credentials <== warning, danger!

As a beta version, this is meant to be run locally (package it using pkg for example) on your machine. Make sure to not publish your crednetials online via the excel spreadsheet.

** WARNING YOUR DISCORD CREDENTIALS MAY LEAK IF YOU ARE NOT CAREFUL **

** NEVER GIVE ACCESS TO YOUR PROJECT / EXCEL FILE WITH YOUR CREDENTIALS **

** NEVER PUBLISH TO GITHUB WITH YOUR CEDENTIALS STILL IN THE EXCEL FILE **

# Usage:
1. Write your message in Discord. Use a private message to a bot for example to make sure it is correctly formatted.
2. Copy your message from the message window, after sending it to the bot.
3. Paste your message in a simple text editor. For example [notepad++](https://notepad-plus-plus.org/downloads/).
4. Any formatting would have been gone (bold, italic etc.. ) so follow the [Discord Markdown Documentation](https://support.discord.com/hc/en-us/articles/210298617-Markdown-Text-101-Chat-Formatting-Bold-Italic-Underline-) to re-apply it.
5. Any embedded picture will need to be replaced with the actual link / url to the picture.
6. Create a new row in the Excel file:
   - Column A "posted": Leave empty. The utility will update this field automatically to "yes" when the message has been posted,
   - Column B: Name your message (for reference only, it won't appear in the scheduled message),
   - Column C: Your discord account username / email,
   - Column D: Your discord account password,
   - Column E: date and time the message should be sent in the format MM/DD/YYYY hh:mma,
   - Column F: Discord Guild ID (also known as Server ID),
   - Column G: Discord Channel ID,
   - Column H "message": Copy and Paste the markdowned / formatted message content there.
