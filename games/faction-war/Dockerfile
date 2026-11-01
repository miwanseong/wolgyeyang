FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json server.js auth.js game.js ./
COPY --chown=node:node public ./public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production PORT=3100 HOST=0.0.0.0 DATA_DIR=/app/data
EXPOSE 3100
CMD ["node", "server.js"]
