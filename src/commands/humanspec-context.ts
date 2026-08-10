import { promises as fs } from 'node:fs';
import path from 'node:path';

import { Command, Option } from 'commander';

import {
  createHumanSpecContextResult,
  humanSpecContextExitCode,
  toHumanSpecContextPlanningHome,
  type HumanSpecContextIssue,
  type HumanSpecContextIssueCode,
  type HumanSpecContextOperation,
  type HumanSpecContextResult,
  type HumanSpecContextStatus,
} from '../core/humanspec-context.js';
import {
  isRootSelectionError,
  resolveOpenSpecRoot,
  type ResolvedOpenSpecRoot,
} from '../core/root-selection.js';
import {
  ProjectDocTemplateAssetError,
  PROJECT_DOC_TEMPLATES,
  readProjectDocTemplate,
  resolveProjectDocTemplateAssetPath,
  type ProjectDocId,
} from '../core/templates/project-docs.js';
import {
  applyArchiveFeedback,
  planArchiveFeedback,
  readProjectDocumentFeedbackContext,
  reconcileArchiveFeedback,
  resolveNextRoadmapContext,
  type ArchiveFeedbackApplyResult,
  type ArchiveFeedbackPlan,
  type NextRoadmapContext,
  type ProjectDocumentFeedbackIssue,
} from '../core/templates/project-doc-feedback.js';
import { COMMON_FLAGS } from '../core/completions/shared-flags.js';
import { asStatus, printJson } from './shared-output.js';

interface RootOptions {
  json?: boolean;
  store?: string;
  storePath?: string;
}

interface ChangeOptions extends RootOptions {
  change?: string;
}

interface ApplyOptions extends RootOptions {
  plan?: string;
  yes?: boolean;
}

interface InspectDocumentData {
  id: ProjectDocId;
  path: string;
  templatePath: string;
  markerType: string;
  templateVersion: string | null;
  template: string | null;
  requiredHeadings: readonly { id: string; heading: string; level: 1 | 2 }[];
  classification: string;
  headings: Record<string, number>;
  issues: HumanSpecContextIssue[];
}

class HumanSpecContextCommandError extends Error {
  constructor(
    readonly code: HumanSpecContextIssueCode,
    message: string,
    readonly status: HumanSpecContextStatus = 'error'
  ) {
    super(message);
    this.name = 'HumanSpecContextCommandError';
  }
}

function hiddenStorePathOption(): Option {
  return new Option(
    '--store-path <path>',
    'Not supported; register the path with "openspec store register <path>" and use --store <id>'
  ).hideHelp();
}

function documentIssueCode(code: ProjectDocumentFeedbackIssue['code']): HumanSpecContextIssueCode {
  switch (code) {
    case 'missing': return 'document_missing';
    case 'unreadable': return 'document_unreadable';
    case 'unmarked': return 'document_unmarked';
    case 'malformed': return 'document_malformed';
    case 'duplicated': return 'document_duplicated';
    case 'ambiguous': return 'document_ambiguous';
    case 'confirmation-required': return 'confirmation_required';
    case 'precondition': return 'precondition_conflict';
    case 'conflict': return 'precondition_conflict';
  }
}

function toContextIssue(issue: ProjectDocumentFeedbackIssue): HumanSpecContextIssue {
  return {
    code: documentIssueCode(issue.code),
    message: issue.message,
    document: issue.document,
    ...(issue.anchor ? { anchor: issue.anchor } : {}),
    ...(issue.line !== undefined ? { line: issue.line } : {}),
  };
}

function errorCode(error: unknown): HumanSpecContextIssueCode {
  if (error instanceof HumanSpecContextCommandError) return error.code;
  const status = asStatus(error, 'context_error');
  if (isRootSelectionError(error)) {
    if (status.code.includes('store')) return status.code === 'store_not_found' ? 'store_not_found' : 'invalid_store';
    return 'planning_home_not_found';
  }
  if (status.code.includes('store')) return 'invalid_store';
  return 'internal_error';
}

function errorResult(operation: HumanSpecContextOperation, error: unknown): HumanSpecContextResult<Record<string, never>> {
  const status = error instanceof HumanSpecContextCommandError ? error.status : 'error';
  return createHumanSpecContextResult({
    operation,
    status,
    planningHome: null,
    data: {},
    issues: [{
      code: errorCode(error),
      message: error instanceof Error ? error.message : String(error),
    }],
  });
}

async function executeOperation<TData>(
  operation: HumanSpecContextOperation,
  options: RootOptions,
  handler: (root: ResolvedOpenSpecRoot) => Promise<HumanSpecContextResult<TData>>
): Promise<void> {
  let result: HumanSpecContextResult<TData> | HumanSpecContextResult<Record<string, never>>;
  try {
    const root = await resolveOpenSpecRoot({
      ...(options.store !== undefined ? { store: options.store } : {}),
      ...(options.storePath !== undefined ? { storePath: options.storePath } : {}),
      allowImplicitRoot: false,
    });
    result = await handler(root);
  } catch (error) {
    result = errorResult(operation, error);
  }
  // Public JSON operations reserve stdout for exactly one parseable envelope.
  printJson(result);
  process.exitCode = humanSpecContextExitCode(result.status);
}

function templateVersion(content: string): string | null {
  const match = content.match(/^version:\s*(.+?)\s*$/mu);
  return match?.[1] ?? null;
}

function contextStatus(hasIssues: boolean): HumanSpecContextStatus {
  return hasIssues ? 'blocked' : 'ready';
}

async function inspect(root: ResolvedOpenSpecRoot): Promise<HumanSpecContextResult<{ documents: InspectDocumentData[] }>> {
  const context = await readProjectDocumentFeedbackContext(root.path);
  const templateIssues: HumanSpecContextIssue[] = [];
  const documents = await Promise.all(PROJECT_DOC_TEMPLATES.map(async (template): Promise<InspectDocumentData> => {
    const analysis = context.analyses[template.id];
    let content: string | null = null;
    try {
      content = await readProjectDocTemplate(template.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      templateIssues.push({
        code: 'template_missing',
        message,
        document: template.id,
        path: error instanceof ProjectDocTemplateAssetError
          ? error.assetPath
          : resolveProjectDocTemplateAssetPath(template.id),
      });
    }
    return {
      id: template.id,
      path: analysis?.path ?? path.join(root.path, 'openspec', template.fileName),
      templatePath: resolveProjectDocTemplateAssetPath(template.id),
      markerType: template.markerType,
      templateVersion: content ? templateVersion(content) : null,
      template: content,
      requiredHeadings: template.requiredHeadings,
      classification: analysis?.status ?? 'missing',
      headings: analysis?.headings ?? {},
      issues: (analysis?.issues ?? []).map(toContextIssue),
    };
  }));
  const issues = [...context.issues.map(toContextIssue), ...templateIssues];
  return createHumanSpecContextResult({
    operation: 'inspect',
    status: templateIssues.length > 0 ? 'error' : contextStatus(issues.length > 0),
    planningHome: toHumanSpecContextPlanningHome(root),
    data: { documents },
    issues,
    ...(issues.length > 0 ? { nextAction: 'Repair the listed project documents or package template assets, then run inspect again.' } : {}),
  });
}

function nextActionForContext(context: NextRoadmapContext): string | undefined {
  switch (context.status) {
    case 'blocked': return 'Repair the listed project documents before choosing the next roadmap slice.';
    case 'reconciliation': return 'Run feedback-reconcile for the pending archived change before choosing new work.';
    case 'ready': return 'Choose one returned candidate slice for the next change.';
    case 'empty': return 'No unchecked candidate slice is currently available.';
  }
}

async function next(root: ResolvedOpenSpecRoot): Promise<HumanSpecContextResult<{
  candidates: NextRoadmapContext['candidates'];
  archivedChanges: string[];
  pendingFeedback: NextRoadmapContext['pendingFeedback'];
  learnerRecords: NextRoadmapContext['learnerRecords'];
}>> {
  const context = await readProjectDocumentFeedbackContext(root.path);
  const roadmap = context.analyses.roadmap;
  const learner = context.analyses.learner;
  if (context.issues.length > 0 || !roadmap?.content || !learner?.content) {
    return createHumanSpecContextResult({
      operation: 'next',
      status: 'blocked',
      planningHome: toHumanSpecContextPlanningHome(root),
      data: { candidates: [], archivedChanges: [], pendingFeedback: [], learnerRecords: [] },
      issues: context.issues.map(toContextIssue),
      nextAction: 'Repair the listed project documents before choosing the next roadmap slice.',
    });
  }
  const resolved = resolveNextRoadmapContext(roadmap.content, learner.content, {
    roadmapPath: roadmap.path,
    learnerPath: learner.path,
  });
  return createHumanSpecContextResult({
    operation: 'next',
    status: resolved.status,
    planningHome: toHumanSpecContextPlanningHome(root),
    data: {
      candidates: resolved.candidates,
      archivedChanges: resolved.archivedChangeNames,
      pendingFeedback: resolved.pendingFeedback,
      learnerRecords: resolved.learnerRecords,
    },
    issues: resolved.issues.map(toContextIssue),
    ...(nextActionForContext(resolved) ? { nextAction: nextActionForContext(resolved) } : {}),
  });
}

function ensureChangeName(changeName: string | undefined): string {
  const normalized = changeName?.trim();
  if (!normalized) {
    throw new HumanSpecContextCommandError('invalid_input', 'A non-empty --change value is required.', 'error');
  }
  if (normalized.includes('\u0000') || normalized.includes('/') || normalized.includes('\\')) {
    throw new HumanSpecContextCommandError('invalid_input', 'The --change value must be a change name, not a path.', 'error');
  }
  return normalized;
}

function archiveNameMatches(changeName: string, archiveName: string): boolean {
  if (archiveName === changeName) return true;
  const match = archiveName.match(/^\d{4}-\d{2}-\d{2}-(.+)$/u);
  return match?.[1] === changeName;
}

async function resolveCanonicalArchive(root: ResolvedOpenSpecRoot, changeName: string): Promise<string> {
  let entries: import('node:fs').Dirent[];
  try {
    entries = await fs.readdir(root.archiveDir, { withFileTypes: true });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'ENOTDIR') {
      throw new HumanSpecContextCommandError('archive_not_found', `No archive directory exists for change ${JSON.stringify(changeName)}.`, 'error');
    }
    throw error;
  }
  const matches = entries
    .filter((entry) => entry.isDirectory() && archiveNameMatches(changeName, entry.name))
    .map((entry) => path.join(root.archiveDir, entry.name));
  if (matches.length === 0) {
    throw new HumanSpecContextCommandError('archive_not_found', `No canonical archive matches change ${JSON.stringify(changeName)}.`, 'error');
  }
  if (matches.length > 1) {
    throw new HumanSpecContextCommandError('invalid_input', `Multiple archives match change ${JSON.stringify(changeName)}; select a uniquely archived change.`, 'error');
  }
  return matches[0];
}

function feedbackPlanResult(
  operation: 'feedback-plan' | 'feedback-reconcile',
  root: ResolvedOpenSpecRoot,
  plan: ArchiveFeedbackPlan,
  data: Record<string, unknown>
): HumanSpecContextResult<Record<string, unknown>> {
  return createHumanSpecContextResult({
    operation,
    status: plan.status,
    planningHome: toHumanSpecContextPlanningHome(root),
    data,
    issues: plan.issues.map(toContextIssue),
    ...(plan.status === 'ready'
      ? { nextAction: 'Present the plan to the learner, then run feedback-apply with --yes only after explicit confirmation.' }
      : plan.status === 'already-applied'
        ? { nextAction: 'Feedback is already applied; choose the next roadmap action.' }
        : { nextAction: 'Repair the listed feedback issues and create a new plan.' }),
  });
}

async function feedbackPlan(root: ResolvedOpenSpecRoot, options: ChangeOptions): Promise<HumanSpecContextResult<Record<string, unknown>>> {
  const changeName = ensureChangeName(options.change);
  const archivedPath = await resolveCanonicalArchive(root, changeName);
  const plan = await planArchiveFeedback({ projectRoot: root.path, changeName, archivedPath });
  return feedbackPlanResult('feedback-plan', root, plan, { plan, archivedPath });
}

function usesWindowsPathSemantics(...values: string[]): boolean {
  return values.some((value) => path.win32.isAbsolute(value) && !path.isAbsolute(value));
}

function samePlanningHome(left: string, right: string): boolean {
  const useWindows = usesWindowsPathSemantics(left, right);
  const resolver = useWindows ? path.win32 : path;
  const normalizedLeft = resolver.resolve(left);
  const normalizedRight = resolver.resolve(right);
  return useWindows
    ? normalizedLeft.toLocaleLowerCase() === normalizedRight.toLocaleLowerCase()
    : normalizedLeft === normalizedRight;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isReadyFeedbackPlan(value: Record<string, unknown>): boolean {
  if (value.status !== 'ready' || value.ready !== true || value.alreadyApplied !== false
    || typeof value.changeName !== 'string' || value.changeName.trim() === ''
    || typeof value.planningHome !== 'string' || value.planningHome.trim() === ''
    || !isRecord(value.documents) || !Array.isArray(value.issues)) {
    return false;
  }
  if (Object.keys(value.documents).some((id) => id !== 'roadmap' && id !== 'learner')) return false;
  const roadmap = value.documents.roadmap;
  const learner = value.documents.learner;
  if (!isRecord(roadmap) || !isRecord(learner)) return false;
  const validDocument = (document: Record<string, unknown>, id: ProjectDocId, fields: string[]) =>
    document.id === id
    && typeof document.path === 'string'
    && typeof document.before === 'string'
    && typeof document.beforeSha256 === 'string'
    && typeof document.changed === 'boolean'
    && fields.every((field) => typeof document[field] === 'string');
  return validDocument(roadmap, 'roadmap', ['pendingContent', 'completeContent'])
    && validDocument(learner, 'learner', ['proposedContent']);
}

function parseFeedbackPlanEnvelope(input: string): ArchiveFeedbackPlan {
  let value: unknown;
  try {
    value = JSON.parse(input);
  } catch {
    throw new HumanSpecContextCommandError('invalid_plan', 'Feedback plan input is not valid JSON.', 'error');
  }
  if (!isRecord(value)
    || value.version !== 1
    || value.operation !== 'feedback-plan'
    || !isRecord(value.data)
    || !isRecord(value.data.plan)) {
    throw new HumanSpecContextCommandError(
      'invalid_plan',
      'Feedback apply requires a version 1 feedback-plan result containing data.plan.',
      'error'
    );
  }
  const plan = value.data.plan;
  if (!isReadyFeedbackPlan(plan)) {
    throw new HumanSpecContextCommandError(
      'invalid_plan',
      'Feedback apply requires a valid ready feedback plan with bound roadmap and learner operations.',
      'error'
    );
  }
  return plan as unknown as ArchiveFeedbackPlan;
}

async function readPlanInput(planPath: string | undefined): Promise<ArchiveFeedbackPlan> {
  if (!planPath) {
    throw new HumanSpecContextCommandError('invalid_input', 'A --plan <path|-> value is required.', 'error');
  }
  try {
    const content = planPath === '-'
      ? await new Promise<string>((resolve, reject) => {
        let input = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', (chunk) => { input += chunk; });
        process.stdin.on('end', () => resolve(input));
        process.stdin.on('error', reject);
      })
      : await fs.readFile(planPath, 'utf8');
    return parseFeedbackPlanEnvelope(content);
  } catch (error) {
    if (error instanceof HumanSpecContextCommandError) throw error;
    throw new HumanSpecContextCommandError('invalid_plan', `Could not read feedback plan ${JSON.stringify(planPath)}: ${String(error)}.`, 'error');
  }
}

async function feedbackApply(root: ResolvedOpenSpecRoot, options: ApplyOptions): Promise<HumanSpecContextResult<Record<string, unknown>>> {
  const plan = await readPlanInput(options.plan);
  if (!samePlanningHome(plan.planningHome, root.path)) {
    return createHumanSpecContextResult({
      operation: 'feedback-apply',
      status: 'conflict',
      planningHome: toHumanSpecContextPlanningHome(root),
      data: {},
      issues: [{
        code: 'path_outside_planning_home',
        message: `Feedback plan belongs to ${plan.planningHome}, not the selected planning home ${root.path}.`,
      }],
      nextAction: 'Create a new feedback plan from the selected project or store.',
    });
  }
  if (options.yes !== true) {
    return createHumanSpecContextResult({
      operation: 'feedback-apply',
      status: 'blocked',
      planningHome: toHumanSpecContextPlanningHome(root),
      data: { plan },
      issues: [{
        code: 'confirmation_required',
        message: 'Feedback application requires --yes after explicit learner confirmation.',
      }],
      nextAction: 'Obtain explicit learner confirmation, then rerun feedback-apply with --yes.',
    });
  }
  const result = await applyArchiveFeedback(plan, { confirmed: true });
  return createHumanSpecContextResult({
    operation: 'feedback-apply',
    status: result.status,
    planningHome: toHumanSpecContextPlanningHome(root),
    data: { result },
    issues: result.issues.map(toContextIssue),
    nextAction: result.nextAction,
  });
}

async function feedbackReconcile(root: ResolvedOpenSpecRoot, options: ChangeOptions): Promise<HumanSpecContextResult<Record<string, unknown>>> {
  const changeName = ensureChangeName(options.change);
  const archivedPath = await resolveCanonicalArchive(root, changeName);
  const result: ArchiveFeedbackApplyResult = await reconcileArchiveFeedback({
    projectRoot: root.path,
    changeName,
    archivedPath,
  });
  return createHumanSpecContextResult({
    operation: 'feedback-reconcile',
    status: result.status,
    planningHome: toHumanSpecContextPlanningHome(root),
    data: { result, archivedPath },
    issues: result.issues.map(toContextIssue),
    nextAction: result.nextAction,
  });
}

function addRootOptions(command: Command): Command {
  return command
    .option('--json', 'Output a versioned JSON result')
    .option('--store <id>', COMMON_FLAGS.store.description)
    .addOption(hiddenStorePathOption());
}

/** Registers the public HumanSpec project-context runtime command group. */
export function registerHumanSpecContextCommand(program: Command): void {
  const humanspec = program
    .command('humanspec')
    .description('Run HumanSpec project-context operations');
  const context = humanspec
    .command('context')
    .description('Inspect and update registered HumanSpec project documents');

  addRootOptions(context
    .command('inspect')
    .description('Inspect registered templates and project-document state'))
    .action(async (options: RootOptions) => executeOperation('inspect', options, inspect));

  addRootOptions(context
    .command('next')
    .description('Resolve the next HumanSpec roadmap context'))
    .action(async (options: RootOptions) => executeOperation('next', options, next));

  addRootOptions(context
    .command('feedback-plan')
    .description('Create a feedback plan from canonical archived evidence')
    .option('--change <name>', 'Archived change name'))
    .action(async (options: ChangeOptions) => executeOperation('feedback-plan', options, (root) => feedbackPlan(root, options)));

  addRootOptions(context
    .command('feedback-apply')
    .description('Apply a confirmed feedback plan')
    .option('--plan <path|->', 'Feedback-plan JSON file, or - for standard input')
    .option('--yes', 'Confirm that the learner explicitly approved this plan'))
    .action(async (options: ApplyOptions) => executeOperation('feedback-apply', options, (root) => feedbackApply(root, options)));

  addRootOptions(context
    .command('feedback-reconcile')
    .description('Resume a pending feedback operation from archived evidence')
    .option('--change <name>', 'Archived change name'))
    .action(async (options: ChangeOptions) => executeOperation('feedback-reconcile', options, (root) => feedbackReconcile(root, options)));
}
