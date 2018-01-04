//
// A demo script to get the air quality index base on the zip code
// 
// @author @greenido
// @date 10/2017
//
// @see https://github.com/topics/puppeteer / https://github.com/emadehsan/thal

const puppeteer = require("puppeteer");

//
// return a JSON object to AoG
//
function returnJSON(jsonObj) {
  console.log("returnJSON() with: " + JSON.stringify(jsonObj));

  jsonObj.writeHead(200, {"Content-Type": "application/json"});
  
  var otherArray = ["item1", "item2"];
  var otherObject = { item1: "item1val", item2: "item2val" };
  var json = JSON.stringify({ 
    anObject: otherObject, 
    anArray: otherArray, 
    another: "item"
  });
  jsonObj.end(json);
}

//
//
//
async function run() {
  var zipArg = "" + process.argv.slice(2);
  if (zipArg.length !== 5) {
    console.log(
      zipArg.length +
        " Zip: " +
        zipArg +
        " - We must have a zip in order to run. Something like: 10021"
    );
    process.exit(1);
  }

  // Let's open chrome
  const browser = await puppeteer.launch({
    headless: false
  });

  const pageUrl = "https://weather.weatherbug.com/life/air-quality/" + zipArg;
  console.log("== Start the party on " + pageUrl + "  ==");
  const page = await browser.newPage();
  //await page.goto(pageUrl);
  //await page.waitFor(1500);

  await page.goto(pageUrl, {
    networkIdleTimeout: 5000,
    waitUntil: 'networkidle',
    timeout: 3000000
  });

  const AIR_SELECTOR =
    "body > main > section.module.js-module.is-colored > div > div > div > div > div > div.life-tab > div > div.life-content > div > div > div > div > div.airquality-top-section-container.ng-scope > div.airquality-index-section > div.airquality-index-chart-container > div.index-chart-section.ng-binding";
  
  let air = await page.evaluate(sel => {
    let element = document.querySelector(sel);
    console.log("elm " + element + " \n\n");
    return element ? element.innerHTML : null;
  }, AIR_SELECTOR);

  console.log("The air quality index: " + air + " for zip code: " + zipArg);
  browser.close();
  process.exit(0);
}

run();
