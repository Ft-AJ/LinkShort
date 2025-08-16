# 🎓 LinkShort ✂️

A student-built **URL shortener** that's simple, fast, and packed with features. Made while learning **Node.js**, **Express**, **MongoDB**, and **Redis**.

## ✨ Features

* 🔗 **Shorten Links** – Clean short links in seconds.
* 🎯 **Custom Aliases** – Create memorable short links (`/meme`, `/project`, etc.).
* 📏 **Configurable Token Length** – Choose your preferred short URL length.
* ⚡ **Caching with Redis** – Because waiting is for textbooks, not apps.
* 🛡️ **Rate Limiting** – Stops spammers from "over-submitting their homework."
  * Create URL: 20 requests/min per IP
  * Redirect: 600 requests/min per IP
* 🗄️ **MongoDB Storage** – Keeps track of shortened URLs.
* 🎨 **Frontend UI** – Minimal student-friendly interface (HTML/CSS/JS).
* 🔑 **Token Service** – Extra utility for future growth.

## 📂 Project Structure

```
LinkShort/
│   .env.example        # Environment variable template
│   .gitignore
│   package.json
│
├── api/
│   └── app.js          # Main Express app
├── client/
│   ├── index.html      # Simple frontend UI
│   ├── script.js
│   └── styles.css
├── controllers/
│   └── url.controller.js  # Core URL logic
├── lib/
│   └── redis.js        # Redis setup
├── middleware/
│   ├── rateLimit.js    # Rate limiting
│   └── url.middleware.js
├── models/
│   └── user.model.js   # MongoDB user model
├── routes/
│   └── user.route.js   # Routes
└── services/
    └── token.js        # Token utilities
```

## ⚙️ Installation & Setup

1. **Clone the repo**

```bash
git clone https://github.com/Ft-AJ/LinkShort.git
cd LinkShort
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**  
   Copy `.env.example` → `.env` and add your own values:

```env
MONGO_URI=your_mongo_connection_string
REDIS_URI=your_redis_connection_string
BASE_URL=your_localhost
```

4. **Run the server**

```bash
npm start
```

Server will start at: BASE_URL

## 🚀 Usage

* Visit the live app: [LinkShort](https://linkshort-ndgg.onrender.com)
* Paste a long URL → click shorten → get your mini link.
* Redis caches lookups for 60s = **faster redirects**.
* Too many requests? You'll meet the **HTTP 429 (too many requests)** wall 😅.

## 🛠️ Tech Stack

* **Backend** → Node.js, Express
* **Database** → MongoDB
* **Cache** → Redis
* **Middleware** → `rate-limiter-flexible`
* **Frontend** → HTML, CSS, JS
* **Deployment** → Render

## 📌 Future Student Goals

* User accounts with login
* Click analytics (see how many friends click your link 👀)

## 🤝 Contributing

Open to PRs & feedback — especially from other students/developers learning the same stack.

## 📜 License

MIT License. Free to use, free to remix.
