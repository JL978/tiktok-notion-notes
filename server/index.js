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

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
