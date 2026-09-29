FROM node:22-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install dependencies first to take advantage of layer caching
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY . .

EXPOSE 3000

USER node

# Run node directly rather than `npm start` (nodemon is for local development)
CMD ["node", "index.js"]
