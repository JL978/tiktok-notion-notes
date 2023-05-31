// bAsic express server
const express = require('express');
const cors = require('cors');

require('dotenv').config();

const app = express();
const server = require('http').Server(app);
const port = process.env.PORT || "8080";

app.use(express.json());
app.use(cors())

const { Client } = require('@notionhq/client');

const client = new Client({ auth: process.env.NOTION_ACCESS_TOKEN });

const databaseId = "98d27aa51b2b4d668777b3998b3652a6";

app.get('/db', async (req, res) => {
  const response = await client.databases.retrieve({
    database_id: databaseId,
  });
  res.send(response);
});

app.get('/queryDb', async (req, res) => {
  const { url } = req.query;
  
  const response = await client.databases.query({
    database_id: databaseId,
    filter: {
      property: 'url',
      url: {
        equals: url
      }
    }
  });

  res.send(response);
})

app.post("/addToDb", async (req, res) => {
  const { url, title } = req.body;

  if (!url) {
    res.status(400).send("No url provided");
  }

  const response = await client.pages.create({
    parent: {
      database_id: databaseId,
    },
    properties: {
      Name: {
        title: [
          {
            text: {
              content: title || ""
            }
          }
        ]
      },
      url: {
        url: url || ""
      },
      Tags: {
        multi_select: []
      },
      Notes: {
        rich_text: [{
          text: {
            content: ""
          }
        }]
      }
    }
  });

  res.send(response);
})


app.post("/updateDb", async (req, res) => {
  const { pageId, tags, notes } = req.body;

  if (!pageId) {
    res.status(400).send("No pageId provided");
  }

  const response = await client.pages.update({
    page_id: pageId,
    properties: {
      Tags: {
        multi_select: tags || []
      },
      Notes: {
        rich_text: [{
          text: {
            content: notes || ""
          }
        }] 
      }
    }
  });

  res.send(response);
})

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
