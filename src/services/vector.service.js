const { Pinecone } = require("@pinecone-database/pinecone");
require("dotenv").config();

const pc = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const index = pc.Index(process.env.PINECONE_INDEX_NAME);

async function createMemory({ vectors, metadata, messageId }) {
  await index.upsert({
    records: [
      {
        id: messageId,
        values: vectors,
        metadata,
      },
    ],
  });
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  const data = await index.query({
    vector: queryVector,
    topK: limit,
    filter: metadata,
    includeMetadata: true,
  });
  return data.matches;
}

module.exports = { createMemory, queryMemory };
