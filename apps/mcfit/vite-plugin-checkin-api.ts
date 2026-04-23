import type { IncomingMessage, ServerResponse } from "node:http";
import { createRequire } from "node:module";
import type { Connect } from "vite";
import type { Plugin } from "vite";
import { runAmapNearestOpenMcDonald } from "./vite-amap-nearest-mcd";

const require = createRequire(import.meta.url);

function readJsonBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c) => chunks.push(c as Buffer));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function setCors(res: ServerResponse): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function attachAmapNearestMcdMiddleware(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/amap-nearest-mcd")) {
      next();
      return;
    }

    if (req.method === "OPTIONS") {
      setCors(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      next();
      return;
    }

    try {
      const raw = await readJsonBody(req as IncomingMessage);
      const body = JSON.parse(raw) as unknown;
      const result = await runAmapNearestOpenMcDonald(body);
      setCors(res);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(result));
    } catch (e) {
      setCors(res);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: false,
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  });
}

function attachCheckinMenuMiddleware(middlewares: Connect.Server): void {
  middlewares.use(async (req, res, next) => {
    if (!req.url?.startsWith("/api/checkin-menu")) {
      next();
      return;
    }

    if (req.method === "OPTIONS") {
      setCors(res);
      res.statusCode = 204;
      res.end();
      return;
    }

    if (req.method !== "POST") {
      next();
      return;
    }

    /** 使用包入口解析路径（exports 未导出 package.json 时不能 resolve package.json） */
    const apiEntry = require.resolve("@mcfit/api");

    let runCheckinMenuAgent: (body: unknown) => Promise<{ message: string }>;
    try {
      const mod = await import(apiEntry);
      runCheckinMenuAgent = mod.runCheckinMenuAgent as typeof runCheckinMenuAgent;
      if (typeof runCheckinMenuAgent !== "function") {
        throw new Error("runCheckinMenuAgent 未导出");
      }
    } catch (e) {
      setCors(res);
      res.statusCode = 503;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error:
            "无法加载 @mcfit/api（请先执行：pnpm --filter @mcfit/api build）。若出现 intakeBudgetKcal 无效，通常是 dist 未更新。",
          detail: e instanceof Error ? e.message : String(e),
        }),
      );
      return;
    }

    try {
      const raw = await readJsonBody(req as IncomingMessage);
      const body = JSON.parse(raw) as Record<string, unknown>;
      const result = await runCheckinMenuAgent(body);
      setCors(res);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(result));
    } catch (e) {
      setCors(res);
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          error: e instanceof Error ? e.message : String(e),
        }),
      );
    }
  });
}

/**
 * 开发 / 本地 preview：将 POST `/api/checkin-menu` 转发到 `@mcfit/api`（需已构建 dist）。
 * 生产静态部署无此端点，应配置 `VITE_CHECKIN_MENU_URL` 指向自有 BFF，并处理 CORS。
 */
export function checkinMenuApiPlugin(): Plugin {
  return {
    name: "mcfit-checkin-menu-api",
    configureServer(server) {
      attachAmapNearestMcdMiddleware(server.middlewares);
      attachCheckinMenuMiddleware(server.middlewares);
    },
    configurePreviewServer(server) {
      attachAmapNearestMcdMiddleware(server.middlewares);
      attachCheckinMenuMiddleware(server.middlewares);
    },
  };
}
