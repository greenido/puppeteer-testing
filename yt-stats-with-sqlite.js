//
// A script to get YT stats by using puppeteer and saving them with SQLite
// 
// @author @greenido
// @date 1/2018
//
// @see https://github.com/topics/puppeteer / https://github.com/emadehsan/thal

const puppeteer = require("puppeteer");
var Sequelize = require('sequelize');
var DB;

//
// Util to format numbers with commas
//
const numberWithCommas = (x) => {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

async function run() {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const videoKeys = ["3NIopUsI4ik", "ykSFAs6S_Kg", "GKP4AS4L_K8", "cHEahGHseGc",
        "sjpbu4y6F_M", "PzILuAKyXIg", "ua4QGWmDfB8"
    ];
    let totalViews = 0;
    for (key in videoKeys) {
        let tmpStrViews = await getViewsPerPage(videoKeys[key]);
        tmpStrViews = tmpStrViews.replace("views", "");
        tmpStrViews = tmpStrViews.replace(",", "");
        tmpStrViews = tmpStrViews.replace(" ", "");
        totalViews += Number.parseInt(tmpStrViews);
    }
    console.log("** The Total is: " + numberWithCommas(totalViews) + " views");
    var ts = Math.round((new Date()).getTime() / 1000);
    DB.create({ id: ts, total: totalViews, comment: "TOTAL" });

    //
    //
    //
    async function getViewsPerPage(key) {
        const pageUrl = "https://www.youtube.com/watch?v=" + key;
        //console.log("== Start the party on " + pageUrl + "  ==");
        const page = await browser.newPage();
        //await page.goto(pageUrl);
        //await page.waitFor(1500);
        await page.goto(pageUrl, {
            networkIdleTimeout: 3000,
            waitUntil: 'networkidle',
            timeout: 3000000
        });

        const VIEWS_SELECTOR = "#count > yt-view-count-renderer > span.view-count.style-scope.yt-view-count-renderer";
        let views = await page.evaluate(sel => {
            let element = document.querySelector(sel);
            console.log("elm " + element + " \n\n");
            return element ? element.innerHTML : null;
        }, VIEWS_SELECTOR);

        console.log("The views for " + key + " video are: " + views);

        var ts = Math.round((new Date()).getTime() / 1000);
        DB.create({ id: ts, total: views, comment: key });
        return views;
    }

    browser.close();
    process.exit(0);
}

//
// CREATE TABLE IF NOT EXISTS `stats` (`id` INTEGER PRIMARY KEY, `total` INTEGER, `comment` VARCHAR(255), `createdAt` DATETIME NOT NULL, 
// `updatedAt` DATETIME NOT NULL);
//
async function connectDB() {
    var sequelize = new Sequelize('database', 'top-secret-user', 'todo-your-own-passwd', {
        host: '0.0.0.0',
        dialect: 'sqlite',
        pool: {
            max: 5,
            min: 0,
            idle: 10000
        },
        storage: './database.db'
    });

    sequelize.authenticate()
        .then(function(err) {
            console.log('Connection has been established successfully to our DB');
            DB = sequelize.define('stats', {
                id: {
                    type: Sequelize.INTEGER,
                    primaryKey: true
                },
                total: {
                    type: Sequelize.INTEGER
                },
                comment: {
                    type: Sequelize.STRING
                }
            });
            DB.sync({ force: false }).then(() => {
                console.log('** Synced with the database.');
            });
        });
}

//
// Start the party
//
connectDB();
run();