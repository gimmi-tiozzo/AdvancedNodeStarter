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
    const browser = await puppeteer.launch({
      headless,
      args: ["--no-sandbox"],
    });
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

  /**
   * Esegui una chiamata get
   * @param {*} path url
   * @returns response
   */
  get(path) {
    return this.page.evaluate(async (_path) => {
      const res = await fetch(_path, {
        method: "GET",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
      });
      return await res.json();
    }, path);
  }

  /**
   * Esegui una chiamata post
   * @param {*} path url
   * @param {*} data json
   * @returns response
   */
  post(path, data) {
    return this.page.evaluate(
      (_path, _data) => {
        return fetch(_path, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(_data),
        }).then((res) => res.json());
      },
      path,
      data
    );
  }

  /**
   * Esegui delle azioni http (chiamate a api)
   * @param {*} actions azione http da eseguire
   * @returns Promise che raccoglie lo stato di resolve di tutte le azioni eseguite
   */
  execRequests(actions) {
    return Promise.all(
      actions.map(({ method, path, data }) => this[method](path, data))
    );
  }
}

module.exports = CustomPage;
