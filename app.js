const express = require("express");
const app = express();

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

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
    console.log(e.message);
  }
};

initializeDBAndServer();

const convertUserDbObjectToResponsiveDbObject = (dbObject) => {
  return {
    userId: dbObject.user_id,
    name: dbObject.name,
    username: dbObject.username,
    password: dbObject.password,
    gender: dbObject.gender,
  };
};
const convertFollowerDbObjectToResponsiveDbObject = (dbObject) => {
  return {
    followerId: dbObject.follower_id,
    followerUserId: dbObject.follower_user_id,
    followingUserId: dbObject.following_user_id,
  };
};
const convertTweetDbObjectToResponsiveDbObject = (dbObject) => {
  return {
    tweetId: dbObject.tweet_id,
    tweet: dbObject.tweet,
    userId: dbObject.user_id,
    dateTime: dbObject.date_time,
  };
};
const convertReplayDbObjectToResponsiveDbObject = (dbObject) => {
  return {
    tweetId: dbObject.tweet_id,
    reply: dbObject.reply,
    userId: dbObject.user_id,
    dateTime: dbObject.date_time,
    replyId: dbObject.reply_id,
  };
};
const convertLikeDbObjectToResponsiveDbObject = (dbObject) => {
  return {
    tweetId: dbObject.tweet_id,
    userId: dbObject.user_id,
    dateTime: dbObject.date_time,
    likeId: dbObject.like_id,
  };
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
    let postNewUserQuery = `
            INSERT INTO
            user (username,name,password,gender)
            VALUES (
                '${username}',
                '${name}',
                '${hashedPassword}',
                '${gender}');`;
    if (password.length < 6) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const newUserDetails = await db.run(postNewUserQuery);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

const authenticateToken = (request, response, next) => {
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
        request.username = payload.username;
        next();
      }
    });
  }
};

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
      const payload = { username: username };
      const jwtToken = jwt.sign(payload, "MY_SECRET_TOKEN");
      response.send({ jwtToken });
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.get("/user/tweets/feed/", authenticateToken, async (request, response) => {
  const tweetsQuery = `
    SELECT
    user.username, tweet.tweet, tweet.date_time AS dateTime
    FROM
    follower
    INNER JOIN tweet
    ON follower.following_user_id = tweet.user_id
    INNER JOIN user
    ON tweet.user_id = user.user_id
    WHERE
    follower.follower_user_id = ${user.user_id}
    ORDER BY
    tweet.date_time DESC
    LIMIT 4;`;
  const apiThreeD = await db.all(apiThree);
  response.send(apiThreeD);
});

app.get("/user/following/", authenticateToken, async (request, response) => {
  const apiFour = `SELECT name FROM user INNER JOIN follower WHERE user_id = ${userId};`;
  const apiFourD = await db.all(apiFour);
  response.send(convertUserDbObjectToResponsiveDbObject(apiFourD));
});

app.get("/user/followers/", authenticateToken, async (request, response) => {
  const apiFive = `SELECT name FROM user INNER JOIN follower WHERE user_id = ${userId};`;
  const apiFiveD = await db.all(apiFive);
  response.send(convertUserDbObjectToResponsiveDbObject(apiFiveD));
});

app.get("/tweets/:tweetId/", authenticateToken, async (request, response) => {
  const { tweetId } = request.params;
  const apiSix = `SELECT * FROM tweet WHERE tweet_id = ${tweetId};`;
  const apiSixD = await db.get(apiSix);
  response.send(convertTweetDbObjectToResponsiveDbObject(apiSixD));
});

app.get(
  "/tweets/:tweetId/likes/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const apiSeven = `SELECT * FROM tweet INNER JOIN like.tweet_id = tweet.tweet_id WHERE tweet_id = ${tweetId};`;
    const apiSevenD = await db.get(apiSeven);
    response.send(convertLikeDbObjectToResponsiveDbObject(apiSevenD));
  }
);

app.get(
  "/tweets/:tweetId/replies/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const apiEight = `SELECT * FROM tweet INNER JOIN reply.tweet_id = tweet.tweet_id WHERE tweet_id = ${tweetId};`;
    const apiEightD = await db.get(apiEight);
    response.send(convertReplayDbObjectToResponsiveDbObject(apiEightD));
  }
);

app.get("/user/tweets/", authenticateToken, async (request, response) => {
  const apiNine = `SELECT * FROM user INNER JOIN tweet WHERE tweet_id = ${tweet_id};`;
  const apiNineD = await db.all(apiNine);
  response.send(convertTweetDbObjectToResponsiveDbObject(apiNineD));
});

app.post("/user/tweets/", authenticateToken, async (request, response) => {
  const { tweet } = request.body;
  const apiTen = `INSERT  INTO user(tweet) VALUES (tweet = "${tweet}")  WHERE tweet_id = ${tweet_id};`;
  const apiTenD = await db.run(apiTen);
  response.send("Created a Tweet");
});

app.delete(
  "/tweets/:tweetId/",
  authenticateToken,
  async (request, response) => {
    const { tweetId } = request.params;
    const apiEleven = `DELETE FROM tweet WHERE tweet_id = ${tweetId};`;
    await db.run(apiEleven);
    response.send("Tweet Removed");
  }
);

module.exports = app;
