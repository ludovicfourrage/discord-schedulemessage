import puppeteer from "puppeteer";
import { headless, xlsxlocation } from './config.json';
import { loadFromXLSX, saveToExcel } from "./helpers";
import cron from "node-cron";
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat'; // import plugin
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'; // import plugin
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // import plugin
dayjs.extend(customParseFormat);
dayjs.extend(isSameOrAfter);
dayjs.extend(isSameOrBefore);

interface scheduledMessage {
    date: string,
    name: string,
    guildId: string,
    channelId: string,
    message: string,
    posted: string,
    username: string,
    password: string
}
let path:string;

init()

async function init() {
    console.log("Discord scheduler started");
    console.log("Testing launching Chrome...");
    const page = await launchPuppeteer(headless).catch(() => {
        console.log("Chrome not found, testing launching Chrome locally...");
        path = './chromium/chrome.exe';
        return launchPuppeteer(headless);
    });
    await wait(2000);
    await closePuppeteer(page);
    console.log("Testing launching Chrome OK");
    console.log("Testing opening Excel file");
    const testOpenFile = openSchedulingFile();
    console.log(`Excel file loaded correctly, ${testOpenFile.length} messages in the file, ${testOpenFile.filter((m) => m.posted !== "yes").length} scheduled to be sent.`);
    cron.schedule("*/5 * * * *", async () => {
        await processScheduledMessages(headless);
    })
}

// processScheduledMessages(headless);

function openSchedulingFile() {
    const content = loadFromXLSX(xlsxlocation, 1, undefined, undefined) as scheduledMessage[];
    return content;
}

export async function processScheduledMessages(headless: boolean) {
    const scheduledMessages = openSchedulingFile();
    const scheduledMessageToProcess = scheduledMessages.find((message) => {
        return message.posted !== "yes" && dayjs(message.date, "MM/DD/YYYY hh:mma").isSameOrBefore(dayjs());
    })
    if (scheduledMessageToProcess) {
        console.log(`Preparing to sending message ${scheduledMessageToProcess.name}`);
        await sendMessage(scheduledMessageToProcess, headless)
        .then(() => {
            console.log(`Message ${scheduledMessageToProcess.name} sent`);
            scheduledMessageToProcess.posted = "yes";
            saveToExcel([{name: "messages", data: scheduledMessages}], xlsxlocation, true, true);
        })
        .catch((err) => {
            console.error(`Error sending message ${scheduledMessageToProcess.name}`, err);
        })
    }
}

export function wait(ms:number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

export function launchPuppeteer(headless: boolean) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config:any = {
        headless, 
        args: [
        "--no-sandbox", 
        "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36"
    ]}
    if (path) {
        config.executablePath = path;
    }
    return puppeteer.launch(config)
        .then(async (browser) => {
          await browser.createIncognitoBrowserContext();
          const page = await browser.newPage();
          // await page.setViewport({ width: 1920, height: 1080 });
          return page;
        });
}

export async function sendMessage(message: {guildId: string, channelId: string, message: string, username: string, password: string}, headless: boolean) {
    const page = await launchPuppeteer(headless);
    const url = `https://discord.com/channels/${message.guildId}/${message.channelId}`;

    await page.goto(url, {timeout: 100000, waitUntil: "networkidle2"}).catch((err) => console.error(err));
    
    const continueButton = await page.$x("//div[contains(text(), 'Continue in browser')]");

    if (continueButton) {
        // console.log(continueButton);
        const parent = await continueButton[0] as puppeteer.ElementHandle<Element>;
        if (parent) {
            await parent.click();
            await wait(2000);
            await page.type("input[name='email']", message.username);
            await page.type("input[name='password']", message.password);
            await Promise.all([
                  page.waitForNavigation(),
                  page.click("[type=\"submit\"]"),
            ]);
            const selector = 'div[contenteditable=true]:nth-child(2)';
            await page.waitForSelector(selector, {timeout: 0})
            const text = await page.$(selector);
            if (text) {
                // console.log("message.messageBody", message.messageBody);
                const messageBodyProcessed = message.message
                    .trim()
                    .split("\r\n\r\n")
                    .filter((paragraph) => paragraph)
                    .map((fragment) => fragment.split("\r\n"));
                // console.log("message.messageBodyProcessed",messageBodyProcessed);
                await text.click()
                for (const paragraph of messageBodyProcessed) {
                    // console.log("fragment", paragraph);
                    for (const fragment of paragraph) {
                        const cleanedFragment = fragment.replace(/\r/g, "");
                        await text.type(cleanedFragment);
                        await page.keyboard.down("Shift");
                        await page.keyboard.press("Enter");
                        await page.keyboard.up("Shift");
                    }
                    await page.keyboard.down("Shift");
                    await page.keyboard.press("Enter");
                    await page.keyboard.up("Shift");
                }

                await page.keyboard.press("Enter")
            }
        }
    }
    await closePuppeteer(page);
}

export function closePuppeteer(page: puppeteer.Page) {
    return page.browser().close();
}