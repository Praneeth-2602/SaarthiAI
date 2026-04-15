FROM node:22-alpine

WORKDIR /app

COPY package.json tsconfig.json next.config.ts eslint.config.mjs next-env.d.ts ./
RUN npm install

COPY app ./app
COPY components ./components
COPY lib ./lib
COPY tests ./tests

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
