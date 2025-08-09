#!/bin/bash

# Generate tsoa routes and swagger spec
npx tsoa spec-and-routes

# Generate TypeScript client SDK
npx @openapitools/openapi-generator-cli generate -i ./build/swagger.json -o ./client -g typescript-fetch
