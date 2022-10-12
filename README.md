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


