FROM node:trixie
WORKDIR /app
COPY . /app
RUN rm -rf /app/.wrangler
RUN npm install
RUN npx wrangler d1 execute voiceworm --local --file db/voiceworm.sql
EXPOSE 8787
CMD ["npm", "run", "dev", "--", "--ip", "0.0.0.0"]
