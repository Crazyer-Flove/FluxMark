export interface DocumentTemplate {
  id: string;
  title: string;
  category: 'overview' | 'tech' | 'academic' | 'office' | 'resume' | 'ppt';
  categoryLabel: string;
  badge: string;
  description: string;
  docName: string;
  content: string;
}

export const DOCUMENT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'overview',
    title: '🌟 极简全景指南与全功能演示',
    category: 'overview',
    categoryLabel: '全功能上手',
    badge: '官方推荐',
    description: '涵盖 Markdown 基础排版、任务清单、KaTeX 数学公式、代码高亮、多媒体及 PPT 放映指令。',
    docName: 'FluxMark全景功能指南.md',
    content: `# 🌟 欢迎使用 FluxMark 智能文档与演示平台

FluxMark 是一款专注于**极致创作体验**与**高效演示**的现代 Markdown 编辑器。它完美融合了**沉浸式所见即所得写作**、**本地文件夹深度同步**、**多媒体拖拽插入**、**一键中英文智能排版**、**KaTeX 科学公式**、**AI 智能助手**以及**全屏 PPT 演示放映**等核心功能。

> 💡 **设计理念**：让思想自由流淌，让表达精美非凡。无论是撰写技术文档、学术论文、会议纪要，还是现场演讲汇报，FluxMark 都能为您提供无缝且优雅的操作体验。

---

## 🎯 快速上手体验清单 (Task List)

您可以直接在下方**点击复选框**开启或完成任务：

- [x] **开启 FluxMark 视界**：感受无缝即时渲染与高颜值 Typography 字体排版
- [x] **体验丰富文本修饰**：选中文字后试试 **加粗**、*斜体*、==重点行内高亮== 与 ~删除线~
- [x] **一键智能格式排版**：选中文本在浮动工具栏中点击 ✨ **一键智能排版** 修正中英文空格与盘古排版规范
- [ ] **体验多媒体拖拽与裁剪**：直接将图片或视频**拖拽/粘贴**入编辑区，选中图片可在线裁剪
- [ ] **关联本地工作区**：点击顶部 “打开文件夹” 绑定本地目录，媒体将自动存入 \`.med\` 独立文件夹
- [ ] **探索 KaTeX 科学公式**：体验行内 $e^{i\pi} + 1 = 0$ 与块级微积分方程
- [ ] **AI 智能助手协作**：点击右上角 AI 图标进行文章润色、段落总结或多语言翻译
- [ ] **全屏 PPT 演示放映**：按 \`F11\` 或点击顶部放映按钮，即可将包含 \`---\` 的文档直接转为全屏幻灯片展示！

---

## ✍️ 文本样式与智能排版演示

FluxMark 支持丰富的标准及扩展 Markdown 格式，帮助您清晰层级化地表达观点：

### 1. 文本强调与标记
- **粗体强调**：输入 \`**加粗文本**\` 获得 **强烈的视觉焦点**
- *斜体排版*：使用 \`*斜体文字*\` 或 \`_斜体强调_\` 表达 *精致的文意倾斜*
- ***粗斜体组合***：同时触发 \`***粗斜体***\` 呈现 ***强烈瞩目效果***
- ==重点高亮==：使用 \`==高亮包裹==\` 为关键短语涂上 ==醒目的荧光高亮色==
- ~删除文本~：使用 \`~删除线~\` 标注 ~废弃或修正内容~
- **上标与下标**：支持数学上标 $X^2 + Y^2 = Z^2$ 以及化学分子式 $H_2O$ 与 $CO_2$

### 2. 块级引用 (Blockquotes)
> 🚀 **高效创作金句**：
> “好的编辑器不应该打断创作逻辑，而应该像延伸的思维神经一样，顺应你的灵感发散与归纳。”
> 
> —— *FluxMark 设计团队*

---

## 🎬 多媒体与本地资源同步

FluxMark 提供了极其平滑的多媒体与本地文件同步能力：

1. **图片与视频拖拽**：直接将电脑中的图片 (\`.jpg\`, \`.png\`, \`.webp\`) 或视频 (\`.mp4\`, \`.webm\`) 拖入编辑器。
2. **本地文件夹联动**：绑定工作区目录后，插入的多媒体资源将自动妥善存入当前目录下的 \`.med\` 文件夹中，Markdown 文件将自动建立相对路径连接。
3. **图片在线裁剪**：点击文档中的图片，选择 “裁剪” 按钮即可调出交互式裁剪模版。

---

## 📐 科学计算与数学公式 (KaTeX Engine)

FluxMark 内置了强大的 **KaTeX 数学渲染引擎**，能够秒级渲染专业公式：

1. **行内公式 (Inline Math)**：比如欧拉恒等式 $e^{i\pi} + 1 = 0$，或正态分布概率密度函数 $f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}$。
2. **块级高阶方程 (Block Math)**：

$$
\\int_{-\\infty}^{+\\infty} e^{-x^2} dx = \\sqrt{\\pi}
$$

$$
\\mathbf{A} \\mathbf{x} = \\lambda \\mathbf{x} \\quad \\implies \\quad \\det(\\mathbf{A} - \\lambda \\mathbf{I}) = 0
$$

---

## 💻 多语言代码渲染与工程集成

针对程序员与技术作者，内置语法高亮与一键代码复制功能：

\`\`\`typescript
// FluxMark 核心架构示例
interface EditorCapabilities {
  aiAssistant: boolean;
  katexEngine: boolean;
  pptPresentation: boolean;
  mediaDirectorySync: boolean;
  theme: 'light' | 'dark' | 'sepia';
}

class FluxMarkApp {
  public static init(config: EditorCapabilities): void {
    console.log('🚀 FluxMark 编辑引擎已就绪，体验流畅创作之旅！');
  }
}

// 启动编辑器
FluxMarkApp.init({
  aiAssistant: true,
  katexEngine: true,
  pptPresentation: true,
  mediaDirectorySync: true,
  theme: 'light',
});
\`\`\`

---

## 📊 结构化数据与表格 (Markdown Tables)

| 功能模块 | 对应快捷键 / 操作入口 | 功能说明 | 推荐度 |
| :--- | :---: | :--- | :---: |
| **保存文档** | \`Ctrl + S\` | 实时写入文件或更新本地缓存 | ⭐⭐⭐⭐⭐ |
| **一键智能排版** | 选区浮动栏 ✨ | 自动规范中英文间距与盘古排版规范 | ⭐⭐⭐⭐⭐ |
| **全屏 PPT 演示** | \`F11\` / 放映图标 | 瞬间将 Markdown 转为演示幻灯片 | ⭐⭐⭐⭐⭐ |
| **AI 智能对话** | 右上角 AI 图标 | 提供润色、总结、翻译与续写辅助 | ⭐⭐⭐⭐⭐ |
| **插入数学公式** | \`KaTeX\` / \`$$\` | 秒级渲染专业排版的数学方程 | ⭐⭐⭐⭐ |

---

## 📺 第二页：全屏 PPT 演示放映模式 (Presentation Page 2)

在 Markdown 文档中使用 **三连减号 \`---\`** 即可划定幻灯片分页！

按 \`F11\` 或点击顶部工具栏的 **“放映”** 按钮，系统会自动将文档切分为全屏幻灯片，并开启强大现场互动工具：

- 🖋️ **画笔与荧光笔圈画**：在演示时直接在屏幕上作图标注重点
- 🧹 **一键橡皮擦与清屏**：轻松抹去批注迹象
- 🔦 **激光笔聚光焦点**：引导听众视线焦点
- ⏱️ **会议演讲倒计时**：掌控现场报告节奏
- 🎯 **随机点名转盘**：课堂与团队会议现场互动神器

---

## 💡 常用快捷键速查表 (Quick Shortcuts)

- \`Ctrl + B\`：文本加粗 / \`Ctrl + I\`：文本斜体 / \`Ctrl + Shift + H\`：文本高亮
- \`Ctrl + Alt + 1\`：一级标题 / \`Ctrl + Shift + 9\`：待办清单
- \`Ctrl + S\`：保存当前文档 / \`Ctrl + /\`：随时唤起帮助与快捷键中心

---
_FluxMark - 灵感流淌，极致表达。_
`
  },
  {
    id: 'tech_arch',
    title: '💻 软件工程架构与技术设计文档',
    category: 'tech',
    categoryLabel: '技术工程',
    badge: '技术规范',
    description: '适用于软件系统设计、API 接口文档、微服务架构方案及技术评审备忘。',
    docName: '分布式微服务架构设计规范.md',
    content: `# 💻 分布式微服务架构设计与 API 接口规范

> **项目名称**：NexusCloud 高并发计算引擎  
> **文档版本**：v2.4.0  
> **更新时间**：2026 年 8 月  
> **编写团队**：核心基础架构组 (Core Infrastructure)

---

## 1. 架构设计概述 (Architecture Overview)

本文档旨在说明 NexusCloud 系统的模块划分、高可用设计、数据一致性策略及统一 API 交互规范。

### 1.1 核心设计目标
- **高吞吐低延迟**：核心接口 P99 延迟 $< 50\\text{ms}$
- **弹性扩缩容**：结合 K8s HPA 实现基于 CPU / 内存指标的分钟级自动扩容
- **零单点故障**：关键服务部署不少于 3 个可用区 (Multi-AZ)

---

## 2. 系统组件分布图 (System Components)

| 组件名称 | 核心职责 | 技术选型 | 伸缩策略 |
| :--- | :--- | :--- | :--- |
| **API Gateway** | 路由分发、限流熔断、鉴权代理 | Kong / Envoy | CPU $> 70\\%$ 弹性扩容 |
| **Auth Service** | JWT 令牌颁发、 OAuth2.0 验证 | Go + Redis | 固定 5 节点多副本 |
| **Data Engine** | 实时计算与状态持久化 | Rust + PostgreSQL | 主从读写分离 + Sharding |
| **Message Queue**| 异步解耦与高并发缓冲 | Apache Kafka | 3 Broker 分布式集群 |

---

## 3. 核心算法与复杂度推导 (Algorithm & Math)

计算节点拓扑路由的最短路径选路效率符合如下 Dijkstra 优先队列优化复杂度：

$$
T(V, E) = O((|V| + |E|) \\log |V|)
$$

在数据分片哈希算法中，一致性哈希环的节点映射满意度满足概率分布：

$$
P(k) = \\binom{n}{k} p^k (1-p)^{n-k} \\implies \\lim_{n \\to \\infty} P(k) = \\frac{\\lambda^k e^{-\\lambda}}{k!}
$$

---

## 4. API 接口定义代码示例 (Typescript)

\`\`\`typescript
/**
 * 核心请求包与响应报文接口声明
 */
export interface GatewayRequest<T = Record<string, unknown>> {
  traceId: string;
  timestamp: number;
  clientIp: string;
  payload: T;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T | null;
  serverTime: number;
}

/**
 * 分布式服务健康度检查函数
 */
export async function checkClusterHealth(clusterEndpoint: string): Promise<boolean> {
  try {
    const res = await fetch(\`\${clusterEndpoint}/healthz\`, { timeout: 3000 } as any);
    return res.ok;
  } catch (error) {
    console.error('[HealthCheck] 集群响应异常:', error);
    return false;
  }
}
\`\`\`

---

## 5. 项目上线里程碑清单 (Milestones Task List)

- [x] **Phase 1**: 完成网关转发与鉴权中间件设计
- [x] **Phase 2**: 接入 Kafka 压测与分布式事务 Saga 验证
- [ ] **Phase 3**: 完成压测评估（目标 QPS $\\ge 50,000$）
- [ ] **Phase 4**: 灰度发布上线与全链路 Trace 追踪对齐

---
_NexusCloud Architecture Specs & Technical Blueprint_
`
  },
  {
    id: 'academic',
    title: '🎓 学术论文与科研推导报告',
    category: 'academic',
    categoryLabel: '学术科研',
    badge: 'KaTeX 公式',
    description: '内置规范的学术论文结构，包含摘要、数学推导方程、数据对比表与文献引用。',
    docName: '量子关联强化学习理论与仿真研究.md',
    content: `# 🎓 基于量子关联泛化神经网络的高维优化研究

**作者**：张晨阳$^{1,*}$，李思敏$^2$，王浩然$^1$  
**机构**：1. 人工智能与前沿交叉研究院； 2. 计算机科学与技术学院  
**联系邮箱**：*cyzhang@research.edu.cn*

---

## 摘要 (Abstract)

本文提出了一种基于量子纠缠概率密度的泛化强化学习算法（**Quantum-Assisted RL, QARL**）。通过引入非局域相位约束，提升在大规模连续动作空间中的收敛稳定性。实验表明，该算法比传统 PPO 算法提升了 $38.6\\%$ 的收敛速率。

**关键词**：量子计算；强化学习；Markov 决策过程；收敛性推导

---

## 1. 理论模型与公式推导 (Mathematical Formulations)

马尔可夫决策过程 (MDP) 可由五元组 $\\mathcal{M} = (\\mathcal{S}, \\mathcal{A}, \\mathcal{P}, \\mathcal{R}, \\gamma)$ 定义。考虑量子态状态空间：

$$
|\\Psi(\\theta)\\rangle = \\sum_{i=1}^{N} c_i(\\theta) |s_i\\rangle \\otimes |a_i\\rangle
$$

状态转移概率密度求得的贝尔曼期望方程展开为：

$$
V^\\pi(s) = \\mathbb{E}_\\pi \\left[ R_t + \\gamma V^\\pi(S_{t+1}) \\;\\middle|\\; S_t = s \\right]
$$

进而推出哈密顿量正则化的损失函数极小化目标：

$$
\\mathcal{L}(\\theta) = \\int_{\\mathcal{S}} \\left| \\nabla \\cdot \\mathbf{J}(s; \\theta) + \\lambda \\hbar \\frac{\\partial \\psi}{\\partial t} \\right|^2 ds
$$

---

## 2. 实验数据与算法对比 (Benchmark Results)

我们在 6 个标准 OpenAI Gym 物理控制环境中进行了 1,000 次基准测试，统计结果如下：

| 算法模型 | 平均收敛步数 (Steps) | 奖励上限 (Max Return) | 方差范围 (Std) | 是否支持量子加速 |
| :--- | :---: | :---: | :---: | :---: |
| **DQN** | $2.4 \\times 10^6$ | $210.5$ | $\\pm 42.1$ | 否 |
| **PPO** | $8.5 \\times 10^5$ | $485.0$ | $\\pm 18.3$ | 否 |
| **SAC** | $5.1 \\times 10^5$ | $520.8$ | $\\pm 12.6$ | 否 |
| **QARL (本文)** | **$3.1 \\times 10^5$** | **$680.4$** | **$\\pm 6.2$** | **是** |

---

## 3. 算法核心伪代码 (Core Algorithm)

\`\`\`python
import torch
import torch.nn as nn

class QuantumPolicyNet(nn.Module):
    def __init__(self, state_dim, action_dim, num_qubits=4):
        super().__init__()
        self.fc1 = nn.Linear(state_dim, 128)
        self.quantum_layer = nn.Linear(128, num_qubits)
        self.out = nn.Linear(num_qubits, action_dim)

    def forward(self, state):
        x = torch.relu(self.fc1(state))
        angles = torch.tanh(self.quantum_layer(x)) * torch.pi
        action_probs = torch.softmax(self.out(angles), dim=-1)
        return action_probs
\`\`\`

---

## 4. 结论与未来展望 (Conclusion)

- [x] 证明了非局域量子相位对状态采样的降维效果
- [x] 完成了经典物理引擎环境下的收敛上限证明
- [ ] 计划在真实量子芯片 (IBM Quantum Hardware) 上进行物理验证

---
`
  },
  {
    id: 'office',
    title: '📝 项目敏捷周报与团队会议纪要',
    category: 'office',
    categoryLabel: '日常办公',
    badge: '高效团队',
    description: '规范的团队周报结构，清晰记录本周成果、下周规划、风险项及议题决议。',
    docName: '2026年第32周产品研发团队周报.md',
    content: `# 📝 2026 年第 32 周研发团队敏捷周报与会议纪要

**会议时间**：2026 年 8 月 8 日 10:00 - 11:30  
**参会人员**：张经理、王工程师、陈设计师、刘测试工程师  
**主持人**：张经理 | **记录人**：李文

---

## 📌 本周核心进展 (Weekly Achievements)

### 1. 软件工程与 UI 交互
- [x] **FluxMark 所见即所得编辑引擎**：完成对图片裁剪与 KaTeX 公式编辑器的闭环调优
- [x] **全屏 PPT 演示工具箱**：新增荧光笔批注、倒计时器与课堂随机抽查点名转盘
- [x] **导出中心模块升级**：修复 PDF 分页高清渲染与 Word 样式还原度问题

### 2. 项目进度数据卡片

| 模块名称 | 负责人 | 预期完成度 | 实际完成度 | 风险等级 |
| :--- | :--- | :---: | :---: | :---: |
| **前端画布导出** | 王工程师 | $100\\%$ | $100\\%$ | 低 |
| **AI 侧边栏对话** | 陈工程师 | $90\\%$ | $95\\%$ | 低 |
| **本地文件夹同步** | 李工程师 | $85\\%$ | $90\\%$ | 低 |

---

## 🎯 下周工作计划 (Next Week Objectives)

- [ ] **性能优化**：针对 10 万字超长 Markdown 文档的虚拟滚轮渲染优化
- [ ] **模版中心拓展**：持续丰富学术报告、技术架构与演示幻灯片预设模版
- [ ] **社区版本发布**：完成开源 GitHub 仓库文档更新与发布打标签

---

## 💡 会议决议与待办项 (Action Items)

> 🔔 **重要决议**：
> 1. 全员同意于下周三（8月13日）进行首轮全平台断网离线可用性测试。
> 2. 增设多格式一键无缝转换快捷入口。

---
`
  },
  {
    id: 'resume',
    title: '📊 高级全栈工程师专业简历',
    category: 'resume',
    categoryLabel: '求职简历',
    badge: '精美排版',
    description: '结构分明的高级工程师简历模板，涵盖个人优势、技术栈、项目经历与教育背景。',
    docName: '高资深全栈开发工程师简历.md',
    content: `# 📊 陆云翔 (Alex Lu) - 高级全栈 / 前端架构师

**电话**：138-0000-0000 | **邮箱**：*alex.lu@fullstack.dev* | **城市**：上海  
**GitHub**：[github.com/alex-lu](https://github.com) | **个人博客**：[alexlu.tech](https://google.com)

---

## 👤 个人优势与简介 (Executive Summary)

- **8年+ 全栈开发经验**，精通 React 19 / Vue 3、TypeScript 及 Node.js / Go 微服务架构。
- 主导过千万级用户量大前端架构演进，擅长**富文本编辑器开发 (ProseMirror / TipTap)**、**Web Worker 离线计算**及**Canvas 渲染引擎**。
- 对代码洁癖与 UI/UX 细节有执着追求，具备优秀团队 Leader 协同管理能力。

---

## 🛠️ 核心技术栈 (Technical Skills)

- **前端领域**：React 19, TypeScript, TipTap / ProseMirror, Tailwind CSS, Motion, WebGL / Canvas
- **后端与云原生**：Node.js (Express / NestJS), Go, Redis, PostgreSQL, Docker, K8s, Cloud Run
- **AI 与工程化**：Gemini API / OpenAI SDK 集成, Vite 构建调优, Jest / Cypress 自动化测试

---

## 💼 核心项目经历 (Work Experience)

### 1. 现代智能 Markdown 编辑平台 (FluxMark) | **技术负责人** *(2024.03 - 至今)*
- **架构设计**：采用 TipTap v3 搭建基于 ProseMirror 的所见即所得编辑器，首屏加载速度提升 $65\\%$。
- **创新功能**：开发了内嵌式 KaTeX 数学公式、多媒体拖拽自适应存储及全屏 PPT 放映与批注工具箱。
- **性能优化**：借助 Web Assembly 与虚拟滚动，使超大文章（10万字+）编辑帧率稳定在 60 FPS。

### 2. 企业级协同云文档系统 (CloudDoc Pro) | **高级前端架构师** *(2021.06 - 2024.02)*
- 搭建分布式 OT / CRDT 实时协同算法，解决万人同时在线编辑的冲突合并问题。
- 设计了组件化导出引擎，支持精准导出 PDF、Word (.docx) 及高清图片。

---

## 🎓 教育背景 (Education)

- **浙江大学** | 计算机科学与技术 | **硕士** *(2018 - 2021)*
- **浙江大学** | 软件工程 | **学士** *(2014 - 2018)*

---
`
  },
  {
    id: 'ppt',
    title: '📺 全屏 PPT 演讲汇报专用幻灯片',
    category: 'ppt',
    categoryLabel: '演示放映',
    badge: 'PPT 模版',
    description: '使用 --- 划分多页幻灯片，按 F11 即可进入专业全屏演示放映模式。',
    docName: '人工智能时代高效创作演讲PPT.md',
    content: `# 🚀 人工智能时代的极简写作与高效演示

### FluxMark 智能编辑与全屏演示发布会

**演讲者**：FluxMark 产品团队  
**时间**：2026 年 8 月  

> 💡 *按 \`F11\` 键进入全屏放映模式，使用方向键翻页，右下角开启画笔与倒计时！*

---

## 📌 传统 Markdown 的三大痛苦痛点

1. **编辑与预览分屏割裂**：左侧写代码，右侧看效果，视线频繁来回穿梭
2. **多媒体插入复杂**：手动输入繁琐路径，难以实时裁剪与调整尺寸
3. **汇报演示成本高**：需要二次导出 PDF 或复制粘贴到 PPT 软件重新做格式

---

## ✨ FluxMark 的破局之道

- [x] **所见即所得 (WYSIWYG)**：输入 Markdown 符号瞬间呈现精致高颜值排版
- [x] **多媒体拖拽即存**：自动与本地工作区文件夹同步
- [x] **一键转化为全屏 PPT**：使用 \`---\` 分页，随时按 \`F11\` 开始演讲
- [x] **AI 智能写作与计算**：集成 Gemini 与 KaTeX 数学引擎

---

## 📐 科学公式与数据精准呈现

欧拉公式连接了数学中最神奇的常数：

$$
e^{i\\pi} + 1 = 0
$$

数据对比表现如下：

| 指标维度 | 传统编辑器 | FluxMark 智能平台 | 提升幅度 |
| :--- | :---: | :---: | :---: |
| **文档排版耗时** | 20 分钟 | **1 分钟** | $95\\%$ ↓ |
| **PPT 转写时间** | 45 分钟 | **0 秒 (一键放映)** | $100\\%$ ↓ |

---

## 🎯 现场演讲互动工具箱

在全屏放映模式下，悬浮右侧工具栏提供：

- 🖋️ **屏幕画笔与荧光笔**：圈画关键数据
- 🔦 **激光笔**：吸引全场注意力
- ⏱️ **演讲倒计时**：精准掌控汇报时长
- 🎯 **随机抽查点名转盘**：互动环节气氛神器

---

# 👏 感谢聆听！

### 开启您的 FluxMark 智能创作之旅

*网页版与本地优先模式即刻可用*
`
  }
];
