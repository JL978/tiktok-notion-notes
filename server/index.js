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

app.get('/', async (req, res) => {
  const databaseId = "98d27aa51b2b4d668777b3998b3652a6";
  const response = await client.databases.retrieve({
    database_id: databaseId,
  });
  res.send(response);
});

server.listen(port, () => console.log(`Example app listening on port ${port}!`));
