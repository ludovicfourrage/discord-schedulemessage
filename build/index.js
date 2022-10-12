"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closePuppeteer = exports.sendMessage = exports.launchPuppeteer = exports.wait = exports.processScheduledMessages = void 0;
const puppeteer_1 = __importDefault(require("puppeteer"));
const config_json_1 = require("./config.json");
const helpers_1 = require("./helpers");
const node_cron_1 = __importDefault(require("node-cron"));
const dayjs_1 = __importDefault(require("dayjs"));
const customParseFormat_1 = __importDefault(require("dayjs/plugin/customParseFormat")); // import plugin
const isSameOrAfter_1 = __importDefault(require("dayjs/plugin/isSameOrAfter")); // import plugin
const isSameOrBefore_1 = __importDefault(require("dayjs/plugin/isSameOrBefore")); // import plugin
dayjs_1.default.extend(customParseFormat_1.default);
dayjs_1.default.extend(isSameOrAfter_1.default);
dayjs_1.default.extend(isSameOrBefore_1.default);
let path;
init();
function init() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("Discord scheduler started");
        console.log(`Configuration loaded for discord account ${config_json_1.discord.username}`);
        console.log("Testing launching Chrome...");
        const page = yield launchPuppeteer(true).catch(() => {
            console.log("Chrome not found, testing launching Chrome locally...");
            path = './chromium/chrome.exe';
            return launchPuppeteer(true);
        });
        yield wait(2000);
        yield closePuppeteer(page);
        console.log("Testing launching Chrome OK");
        console.log("Testing opening Excel file");
        node_cron_1.default.schedule("*/5 * * * *", () => __awaiter(this, void 0, void 0, function* () {
            yield processScheduledMessages(config_json_1.headless);
        }));
    });
}
// processScheduledMessages(headless);
function openSchedulingFile() {
    const file = "./scheduledposts.xlsx";
    const content = (0, helpers_1.loadFromXLSX)(file, 1, undefined, undefined);
    console.log("Excel file loaded correctly");
    return content;
}
function processScheduledMessages(headless) {
    return __awaiter(this, void 0, void 0, function* () {
        const file = "./scheduledposts.xlsx";
        const scheduledMessages = openSchedulingFile();
        const scheduledMessageToProcess = scheduledMessages.find((message) => {
            return message.posted !== "yes" && (0, dayjs_1.default)(message.date, "MM/DD/YYYY hh:mma").isSameOrBefore((0, dayjs_1.default)());
        });
        if (scheduledMessageToProcess) {
            console.log(`Preparing to sending message ${scheduledMessageToProcess.name}`);
            yield sendMessage({ guildId: scheduledMessageToProcess.guildId, channelId: scheduledMessageToProcess.channelId, messageBody: scheduledMessageToProcess.message }, headless)
                .then(() => {
                console.log(`Message ${scheduledMessageToProcess.name} sent`);
                scheduledMessageToProcess.posted = "yes";
                (0, helpers_1.saveToExcel)([{ name: "messages", data: scheduledMessages }], file, true, true);
            })
                .catch((err) => {
                console.error(`Error sending message ${scheduledMessageToProcess.name}`, err);
            });
        }
    });
}
exports.processScheduledMessages = processScheduledMessages;
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
exports.wait = wait;
function launchPuppeteer(headless) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const config = {
        headless,
        args: [
            "--no-sandbox",
            "--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4182.0 Safari/537.36"
        ]
    };
    if (path) {
        config.executablePath = path;
    }
    return puppeteer_1.default.launch(config)
        .then((browser) => __awaiter(this, void 0, void 0, function* () {
        yield browser.createIncognitoBrowserContext();
        const page = yield browser.newPage();
        // await page.setViewport({ width: 1920, height: 1080 });
        return page;
    }));
}
exports.launchPuppeteer = launchPuppeteer;
function sendMessage(message, headless) {
    return __awaiter(this, void 0, void 0, function* () {
        const page = yield launchPuppeteer(headless);
        const url = `https://discord.com/channels/${message.guildId}/${message.channelId}`;
        yield page.goto(url, { timeout: 100000, waitUntil: "networkidle2" }).catch((err) => console.error(err));
        const continueButton = yield page.$x("//div[contains(text(), 'Continue in browser')]");
        if (continueButton) {
            // console.log(continueButton);
            const parent = yield continueButton[0];
            if (parent) {
                yield parent.click();
                yield wait(2000);
                yield page.type("input[name='email']", config_json_1.discord.username);
                yield page.type("input[name='password']", config_json_1.discord.password);
                yield Promise.all([
                    page.waitForNavigation(),
                    page.click("[type=\"submit\"]"),
                ]);
                const selector = 'div[contenteditable=true]:nth-child(2)';
                yield page.waitForSelector(selector, { timeout: 0 });
                const text = yield page.$(selector);
                if (text) {
                    // console.log("message.messageBody", message.messageBody);
                    const messageBodyProcessed = message.messageBody
                        .trim()
                        .split("\r\n\r\n")
                        .filter((paragraph) => paragraph)
                        .map((fragment) => fragment.split("\r\n"));
                    // console.log("message.messageBodyProcessed",messageBodyProcessed);
                    yield text.click();
                    for (const paragraph of messageBodyProcessed) {
                        // console.log("fragment", paragraph);
                        for (const fragment of paragraph) {
                            const cleanedFragment = fragment.replace(/\r/g, "");
                            yield text.type(cleanedFragment);
                            yield page.keyboard.down("Shift");
                            yield page.keyboard.press("Enter");
                            yield page.keyboard.up("Shift");
                        }
                        yield page.keyboard.down("Shift");
                        yield page.keyboard.press("Enter");
                        yield page.keyboard.up("Shift");
                    }
                    yield page.keyboard.press("Enter");
                }
            }
        }
        yield closePuppeteer(page);
    });
}
exports.sendMessage = sendMessage;
function closePuppeteer(page) {
    return page.browser().close();
}
exports.closePuppeteer = closePuppeteer;
//# sourceMappingURL=index.js.map