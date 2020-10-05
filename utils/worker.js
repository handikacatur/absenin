const puppeteer = require('puppeteer');
const axios = require('axios');

const loginUrl = 'https://mmp.unej.ac.id/login/index.php';
const url = 'https://api.telegram.org/bot';
const apiToken = '1253962774:AAGCBobqNvMDaBbcYY4QHa7hvLDId4o0hFM';

const tasks = [];
const users = {};

const sendMessage = (res, chatId, message) => {
    axios.post(`${url}${apiToken}/sendMessage`,
        {
            chat_id: chatId,
            text: message
        }
    ).then((response) => {
        res.status(200).json(response);
    }).catch((error) => {
        res.send(error);
    });
}


const login = async (username, password, page, loginAttempt) => {
    /* Login function for every core */
    
    await page.goto(loginUrl);

    await page.evaluate(() => Array.from(
        document.querySelectorAll('input'),
        input => input.value = 0
    ));
    
    const usernameField = await page.$('input#username');
    await usernameField.click();

    await page.keyboard.type(username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(password);
    await page.keyboard.press('Enter');
    
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    const title = await page.evaluate(() => Array.from(
        document.querySelectorAll('title'),
        title => title.innerText
    ));

    // Check if user has signed in
    if (title[0] === 'Dashboard') {
        return true;
    } else {
        if (loginAttempt === 0) {
            return false;
        } else {
            loginAttempt -= 1;
            page.reload();
            login(username, password, page, loginAttempt-1);
        }
    }
}

const checkSignedIn = async (page) => {
    const title = await page.evaluate(() => Array.from(
        document.querySelectorAll('title'),
        title => title.innerText
    ));

    // Check if user has signed in
    if (title[0] === 'Dashboard') {
        return true;
    } else {
        return false;
    }
}

const getActivites = async (res, chatId, username, password) => {
    /* Get current activities */
    
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(username, password, page, 5);

    if (await checkSignedIn(page) === false) {
        console.log('executed');
        sendMessage(res, chatId, 'Login gagal! Silakan mulai kembali perintah /absenin.');
        await browser.close();
        return;
    } else {
        sendMessage(res, chatId, 'Login berhasil...')
    }
    
    const today = await page.$$('td.day');
    await today[5].click();
    
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    sendMessage(res, chatId, 'Sedang mencari absen...');

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
        tasks[key].push(chatId);
    }
    
    let message = ''
    if (tasks.length !== 0) {
        message += 'Absen ditemukan:'
        for (let i = 0; i < tasks.length; i++) {
            message += `\n${i+1}. `;
            await page.goto(tasks[i][1]);
            const title = await page.evaluate(() => Array.from(
                document.querySelectorAll('div.page-header-headings h1'),
                title => title.innerText
            ));
            message += `${title[0]}: ${tasks[i][0]}`
        }
    } else {
        message += 'Absen tidak ditemukan!'
    }

    sendMessage(res, chatId, message);
    sendMessage(res, chatId, 'Nanti saya absenin ya 😁');

    users[chatId] = [username, password];

    // close the browser
    await browser.close();
} 

const core1 = async () => {
    taskCounter += 1;
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();

    await login(page);

    await checkSignedIn(page) === true ? sendMessage(res, chatId, 'Login berhasil...') : sendMessage(res, chatId, 'Gagal login saat memulai absen! Silakan mulai kembali perintah /absenin.');

    await page.goto

    await browser.close();
}

const main = async () => {
    // core1();
}

module.exports = {main, getActivites};