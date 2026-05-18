<p align="center">
    <a href="https://linux.do" alt="LINUX DO">
        <img
            src="https://img.shields.io/badge/LINUX-DO-FFB003.svg?logo=data:image/svg%2bxml;base64,DQo8c3ZnIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cGF0aCBkPSJNNDYuODItLjA1NWg2LjI1cTIzLjk2OSAyLjA2MiAzOCAyMS40MjZjNS4yNTggNy42NzYgOC4yMTUgMTYuMTU2IDguODc1IDI1LjQ1djYuMjVxLTIuMDY0IDIzLjk2OC0yMS40MyAzOC0xMS41MTIgNy44ODUtMjUuNDQ1IDguODc0aC02LjI1cS0yMy45Ny0yLjA2NC0zOC4wMDQtMjEuNDNRLjk3MSA2Ny4wNTYtLjA1NCA1My4xOHYtNi40NzNDMS4zNjIgMzAuNzgxIDguNTAzIDE4LjE0OCAyMS4zNyA4LjgxNyAyOS4wNDcgMy41NjIgMzcuNTI3LjYwNCA0Ni44MjEtLjA1NiIgc3R5bGU9InN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVub2RkO2ZpbGw6I2VjZWNlYztmaWxsLW9wYWNpdHk6MSIvPjxwYXRoIGQ9Ik00Ny4yNjYgMi45NTdxMjIuNTMtLjY1IDM3Ljc3NyAxNS43MzhhNDkuNyA0OS43IDAgMCAxIDYuODY3IDEwLjE1N3EtNDEuOTY0LjIyMi04My45MyAwIDkuNzUtMTguNjE2IDMwLjAyNC0yNC4zODdhNjEgNjEgMCAwIDEgOS4yNjItMS41MDgiIHN0eWxlPSJzdHJva2U6bm9uZTtmaWxsLXJ1bGU6ZXZlbm9kZDtmaWxsOiMxOTE5MTk7ZmlsbC1vcGFjaXR5OjEiLz48cGF0aCBkPSJNNy45OCA3MC45MjZjMjcuOTc3LS4wMzUgNTUuOTU0IDAgODMuOTMuMTEzUTgzLjQyNiA4Ny40NzMgNjYuMTMgOTQuMDg2cS0xOC44MSA2LjU0NC0zNi44MzItMS44OTgtMTQuMjAzLTcuMDktMjEuMzE3LTIxLjI2MiIgc3R5bGU9InN0cm9rZTpub25lO2ZpbGwtcnVsZTpldmVuZDtmaWxsOiNmOWFmMDA7ZmlsbC1vcGFjaXR5OjEiLz48L3N2Zz4=" /></a>
</p>

# 命语

命语是一个面向 AI 时代的命理、占卜与提示词生成项目，目标不是把传统术数包装成神秘黑箱，而是把排盘、起卦、抽牌、结构化数据和 AI 提示词连接成一条清晰可复用的流程。让所有人都可以快速的生成专业可靠的排盘信息，而不是依靠模糊的关键词和无脑堆叠专业词汇，让AI占卜相对更加可靠，享受术数的神秘智慧。

它适合两类人使用：普通用户可以在网页端快速完成排盘或占卜，并把生成的结构化提示词交给常用 AI 工具继续解读；开发者和 AI 代理则可以通过公开 API、MCP Server 或 skill，把命语的排盘与提示词能力接入自己的应用、工作流和智能体系统。

项目目前覆盖八字排盘、紫微斗数、星盘、六爻、梅花易数、奇门遁甲、大六壬、小六壬、塔罗牌、雷诺曼、三山国王灵签、择日等场景，并尽量将结果拆分为机器可读的数据、用户可理解的摘要和适合大模型继续分析的提示词。

线上体验：[https://aov.cc](https://aov.cc)

公开 API：[https://aov.cc/api/v1/manifest](https://aov.cc/api/v1/manifest)

OpenAPI：[https://aov.cc/api/v1/openapi.json](https://aov.cc/api/v1/openapi.json)

公开 skill：[https://aov.cc/skills/aov-mingyu-api/SKILL.md](https://aov.cc/skills/aov-mingyu-api/SKILL.md)

## 核心能力

### 命理排盘

- 八字排盘：四柱、十神、藏干、纳音、神煞、大运、流年、旺衰、格局、用神与调候分析。
- 紫微斗数：基于 `iztro` 的完整命盘，支持本命、大限、流年、流月、流日、流时等数据范围。
- 星盘排盘：西方占星完整排盘，包含太阳、月亮、上升星座与宫位、十大行星、逆行提示与主要相位分析。
- 合盘与关系分析：支持双方盘面结构化提示词，适配婚恋、合作、友情、亲子、父母、兄弟等场景。
- 时辰反推：在用户不确定出生时辰时，生成保守的三柱分析与互动式反推提示词。

### 占卜术数

- 六爻：京房八宫法排盘，包含纳甲、六亲、六神、世应、动变、空亡等信息。
- 梅花易数：支持时间起卦、数字起卦、随机起卦、外应起卦，包含体用生克与四时旺衰。
- 奇门遁甲：时家奇门转盘法，包含天地人神四盘、值符值使、格局标签与宫位洞察。
- 大六壬：天盘、四课、三传、月将、贵人、旬空、课体与断课模板。
- 小六壬：大安、留连、速喜、赤口、小吉、空亡六宫起课，支持时间起课与随机起课，输出起因、过程、结果三宫提示词。
- 塔罗牌：78 张塔罗牌，支持单牌、时间流、爱情、事业、选择等牌阵。
- 雷诺曼：36 张雷诺曼牌，支持单牌、时间流、爱情、事业、选择等牌阵。
- 三山国王灵签：100 签灵签，包含签题、签诗、典故故事与分类解签。

### 择吉择日

- 黄历择日：支持搬家入宅、订婚结婚、开业启动、签约合作、出行赴任、就医手术、考试学习等事项，按参与人生辰与事项类型推荐最佳日期并给出评分。

### AI 提示词

- 使用 `【当前时间】`、`【问题】`、`【任务】`、`【输出要求】` 等稳定 section 结构。
- 支持八字、紫微、占卜三类提示词，并按婚姻、事业、财运、健康、学业等场景补充分析重点。
- 提供问题灵感库，帮助用户快速提出更适合命理或占卜分析的问题。
- 支持复制和移动端分享，方便把结构化提示词带到其他 AI 平台继续解读。

### 模型评测

- 内置 `2025年第十六届全球算命师比赛` 评测资料，包含原题、8 份八字提示词和 40 题正确答案。
- 提示词已补入题目涉及年份、年龄段对应的大运、流年、年龄、十神和小运信息，方便直接评测不同模型的命理选择题表现。
- 提供快速评测脚本，支持 OpenAI Chat Completions、OpenAI Responses、Claude Messages、Gemini generateContent 四种接口格式。
- 评测结果按 100 分制输出，并同时给出准确率和逐题明细。

## 给普通用户

直接打开 [https://aov.cc](https://aov.cc)，选择排盘或占卜模式：

1. 填写出生信息，生成八字、紫微或星盘。
2. 输入问题，选择六爻、梅花、奇门、大六壬、小六壬、塔罗、雷诺曼或灵签；或进入择日选择事项与日期范围。
3. 复制生成的结构化提示词，发送给你常用的 AI 工具进行解读。
4. 在历史记录中找回之前生成过的排盘、占卜和提示词。

## 给开发者

命语提供三种集成方式：公开 API、MCP Server、公开 skill。API 和 MCP 都支持一站式返回 `result` 与 `prompt`，README 只保留快速入口和安装方式，接口参数、客户端配置和调用示例请跳转到对应文档。

### 公开 API

无需安装，直接调用线上接口：

```text
https://aov.cc/api/v1
```

详细文档：[docs/api.md](docs/api.md)

OpenAPI：[https://aov.cc/api/v1/openapi.json](https://aov.cc/api/v1/openapi.json)

### MCP Server

命语内置 MCP Server，让支持 MCP 的 AI 客户端直接调用本地排盘引擎，不需要用户手动复制 JSON 或提示词。

快速安装：

```bash
git clone https://github.com/Brhiza/mingyu.git
cd mingyu
npm install
```

启动命令：

```bash
npm run mcp
```

详细文档：[mcp/README.md](mcp/README.md)

### 公开 skill

这个 skill 面向 AI 代理和开发者，说明如何通过 `aov.cc` 公开 API 完成排盘、占卜和提示词生成。

快速安装：

```bash
npx skills add Brhiza/mingyu --skill aov-mingyu-api -g -y
```

快速读取：

```text
让你的 AI 代理读取这个 skill：
https://aov.cc/skills/aov-mingyu-api/SKILL.md
```

如果当前环境无法使用 `npx skills`，也可以手动创建目录后保存：

```bash
mkdir -p ~/.codex/skills/aov-mingyu-api
curl -L https://aov.cc/skills/aov-mingyu-api/SKILL.md \
  -o ~/.codex/skills/aov-mingyu-api/SKILL.md
```

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$env:USERPROFILE\.codex\skills\aov-mingyu-api"
Invoke-WebRequest "https://aov.cc/skills/aov-mingyu-api/SKILL.md" `
  -OutFile "$env:USERPROFILE\.codex\skills\aov-mingyu-api\SKILL.md"
```

详细文档：[public/skills/aov-mingyu-api/SKILL.md](public/skills/aov-mingyu-api/SKILL.md)

元数据发现：[https://aov.cc/.well-known/aov-mingyu-api.json](https://aov.cc/.well-known/aov-mingyu-api.json)

## 技术栈

| 类别 | 技术 |
| --- | --- |
| 前端 | React 19、TypeScript 5.9 |
| 构建 | Vite 7 |
| 路由 | React Router 7 |
| 部署 | Cloudflare Pages、Pages Functions |
| 历法与星盘 | `tyme4ts`、`iztro` |
| 数据校验 | `zod` |
| 测试 | Node.js 原生测试运行器 |
| AI 集成 | MCP Server、OpenAPI、skill 文档 |

## 项目结构

```text
mingyu/
├── functions/                 # Cloudflare Pages Functions 公开 API
├── mcp/                       # MCP Server
├── public/
│   ├── .well-known/           # 公开发现元数据
│   └── skills/                # 公开 skill 文档
├── src/
│   ├── components/            # 页面组件与通用 UI
│   ├── lib/
│   │   ├── divination/        # 占卜引擎与提示词拼装
│   │   ├── full-chart-engine/ # 八字、紫微完整排盘入口
│   │   ├── iztro/             # 紫微运行时适配
│   │   ├── public-api/        # 公开 API handler
│   │   └── ziwei-prompts/     # 紫微提示词模块
│   ├── pages/                 # 输入页、结果页、历史页、教程页
│   ├── types/                 # 领域类型定义
│   ├── utils/                 # 八字、塔罗、历法、灵签等工具
│   └── workers/               # 紫微相关 Web Worker
└── tests/                     # 单元测试与集成测试
```

## 本地开发

安装依赖：

```bash
npm install
```

启动网页开发服务：

```bash
npm run dev
```

启动 MCP Server：

```bash
npm run mcp
```

构建生产版本：

```bash
npm run build
```

运行测试：

```bash
npm test
```

类型检查 MCP 与共享源码：

```bash
npx tsc --project mcp/tsconfig.json --noEmit
```

## 模型评测

比赛资料位于：[docs/2025第十六届全球算命师比赛](docs/2025第十六届全球算命师比赛)

交互式运行：

```bash
npm run contest:evaluate
```

脚本会依次询问接口 URL、API Key 和模型名称，自动读取 8 份提示词与 `正确答案.md`。每个命例只要求模型输出 5 个 A/B/C/D 答案字母，减少长理由导致的截断和解析错误；调用完成后输出 100 分制总分、准确率、分命例得分和逐题明细。

也可以直接传参：

```bash
npm run contest:evaluate -- --format chat --url https://api.openai.com/v1 --key sk-xxx --model gpt-4.1-mini
```

批量并发评测：

```bash
npm run contest:evaluate -- --format chat --url https://openrouter.ai/api/v1 --key sk-xxx --concurrency 3 --models "GPT-5.4=openai/gpt-5.4,Claude Sonnet 4.6=anthropic/claude-sonnet-4.6"
```

`--concurrency` 控制同时评测的模型数量，默认批量为 3；`--caseConcurrency` 控制同一模型内命例并发数量，默认 1。批量模式会合并更新比赛目录下的 `模型评测排名报告.md` 和 `评测结果/本次排名原始结果.json`。

使用 OpenRouter 测 reasoning 模型时，可以加 `--reasoningEffort none --excludeReasoning --maxTokens 256`，让模型尽量只返回最终答案。若某个命例没有解析满 5 个答案，脚本会把该模型标为失败，不会把 `?????` 当作 0 分答案计入排名。

支持的 `--format`：

| 格式 | 说明 | URL 示例 |
| --- | --- | --- |
| `chat` | OpenAI Chat Completions 或兼容接口 | `https://api.openai.com/v1` |
| `responses` | OpenAI Responses | `https://api.openai.com/v1` |
| `claude` | Claude Messages | `https://api.anthropic.com/v1` |
| `gemini` | Gemini generateContent | `https://generativelanguage.googleapis.com/v1beta` |

不传 `--format` 时会自动识别；评测报告会保存到比赛资料目录下的 `评测结果/`。

## 适合贡献的方向

- 补充更多命理、占卜与提示词测试样例。
- 优化公开 API 的字段文档和返回示例。
- 增加更多 AI 客户端的 MCP 配置示例。
- 扩展 skill，使更多代理能自动发现并调用命语。
- 增强移动端体验、可访问性和教程说明。

## 免责声明

命语提供的是命理、占卜与 AI 提示词辅助工具，结果仅供参考和娱乐学习使用，不应替代医疗、法律、投资、心理咨询等专业建议。

## 项目关键词

算命、AI 算命、在线算命、免费算命、智能算命、八字算命、八字排盘、紫微斗数、紫微排盘、星盘、占星排盘、六爻起卦、梅花易数、奇门遁甲、大六壬、小六壬、塔罗占卜、塔罗抽牌、雷诺曼、抽签、灵签、三山国王灵签、择日、黄道吉日、命理工具、占卜工具、运势分析、婚姻算命、事业运势、财运分析。
