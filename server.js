const puppeteer = require('puppeteer');

const loginUrl = 'https://mmp.unej.ac.id/login/index.php';

const users = [];

const tasks = [];

const login = async (page) => {
    /* Login function for every core */

    await page.setDefaultNavigationTimeout(0);

    await page.goto(loginUrl);

    await page.keyboard.type('192410101066');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Dhyka_67');
    
    const loginButton = await page.$('input[type="submit"]');
    await loginButton.click();
}

const getActivites = async () => {
    /* Get current activities */
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(page);

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    // const today = await page.$('td.today');
    const today = await page.$$('td.day');
    await today[0].click();

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    // const activities = await page.$$('span.date');
    const activities = await page.evaluate(() => document.querySelectorAll('span.date').innerText);

    console.log(activities);

    // await activities.forEach((i) => {
    //     const time = i.innerText.split(' ')[1].split(':');

    //     const taskHour = new Date();
    //     taskHour.setHours(parseInt(time[0]));
    //     taskHour.setMinutes(parseInt(time[1]));

    //     tasks.push(taskHour);
    // });

    console.log(tasks);
} 

const core1 = async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(page);

    console.log(await page.content());

//   await browser.close();
}

getActivites();
// core1();