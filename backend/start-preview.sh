#!/bin/bash
# Preview mode — sem Bull, sem Redis, sem DB
NODE_ENV=development PORT=3000 LOG_LEVEL=warn DATABASE_URL="" REDIS_URL="" AI_ROBOT_ENABLED=false node --import tsx src/index-preview.mjs
