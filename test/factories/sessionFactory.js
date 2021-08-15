const Buffer = require("safe-buffer").Buffer;
const Keygrip = require("keygrip");
const keys = require("../../config/keys");
const keygrip = new Keygrip([keys.cookieKey]);

module.exports = (user) => {
  //costruisci la stringa in base64 per l'oggetto che identifica lo user nel cookie di sessione OAuth2
  const sessionObject = { passport: { user: user._id.toString() } };
  const session = Buffer.from(JSON.stringify(sessionObject)).toString("base64");

  //costruisci la stringa di firma relativa alla stringa di sessione
  const sig = keygrip.sign("session=" + session);

  return { session, sig };
};
