
const express = require("express");
const fs = require("fs");
const path = require("path");
const session = require("express-session");

const app = express();
const PORT = 3000;

const USERNAME = "Admin";
const PASSWORD = "1234";

app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: "local-media-secret",
    resave: false,
    saveUninitialized: true,
  })
);

function requireLogin(req, res, next) {
  if (req.session.loggedIn) next();
  else res.redirect("/login");
}

app.get("/login", (req, res) => {
  res.send(`
    <h2>Local Media Server Login</h2>
    <form method="POST">
      <input name="username" placeholder="Username" required /><br><br>
      <input name="password" type="password" placeholder="Password" required /><br><br>
      <button>Login</button>
    </form>
  `);
});

app.post("/login", (req, res) => {
  if (req.body.username === USERNAME && req.body.password === PASSWORD) {
    req.session.loggedIn = true;
    res.redirect("/");
  } else {
    res.send("Invalid login");
  }
});

app.get("/", requireLogin, (req, res) => {
  const mediaDir = path.join(__dirname, "media");
  const files = fs.existsSync(mediaDir) ? fs.readdirSync(mediaDir) : [];

  res.send(`
    <h1>Local Media Server</h1>

    <h2>Local Videos</h2>
    <ul>
      ${files.map(f => `<li><a href="/watch/${f}">${f}</a></li>`).join("")}
    </ul>

    <h2>YouTube</h2>
    <form action="/youtube" method="GET">
      <input name="url" placeholder="Paste YouTube URL" size="40" required />
      <button>Play</button>
    </form>

    <br>
    <a href="/logout">Logout</a>
  `);
});

app.get("/watch/:file", requireLogin, (req, res) => {
  res.send(`
    <h2>${req.params.file}</h2>
    <video width="800" controls autoplay>
      <source src="/media/${req.params.file}">
    </video>
    <br><br>
    <a href="/">Back</a>
  `);
});

app.get("/media/:file", requireLogin, (req, res) => {
  res.sendFile(path.join(__dirname, "media", req.params.file));
});

app.get("/youtube", requireLogin, (req, res) => {
  const url = req.query.url || "";
  const match = url.match(/(youtu\.be\/|v=)([^&]+)/);
  const videoId = match ? match[2] : null;

  if (!videoId) {
    return res.send("Invalid YouTube URL <br><a href='/'>Back</a>");
  }

  res.send(`
    <h2>YouTube Player</h2>
    <iframe
      width="900"
      height="500"
      src="https://www.youtube.com/embed/${videoId}"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen>
    </iframe>
    <br><br>
    <a href="/">Back</a>
  `);
});

app.get("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/login"));
});

app.listen(PORT, () => {
  console.log(`Media server running at http://localhost:${PORT}`);
});
