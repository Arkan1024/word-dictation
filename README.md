# 🍎 Word Dictation Generator | 单词听写表生成器

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%2018-61dafb?logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Build-Vite-646cff?logo=vite)](https://vitejs.dev/)
[![Docker](https://img.shields.io/badge/Deployment-Docker-2496ed?logo=docker)](https://www.docker.com/)

一个专为家长和老师设计的英语单词听写练习单生成工具。支持 **A4 规格**、**双向练习**、**专业四线格**，以及极致的**移动端适配**。

[查看演示](#) · [报告 Bug](https://github.com/your-username/word-dictation/issues) · [提交建议](https://github.com/your-username/word-dictation/issues)

---

## ✨ 核心特性

- **双栏交互布局**：左侧英文写中文，右侧中文写英文，全面覆盖记忆点。
- **专业四线三格**：
  - 加宽设计（36px），更适合中小学生书写。
  - 首尾线加粗加深（红色基准线），打印效果极佳。
- **动态词库管理**：
  - **分组支持**：识别 `-` 符号自动对词库进行 Module/Unit 分组。
  - **Tab 化选择**：支持多词库同时加载，通过弹窗精细化勾选分组。
  - **持久化标签**：已加载词库以 Tag 展示，支持点击一键移除并刷新列表。
- **响应式体验**：
  - **PC 端**：左右分栏，高效录入。
  - **移动端**：精简头部，100vw 全屏 A4 预览，无缝体验。
- **批量导入**：支持从剪贴板一键导入文本，智能识别中英文。

---

## 🚀 腾讯云 CloudBase 部署 (GitHub 方案)

本项目已针对**腾讯云云托管 (Cloud Container)** 优化，支持代码推送自动更新。

### 1. 部署流程
1.  将本项目上传至您的 **GitHub 仓库**。
2.  登录 [腾讯云云开发控制台](https://console.cloud.tencent.com/tcb)。
3.  进入 **“云托管”** -> **“新建服务”**：
    -   **服务名称**：`word-dictation`
    -   **部署方式**：选择 **“代码流水线”**。
    -   **代码源**：选择 **GitHub**，授权并选择您的仓库。
    -   **构建配置**：
        -   **端口**：`80`
        -   **构建目录**：`/`
        -   **Dockerfile 路径**：`Dockerfile`
4.  点击 **“完成”**，稍等片刻即可获得公网访问域名。

### 2. 词库更新方案
- **自动触发**：直接在本地 GitHub 仓库的 `public/words/` 下添加或修改 `.txt` 文件。
- **一键生效**：执行 `git push`，腾讯云将自动捕获更新并触发重新构建发布。

---

## 🐳 NAS & Docker 部署 (私有化)

针对群晖 (Synology)、极空间、飞牛等 NAS 优化：

```bash
# 本地快速打包镜像
./build-for-nas.sh
```

**Docker Compose 配置：**
```yaml
services:
  word-dictation:
    image: word-dictation:latest
    container_name: word-dictation-app
    ports:
      - "8080:80"
    volumes:
      - /your/nas/words:/usr/share/nginx/html/words
    restart: always
```

---

## 📝 词库文件规范

在 `public/words/` 目录下创建 `.txt` 文件，格式如下：

```text
- Module 1  <-- 分组标识（可选）
apple 苹果
banana 香蕉

- Module 2
drive 驾驶
```

---

## 🛠 技术栈

- **Frontend**: React 18, TypeScript, Lucide Icons
- **Styles**: Vanilla CSS (Modern CSS Variables)
- **Container**: Nginx (Alpine based), Docker
- **Environment**: CloudBase, NAS, Local Dev

---

## 📄 打印建议

1. 点击右下角 **[生成 PDF]**。
2. 在浏览器打印对话框中：
   - **纸张尺寸**：A4
   - **边距**：无 (None)
   - **选项**：**必须勾选“背景图形” (Background graphics)**。

---

## 🤝 贡献

如果你有任何好的想法，欢迎提交 Pull Request！

1. Fork 本项目
2. 创建您的 Feature 分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

---
Built with ❤️ for better education. 🍎
