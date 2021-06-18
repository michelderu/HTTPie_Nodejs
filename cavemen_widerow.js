const restBasePath = "/api/rest/v2/keyspaces/workshop/";
const restSchemaPath = "/api/rest/v2/schemas/keyspaces/workshop/tables/";

console.log(require('dotenv').config());

async function runCalls() {
  const astraRest = require("@astrajs/rest");

  let response;

  console.log("Creating REST client");
  const astraClient = await astraRest.createClient({
    astraDatabaseId: process.env.ASTRA_DB_ID,
    astraDatabaseRegion: process.env.ASTRA_DB_REGION,
    authToken: process.env.ASTRA_DB_APPLICATION_TOKEN,
  });

  // REST API

  // List my tables
  console.log("\n--- List all tables ---");
  response = await astraClient.get(restSchemaPath);
  console.log("GET " + restSchemaPath);
  console.log(response);


  // Delete cavemen if it exists
  console.log("\n--- Delete cavemen table ---");
  try {
    response = await astraClient.delete(restSchemaPath + "cavemen");
    console.log("DELETE " + restSchemaPath);
    console.log(response);
  } catch {
    console.log("No cavemen found, not deleting table");
  }

  // Create the cavemen table
  console.log("\n--- Create cavemen table ---");
  response = await astraClient.post(restSchemaPath, {
    name: "cavemen",
    columnDefinitions: [
      {
        name: "firstname",
        typeDefinition: "text",
        static: false,
      },
      {
        name: "lastname",
        typeDefinition: "text",
        static: false,
      },
      {
        name: "occupation",
        typeDefinition: "text",
      },
    ],
    primaryKey: {
      partitionKey: ["lastname"],
      clusteringKey: ["firstname"],
    },
  });
  console.log("POST " + restSchemaPath);
  console.log(response);

  // Add some data
  console.log("\n--- Add Fred ---");
  response = await astraClient.post(restBasePath + "cavemen", {
    firstname: "Fred",
    lastname: "Flintstone",
  });
  if (response.status == 201) {
    console.log("Created Fred in the cavemen collection");
  }

  // Add some data
  console.log("\n--- Add Barney ---");
  response = await astraClient.post(restBasePath + "cavemen", {
    firstname: "Barney",
    lastname: "Rubble",
  });
  if (response.status == 201) {
    console.log("Created Barney in the cavemen collection");
  }

  // Check table
  console.log("\n--- Get all data from table ---");
  response = await astraClient.get(restBasePath + "cavemen/rows");
  console.log("GET " + restBasePath + "cavemen/rows");
  console.log(response);

  // Now let's query the table using a filter
  console.log("\n--- Query the table ---");
  query = '{"lastname":{"$in":["Flintstone"]}}';
  response = await astraClient.get(restBasePath + "cavemen?where=" + query);
  console.log("GET " + restBasePath + "cavemen?where=" + query);
  console.log(response);
  
}

runCalls();
