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

describe("Se non autenticato", async () => {
  const actions = [
    {
      method: "post",
      path: "api/blogs",
      data: {
        title: "My Title",
        content: "My Content",
      },
    },
    {
      method: "get",
      path: "api/blogs",
    },
  ];

  test("Utente non può chiamare una api protetta", async () => {
    const results = await page.execRequests(actions);

    results.forEach((result) => {
      expect(result).not.toBeNull();
      expect(result.error).toEqual("You must log in!");
    });
  });
});
