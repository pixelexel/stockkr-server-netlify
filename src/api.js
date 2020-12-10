const express = require("express");
const app = express();
const router = express.Router();
const cors = require("cors");
const axios = require("axios");
const { response } = require("express");
const serverless = require("serverless-http");

app.use(cors());
app.options("*", cors());
app.use(express.json());

const TIINGO_TOKEN = process.env.TIINGO_KEY; // Your Tiingo key
const NEWS_TOKEN = process.env.NEWS_API_KEY; //Your News API key

router.get("/autocomplete", (req, res) => {
  query = req.query.search;
  if (query) {
    axios
      .get(
        "https://api.tiingo.com/tiingo/utilities/search?query=" +
          query +
          "&token=" +
          TIINGO_TOKEN
      )
      .then(function (response) {
        const tickers_name = response.data.map(({ ticker, name }) => ({
          ticker,
          name,
        }));
        res.json(tickers_name);
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    axios
      .get(
        "https://api.tiingo.com/tiingo/utilities/search?query=" +
          query +
          "&token=" +
          TIINGO_TOKEN
      )
      .then(function (response) {
        const tickers_name = {};
        res.json(tickers_name);
      })
      .catch(function (error) {
        console.log(error);
      });
  }
});

// router.post("/api/stocklist", (req, res) => {
//   var stockList = [];
//   for (var i = 0; i < req.body.length; i++) {
//     ticker = req.body[i];
//     axios
//       .all([
//         axios.get(
//           "https://api.tiingo.com/tiingo/daily/" +
//             ticker +
//             "?token=" +
//             TIINGO_TOKEN
//         ),
//         axios.get(
//           "https://api.tiingo.com/iex/?tickers=" +
//             ticker +
//             "&token=" +
//             TIINGO_TOKEN
//         ),
//       ])
//       .then(
//         axios.spread((desc, lastPrice) => {
//           var stock = {
//             ...desc.data,
//             ...lastPrice.data[0],
//           };
//           stockList.push(stock);

//           if (stockList.length === req.body.length) {
//             res.json(stockList);
//           }
//         })
//       )
//       .catch(function (error) {
//         console.log(error);
//       });
//   }
// });

router.get("/stocklist", (req, res) => {
  var stockList = [];
  tickerList = req.query.ticker;

  if (!Array.isArray(tickerList)) {
    ticker = tickerList;
    axios
      .get("https://api.tiingo.com/iex/" + ticker + "?token=" + TIINGO_TOKEN)
      .then(function (response) {
        stockList.push(response.data[0]);
        res.json({ stocks: stockList });
      })
      .catch(function (error) {
        console.log(error);
      });
  } else {
    for (var i = 0; i < tickerList.length; i++) {
      ticker = tickerList[i];
      axios
        .get(
          "https://api.tiingo.com/iex/?tickers=" +
            ticker +
            "&token=" +
            TIINGO_TOKEN
        )
        .then((response) => {
          stockList.push(response.data[0]);
          if (stockList.length === tickerList.length) {
            res.json({ stocks: stockList });
          }
        })
        .catch(function (error) {
          console.log(error);
        });
    }
  }
});

router.get("/details", (req, res) => {
  ticker = req.query.ticker;
  axios
    .all([
      axios.get(
        "https://api.tiingo.com/tiingo/daily/" +
          ticker +
          "?token=" +
          TIINGO_TOKEN
      ),
      axios.get(
        "https://api.tiingo.com/iex/?tickers=" +
          ticker +
          "&token=" +
          TIINGO_TOKEN
      ),
    ])
    .then(
      axios.spread((desc, lastPrice) => {
        var stockDetails = {
          ...desc.data,
          ...lastPrice.data[0],
        };
        res.json(stockDetails);
      })
    )
    .catch(function (error) {
      res.json("Invalid ticker symbol");
      console.log(error);
    });
});

router.get("/news", (req, res) => {
  ticker = req.query.ticker;
  axios
    .get(
      "https://newsapi.org/v2/everything?apiKey=" + NEWS_TOKEN + "&q=" + ticker
    )
    .then(function (response) {
      res.json(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
});

router.get("/charts_daily", (req, res) => {
  date = req.query.date.slice(0, 10);
  //console.log(date);
  ticker = req.query.ticker;
  axios
    .get(
      "https://api.tiingo.com/iex/" +
        ticker +
        "/prices?startDate=" +
        date +
        "&resampleFreq=4min&token=" +
        TIINGO_TOKEN
    )
    .then(function (response) {
      res.json(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
});

router.get("/charts2", (req, res) => {
  let today = new Date();
  today.setFullYear(today.getFullYear() - 2);
  date = today.toISOString().slice(0, 10);
  console.log(date);
  // date = req.query.date;
  ticker = req.query.ticker;
  console.log(ticker);

  axios
    .get(
      "https://api.tiingo.com/iex/" +
        ticker +
        "/prices?startDate=" +
        date +
        "&resampleFreq=12hour&token=" +
        TIINGO_TOKEN +
        "&columns=open,high,low,close,volume"
    )
    .then(function (response) {
      res.json(response.data);
    })
    .catch(function (error) {
      console.log(error);
    });
});

router.get("*", (req, res) => {
  res.sendFile("../dist/index.html");
});

//Netflify, express -> netlify lambda
app.use("/.netlify/functions/api", router);
module.exports.handler = serverless(app);
