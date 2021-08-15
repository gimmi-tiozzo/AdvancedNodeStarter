const puppeteer = require("puppeteer");
const sessionFactory = require("./factories/sessionFactory");
const userFactory = require("./factories/userFactory");

let browser, page;

//setup per ogni unit test
beforeEach(async () => {
  browser = await puppeteer.launch({ headless: false });
  page = await browser.newPage();
  await page.goto("http://localhost:3000");
});

//teardown per ogni unit test
afterEach(async () => {
  await browser.close();
});

test("Verifica contenuto header blog", async () => {
  const text = await page.$eval("a.brand-logo", (el) => el.innerHTML);
  expect(text).toEqual("Blogster");
});

test("Verifica inizio processo OAuth2", async () => {
  await page.click(".right a");
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

//con test.only solo questo test viene eseguito nella suite corrente, gli altri vengono ignorati
test("Visualizza tasto logout quando sono autenticato", async () => {
  //imposta i coockie di sessione OAuth2
  const user = await userFactory();
  const { session, sig } = sessionFactory(user);
  await page.setCookie({ name: "session", value: session });
  await page.setCookie({ name: "session.sig", value: sig });

  //refresh. Con i cookie impostati si risulta autenticati e l'header della pagina cambia con il link logout
  await page.goto("http://localhost:3000");
  await page.waitFor("a[href='/auth/logout']"); //attendi caricamento dell'elemento nel DOM della pagina

  //estrai il valore del link logout
  const text = await page.$eval("a[href='/auth/logout']", (el) => el.innerHTML);
  expect(text).toEqual("Logout");
});
