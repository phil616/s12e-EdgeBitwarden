# EdgeBitwarden

EdgeBitwarden 是一个基于 Next.js 构建的现代、安全且注重隐私的密码管理器。它采用了最新的 Web 技术标准，旨在为用户提供类似于商业级密码管理器的体验，同时保持开源和可自托管的灵活性。

![Preview](preview.png)

## 核心特性

*   **端到端加密**：使用 Web Crypto API 在客户端进行加密，确保只有您能解密数据。服务器仅存储加密后的数据块。
*   **Passkey 支持**：集成 WebAuthn，支持使用指纹、Face ID 或硬件密钥（如 YubiKey）进行无密码登录和解锁。
*   **现代 UI/UX**：基于 Tailwind CSS 和 Framer Motion 打造的流畅、响应式界面，拥有细腻的微交互动效。
*   **安全便签**：支持 Markdown 渲染和代码高亮的安全便签功能。
*   **零知识架构**：主密码从不离身，服务器端无法得知您的密钥。
*   **灵活存储**：支持自定义 KV 存储后端，数据掌控在自己手中。

## 技术栈

*   **框架**: [Next.js 16](https://nextjs.org/) (App Router)
*   **语言**: [TypeScript](https://www.typescriptlang.org/)
*   **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
*   **动画**: [Framer Motion](https://www.framer.com/motion/)
*   **认证**: [SimpleWebAuthn](https://simplewebauthn.dev/) (Passkeys)
*   **图标**: [Lucide React](https://lucide.dev/)
*   **工具**: React Hook Form, Zod, Sonner

## 本地开发

### 前置要求

*   Node.js 18+
*   npm 或 yarn

### 1. 克隆项目

```bash
git clone https://github.com/your-username/edge-bitwarden.git
cd edge-bitwarden
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

复制 `.env` 文件示例：

```bash
cp .env .env.local
```

编辑 `.env.local` 文件，配置必要的环境变量。对于本地开发，可以使用默认的 WebAuthn 配置，但需要确保 `KV_API_URL` 和 `KV_API_KEY` 指向有效的 KV 存储服务（或使用本地 Mock 服务）。

```env
# KVDB 配置 (用于存储加密后的数据)
KV_API_URL=https://your-kv-service.com/api
KV_API_KEY=your-secret-key

# WebAuthn 配置 (本地开发默认值)
NEXT_PUBLIC_RP_ID=localhost
NEXT_PUBLIC_RP_NAME=EdgeBitwarden
NEXT_PUBLIC_ORIGIN=http://localhost:3000
```

> **注意**：本项目依赖外部 KV 存储服务来持久化数据。您可以使用任何兼容简单 REST API (GET/PUT/POST) 的 KV 服务，或者编写自己的适配器。

### 4. 启动开发服务器

```bash
npm run dev
```

打开浏览器访问 [http://localhost:3000](http://localhost:3000) 即可看到应用。

## 生产环境部署

### Vercel 部署（推荐）

EdgeBitwarden 针对 Vercel 进行了优化，部署非常简单：

1.  将代码推送到 GitHub/GitLab。
2.  在 Vercel 导入项目。
3.  在 Vercel 项目设置中配置环境变量（参考上文）。
4.  点击 Deploy。

### Docker / 自托管

构建生产版本：

```bash
npm run build
npm start
```

确保在生产环境的服务器上配置了正确的 `NEXT_PUBLIC_RP_ID` 和 `NEXT_PUBLIC_ORIGIN`，否则 Passkey 功能将无法工作（WebAuthn 对域名有严格限制）。

## 安全说明

*   **主密码重要性**：由于采用零知识架构，如果您忘记了主密码，**没有人（包括管理员）能帮您恢复数据**。请务必牢记主密码或将其备份在安全的地方。
*   **HTTPS**：生产环境**必须**使用 HTTPS，否则浏览器会禁用 Web Crypto API 和 WebAuthn 功能。

## 许可证

MIT License
