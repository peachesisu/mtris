# Build Stage
FROM node:20-alpine as build

WORKDIR /app

COPY package*.json ./
# Install dependencies (using legacy-peer-deps based on project history)
RUN npm install --legacy-peer-deps

ARG VITE_RANKING_SECRET
ENV VITE_RANKING_SECRET=$VITE_RANKING_SECRET

COPY . .
RUN npm run build

# Production Stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
