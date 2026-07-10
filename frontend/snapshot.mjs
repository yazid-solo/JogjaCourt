import puppeteer from "puppeteer";
import fs from "fs";

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on("console", msg => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", error => console.log("PAGE ERROR:", error.message));
  
  try {
    await page.goto("http://localhost:3000/", { waitUntil: "networkidle2" });
    const bodyHTML = await page.evaluate(() => document.body.innerHTML);
    fs.writeFileSync("snapshot.html", bodyHTML);
    console.log("Snapshot saved to snapshot.html");
  } catch (err) {
    console.log("Navigation Error:", err);
  }
  await browser.close();
})();