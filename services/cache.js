const mongoose = require("mongoose");
const redis = require("redis");
const util = require("util");

const redisUrl = "redis://localhost:6379";
const redisClient = redis.createClient(redisUrl);
const exec = mongoose.Query.prototype.exec;
redisClient.hget = util.promisify(redisClient.hget);
redisClient.get = util.promisify(redisClient.get);

mongoose.Query.prototype.cache = function (option = {}) {
  this.chacheEnabled = true;
  this.masterKey = JSON.stringify(option.key ?? "");
  return this;
};

//sovrascrivi la funzione exec di una query mongoose introducendo la gestione della cache dei dati con redis
mongoose.Query.prototype.exec = async function () {
  //se la cache non è abilitata esegui subito la query
  if (!this.chacheEnabled) {
    console.log("Cache Redis disabilitata. Eseguo la query verso Mongo");
    return await exec.apply(this, arguments);
  }

  //la chiave della chache è la query + il contesto (collection)
  const key = JSON.stringify(
    Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name,
    })
  );
  //cerca in cache
  const cachedValues = await redisClient.hget(this.masterKey, key);
  //se trovo in cache i risultati di una query allora serializza i valori trovati nel object model di mongoose
  if (cachedValues) {
    console.log("Utilizzo query cache Redis");
    console.log(cachedValues);

    const parsedValues = JSON.parse(cachedValues);

    return Array.isArray(parsedValues)
      ? parsedValues.map((v) => new this.model(v))
      : new this.model(parsedValues);
  } else {
    console.log("Utilizzo accesso a Mongo + save in Redis");
  }

  //se non trovo i risultati in cache, esegui la query verso mongo e salva i dati in cache
  const result = await exec.apply(this, arguments);
  redisClient.hset(this.masterKey, key, JSON.stringify(result));
  return result;
};

module.exports = {
  clearCache: function (masterKey) {
    redisClient.del(JSON.stringify(masterKey));
  },
};
