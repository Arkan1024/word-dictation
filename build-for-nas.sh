#!/bin/bash

# 设置镜像名称和版本
IMAGE_NAME="word-dictation"
TAG="v1"
OUTPUT_FILE="word-dictation.tar"

echo "🚀 开始构建适用于 NAS 的 Docker 镜像 (linux/amd64)..."

# 检查是否安装了 Docker
if ! [ -x "$(command -v docker)" ]; then
  echo '❌ 错误: 未检测到 Docker，请先安装 Docker。' >&2
  exit 1
fi

# 1. 使用 buildx 构建镜像 (强制 amd64 架构，适配大多数 NAS)
# --load 表示构建完成后加载到本地镜像列表
docker buildx build --platform linux/amd64 -t ${IMAGE_NAME}:${TAG} --load .

if [ $? -eq 0 ]; then
  echo "✅ 镜像构建成功: ${IMAGE_NAME}:${TAG}"
else
  echo "❌ 镜像构建失败，请检查 Dockerfile。"
  exit 1
fi

echo "📦 正在导出镜像到文件: ${OUTPUT_FILE}..."

# 2. 导出镜像为离线 tar 包
docker save ${IMAGE_NAME}:${TAG} > ${OUTPUT_FILE}

if [ $? -eq 0 ]; then
  echo "✨ 完成！您可以将 ${OUTPUT_FILE} 上传到极空间 NAS 并导入了。"
  echo "👉 提示: 极空间导入路径为 [镜像控制台] -> [添加] -> [导入本地镜像]"
else
  echo "❌ 镜像导出失败。"
  exit 1
fi
