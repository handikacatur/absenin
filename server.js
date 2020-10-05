const express = require('express');
const axios = require('axios');
const {}

const url = 'https://api.telegram.org/bot';
const apiToken = '1253962774:AAGCBobqNvMDaBbcYY4QHa7hvLDId4o0hFM'

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
    const message = req.body.message.text;

    if (message === '/start' | message === '/help') {
        sendMessage(res, chatId, 'Usage:\n/absenin username password');
    } else if (message.search('/absenin') !== -1) {
        sendMessage(res, chatId, 'Sedang mencari jadwal absen. Tunggu sebentar...');
    } else {
        sendMessage(res, chatId, 'Perintah tidak ditemukan!\nGunakan perintah /absenin untuk absen.\nContoh: /absenin 1029383928 inipassword90');
    }
});

app.listen(8080, () => {
    console.log('App listening on port 8080');
});