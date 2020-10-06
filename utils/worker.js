const puppeteer = require('puppeteer');
const axios = require('axios');

 // If you want to use this for your own e-learning module, change this link with your own authentication link
const loginUrl = 'https://mmp.unej.ac.id/login/index.php';

const url = 'https://api.telegram.org/bot';
const apiToken = '<your token>'; // Change this shit with your bot token API

// Tasks stored here. The data should be [[the_time, link, chatId]]
const tasks = [];
// This shit is stored the user data. The data should be {chatId: [username, password, chatId]}
const users = {};

// To specify the task that should be perform. Incremented after a task is done
let taskCounter = 0;

// This is the fucking function to send message to the user through telegram bot
/**
 * ? I don't know why but sometime it says can't set header when it's already set
 * ? I think it's from the status response
 */
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

/**
 * This is login function that handle every login process
 */
const login = async (username, password, page, loginAttempt) => {
    /* Login function for every core */

    // This fuckin' shit is to prevent the browser timeout because the single sign on is very fucking slow
    await page.setDefaultNavigationTimeout(0);
    
    await page.goto(loginUrl);
    
    // ? I still search if any better method to fill SSO's fucking form
    // * I've add the waitUntil shit but it won't work and the fill method still doesn't do anything
    // * This method work, but sometime it gives us login error because of SSO's form focusing or maybe the network. I don't know
    const usernameField = await page.$('input#username');
    await usernameField.click();

    await page.keyboard.type(username);
    await page.keyboard.press('Tab');
    await page.keyboard.type(password);
    await page.keyboard.press('Enter');
    
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    // To check if the login method works, I have to check the page title. Here's the code
    const title = await page.evaluate(() => Array.from(
        document.querySelectorAll('title'),
        title => title.innerText
    )).catch((err) => console.log(err));

    // Check if user has signed in
    if (title[0] === 'Dashboard') {
        return true;
    } else {
        if (loginAttempt === 0) {
            return false;
        } else {
            page.reload();
            login(username, password, page, loginAttempt-1);
        }
    }
}

// * I know i've had the check title codes above but, I have some logical reason for this. You know, maybe I'll fix this logic later
const checkSignedIn = async (page) => {
    const title = await page.evaluate(() => Array.from(
        document.querySelectorAll('title'),
        title => title.innerText
    )).catch((err) => console.log(err));

    // Check if user has signed in
    if (title[0] === 'Dashboard') {
        return true;
    } else {
        return false;
    }
}

// This long boring function is to get the activiies
// @param res is the res from express
// @param chatId from telegram bot
// @param username and password that sent from bot
const getActivites = async (res, chatId, username, password) => {
    /* Get current activities */

    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    
    // In case if there's some error after getting activities are done, so this check come up. 
    // Because the user have to send the /absenin command again
    // If the tasks variable already have the activities, then it will close this browser instance, call the core function and then stop this function
    if (tasks.length > 0) {
        await browser.close();
        core1(res);
        return;
    }

    await login(username, password, page, 5);

    // Check if user has logged in
    if (await checkSignedIn(page) === false) {
        sendMessage(res, chatId, 'Login gagal! Silakan mulai kembali perintah /absenin.');
        await browser.close();
        return;
    } else {
        sendMessage(res, chatId, 'Login berhasil...')
    }
    
    const today = await page.$('td.today');
    await today.click();
    
    await page.waitForNavigation({waitUntil: 'networkidle0'});

    sendMessage(res, chatId, 'Sedang mencari absen...');

    // This fuckin shit is suspected as the console error output
    // It still warn me that I have unhandled promise and I have to catch that
    // This function is just get the activities time
    let texts = await page.evaluate(() => Array.from(
        document.querySelectorAll('span.date'),
        span => span.innerText
    )).catch((err) => console.log(err));

    // Then I have to split this, so I have the exact Hour and Minute
    texts = texts.map((i) => i.split(' ')[1].split(':'));

    // Push the Hour and Minute to tasks
    texts.forEach((i) => {
        const currentActivities = new Date();
        currentActivities.setHours(parseInt(i[0]));
        currentActivities.setMinutes(parseInt(i[1]));

        tasks.push([currentActivities]);
    });

    // Same as the the get time function but this function is getting the links
    // The shitty thing is that this function maybe causing warning error
    // There's some more function as this one. So I'm gonna call this as Shitty Function
    const links = await page.evaluate(() => Array.from(
        document.querySelectorAll('div.calendar_event_attendance a'),
        a => a.getAttribute('href')
    )).catch((err) => console.log(err));

    // After getting links, push it to tasks along with chatId
    for (key in links) {
        tasks[key].push(links[key]);
        tasks[key].push(chatId);
    }
    
    // Send the activities message so the user doesn't complain the bot don't do anything
    let message = ''
    if (tasks.length !== 0) {
        message += 'Absen ditemukan:'
        for (let i = 0; i < tasks.length; i++) {
            message += `\n${i+1}. `;
            await page.goto(tasks[i][1]);
            const title = await page.evaluate(() => Array.from(
                document.querySelectorAll('div.page-header-headings h1'),
                title => title.innerText
            )).catch((err) => console.log(err));
            message += `${title[0]}: ${tasks[i][0]}`
        }
    } else {
        message += 'Absen tidak ditemukan!'
    }

    sendMessage(res, chatId, message);
    sendMessage(res, chatId, 'Nanti saya absenin ya 😁');

    users[chatId] = [username, password, chatId];

    // close the browser and call the core function
    await browser.close();
    core1(res);
} 

// * I was thingking about having some asynchronous core to handle some user 
// * But in this short of time, I've change the code to handle just a user
const core1 = async (res) => {
    // Get the time when this function is called
    const now = new Date();
    // Get the difference
    const executionTime = tasks[taskCounter][0] - now;

    // * I won't explain this shit because it's too complicated 😥
    if (executionTime <= 0) {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();
    
        await login(users[tasks[taskCounter][2]][0], users[tasks[taskCounter][2]][1], page, 5);
    
        if (await checkSignedIn(page) === false) {
            sendMessage(res, tasks[taskCounter][2], 'Login gagal! Silakan mulai kembali perintah /absenin.');
            await browser.close();
            return;
        } else {
            sendMessage(res, tasks[taskCounter][2], 'Login berhasil...')
        }
    
        await page.goto(tasks[taskCounter][1]);

        const status = await page.evaluate(() => Array.from(
            document.querySelectorAll('td.statuscol'),
            statuscol => statuscol.innerText
        )).catch((err) => console.log(err));

        if (status[0] === 'Present') {
            const matkul = await page.evaluate(() => Array.from(
                document.querySelectorAll('div.page-header-headings h1'),
                header => header.innerText
            ));

            await sendMessage(res, tasks[taskCounter][2], `${matkul}: Present ✅`);

            await browser.close();
            taskCounter += 1;

            core1(res);
        } else {
            try {
                const submit = await page.evaluate(() => Array.from(
                    document.querySelectorAll('td.statuscol a'),
                    a => a.getAttribute('href')
                ));

                await page.goto(submit[0]);

                const present = await page.$$('span.statusdesc');
                await present[0].click();

                const submitButton = await page.$('input[type="submit"]');
                await submitButton.click();

                const absenStatus = await page.evaluate(() => Array.from(
                    document.querySelectorAll('td.statuscol'),
                    statuscol => statuscol.innerText
                ));

                if (absenStatus === 'Present') {
                    const absenMatkul = await page.evaluate(() => Array.from(
                        document.querySelectorAll('div.page-header-headings h1'),
                        header => header.innerText
                    ));
        
                    await sendMessage(res, tasks[taskCounter][2], `${absenMatkul}: Present ✅`);
                }
            } catch (err) {
                await sendMessage(res, tasks[taskCounter][2], `Absen Error`);
            }
        }
    
    } else {
        if (taskCounter === tasks.length) {
            await sendMessage(res, tasks[taskCounter][2], 'Sudah tidak ada absen untuk hari ini.');
            await browser.close();
            return;
        } else {
            await sendMessage(res, tasks[taskCounter][2], `Menunggu next absen pada: ${tasks[taskCounter][0]}`);
            await browser.close();
            setTimeout(core1(res), executionTime);
        }
    }
}

module.exports = {getActivites};