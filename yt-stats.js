//
// A script to get YT stats by using puppeteer
// 
// @author @greenido
// @date 1/2018
//
// @see https://github.com/topics/puppeteer / https://github.com/emadehsan/thal

const puppeteer = require("puppeteer");
var SequelizePkg = require('sequelize'); 
var fs = require('fs');

var sequelize;
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
                       "sjpbu4y6F_M", "PzILuAKyXIg", "ua4QGWmDfB8", "end"];
    let totalViews = 0;
    for (key in videoKeys) {
      if (videoKeys[key] == "end") {
        await saveTotal(totalViews);	    
        break;
      }
      try {
        let tmpStrViews = await getViewsPerPage(videoKeys[key]);
        tmpStrViews = tmpStrViews.replace("views","");
        tmpStrViews = tmpStrViews.replace(",","");
        tmpStrViews = tmpStrViews.replace(" ","");
        totalViews += Number.parseInt(tmpStrViews);
      } catch(err) {
        console.log("ERR with page: " + videoKeys[key] + " Error: " + JSON.stringify(err));
      }
    }
   
	  
    async function saveTotal(totalViews) {
      var ts1 = Math.round((new Date()).getTime() );
      var totalViews = "" + totalViews;
      fs.writeFile('./totals.txt', totalViews, (err) => {
        if (err) {
	  console.log("ERROR with saving the totals: " + totalViews + " Err: " + JSON.stringify(err));	
	}
        console.log("The totals: " + totalViews + " was succesfully saved!");
      }); 
      DB.create({'id': ts1, 'total': totalViews, 'comment': 'totals'});
      console.log("time: " + ts1 + " " + totalViews + " ** The Total is: " + numberWithCommas(totalViews) + " views");
    }

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

      console.log("The views for " +key + " video are: " + views);
      var ts = Math.round((new Date()).getTime() ); 
      DB.create({ id: ts, total: views, comment: key});
      return views;
    }
    
    browser.close();
    //process.exit(0);
}

// CREATE TABLE IF NOT EXISTS `stats` (`id` INTEGER PRIMARY KEY, `total` INTEGER, `comment` VARCHAR(255), `createdAt` DATETIME NOT NULL, `updatedAt` DATETIME NOT NUL
// L);
//
async function connectDB(){
  sequelize = new SequelizePkg('database','' , '', {
     host: '0.0.0.0',
     dialect: 'sqlite',
     pool: {
       max: 15,
       min: 0,
       idle: 90000
      },
       storage: './database.db'
   });

   sequelize.authenticate()
    .then(function(err) {
        console.log('Connection has been established successfully to our DB');
        DB = sequelize.define('stats', {
        id: {
    	  type: SequelizePkg.INTEGER, primaryKey: true
        },
        total: {
          type: SequelizePkg.STRING
        },
        comment: { 
          type: SequelizePkg.STRING
        }
      });

        DB.sync({force: false}).then(() => {
          console.log('** Synced with the database.');  
      });
    }); 
}

//
// start the party
// 
try {
  connectDB().then(run());
}
catch(err) {
  console.log("MAIN ERR: " + JSON.stringify(err));
}

