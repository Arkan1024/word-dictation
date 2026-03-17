# 构建阶段
FROM node:18-alpine as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine as production-stage
# 复制构建产物到 nginx 目录
COPY --from=build-stage /app/dist /usr/share/nginx/html
# 复制自定义 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf
# 暴露 80 端口
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
