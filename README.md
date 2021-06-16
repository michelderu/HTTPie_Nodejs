# Accessing Astra using HTTPie and @astrajs
* Jump to REST
* Jump to GraphQL
* Jump to Document
* Jump to @astrajs

## Configuration
See `.env` and `~/.config/httpie/config.json`.
For a new Astra database run `./env.sh`.

## REST
### Get keyspaces
```sh
http :/rest/v1/keyspaces
```
### Create table
```sh
http POST :/rest/v2/schemas/keyspaces/workshop/tables json:='{
  "name": "cavemen",
  "ifNotExists": false,
  "columnDefinitions": [
    {
      "name": "firstname",
      "typeDefinition": "text",
      "static": false
    },
    {
      "name": "lastname",
      "typeDefinition": "text",
      "static": false
    },
        {
          "name": "occupation",
          "typeDefinition": "text"
        }
  ],
  "primaryKey": {
    "partitionKey": [
      "lastname"
    ],
    "clusteringKey": [
      "firstname"
    ]
  }'
```
### Get all tables
```sh
http :/rest/v2/schemas/keyspaces/workshop/tables
```
### Load some data
```sh
http POST :/rest/v2/keyspaces/workshop/cavemen json:='
{
            "firstname" : "Fred",
            "lastname": "Flintstone"
}'
http POST :/rest/v2/keyspaces/workshop/cavemen json:='
{
            "firstname" : "Barney",
            "lastname": "Rubble"
}'
```
### Retrieve data
```sh
http :/rest/v2/keyspaces/workshop/cavemen where=='{"lastname":{"$in":["Rubble","Flintstone"]}}' -vvv
```
### Update rows
```sh
http PUT :/rest/v2/keyspaces/workshop/cavemen/Flintstone/Fred json:='
{ "occupation": "Quarry Screamer"}'
```
### Retrieve data
```sh
http :/rest/v2/keyspaces/workshop/cavemen where=='{"lastname":{"$in":["Rubble","Flintstone"]}}' -vvv
```
### Delete data
```sh
http DELETE :/rest/v2/keyspaces/workshop/cavemen/Rubble/Barney
```
### Delete the table
```sh
http DELETE :/rest/v2/schemas/keyspaces/workshop/tables/cavemen
```
## GraphQL
### Create a table
```sh
http POST :/graphql-schema query='
mutation createTables {
    cavemen: createTable(
        keyspaceName: "workshop", 
        tableName: "cavemen", 
        partitionKeys: 
            [{name: "lastname", type: {basic: TEXT}}], 
        clusteringKeys: 
            [{name: "firstname", type: {basic: TEXT}}],
        values: [
            { name: "occupation", type: {basic: TEXT} }
        ]
)}'
```
### Add some rows
```sh
http POST :/graphql/workshop query='
mutation insertcavemen {
  barney: insertcavemen(value: {firstname:"Barney", lastname: "Rubble"}) {
    value {
      firstname
    }
  }
}'
http POST :/graphql/workshop query='
mutation insertcavemen {
  fred: insertcavemen(value: {firstname:"Fred", lastname: "Flintstone"}) {
    value {
      firstname
    }
  }
}'
```
### Retrieve some data
```sh
http POST :/graphql/workshop query='
query getCaveman {
    cavemen (value: {lastname:"Rubble"}) {
      values {
          lastname
      }
    }
}'
```
### Update data
```sh
http POST :/graphql/workshop query='
mutation updatecavemen {
  fred: updatecavemen(value: {firstname:"Fred", lastname:"Flintstone", occupation:"Quarry Screamer"}, ifExists: true ) {
    value {
      firstname
    }
  }
}'
```
### Show updated data
```sh
http POST :/graphql/workshop query='
    query cavemen {
    cavemen(filter: {lastname: {in: ["Rubble", "Flintstone"]}}) {
    values {firstname
    lastname
    occupation}
}}'
```
### Delete data
```sh
http POST :/graphql/workshop query='
mutation deletecavemen {
  barney: deletecavemen(value: {firstname:"Barney",lastname:"Rubble"}, ifExists: true ) {
    value {
      firstname
    }
  }
}'
```
### Check data is gone
```sh
http POST :/graphql/workshop query='
mutation deletecavemen {
  barney: deletecavemen(value: {firstname:"Barney",lastname:"Rubble"}, ifExists: true ) {
    value {
      firstname
    }
  }
}'
```
## Document API
### Check namespaces
```sh
http :/rest/v2/schemas/namespaces | jq ".data[].name"
```
### Write a document
```sh
http POST :/rest/v2/namespaces/KS/collections/cavemen json:='{"firstname": "Fred", "lastname": "Flintstone"}'
```
### Write a document with a specific docid
```sh
http PUT :/rest/v2/namespaces/KS/collections/cavemen/BarneyRubble json:='{"firstname": "Barney", "lastname": "Rubble"}'
```
### Retrieve data
```sh
http :/rest/v2/namespaces/KS/collections/cavemen page-size==5
```
### Get a document
```sh
http :/rest/v2/namespaces/KS/collections/cavemen page-size==5
```
### Search for a document
```sh
http GET :/rest/v2/namespaces/KS/collections/cavemen where=='{"firstname" { $eq: "Fred’}}'
```
### Get a subdocument
```sh
http :/rest/v2/namespaces/KS/collections/cavemen/BarneyRubble/firstname
```
### Update a document
```sh
http :/rest/v2/namespaces/KS/collections/cavemen where=='{"firstname": { "$eq": "Fred"}}'

export DOCUMENT_ID=<copy-the-document-id>

http PATCH :/rest/v2/namespaces/KS/collections/cavemen/$DOCUMENT_ID json:='{"firstname":"Fred","lastname":"flintstone","occupation":"Quarry Screamer"}'
```
### Check the document
```sh
http GET :/rest/v2/namespaces/KS/collections/cavemen/$DOCUMENT_ID
```
### Delete a document
```sh
http DELETE :/rest/v2/namespaces/KS/collections/cavemen/BarneyRubble
```
### Delete the collection
```sh
http DELETE :/rest/v2/namespaces/KS/collections/cavemen
```
## @astrajs
### First install the libraries for Node.js
```sh
npm install @astrajs/collections @astrajs/rest@0.0.12 sleep dotenv
```
### Grab the caveman.js file
```sh
wget https://raw.githubusercontent.com/synedra-datastax/ExploringStargate/main/cavemen.js
```
### Make sure the environment settings are correct
Check the `.env` file for correct settings, else re-run `sh ./env.sh` and provide information from the Astra Connect tab.
### Run cavemen
```sh
node cavemen.js
```