//import modules: express, dotenv
const express = require("express");
const dotenv = require("dotenv");
const app = express();
const { EventEmitter } = require("events");

//accept json data in requests
app.use(express.json());

//setup environment variables
dotenv.config();

//OpenAIApi Configuration
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
//build openai instance using OpenAIApi
const openai = new OpenAIApi(configuration);

// Create an EventEmitter for sending stream data
const completionEmitter = new EventEmitter();

//build the runCompletion which sends a request to the OPENAI Completion API
async function startCompletionStream(prompt) {
  const response = await openai.createCompletion(
    {
      model: "gpt-3.5-turbo-instruct",
      prompt: prompt,
      temperature: 1,
      max_tokens: 50,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
      stream: true,
    },
    {
      responseType: "stream",
    }
  );

  response.data.on("data", (data) => {
    const message = data
      .toString()
      .replace(/^data: /, "")
      .trim();

    if (message.startsWith("data")) {
      // console.error("message should not start with 'data'");
    }

    if (message !== "[DONE]") {
      completionEmitter.emit("data", message);
    } else {
      completionEmitter.emit("done"); // Notify that the stream is done
    }
  });
}

//post request to /api/chatgpt
app.post("/api/chatgpt", async (req, res) => {
  try {
    //extract the text from the request body
    const { text } = req.body;

    // Pass the request text to the runCompletion function
    startCompletionStream(text);

    const dataListener = (data) => {
      res.write(data);
    };

    const doneListener = () => {
      res.write('{"event": "done"}');
      res.end();
      // delete the listeners
      completionEmitter.off("data", dataListener);
      completionEmitter.off("done", doneListener);
    };
    // Listen to events from the completionEmitter
    completionEmitter.on("data", dataListener);
    completionEmitter.on("done", doneListener);
  } catch (error) {
    //handle the error in the catch statement
    if (error.response) {
      console.error(error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else {
      console.error("Error with OPENAI API request:", error.message);
      res.status(500).json({
        error: {
          message: "An error occured during your request.",
        },
      });
    }
  }
});

//set the PORT
const PORT = process.env.SERVER_PORT || 5001;

//start the server on the chosen PORT
app.listen(PORT, console.log(`Server started on port ${PORT}`));
