FROM node:24-alpine
WORKDIR /app
COPY --chown=node:node package.json server.js auth.js game.js layout.js content.js economy.js survival.js adventure.js combat.js equipment.js environment.js biomes.js skills.js world-lore.js life.js interest.js fishing.js fish-catalog.js fishing-gear.js asset-layout.js audio-library.js nature.js party.js cooking.js cooking-data.js motion.js movement-server.js attacks.js encounters.js town.js season.js death.js ./
COPY --chown=node:node public ./public
RUN mkdir -p /app/data && chown node:node /app/data
USER node
ENV NODE_ENV=production PORT=3100 HOST=0.0.0.0 DATA_DIR=/app/data
EXPOSE 3100
CMD ["node", "server.js"]
