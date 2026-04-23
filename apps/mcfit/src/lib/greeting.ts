export function getGreeting(): { line: string; sub: string } {
  const h = new Date().getHours();
  if (h < 6) return { line: "嗨，凌晨好", sub: "注意作息哦" };
  if (h < 12) return { line: "嗨，早安！", sub: "今天也要保持状态" };
  if (h < 18) return { line: "嗨，午安", sub: "该动一动了" };
  return { line: "嗨，晚上好", sub: "收工也别忘记拉伸" };
}
