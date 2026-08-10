# HumanSpec 实现缺口审计与修补计划

> 审计基线：`dev` 分支，提交 `81c0dcb`（2026-08-07）  
> 对照文档：[`humanspec-implementation-roadmap.md`](./humanspec-implementation-roadmap.md)  
> 审计性质：实现、测试、打包与发布链路的只读检查；除本文档外未修改实现。

## 1. 执行摘要

HumanSpec 的基础设施已经较完整：`human-learning` schema、HumanSpec profile、七个 workflow、无公开 apply 的默认安装、任务追踪、结构化状态接口、验证/归档 prompt，以及项目文档反馈内核均已存在。阶段 0–2 基本完成，阶段 3–7 已形成可供人工测试的 workflow 契约。

但严格对照路线图，当前还不只是“手动测试 + 最终仓库迁移”。主要剩余问题是：

1. workflow 要求调用的项目文档 helper 没有可调用的生产入口，相关“E2E”测试绕过了真实 workflow；
2. archive 后尚未更新里程碑或形成下一候选方向，阶段 8 的自适应闭环不完整；
3. verify 的持久化记录与 archive retry 所需的学习反馈格式不闭合；
4. init 存在自举矛盾和过期文案；
5. 三份项目文档模板没有进入发布包；
6. change 尺寸、学习反思和 verify 契约仍有若干路线图级遗漏；
7. 缺少真实的 HumanSpec 全闭环测试，Windows 发布守卫也存在可复现问题。

建议先修复确定性 runtime 契约和阶段 8 闭环，再进行人工模型测试，最后执行统一 manifest 与仓库迁移。否则人工测试会把“模型自行补全内部实现”的偶然成功误当成产品能力。

## 2. 审计范围与方法

本次检查覆盖：

- `docs/humanspec-implementation-roadmap.md` 的产品边界、阶段 0–9、测试策略和完成定义；
- `schemas/human-learning/`；
- `src/core/templates/workflows/humanspec-*.ts`；
- profile、skill/command 生成与 adapter parity；
- project document registry、feedback planner、next routing；
- init、update、archive、structured JSON CLI；
- HumanSpec unit、template、CLI E2E 与跨平台 CI；
- `npm pack` 产物和发布前版本检查。

审计没有采信已归档 change 的任务勾选状态，而是核对了当前源码、生成结果、调用关系和测试实际执行路径。

## 3. 当前验证结果

### 3.1 本地检查

| 检查 | 结果 |
|---|---|
| `pnpm test` | 137 个测试文件通过；3697 passed，24 skipped |
| `pnpm lint` | 通过 |
| `pnpm build` | 通过 |
| Git 工作区 | 审计结束时 clean |
| `pnpm check:pack-version` | Windows 失败：`spawnSync npm ENOENT` |

24 个跳过项均来自平台条件测试，未发现 HumanSpec 专属测试被显式跳过。

### 3.2 跨平台与打包

- `.github/workflows/ci.yml:45-116` 已配置 Ubuntu、macOS、Windows 测试矩阵。
- `npm pack --dry-run` 包含：
  - `schemas/human-learning/schema.yaml` 及三个 change artifact 模板；
  - 编译后的七个 HumanSpec workflow；
  - 编译后的 project-document feedback 模块。
- 但不包含：
  - `project.md`；
  - `roadmap.md`；
  - `learner.md` 三个项目文档模板。

### 3.3 阶段判断

| 阶段 | 判断 | 说明 |
|---|---|---|
| 阶段 0：行为基线 | 基本完成 | schema/DAG、skip、instructions、tracks、archive 等已有测试 |
| 阶段 1：human-learning schema | 完成 | schema、artifact 顺序、skip_specs、learning 任务统计均已实现 |
| 阶段 2：HumanSpec workflow 集合 | 完成 | 七个 workflow，无公开 apply，update/cleanup/parity 已覆盖 |
| 阶段 3：项目初始化 | 部分完成 | prompt 契约存在，但有自举、过期文案和模板发布问题 |
| 阶段 4：human-sized propose | 部分完成 | 主流程存在，尺寸规则和路线图外需求仍有遗漏 |
| 阶段 5：Coach | 基本完成 | 三级提示与禁写边界明确；真实模型行为仍需手测 |
| 阶段 6：学习导向 Verify | 部分完成 | gate 与记录存在，范围/约束、学习反馈格式仍不完整 |
| 阶段 7：humanspec-next | 部分完成 | 状态机 prompt 完整，但 deterministic helper 未接生产入口 |
| 阶段 8：归档与自适应路线图 | 未完全完成 | 可归档并更新 learner，但不更新里程碑或形成下一候选 |
| 阶段 9：产品化与迁移 | 未完成且非 MVP 阻塞 | manifest、品牌/路径、示例和发布工作仍待处理 |

## 4. 已确认的实现缺口

### 4.1 P0：项目文档内核没有接入真实 workflow runtime

生成的 workflow 明确要求使用内部 TypeScript 符号：

- `src/core/templates/workflows/humanspec-next.ts:25-38,87-102`
  - 要求调用 `resolveNextRoadmapContext`；
- `src/core/templates/workflows/humanspec-archive.ts:83-99`
  - 要求使用 project-document feedback planner；
- 其他 HumanSpec workflow 还引用：
  - `PROJECT_DOC_TEMPLATES`；
  - `getProjectDocTemplate`；
  - `resolveProjectDocPath`；
  - `detectHumanSpecDocType`。

这些名称不是 AI tool，也没有对应 CLI 命令。当前生产源码中，`resolveNextRoadmapContext`、`planArchiveFeedback` 和 `applyArchiveFeedback` 没有实际 workflow 调用方。

所谓 archive-feedback E2E 实际执行的是：

1. `openspec archive`；
2. 测试代码直接 import `planArchiveFeedback`；
3. 测试代码直接 import `applyArchiveFeedback`。

证据：`test/cli-e2e/humanspec-archive-feedback.test.ts:6-13,62-83`。

这意味着：

- 测试验证的是 helper 本身，而不是已安装 skill 的实际可执行路径；
- 真实 AI 必须自行重新实现 Markdown 解析、冲突检测、去重和原子写入；
- 不同 AI tool 的行为可能与测试过的内核不一致；
- workflow 中“调用 helper”的指令对发布包用户并不可执行。

### 同一内核的确认门是 fail-open

`applyArchiveFeedback()` 仅在 `confirmed === false` 时拒绝写入：

- `src/core/templates/project-doc-feedback.ts:1098-1139`

未传 `confirmed` 时会直接写文件。虽然该函数目前没有生产 workflow 调用方，但在将其接入 runtime 前必须改为仅 `confirmed === true` 才允许写入。

### 4.2 P0：阶段 8 没有完成自适应路线图闭环

当前 feedback planner 只会：

1. 删除当前候选 slice；
2. 添加或更新 archived record；
3. 向 learner 添加 `gap:`、`mastered:`、`review:` 记录。

实现位置：`src/core/templates/project-doc-feedback.ts:933-1009`。

它不会：

- 更新当前 roadmap 里程碑状态；
- 根据本次验证结果调整后续方向；
- 在需要时记录下一 change 候选方向。

现有测试为了证明 next 能看到后续 change，是在 archive feedback 完成后手工插入 `later-change`：

- `test/core/project-doc-feedback.test.ts:149-160`

因此，当 roadmap 中最后一个预置 candidate 被归档后，`humanspec-next` 会进入 `empty`，而不是利用新的 learner 状态继续路线图。这不满足路线图阶段 8 的以下要求：

- 归档后更新 roadmap 里程碑状态；
- 记录下一 change 候选方向，但不自动创建；
- 下一次 next 使用新的学习状态，而不是停在空路线图。

### 4.3 P0：verify 记录与 archive retry 的证据格式不闭合

`humanspec-verify` 要求写入固定结构：

- overall disposition；
- learning-result assessment；
- context；
- gate dispositions；
- contract evidence；
- blockers、suggestions 和 next action。

见 `src/core/templates/workflows/humanspec-verify.ts:181-216`。

但该结构没有稳定记录：

- mastered topics；
- knowledge gaps；
- review items。

archive feedback parser 则只从显式标题或带标签的记录中提取这些信息：

- `src/core/templates/project-doc-feedback.ts:622-674`

测试为 retry 人工构造了 verify 实际不会生成的内容：

```markdown
### Mastered topics
- Archived evidence
```

见 `test/core/project-doc-feedback.test.ts:208-226`。

影响：如果 canonical archive 已完成，但 learner 文档写入中断，retry 只能读取归档的 `learning.md` 时，无法可靠恢复原本应写入的 mastered/gap/review 记录。模型可以再次推断，但这不是持久、可重放的契约。

### 4.4 P1：humanspec-init 存在自举矛盾

本地 `humanspec-init` skill 只有在 CLI bootstrap 后才会生成，但 skill 本身又要求执行：

```text
openspec init --profile humanspec --tools <tool-ids>
```

见 `src/core/templates/workflows/humanspec-init.ts:22-45`。

问题包括：

- 未 bootstrap 时，本地 skill 尚不存在，无法靠自己完成 bootstrap；
- 已 bootstrap 时，重复执行 init 会重新处理 skill/command surfaces；
- workflow 声明的写边界只允许项目文档和 config，却在步骤中触发额外生成文件；
- “CLI bootstrap → AI 初始化对话”的产品顺序被写成了 skill 内再次 bootstrap。

正确契约应是：

- `humanspec-init` 把 bootstrap 视为前置条件；
- 只验证 profile、tool surfaces 和无 apply 状态；
- 如果前置条件不存在，停止并给出外部 CLI 修复命令；
- 不在当前 workflow 内执行 bootstrap。

### 4.5 P1：init 仍包含过期产品状态说明

当前输出要求声明：

> HumanSpec roadmap behaviors are not implemented yet.

位置：

- `src/core/templates/workflows/humanspec-init.ts:121-124`；
- `skills/humanspec-init/SKILL.md:252`。

但 next、verify、archive feedback 已经存在。准确表述应是：这些行为不属于 init 的职责，由独立 workflow 提供；而不是全局尚未实现。

对应测试目前反而锁定了旧文案：

- `test/core/templates/humanspec-init.test.ts:20-26`。

### 4.6 P1：项目文档模板没有进入发布包

源码包含：

- `src/core/templates/project-docs/project.md`；
- `src/core/templates/project-docs/roadmap.md`；
- `src/core/templates/project-docs/learner.md`。

但：

- `build.js` 只清理 `dist` 并执行 TypeScript 编译；
- `package.json` 的发布文件不包含 `src/`；
- 项目文档测试固定读取源码目录：`test/core/project-docs.test.ts:15-20`；
- `npm pack --dry-run` 中三个文件均缺失。

当前生成的 init prompt 描述了标题和 grammar，因此模型可能重建近似文档；但发布包并没有满足“从注册模板 materialize”或“ship templates”的契约，也无法保证注释、frontmatter 版本和默认内容完全一致。

### 4.7 P1：learning.md 未完整实现路线图 5.4 的教学结构

当前模板：`schemas/human-learning/templates/learning.md:1-31`。

它保留了六个主标题，但相较路线图 5.4 缺少明确字段，例如：

- `本次明确不学习`；
- `我准备先从哪里开始`；
- `使用的提示等级`；
- `错误现象`；
- `定位过程`；
- `目前仍不理解`；
- `不看代码能否重新实现`；
- `下一次应复习什么`。

当前 coach 和 verify 又要求 stuck episode 包含尝试、观察、假设、提示级别等信息，模板却只提供一条注释，没有稳定 scaffold。这会使学习者更容易漏填，随后在 verify 阶段遭遇意外 blocker。

### 4.8 P1：Propose 与 Next 没有真正共用完整尺寸策略

`humanspec-propose` 已覆盖：

- 一个 outcome；
- 一个主要目标；
- 最多两个辅助概念；
- 2–5 个任务；
- 时段预算；
- 多 outcome、超时、长设计时拆分。

见 `src/core/templates/workflows/humanspec-propose.ts:45-67`。

但路线图第 6 节的以下规则没有被完整、显式实现：

- 同时引入多个框架或基础设施组件；
- 需要多个陌生核心概念才能开始；
- “完成整个模块/系统”等不可独立验证的任务；
- 无法提供单一清晰完成证据；
- 结合学习者经验、技术栈判断认知负荷。

此外：

- 对路线图外新需求，只做了 roadmap 比较，没有明确报告其对当前学习路径的影响；
- `humanspec-next.ts:96-102` 只选择一个 “fitting” candidate，没有复用同一套完整尺寸规则。

当前实现容易让 propose 与 next 对同一个候选给出不同的尺寸判断。

### 4.9 P1：Verify 未完整覆盖范围、约束与学习后续项

`src/core/templates/workflows/humanspec-verify.ts:118-170` 会检查：

- observable outcome；
- delta requirements/scenarios；
- implementation evidence；
- test/lint/build 等项目检查。

但没有显式检查：

- proposal 的 Included/Excluded Scope；
- proposal Constraints；
- 实现是否引入了排除项、额外依赖或超出学习范围的设计。

分类也与路线图略有偏差：

- 当前为 blocking findings、non-blocking suggestions、一个 learner next action；
- 路线图要求阻塞项、建议项、后续学习项；
- 路线图还要求每个 blocker 有具体证据和下一步，而当前只要求一个最重要的下一行动。

另外，verify 虽禁止修改实现，但没有像 coach 一样明确禁止在失败反馈中输出完整可应用答案。

### 4.10 P2：测试名称和覆盖层级高于实际保证

现有 HumanSpec 测试的主要形式是：

- workflow body 包含某些文本；
- skill 与 command 内容相等；
- helper 纯函数和文件操作测试；
- generic CLI archive 后直接调用 helper。

尚未覆盖真实的：

```text
init
→ next/propose
→ 人工实践
→ coach level 1/2
→ verify 首次失败
→ 人工修复
→ verify 通过
→ archive + feedback
→ next 选择后续方向
```

`test/cli-e2e/humanspec-archive-feedback.test.ts` 创建的也是 generic `design.md`/`tasks.md` change，不是完整的 `human-learning` change，没有运行生成的 HumanSpec workflow。

因此当前自动化能证明 CLI 内核和 prompt 契约存在，但不能证明 AI 实际遵守：

- 超大请求拆分；
- 初学者/熟练者的不同粒度；
- 提示等级逐级升级；
- 不输出完整 patch；
- 软件通过但学习证据不足时 verify 失败；
- 中断后完整恢复。

这些仍需人工或模型驱动测试，但应先补上可确定执行的 runtime seam。

### 4.11 P2：Windows 发布守卫失败

本地执行：

```text
pnpm check:pack-version
```

在 Windows 上失败：

```text
spawnSync npm ENOENT
```

原因是 `scripts/pack-version-check.mjs:23-29,80` 使用 `execFileSync('npm', ...)`，未处理 Windows 的 `npm.cmd` 或 `npm_execpath`。

该脚本还在以下位置硬编码当前包名：

- 日志中的 `@fission-ai/openspec`；
- `node_modules/@fission-ai/openspec/bin/openspec.js`。

因此即使在 Linux 上，最终 package rename 后也会破坏版本检查。应改为从 `package.json.name` 动态推导安装路径，并使用跨平台 npm 启动方式。

## 5. 非缺口与明确延期项

以下内容不应被误判为当前 MVP 缺陷：

- 对所有 AI coding tools 的机械写入拦截：路线图明确延期；当前通过 prompt 和 workflow ownership boundary 约束。
- 全局 HumanSpec skills：MVP 明确要求先执行项目级 CLI bootstrap。
- 云端、多设备学习记录同步。
- 多学习者协作和教师后台。
- 间隔重复算法。
- 完整重命名全部 OpenSpec 内部接口。

同时应认识到：普通 AI 对话中的“人类实现、AI 辅导”规则仍未被机械强制，这属于阶段 9 的产品化候选，而不是当前 workflow 实现缺陷。

## 6. 建议修补计划

建议把修补拆成小型、可独立验证的 changes，不与最终大规模重命名混合。

### 6.1 第一批：接通确定性 runtime 与安全边界

建议 change：`expose-humanspec-project-context-runtime`

工作内容：

1. 为项目文档内核增加结构化 CLI 入口，例如：
   - inspect project documents；
   - 返回模板/目标路径；
   - resolve next roadmap context；
   - archive-feedback plan；
   - archive-feedback apply/reconcile。
2. 所有命令使用现有 root/store selection，返回稳定 JSON。
3. 生成的 next/archive/init workflow 只调用公开 CLI，不再要求 AI 调内部 TypeScript 符号。
4. `applyArchiveFeedback` 改为 fail-closed：只有显式 `confirmed: true` 或 CLI `--yes` 才允许写。
5. 对 plan 增加内容哈希或旧内容校验，避免 preview 后文档变化造成 TOCTOU 覆盖。
6. 将三份 project document 模板复制到 `dist`，并通过 runtime API 返回准确模板内容。

验收：

- `applyArchiveFeedback(plan)` 未显式确认时零写入；
- 从 packed tarball 安装后，CLI 可以读取三份模板并分析项目文档；
- next/archive 生成内容不再出现不可调用的内部 helper 名称；
- CLI 黑盒测试覆盖冲突、CRLF、partial write 和 reconcile。

### 6.2 第二批：闭合 learning → verify → archive 证据契约

建议 change：`align-learning-verification-feedback-contract`

工作内容：

1. 扩充 `learning.md` 的开始前、stuck、完成后字段。
2. 在 verify latest-result 中增加稳定、机器可读的学习反馈区：
   - mastered；
   - gap；
   - review。
3. 明确：
   - learning complete 才允许产生 mastery；
   - fail/inconclusive 仍可记录 gap/review；
   - 无记录时不输出会被 parser 当成 topic 的 `<none>` 占位符。
4. archive feedback parser 直接消费真实 verify 输出。
5. retry 测试使用完整 verify-shaped `learning.md`，不再手工发明 `### Mastered topics` fixture。
6. Verify 增加 Scope、Excluded Scope、Constraints 检查，并为每个 blocker 记录证据和下一步。

验收：

- archive 后在 learner 写入前模拟中断；
- 仅凭归档 `learning.md` 即可幂等恢复全部反馈；
- incomplete/inconclusive 不会写入 mastery；
- retry 不重复任何 learner 记录。

### 6.3 第三批：完成自适应路线图

建议 change：`complete-adaptive-roadmap-feedback`

工作内容：

1. 为 roadmap 定义稳定的里程碑状态 grammar。
2. archive feedback plan 同时预览：
   - 当前 slice 归档；
   - 当前里程碑状态变化；
   - 基于 learner feedback 的下一候选方向。
3. 下一候选只作为 proposal，必须经学习者确认后写入 roadmap；不得自动创建 change。
4. `resolveNextRoadmapContext` 消费里程碑、候选和 learner records。
5. 删除测试中手工插入 `later-change` 的步骤。

验收：

- roadmap 只有一个候选时，归档后仍能产生经确认的后续候选；
- next 使用更新后的 mastered/gap/review 解释候选理由；
- 重跑 archive/next 不重复 candidate 或 archived record；
- learner 拒绝候选更新时保留空路线图并明确报告，而不是静默创建。

### 6.4 第四批：修正 init、尺寸与教学 prompt

建议 change：`tighten-humanspec-workflow-contracts`

工作内容：

1. init 只验证 bootstrap 前置条件，不在 workflow 内重跑 `openspec init`。
2. 把 “not implemented yet” 改为“由独立 workflow 提供，不属于 init 职责”。
3. 抽取 propose/next 共用的 HumanSpec change sizing 常量。
4. 补齐：
   - 多框架/基础设施；
   - 多陌生核心概念；
   - 整模块/整系统；
   - 缺少单一证据；
   - 学习者经验与认知负荷；
   - 路线图外需求对学习路径的影响。
5. Coach 每次输出提示等级，并提醒学习者自行记录实际使用等级。
6. Verify 增加后续学习项和失败时不得给出完整实现的约束。
7. 重新生成 committed skills、commands、parity hashes。

### 6.5 第五批：建立真实 QA 与发布门

建议 change：`add-humanspec-capstone-harness`

工作内容：

1. 完成或扩展现有 `add-qa-smoke-harness`。
2. 增加一个最小 HumanSpec 示例项目和可重放 fixture。
3. 自动化确定性部分：
   - packed install；
   - bootstrap；
   - human-learning artifacts；
   - verify-shaped records；
   - archive/reconcile；
   - next context。
4. 人工/模型测试保留为单独 checklist，不伪装成 deterministic E2E。
5. 修复 `pack-version-check.mjs`：
   - 跨平台执行 npm；
   - 动态读取 package name；
   - 验证关键模板和 schema 均在 tarball 中。
6. Windows CI 增加 pack-version/package-install smoke。

### 6.6 第六批：产品化与最终迁移

完成前述行为修复并冻结契约后，再执行：

1. 决定是否先完成 `unify-template-generation-pipeline`：当前仍有 24 个未完成任务；
2. 将 HumanSpec workflows 迁移到统一 manifest；
3. 迁移 package、repository、binary、GitHub URL、发布配置；
4. 决定 `openspec/` → `humanspec/` 的兼容和回滚策略；
5. 更新 README、网站、示例、changeset 和 release notes；
6. 对 packed artifact 运行完整 smoke，而不是只在源码仓库中测试。

不建议把 correctness 修复、manifest 重构和全仓库重命名放进同一个 change。

## 7. 人工工作流测试矩阵

确定性修补完成后，至少手动验证以下场景：

### 7.1 Init

- 空项目 bootstrap 后首次 init；
- 只存在一至两个项目文档；
- 有合法文档时重复 init；
- 有 unmarked 用户文件；
- 用户拒绝更新；
- 不再重复执行 CLI bootstrap。

### 7.2 Propose

- 初学者、熟练者使用同一 45 分钟预算；
- 同时请求 React、数据库、部署和完整模块；
- 路线图内候选；
- 路线图外需求；
- 请求完整实现；
- `skip_specs` 和有行为 delta 两条路径。

### 7.3 Coach

- Level 1 后解决；
- Level 1 → 2 → 3；
- 用户直接索要完整 patch；
- 中断并从 learner-authored stuck record 恢复；
- 多 active change 时不静默选择。

### 7.4 Verify

- 有未勾任务；
- 开始前或完成后只有模板占位；
- 软件测试通过但学习证据不足；
- 实现违反 Excluded Scope 或 Constraints；
- required check 无法运行；
- 首次 fail、修复后 pass；
- 重跑只保留一个 latest result。

### 7.5 Archive 与 Next

- 正常 pass 后归档；
- 强制归档 incomplete learning；
- canonical archive 失败；
- roadmap pending 写入后 learner 写入失败；
- reconcile 不重复 canonical archive；
- 最后一个 candidate 归档后产生下一候选方向；
- 多 active change 和 pending feedback 的优先级。

### 7.6 平台与工具

- 至少在 Windows、macOS、Linux 各跑一次 packed-install smoke；
- 至少选择一个 skills-only adapter 和一个 command adapter；
- 验证普通对话与 HumanSpec workflow 的 ownership 提示差异。

## 8. 最终完成门

在开始最终仓库迁移前，建议要求以下条件全部成立：

- [ ] workflow 不再引用用户不可调用的内部 TypeScript helper；
- [ ] archive feedback 未显式确认时零写入；
- [ ] 三份 project document 模板存在于 packed tarball；
- [ ] verify 输出可独立支持 archive retry；
- [ ] archive 更新里程碑并能形成经确认的下一候选方向；
- [ ] init 不重复 bootstrap，不再声称后续 workflow 未实现；
- [ ] propose 与 next 共用同一套尺寸规则；
- [ ] verify 检查 proposal scope/constraints 并输出后续学习项；
- [ ] 真正的 HumanSpec capstone fixture 和人工 checklist 均已执行；
- [ ] `test`、`lint`、`build`、`check:pack-version` 在支持的平台通过；
- [ ] packed-install smoke 在 Windows、macOS、Linux 行为一致；
- [ ] 统一 manifest 是否纳入迁移已有明确决策。

达到这些条件后，剩余工作才可以基本归类为品牌、路径、仓库和发布迁移。
