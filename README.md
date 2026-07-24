# FluxMark ✦ 智能 Markdown 编辑器

<p align="center">
  <strong>一款极简纯粹、本地优先、功能强大的 Typora 风格智能 Markdown 编辑器</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0-blue?logo=react" alt="React 19" />
  <img src="https://img.shields.io/badge/TypeScript-5.8-blue?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/TailwindCSS-v4-06B6D4?logo=tailwindcss" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Privacy-100%25%20Local-emerald" alt="100% Local Privacy" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="License" />
</p>

---

## ✨ 核心特色

- **📝 仿 Typora 所见即所得编辑**：打通渲染与编辑边界，支持无缝实时交互与排版预览。
- **🤖 AI 写作与助手**：集成 Gemini AI 辅助，支持文本智能润色、扩写、语法纠错与长文总结。
- **📐 科学与数学公式**：完美支持 KaTeX 行内公式 `$E=mc^2$` 与块级公式渲染。
- **💻 代码块与语法高亮**：基于 `highlight.js` 支持多种编程语言的精确语法突出与一键复制代码。
- **🖼️ 图像处理与裁剪**：内置图片裁剪、自适应调整尺寸、居中对齐与图注设置。
- **🔒 本地优先与隐私安全**：100% 离线数据存取，无广告、无后台跟踪，守护您的写作资产。
- **📤 丰富导出能力**：一键导出为 Markdown (`.md`)、Word (`.docx`)、PDF、HTML 以及高清长图 PNG。
- **💖 赏赞支持系统**：内置优雅的赞赏模组，支持微信与支付宝扫码，并提供本地收款码图片自定义能力。
- **🎓 课堂与研讨实用小工具**：内置课堂随机点名抽查、倒计时计时器与文档字数统计大纲。

---

## 🛠️ 技术栈

- **前端框架**：[React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **构建工具**：[Vite 6](https://vitejs.dev/)
- **富文本引擎**：[TipTap Editor v3](https://tiptap.dev/)
- **UI & 样式**：[Tailwind CSS v4](https://tailwindcss.com/) + [Lucide Icons](https://lucide.dev/)
- **动效库**：[Motion (Framer Motion)](https://motion.dev/)
- **数学公式**：[KaTeX](https://katex.org/)
- **AI 引擎**：[@google/genai](https://www.npmjs.com/package/@google/genai)

---

## 🚀 快速开始

### 1. 克隆项目与安装依赖

```bash
# 克隆仓库
git clone https://github.com/your-username/fluxmark.git
cd fluxmark

# 安装依赖
npm install
```

### 2. 配置环境变量 (可选)

根目录下复制 `.env.example` 为 `.env`：

```env
# 若需要使用 AI 写作助手功能，请输入 Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 `http://localhost:3000` 即可开始创作！

---

## 🔒 隐私与安全承诺

1. **数据存储**：所有编辑内容仅保存在您的浏览器 IndexedDB / LocalStorage 及本机文件系统。
2. **无静默上传**：FluxMark 不会将您的文档资产静默传输到外部远程服务器。
3. **AI 数据安全**：仅当您主动触发 AI 润色或对话时，选定的特定文本才会通过加密通道调用大模型 API。

---

## 💖 赏赞与支持

如果您觉得 FluxMark 提升了您的创作或工作效率，欢迎给予赏赞支持！您可以使用微信或支付宝扫描下方二维码：

* 在弹出的“赏赞支持”模组中，点击 **“上传/更换微信/支付宝真实收款码图片”**，即可无缝替换为您自己的收款码图片（或直接替换 `/public/wechat-qr.jpg` 和 `/public/alipay-qr.jpg`）。

---

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 协议开源。
