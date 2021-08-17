const Page = require("./helpers/page");

let page;

//setup per ogni unit test
beforeEach(async () => {
  page = await Page.build(true);
  await page.goto("http://localhost:3000");
});

//teardown per ogni unit test
afterEach(async () => {
  await page.close();
});

test("Verifica contenuto header blog", async () => {
  const text = await page.getContentFor("a.brand-logo");
  expect(text).toEqual("Blogster");
});

test("Verifica inizio processo OAuth2", async () => {
  await page.click(".right a");
  const url = await page.url();
  expect(url).toMatch(/accounts\.google\.com/);
});

//con test.only solo questo test viene eseguito nella suite corrente, gli altri vengono ignorati
test("Visualizza tasto logout quando sono autenticato", async () => {
  await page.login();

  //estrai il valore del link logout
  const text = await page.getContentFor("a[href='/auth/logout']");
  expect(text).toEqual("Logout");
});
