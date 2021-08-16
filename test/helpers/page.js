const puppeteer = require("puppeteer");
const sessionFactory = require("../factories/sessionFactory");
const userFactory = require("../factories/userFactory");

/**
 * Classe che estende tramite proxy, la classe Page di puppeteer
 */
class CustomPage {
  /**
   * costruisci un nuovo proxy verso le classi Page, CustomPage e Browser
   * @param headless indica se lanciare il browser in modalità headeless (senza UI)
   */
  static async build(headless = true) {
    const browser = await puppeteer.launch({ headless });
    const page = await browser.newPage();
    const customPage = new CustomPage(page);

    //costruisci un proxy che fa da broker verso le classi Page, CustomPage e Browser
    return new Proxy(customPage, {
      get: function (target, property) {
        return target[property] || browser[property] || page[property];
      },
    });
  }

  /**
   * Costruttore
   * @param {*} page pagina (tab) del browser
   */
  constructor(page) {
    this.page = page;
  }

  /**
   * Esegui un login
   */
  async login() {
    //imposta i coockie di sessione OAuth2
    const user = await userFactory();
    const { session, sig } = sessionFactory(user);
    await this.page.setCookie({ name: "session", value: session });
    await this.page.setCookie({ name: "session.sig", value: sig });

    //refresh. Con i cookie impostati si risulta autenticati e l'header della pagina cambia con il link logout
    await this.page.goto("http://localhost:3000/blogs");
    await this.page.waitFor("a[href='/auth/logout']"); //attendi caricamento dell'elemento nel DOM della pagina
  }

  /**
   * Ottieni il contenuto di un elemento nel DOM della pagina
   * @param {*} selector espressione selector
   * @returns contenuto di un elemento nel DOM della pagina
   */
  getContentFor(selector) {
    return this.page.$eval(selector, (el) => el.innerHTML);
  }
}

module.exports = CustomPage;
