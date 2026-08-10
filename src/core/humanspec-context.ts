import type { ResolvedOpenSpecRoot } from './root-selection.js';

/** The compatibility version for every public HumanSpec context result. */
export const HUMANSPEC_CONTEXT_RESULT_VERSION = 1 as const;

export type HumanSpecContextOperation =
  | 'inspect'
  | 'next'
  | 'feedback-plan'
  | 'feedback-apply'
  | 'feedback-reconcile';

/**
 * Public operation states. A state is deliberately separate from process exit
 * status: callers can always parse one result before deciding what to do next.
 */
export type HumanSpecContextStatus =
  | 'ready'
  | 'empty'
  | 'blocked'
  | 'reconciliation'
  | 'complete'
  | 'pending'
  | 'already-applied'
  | 'conflict'
  | 'error';

/** Stable issue codes emitted by the public HumanSpec context boundary. */
export type HumanSpecContextIssueCode =
  | 'planning_home_not_found'
  | 'store_not_found'
  | 'invalid_store'
  | 'invalid_input'
  | 'invalid_plan'
  | 'change_not_found'
  | 'archive_not_found'
  | 'document_missing'
  | 'document_unreadable'
  | 'document_unmarked'
  | 'document_malformed'
  | 'document_duplicated'
  | 'document_ambiguous'
  | 'template_missing'
  | 'confirmation_required'
  | 'precondition_conflict'
  | 'path_outside_planning_home'
  | 'write_failed'
  | 'reconciliation_required'
  | 'internal_error';

export interface HumanSpecContextIssue {
  code: HumanSpecContextIssueCode;
  message: string;
  document?: 'project' | 'roadmap' | 'learner';
  path?: string;
  anchor?: string;
  line?: number;
}

export interface HumanSpecContextPlanningHome {
  path: string;
  source: ResolvedOpenSpecRoot['source'];
  storeId?: string;
}

export interface HumanSpecContextResult<TData = unknown> {
  version: typeof HUMANSPEC_CONTEXT_RESULT_VERSION;
  operation: HumanSpecContextOperation;
  status: HumanSpecContextStatus;
  planningHome: HumanSpecContextPlanningHome | null;
  data: TData;
  issues: HumanSpecContextIssue[];
  nextAction?: string;
}

export function toHumanSpecContextPlanningHome(
  root: ResolvedOpenSpecRoot
): HumanSpecContextPlanningHome {
  return {
    path: root.path,
    source: root.source,
    ...(root.storeId ? { storeId: root.storeId } : {}),
  };
}

export function createHumanSpecContextResult<TData>(options: {
  operation: HumanSpecContextOperation;
  status: HumanSpecContextStatus;
  planningHome: HumanSpecContextPlanningHome | null;
  data: TData;
  issues?: HumanSpecContextIssue[];
  nextAction?: string;
}): HumanSpecContextResult<TData> {
  return {
    version: HUMANSPEC_CONTEXT_RESULT_VERSION,
    operation: options.operation,
    status: options.status,
    planningHome: options.planningHome,
    data: options.data,
    issues: options.issues ?? [],
    ...(options.nextAction ? { nextAction: options.nextAction } : {}),
  };
}

/**
 * JSON-mode exit mapping. A caller may inspect every status from stdout; only
 * completed/evaluated states exit successfully.
 */
export function humanSpecContextExitCode(status: HumanSpecContextStatus): number {
  return status === 'ready'
    || status === 'empty'
    || status === 'complete'
    || status === 'already-applied'
    ? 0
    : 1;
}
