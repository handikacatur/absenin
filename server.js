// Some beutiful explanations are in /utils/worker.js
const express = require('express');
const axios = require('axios');
const worker = require('./utils/worker');

const url = 'https://api.telegram.org/bot';
const apiToken = '<your token>';

const app = express();

app.use(express.json());

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

app.post('/', (req, res) => {
    const chatId = req.body.message.chat.id;
    let message = req.body.message.text;
    
    if (message === '/start' | message === '/help') {
        sendMessage(res, chatId, 'Usage:\n/absenin username password\n\nNOTE: Untuk alasan keamanan, username dan password tidak akan disimpan pada database.');
    } else if (message.search('/absenin') !== -1) {
        message = message.split(' ');
        if (message.length !== 3) {
            sendMessage(res, chatId, 'Isi username sama passwordnya goblok!');
        } else {
            sendMessage(res, chatId, 'Mencoba Login...');
            worker.getActivites(res, chatId, message[1], message[2]);
        }
    } else {
        sendMessage(res, chatId, 'Perintah tidak ditemukan!\nGunakan perintah /absenin untuk absen.\nContoh: /absenin 1029383928 inipassword90');
    }
});

app.listen(8080, () => {
    console.log('App listening on port 8080');
});