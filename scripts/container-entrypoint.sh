#!/bin/sh
set -eu
./node_modules/.bin/tsx scripts/validate-env.ts
./node_modules/.bin/prisma migrate deploy
./node_modules/.bin/tsx scripts/bootstrap.ts
exec ./node_modules/.bin/tsx server.ts --production
