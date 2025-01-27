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

describe("Se autenticato", () => {
  beforeEach(async () => {
    await page.login();
    await page.click("a.btn-floating");
  });

  test("Devo vedere il form di creazione di un blog", async () => {
    const label = await page.getContentFor("form label");
    expect(label).toEqual("Blog Title");
  });

  describe("Se uso degli input validi", () => {
    beforeEach(async () => {
      await page.type(".title input", "My Title");
      await page.type(".content input", "My Content");
      await page.click("form button");
    });

    test("Dopo submit devo vedere la pagina di sommario", async () => {
      const text = await page.getContentFor("h5");
      expect(text).toEqual("Please confirm your entries");
    });

    test("Dopo submit e save devo vedere la pagina dei blogs", async () => {
      await page.click("button.green");
      await page.waitFor(".card");

      const blogTitle = await page.getContentFor(".card-title");
      const blogContent = await page.getContentFor("p");

      expect(blogTitle).toEqual("My Title");
      expect(blogContent).toEqual("My Content");
    });
  });

  describe("Se uso degli input non validi", () => {
    beforeEach(async () => {
      await page.click("form button");
    });

    test("Form deve visualizzare dei messaggi di errore", async () => {
      const titleError = await page.getContentFor(".title .red-text");
      const contentError = await page.getContentFor(".content .red-text");

      expect(titleError).toEqual("You must provide a value");
      expect(contentError).toEqual("You must provide a value");
    });
  });
});
