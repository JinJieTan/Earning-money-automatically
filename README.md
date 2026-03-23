# Agent Earner (v1.3 MVP)

Node.js 全栈实验平台，用于验证 AI Agent 在低人工干预下的创收执行能力。

## 1. 功能覆盖

- Next.js 14 App Router Dashboard
- SQLite 全量持久化（`tasks`, `task_logs`, `earnings`, `snapshots`, `agent_state`, `installed_deps`）
- Agent Tick 调度（`node-cron`）
- Playwright 平台访问骨架（Fiverr / Medium / Upwork）
- OpenAI SDK 对接本地兼容 `/v1/chat/completions`
- Dashboard 鉴权（JWT / API Key）
- 每 30 分钟快照落库

## 2. 快速开始

1. 安装依赖

```bash
npm install
```

2. 配置环境变量

```bash
cp .env.example .env
```

3. 初始化数据库

```bash
npm run db:migrate
```

4. 启动 Web

```bash
npm run dev
```

5. 启动 Agent 调度进程（另一个终端）

```bash
npm run agent
```

## 3. API 入口

- `POST /api/auth/login`：传入 `x-api-key` 或 JSON `{ "apiKey": "..." }` 获取 JWT
- `GET /api/dashboard/summary`：Dashboard 汇总（需鉴权）
- `GET /api/tasks`：任务列表（需鉴权）
- `POST /api/tasks`：创建任务（需鉴权）
- `GET /api/agent`：Agent 控制与状态（需鉴权）
- `POST /api/agent`：`start|stop|tick`（需鉴权）
- `POST /api/earnings/confirm`：确认真实到账并写入收益（需鉴权）

## 4. 默认安全边界

- 域名白名单：从 `ALLOWED_DOMAINS` 读取并强校验
- 禁止危险命令模式（`rm -rf` 等）执行
- 日志脱敏基础能力（API/JWT/LLM key）
- 不读取本地文件上传至网络（当前代码未实现该路径）

## 5. 当前限制

- 平台自动化仅为 v1 骨架（登录、发单、投递选择器流程未完整接入）
- 默认建议 `AGENT_DRY_RUN=true`
- 当前版本不会自动把 `expected_usd` 写入真实收益，必须通过 `POST /api/earnings/confirm` 确认到账
- 未实现多实例任务抢占锁（生产建议增加任务 lease）

## 6. Docker 运行

```bash
docker compose up -d --build
```

容器：
- `web`：Next.js Dashboard/API
- `agent`：独立调度循环
