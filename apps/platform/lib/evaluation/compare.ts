export interface ComparableIssue { ruleId: string; selector: string; impact?: string; pageScan: { pageUrl: string } }
const key = (issue: ComparableIssue) => `${issue.ruleId}|${issue.pageScan.pageUrl}|${issue.selector}`;
export function compareIssues(before: ComparableIssue[], after: ComparableIssue[]) { const beforeKeys = new Set(before.map(key)), afterKeys = new Set(after.map(key)); return { resolved: before.filter(issue => !afterKeys.has(key(issue))), remaining: before.filter(issue => afterKeys.has(key(issue))), regressions: after.filter(issue => !beforeKeys.has(key(issue))) }; }
