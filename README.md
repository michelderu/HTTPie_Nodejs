# Accessing DataStax Astra using HTTPie and Node.js @astrajs
* Jump to [REST API](#rest)
* Jump to [GraphQL API](#graphql)
* Jump to [Document API](#document)
* Jump to [Node.js @astrajs](#nodejs)

## Prerequisites
Make sure to create a Cassandra database on [DataStax Astra](https://astra.datastax.com), a managed serverless cloud service for Cassandra.
Use the `datastax` as the database name and `workshop` as the keyspace name.

## Configuration
For a new Astra database run `sh ./env.sh` and provide connection details, this will create two files:
- A configuration file for use with HTTPie called `~/.astrarc`
- A configuration file for use with Node.js called `.env`

To make things easier with HTTPie, create a configuration file `~/.config/httpie/config.json` and add the following:
```json
{
    "default_options": [
      "--style=fruity",
      "--auth-type=astra",
      "--auth=holidays:"
    ]
}
```
This will tell HTTPie to use the `[holidays]` section from `~/.astrarc` for connectivity and authentication towards Astra.

## ① <a name="rest"></a> REST API
Let's get started with the REST API. The REST API allows you to interact with tables in Cassandra. The difference is, you don't have to have experience with the CQL query language now:
### Get keyspaces
```sh
http :/rest/v1/keyspaces
```
### Create table
Let's create a bucketlist table to store our Holiday Bucketlist ideas into:
```sh
http POST :/rest/v2/schemas/keyspaces/workshop/tables json:='
{
  "name": "bucketlist",
  "columnDefinitions": [
    {
      "name": "name",
      "typeDefinition": "text",
      "static": false
    },
    {
      "name": "city",
      "typeDefinition": "text"
    },
    {
      "name": "activities",
      "typeDefinition": "list<text>"
    }
  ],
  "primaryKey": {
    "partitionKey": [
      "name"
    ]
  }
}'
```
### Get all tables
```sh
http :/rest/v2/schemas/keyspaces/workshop/tables
```
### Load some data
```sh
http POST :/rest/v2/keyspaces/workshop/bucketlist json:='
{
  "name" : "Amsterdam siteseeing",
  "city": "Amsterdam",
  "activities": "[shopping, siteseeing]"
}'
http POST :/rest/v2/keyspaces/workshop/bucketlist json:='
{
  "name" : "Cornwall camping",
  "city": "Cornwall",
  "activities": "[hiking, swimming]"
}'
```
### Retrieve data on primary key
```sh
http :/rest/v2/keyspaces/workshop/bucketlist where=='{"name":{"$eq":["Amsterdam siteseeing"]}}'
```
### Create a secondary index
With Astra indexing at relational scale is possible 
```sh
http POST :/rest/v2/schemas/keyspaces/workshop/tables/bucketlist/indexes json:='
{
  "name": "city_idx",
  "column": "city",
  "type": "StorageAttachedIndex"
}'
```
### Retrieve data on secondary index
```sh
http :/rest/v2/keyspaces/workshop/bucketlist where=='{"city":{"$eq":["Cornwall"]}}'
```
### Update rows
```sh
http PUT :/rest/v2/keyspaces/workshop/bucketlist/Cornwall Camping json:='
{ "occupation": "Quarry Screamer"}'
```
### Retrieve data
```sh
http :/rest/v2/keyspaces/workshop/cavemen where=='{"lastname":{"$in":["Rubble","Flintstone"]}}'
```
### Delete data
```sh
http DELETE :/rest/v2/keyspaces/workshop/cavemen/Rubble/Barney
```
### Delete the table
```sh
http DELETE :/rest/v2/schemas/keyspaces/workshop/tables/cavemen
```
## ② <a name="graphql"></a> GraphQL API
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
Note how nicely we can insert nmultiple rows in one go:
```sh
http POST :/graphql/workshop query='
mutation insertData {
  cornwall: insertbucketlist(value: {name:"Cornwall camping", city: "Cornwall", activities: ["hiking", "swimming"]}) {
    value {
      name
    }
  }

  amsterdam: insertbucketlist(value: {name:"Amsterdam siteseeing", city: "Amsterdam", activities: ["shopping", "siteseeing"]}) {
    value {
      name
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
## ③ <a name="document"></a> Document API
The [Stargate.io](https://stargate.io) Document API allows you to use Cassandra as a Document Database. Some advantages:
- Schemaless way of working
- Ingest arbitrarily complex JSON document
- No modelling needed
- Flexible ad-hoc querying on any field or combination

As Stargate is part of [DataStax Astra](https://astra.datastax.com) the Document API is available by default on this manages serverless Cassandra offering as well.

The use-case we'll explore with the Document API is that of storing JSON data alongside with *provenance* and *lineage* information.

In order to make that happen we're going to use two concepts:
1. The design pattern called [Envelope pattern](http://www.xmlpatterns.com/EnvelopeMain.shtml)
2. The W3C recommendation called [Provenance Ontology](https://www.w3.org/Submission/prov-json/) using the [PROV-JSON Serialization](https://www.w3.org/Submission/prov-json/)

![PROV ontology](https://dvcs.w3.org/hg/prov/raw-file/default/ontology/diagrams/starting-points.svg)

Allowing Cassandra to store document data in combination with tracking Provenance and Lineage is very important in regulated verticals like Financial Services or Government organisations. It allows for formally documenting the origin, transformation and use-cases of data.

### Check namespaces
First let's check the namespaces in the database. We'll use the cli tool `jq` grab the namespaces out of the JSON structure:
```sh
http :/rest/v2/schemas/namespaces | jq ".data[].name"
```
### Write a document
The document we want to write is contains an address change for an account and looks as such:
```json
{
  "account": "NLABNA0123456789",
  "name": "Scrooge McDuck",
  "address": {
    "housenumber": 777,
    "street": "Pond Street",
    "city": "Duck City"
  }
}
```

Now, as we use schemaless JSON, it's easy to add [Provenance](https://dictionary.cambridge.org/dictionary/english/provenance) and [Lineage](https://dictionary.cambridge.org/dictionary/english/lineage) information to this.

Let's say we have the following information about this update:
- It was initiated through the self-service portal on a smartphone
- It was done on "2021-06-25T13:34:00"
- It was done by "Donald Duck"

Then, we could imagine a (simplified) PROV-JSON structure as such:
```json
{
  "activity": {
    "startTime": "2021-06-25T13:34:00",
    "system": "Smartphone app",
    "type": "Address change"
  },
  "agent": {
    "Donald Duck": {
      "prov:type": {
        "$": "prov:Person",
        "type": "xsd:QName"
      }
    },
    "Scrooge McDuck": {
      "prov:type": {
        "$": "prov:Person",
        "type": "xsd:QName"
      }
    }
  },
  "wasAttributedTo": {
    "editor": {
      "prov:type": "editor",
      "prov:agent": "Donald Duck",
    },
    "owner": {
      "prov:type": "owner",
      "prov:agent": "Scrooge McDuck",
    }
  }
}
```
Now putting it all together using the *envelope pattern*. Note that we'll use the container `instance` to store the entitity information and the container `provenance` to store the provenance and lineage for traceability reasons:
```json
{
  "instance": {
    "account": "NLABNA0123456789",
    "name": "Scrooge McDuck",
    "address": {
      "housenumber": 777,
      "street": "Pond Street",
      "city": "Duck City"
    }
  },
  "provenance": {
    "activity": {
      "startTime": "2021-06-25T13:34:00",
      "system": "Smartphone app",
      "type": "Address change"
    },
    "agent": {
      "Donald Duck": {
        "prov:type": {
          "$": "prov:Person",
          "type": "xsd:QName"
        }
      },
      "Scrooge McDuck": {
        "prov:type": {
          "$": "prov:Person",
          "type": "xsd:QName"
        }
      }
    },
    "wasAttributedTo": {
      "editor": {
        "prov:type": "editor",
        "prov:agent": "Donald Duck"
      },
      "owner": {
        "prov:type": "owner",
        "prov:agent": "Scrooge McDuck"
      }
    }
  }
}
```
Let's store this into Cassandra:
```sh
http POST :/rest/v2/namespaces/workshop/collections/accounts json:='{
  "instance": {
    "account": "NLABNA0123456789",
    "name": "Scrooge McDuck",
    "address": {
      "housenumber": 777,
      "street": "Pond Street",
      "city": "Duck City"
    }
  },
  "provenance": {
    "activity": {
      "startTime": "2021-06-25T13:34:00",
      "system": "Smartphone app",
      "type": "Address change"
    },
    "agent": {
      "Donald Duck": {
        "prov:type": {
          "$": "prov:Person",
          "type": "xsd:QName"
        }
      },
      "Scrooge McDuck": {
        "prov:type": {
          "$": "prov:Person",
          "type": "xsd:QName"
        }
      }
    },
    "wasAttributedTo": {
      "editor": {
        "prov:type": "editor",
        "prov:agent": "Donald Duck"
      },
      "owner": {
        "prov:type": "owner",
        "prov:agent": "Scrooge McDuck"
      }
    }
  }
}'
```
### Write a document with a specific docid
```sh
http PUT :/rest/v2/namespaces/workshop/collections/customers/Scrooge json:='{"firstname": "Scrooge", "lastname": "McDuck", "type": "owner"}'
```
and
```sh
http PUT :/rest/v2/namespaces/workshop/collections/customers/Donald json:='{"firstname": "Donald", "lastname": "Duck", "type": "editor"}'
```
### Retrieve data
```sh
http :/rest/v2/namespaces/workshop/collections/customers page-size==5
```
### Get a specific document
```sh
http :/rest/v2/namespaces/workshop/collections/customers/Scrooge page-size==5
```
### Search for a document
```sh
http GET :/rest/v2/namespaces/workshop/collections/customers where=='{"provenance.activity.system": {"$eq": "Smartphone app"}}' | jq ".data"
```
### Get a subdocument
```sh
http :/rest/v2/namespaces/workshop/collections/customers/Donald/lastname
```
### Update a document
```sh
http PATCH :/rest/v2/namespaces/workshop/collections/customers/Donald json:='{"firstname": "Donald", "lastname": "Duck", "type": "unemployed"}'
```
### Check the document
```sh
http :/rest/v2/namespaces/workshop/collections/customers/Donald
```
### Delete a document
```sh
http DELETE :/rest/v2/namespaces/workshop/collections/customers/Donald
```
### Delete the collection
```sh
http DELETE :/rest/v2/namespaces/workshop/collections/customers
```
### Utilize provenance/lineage information to find all Smartphone updated data
```sh
http GET :/rest/v2/namespaces/workshop/collections/accounts where=='{"provenance.activity.system": {"$eq": "Smartphone app"}}' | jq ".data"
```
## ④ <a name="nodejs"></a> Node.js @astrajs
### First install the libraries for Node.js
Make sure you have node installed.
```sh
npm install @astrajs/collections @astrajs/rest@0.0.12 dotenv
```
### Make sure the environment settings are correct
Check the `.env` file for correct settings, else re-run `sh ./env.sh` and provide information from the Astra Connect tab.
### Cavemen using the @astra REST module
```sh
node cavemen_widerow.js
```
### Cavemen using the @astra collections module
```sh
node cavemen_document.js
```