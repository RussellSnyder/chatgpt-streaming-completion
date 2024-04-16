import React, { useState } from "react";
import "./home.css";

const Stream = () => {
  const [inputValue, setInputValue] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [prompt, setPrompt] = useState("");
  const [jresult, setJresult] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!inputValue) {
      setError("Please enter a prompt");
      setPrompt("");
      setResult("");
      setJresult("");
      return;
    }

    try {
      // This controller will be used to cancel the fetch request when needed
      const controller = new AbortController();
      // Allows us to communicate and control to the fetch request
      const signal = controller.signal;

      const response = await fetch("/api/chatgpt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: inputValue }),
        signal: signal, // pass the abort signal
      });

      if (response.ok) {
        // read response incrementally
        const reader = response.body.getReader();
        let resultData = "";
        let jresultData = [];

        setPrompt(inputValue);
        setResult(resultData);
        setInputValue("");
        setError("");

        let readerDone = false;
        while (!readerDone) {
          // The value property of the reader object is a promise that resolves with the next chunk of data
          // the done property is a promise that resolves to true when the stream is finished
          const { value, done } = await reader.read();

          if (done) {
            readerDone = true;
            break;
          }

          let chunk = new TextDecoder("utf-8").decode(value);
          chunk = chunk
            .replaceAll('{"event": "done"}', "")
            .replaceAll("data: [DONE]", "")
            .replace(/\}\s*data:\s*\{/g, "}{")
            .replace(/^data: /, "")
            .replaceAll("}{", "},{");

          chunk = `[${chunk}]`;
          chunk = JSON.parse(chunk);
          let text = "";

          chunk.forEach((element) => {
            const choices = element.choices;
            if (choices && choices.length > 0) {
              text += choices[0].text;
            }
          });

          resultData += text;
          setResult((prevResult) =>
            (prevResult + text).replaceAll("\n\n", "\n")
          );

          jresultData.push(chunk);
          setJresult(JSON.stringify(jresultData, null, 2));
        }
      } else {
        throw new Error("Something went wrong");
      }
    } catch (error) {
      console.log(error);
      setResult("");
      setError("Something went wrong");
    }
  };
  return (
    <div className="container">
      <form className="form-horizontal" onSubmit={handleSubmit}>
        <div className="row form-group mt-2">
          <div className="col-sm-10">
            <div className="form-floating">
              <textarea
                className="form-control custom-input"
                id="floatingInput"
                placeholder="Enter a prompt"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
              <label htmlFor="floatingInput">input</label>
            </div>
          </div>
          <div className="col-sm-2 mt-2">
            <button className="btn btn-primary custom-button" type="submit">
              Submit
            </button>
          </div>
        </div>
      </form>
      {error && <div className="alert alert-danger mt-3">{error}</div>}
      {prompt && <div className="alert alert-secondary mt-3">{prompt}</div>}
      {result && (
        <div
          className="alert alert-success mt-3"
          style={{ whiteSpace: "pre-line" }}
          dangerouslySetInnerHTML={{ __html: result }}
        ></div>
      )}
      {jresult && (
        <pre className="alert alert-info mt-3">
          <code>{jresult}</code>
        </pre>
      )}
    </div>
  );
};

export default Stream;
