const { text } = require('express');
const puppeteer = require('puppeteer');

const loginUrl = 'https://mmp.unej.ac.id/login/index.php';

const tasks = [];

let loginAttempt = 5;

const login = async (page) => {
    /* Login function for every core */

    await page.setDefaultNavigationTimeout(0);

    await page.goto(loginUrl);

    await page.keyboard.type('192410101066');
    await page.keyboard.press('Tab');
    await page.keyboard.type('Dhyka_67');
    await page.keyboard.press('Enter');
    
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    const title = await page.evaluate(() => Array.from(
        document.querySelectorAll('title'),
        title => title.innerText
    ));

    // Check if user has signed in
    if (title[0] === 'Dashboard') {
        return 'Login Success!';
    } else {
        if (loginAttempt === 0) {
            return 'Login Failed! Check your password and try again.';
        } else {
            loginAttempt -= 1;
            page.reload();
            login(page);
        }
    }
}


const getActivites = async () => {
    /* Get current activities */
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(page);

    const today = await page.$('td.today');
    await today.click();

    await page.waitForNavigation({waitUntil: 'networkidle0'});

    let texts = await page.evaluate(() => Array.from(
        document.querySelectorAll('span.date'),
        span => span.innerText
    ));

    texts = texts.map((i) => i.split(' ')[1].split(':'));

    texts.forEach((i) => {
        const currentActivities = new Date();
        currentActivities.setHours(parseInt(i[0]));
        currentActivities.setMinutes(parseInt(i[1]));

        tasks.push([currentActivities]);
    });

    const links = await page.evaluate(() => Array.from(
        document.querySelectorAll('div.calendar_event_attendance a'),
        a => a.getAttribute('href')
    ));

    for (key in links) {
        tasks[key].push(links[key]);
    }
} 

const core1 = async () => {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(page);

    console.log(await page.content());

//   await browser.close();
}

const main = async () => {
    getActivites();
    // core1();
}

main();