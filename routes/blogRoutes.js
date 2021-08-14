const mongoose = require("mongoose");
const requireLogin = require("../middlewares/requireLogin");
const redis = require("redis");
const util = require("util");

const Blog = mongoose.model("Blog");

//***********gestione cache con redis**************
const redisUrl = "redis://localhost:6379";
const redisClient = redis.createClient(redisUrl);
redisClient.get = util.promisify(redisClient.get);

module.exports = (app) => {
  app.get("/api/blogs/:id", requireLogin, async (req, res) => {
    const blog = await Blog.findOne({
      _user: req.user.id,
      _id: req.params.id,
    });

    res.send(blog);
  });

  app.get("/api/blogs", requireLogin, async (req, res) => {
    //***********gestione cache con redis**************
    const blogsCached = await redisClient.get(req.user.id);

    if (blogsCached) {
      console.log(`blogs trovati in cache per user-id: ${req.user.id}`);
      return res.send(JSON.parse(blogsCached));
    } else {
      console.log(`blogs trovati in mongo per user-id: ${req.user.id}`);
    }

    const blogs = await Blog.find({ _user: req.user.id });
    res.send(blogs);

    if (blogs) {
      //redisClient.set(req.user.id, JSON.stringify(blogs), "EX", 10); //expire dopo 10 secondi ell'entry in cache
      redisClient.set(req.user.id, JSON.stringify(blogs));
    }
  });

  app.post("/api/blogs", requireLogin, async (req, res) => {
    const { title, content } = req.body;

    const blog = new Blog({
      title,
      content,
      _user: req.user.id,
    });

    try {
      await blog.save();
      res.send(blog);

      //***********gestione cache con redis**************
      //se arrivo qui allora resetto la cache in modo da forzare un recupero con dei valori più aggiornati
      redisClient.del(req.user.id);
    } catch (err) {
      res.send(400, err);
    }
  });
};
