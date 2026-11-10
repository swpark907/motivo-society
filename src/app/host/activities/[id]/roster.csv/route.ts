import { getHostActivity, logRosterExport } from "@/lib/platform/host";
import { rosterCsv, rosterFileName } from "@/lib/platform/host-activity-view";
import { ORDER_STATUS_LABELS } from "@/lib/platform/messages";
import { getCurrentUser } from "@/lib/platform/session";
import { isUuid } from "@/lib/platform/ids";

// 명단 CSV 내려받기(H09). 관리 권한이 있는 사람만, 내보낼 때마다 감사 기록을 남긴다.
export async function GET(req: Request, ctx: RouteContext<"/host/activities/[id]/roster.csv">) {
  const { id } = await ctx.params;
  if (!isUuid(id)) return new Response("Not found", { status: 404 });
  const user = await getCurrentUser();
  if (!user) {
    return Response.redirect(
      new URL(`/login?next=${encodeURIComponent(`/host/activities/${id}`)}`, req.url),
      303,
    );
  }
  const result = await getHostActivity(id);
  if (!result.found) return new Response("Not found", { status: 404 });
  if (!result.canManage) return new Response("Forbidden", { status: 403 });
  if (await logRosterExport(id, "csv")) return new Response("Forbidden", { status: 403 });

  const a = result.activity;
  const body = rosterCsv(a.kind, a.roster, ORDER_STATUS_LABELS, a.threshold);
  const name = rosterFileName(a.title, new Date());
  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="roster.csv"; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}
