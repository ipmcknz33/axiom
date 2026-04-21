const approvalRequiredActions = new Set([
  "money.move",
  "trade.execute",
  "production.code_change",
  "permissions.modify",
  "legal_sensitive.publish"
]);

export function requiresApproval(action: string): boolean {
  return approvalRequiredActions.has(action);
}