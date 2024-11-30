const { PineconeClient } = require("@pinecone-database/pinecone");
const { Configuration, OpenAIApi } = require("openai");

exports.handler = async function (event, context) {
  try {
    const pinecone = new PineconeClient();
    await pinecone.init({
      apiKey: process.env.PINECONE_API_KEY,
      environment: process.env.PINECONE_ENVIRONMENT,
    });

    const index = pinecone.Index(process.env.PINECONE_INDEX_NAME);

    const pineconeResults = await index.query({
      vector: Array(1024).fill(0.5),
      topK: 3,
      includeMetadata: true,
    });

    const configuration = new Configuration({
      apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);

    const prompt = `Summarize this: ${JSON.stringify(pineconeResults)}`;
    const openAIResponse = await openai.createCompletion({
      model: "text-davinci-003",
      prompt,
      max_tokens: 150,
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        pineconeResults,
        openAIResponse: openAIResponse.data.choices[0].text,
      }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
