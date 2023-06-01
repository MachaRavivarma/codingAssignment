const express = require("express");
const app = express();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
app.use(express.json());
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const dbPath = path.join(__dirname, "twitterClone.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http:/localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error ${e.message}`);
  }
};

initializeDBAndServer();

const authenticateToken = (request, response, next) => {
  const { tweet } = request.body;
  const { tweetId } = request.params;
  let jwtToken;
  const authHeader = request.headers["authorization"];
  if (authHeader !== undefined) {
    jwtToken = authHeader.split(" ")[1];
  }
  if (jwtToken === undefined) {
    response.status(401);
    response.send("Invalid JWT Token");
  } else {
    jwt.verify(jwtToken, "MY_SECRET_TOKEN", async (error, payload) => {
      if (error) {
        response.status(401);
        response.send("Invalid JWT Token");
      } else {
        request.payload = payload;
        request.tweetId = tweetId;
        request.tweet = tweet;
        next();
      }
    });
  }
};

app.post("/register/", async (request, response) => {
  const { username, name, password, gender } = request.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  const userData = await db.get(checkTheUsername);
  if (userData === undefined) {
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      let postNewUserQuery = `
            INSERT INTO
            user (name, username, password, gender)
            VALUES (
                '${name}',
                '${username}',
                '${hashedPassword}',
                '${gender}');`;
      await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const selectUserQuery = `SELECT * FROM user WHERE username = '${username}'`;
  const dbUser = await db.get(selectUserQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const tweetsQuery = `
    SELECT
    username, tweet, date_time AS dateTime
    FROM
    follower
    INNER JOIN tweet
    ON follower.following_user_id = tweet.user_id
    INNER JOIN user
    ON user.user_id = follower.following_user_id
    WHERE
    follower.follower_user_id = ${user_id}
    ORDER BY
    date_time DESC
    LIMIT 4;`;
  const apiThreeD = await db.all(tweetsQuery);
  response.send(apiThreeD);
});

app.get("/user/following/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const apiFour = `SELECT name FROM user INNER JOIN follower ON user.user_id = follower.following_user_id WHERE follower.follower_user_id = ${user_d};`;
  const apiFourD = await db.all(apiFour);
  response.send(apiFourD);
});

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const apiFive = `SELECT name FROM user INNER JOIN follower ON user.user_id = follower.follower_user_id WHERE follower.following_user_id = ${user_d};`;
  const apiFiveD = await db.all(apiFive);
  response.send(apiFiveD);
});

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const { tweetId } = request.params;
  const apiSix = `SELECT * FROM tweet WHERE tweet_id = ${tweetId};`;
  const apiSixD = await db.get(apiSix);
  const apiSixTwo = `SELECT * FROM follower INNER JOIN user ON user.user_id = follower.following_user_id WHERE follower.follower_user_id = ${user_d};`;
  const apiSixTwoD = await db.all(apiSixTwo);
  if (
    apiSixTwoD.some((item) => item.following_user_id === tweetsResult.user_id)
  ) {
    const getTweetDetailsQuery = `
      SELECT 
        tweet,
        COUNT(DISTINCT(like.like_id)) AS likes,
        COUNT(DISTINCT(reply.reply_id)) AS replies,
        tweet.date_time As dateTime
    From
        tweet INNER JOIN like ON tweet.tweet_id = like.tweet_id INNER JOIN reply ON reply.tweet_id = tweet.tweet_id
    WHERE 
        tweet.tweet_id = ${tweetId} AND tweet.user_id = ${userFollowers[0].user_id}
      `;
    const tweetDetails = await db.get(getTweetDetailsQuery);
    response.send(tweetDetails);
  } else {
    response.status(401);
    response.send("Invalid Request");
  }
});

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    const { payload } = request;
    const { user_id, name, username, gender } = payload;
    const { tweetId } = request.params;
    const apiSeven = `SELECT * FROM follower INNER JOIN tweet ON  tweet.user_id = follower.following_user_id INNER JOIN like ON like.tweet_id = tweet.tweet_id
    INNER JOIN user ON user.user_id = like.user_id WHERE tweet.tweet_id = ${tweetId} AND follower.follower_user_id = ${user_id};`;
    const apiSevenD = await db.all(apiSeven);
    if (apiSevenD.length !== 0) {
      let likes = [];
      const getNamesArray = (apiSevenD) => {
        for (let item of apiSevenD) {
          likes.push(item.username);
        }
      };
      getNamesArray(apiSevenD);
      response.send({ likes });
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    const { payload } = request;
    const { user_id, name, username, gender } = payload;
    const { tweetId } = request.params;
    const apiEight = `SELECT * FROM follower INNER JOIN tweet ON tweet.user_id = follower.following_user_id INNER JOIN reply ON reply.tweet_id = tweet.tweet_id
    INNER JOIN user ON user.user.user_id = reply.user_id WHERE tweet.tweet_id = ${tweetId} AND  follower.follower_user_id = ${user_id};`;
    const apiEightD = await db.all(apiEight);
    if (apiEightD.length !== 0) {
      let replies = [];
      const getNamesArray = (apiEightD) => {
        for (let item of apiEightD) {
          let object = {
            name: item.name,
            reply: item.reply,
          };
          replies.push(object);
        }
      };
      getNamesArray(apiEightD);
      response.send({ replies });
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const apiNine = `
  SELECT
        tweet.tweet AS tweet,
         COUNT(DISTINCT(like.like_id)) AS likes,
        COUNT(DISTINCT(reply.reply_id)) AS replies,
        tweet.date_time As dateTime
    FROM user INNER JOIN tweet ON user.user_id = tweet.user_id INNER JOIN like ON like.tweet_id = tweet.tweet_id INNER JOIN reply ON reply.tweet_id = tweet.tweet_id WHERE user.user_id = ${user_id} GROUP BY tweet.tweet_id;`;
  const apiNineD = await db.all(apiNine);
  response.send(apiNineD);
});

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { payload } = request;
  const { user_id, name, username, gender } = payload;
  const { tweet } = request.body;
  const { tweetId } = request.params;
  const apiTen = `INSERT  INTO tweet(tweet, user_id) VALUES ('${tweet}','${user_id}')  WHERE tweet_id = ${tweet_id};`;
  const apiTenD = await db.run(apiTen);
  response.send("Created a Tweet");
});

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { payload } = request;
    const { user_id, name, username, gender } = payload;
    const { tweetId } = request.params;
    const selectedQuery = `SELECT * FROM tweet WHERE tweet.user_id = ${user_id} AND tweet.tweet_id = ${tweet_id};`;
    const tweetUser = await db.all(selectedQuery);
    if (tweetUser.length !== 0) {
      const apiEleven = `DELETE FROM tweet WHERE tweet_id = ${tweetId} AND tweet.user_id = ${user_id};`;
      await db.run(apiEleven);
      response.send("Tweet Removed");
    } else {
      response.status(401);
      response.send("Invalid Request");
    }
  }
);

module.exports = app;
