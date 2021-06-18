console.log(require('dotenv').config());

async function runCalls() {
  const astraDoc = require("@astrajs/collections");

  let data;
  let response;

  console.log("Creating Document client");
  const docClient = await astraDoc.createClient({
    astraDatabaseId: process.env.ASTRA_DB_ID,
    astraDatabaseRegion: process.env.ASTRA_DB_REGION,
    authToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
  });

  cavemenCollection = docClient.namespace("serverless").collection("cavemen");

  // Document API

  // create a new user without a document id
  console.log("\n--- Create Fred ---");
  response = await cavemenCollection.create({
    firstname: "Fred",
    lastname: "Flintstone",
  });
  console.log(response);

  console.log("\n--- Create Barney with a specific document id ---");
  response = await cavemenCollection.create("BarneyRubble", {
    firstname: "Barney",
    lastname: "Rubble",
  });
  console.log(response);

  // search a collection of documents
  console.log("\n--- Search for Fred ---");
  response = await cavemenCollection.find( {
    firstname: { $eq: "Fred" }
  });
  console.log(response)

  // get a single user by document id
  console.log("\n--- Get a specific document ---");
  response = await cavemenCollection.get("BarneyRubble");
  console.log(response);

  // get a subdocument by path
  console.log("\n--- Get a sub document ---");
  response = await cavemenCollection.get("BarneyRubble/firstname");
  console.log(response);

  // create a user subdocument
  console.log("\n--- Create a sub document ---");
  await cavemenCollection.update("BarneyRubble/addresses/home", {
    city: "Stone City",
  });
  console.log(response);

  // partially update user
  console.log("\n--- Update a document ---");
  response = await cavemenCollection.update("BarneyRubble", {
    occupation: "Fred's Friend",
  });
  console.log(response);

  console.log("\n--- Show updated Barney ---");
  response = await cavemenCollection.get("BarneyRubble");
  console.log(response);

  // delete a user subdocument
  console.log("\n--- Delete a subdocument and show ---");
  response = await cavemenCollection.delete("BarneyRubble/addresses");
  response = await cavemenCollection.get("BarneyRubble");
  console.log(response);

  // delete a user
  console.log("\n--- Delete a document ---");
  response = await cavemenCollection.delete("BarneyRubble");
  console.log(response);

}

runCalls();
