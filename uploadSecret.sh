#!/bin/bash
PROJECT=stanke
ENV_FILE=/Users/stanmac/Work/stanKe/.env

grep -E '^(GEMINI_API_KEY|GITHUB_TOKEN|GITHUB_USERNAME)=' "$ENV_FILE" | while IFS='=' read -r key value; do
  echo "$value" | npx wrangler pages secret put "$key" --project-name "$PROJECT"
done