# HumanSpec 实现路线图

> 状态：规划中  
> 目标：将 OpenSpec 改造为以人类亲手实现、AI 负责规划与辅导的软件开发学习工具。  
> 原则：先完成可验证的最小学习闭环，再逐步增加自动编排、品牌迁移和上游同步。

## 1. 产品目标

HumanSpec 面向希望通过真实项目学习和练习软件开发的人。AI 可以帮助用户明确目标、拆分工作、解释概念、提供渐进提示、审查实现并归档学习记录，但默认不代替用户编写应用代码或测试代码。

一次完整循环应当让用户获得两类可追溯成果：

- 软件成果：完成一个足够小、可以独立验证的功能切片。
- 学习成果：记录开始前的理解、实现过程、错误定位、完成后的新理解与遗留问题。

目标体验：

```text
项目初始化
    │
    ▼
生成项目路线图与学习者档案
    │
    ▼
提出一个小而专注的 change
    │
    ▼
人类编码，AI 按需辅导
    │
    ▼
AI 验证实现与学习证据
    │
    ▼
同步规格、归档 change、更新路线图
    │
    └──────────────► 选择下一个 change
```

## 2. 已确认的产品决策

| 主题 | 决策 |
|---|---|
| 实现责任 | 默认由人类编写应用代码和测试代码。AI 负责规划、解释、提示、诊断和审查。 |
| Apply 工作流 | 不向用户安装或暴露 `opsx-apply` / `openspec-apply-change`；保留底层 apply 配置作为任务跟踪和上下文协议。 |
| Change 大小 | 默认一个 change 只覆盖一个可独立验证的行为切片和一个主要学习目标。 |
| Artifact 数量 | 默认使用 `proposal.md`、可选 delta specs、`learning.md`，不再单独生成 `design.md` 和 `tasks.md`。 |
| 任务位置 | 实践任务作为复选框写入 `learning.md`，schema 的 `apply.tracks` 指向该文件。 |
| 活动 change | `humanspec-next` 默认一次只推进一个 HumanSpec change；直接 propose 可以创建旁路需求，但必须提示注意力成本。 |
| Spec 同步 | 标准流程由 archive 内联完成 sync；独立 sync 仅作为高级操作保留。 |
| 初始化范围 | MVP 只要求项目级初始化，不依赖全局 skill 安装。空目录先运行 CLI init，再调用生成的 AI skill。 |
| 统一生成管线 | `unify-template-generation-pipeline` 不作为前置依赖。当前按现有注册点接入，主分支完成统一管线后再同步和迁移。 |
| 内部兼容 | 初期继续复用 OpenSpec 的 schema、status、instructions、validate、archive 和 `openspec/` 存储结构。 |

## 3. MVP 边界

### 3.1 MVP 必须做到

- 初始化一个项目的目标、技术约束、路线图和学习者档案。
- 从路线图或用户输入生成一个足够小的 change。
- 生成适合人工实践的 artifacts。
- 在实践阶段阻止 HumanSpec skills 直接修改实现代码。
- 在用户卡住时提供分级提示，而不是直接给出完整实现。
- 验证任务、规格、实现、测试和学习反思是否一致。
- 在验证通过后同步规格、归档 change，并为下一次学习提供输入。

### 3.2 MVP 暂不处理

- 全局安装 HumanSpec skills。
- 多设备或云端学习记录同步。
- 多学习者协作和教师后台。
- 基于间隔重复算法的自动复习计划。
- 对所有 AI coding tools 的强制写入拦截。
- 完整重命名所有 OpenSpec 内部目录、环境变量和兼容接口。
- 与主分支尚未完成的统一 workflow manifest 同步。

## 4. 目标信息结构

MVP 继续使用 `openspec/` 作为内部规划目录，以降低与现有引擎的耦合改造成本：

```text
openspec/
├── config.yaml
├── project.md
├── roadmap.md
├── learner.md
├── specs/
└── changes/
    ├── <change-name>/
    │   ├── .openspec.yaml
    │   ├── proposal.md
    │   ├── specs/
    │   │   └── <capability>/spec.md
    │   └── learning.md
    └── archive/
```

项目级文档的职责：

| 文档 | 内容 | 更新时机 |
|---|---|---|
| `project.md` | 产品目标、目标用户、技术栈、约束、总体完成标准 | 初始化；项目方向改变时 |
| `roadmap.md` | 里程碑、预期成果、学习重点、完成证据、候选切片 | 初始化；change 归档后 |
| `learner.md` | 已有经验、学习目标、单次时间预算、提示偏好、已暴露的知识缺口 | 初始化；验证或归档后 |

路线图只规划里程碑，不在初始化阶段提前固定全部 change。`humanspec-next` 应根据当前代码、已归档的 `learning.md` 和学习者状态选择下一个最小切片。

## 5. `human-learning` schema

### 5.1 Artifact DAG

```text
proposal
    │
    ▼
 specs  ──► 可通过 skip_specs 标记跳过
    │
    ▼
learning
```

推荐的 schema 语义：

```yaml
name: human-learning
version: 1

artifacts:
  - id: proposal
    generates: proposal.md
    requires: []

  - id: specs
    generates: "specs/**/*.md"
    requires: [proposal]

  - id: learning
    generates: learning.md
    requires: [proposal, specs]

apply:
  requires: [learning]
  tracks: learning.md
  instruction: |
    Implementation is performed by the human learner.
    AI may explain, inspect, diagnose, review, and provide progressive hints,
    but must not edit application or test implementation files.
```

这里保留 `apply` 配置，但它不是用户可调用的 AI workflow。它只用于：

- 声明实践开始前必须存在的 artifacts。
- 从 `learning.md` 解析任务复选框并统计进度。
- 为 verify 提供 change 的完整上下文文件。
- 复用现有 list/status/archive 的任务完成判断。

### 5.2 `proposal.md`

proposal 必须保持短小，建议只包含：

- 本次改变的原因。
- 一个可观察的目标结果。
- 明确包含和排除的范围。
- 简短实现方向或必须遵守的技术约束。
- 验证完成的证据。

如果 proposal 需要长篇架构设计，默认动作应是继续拆分 change。无法合理拆分的复杂工作可以显式使用 OpenSpec 的完整 `spec-driven` schema。

### 5.3 Delta specs

delta specs 继续描述可观察行为和验证场景，以便：

- verify 能从 requirement/scenario 推导验证项。
- archive 能把新行为同步到主 specs。
- 实现方式变化时仍保留稳定的产品契约。

纯重构、环境配置、文档练习等没有行为变化的 change 使用 `skip_specs: true`，不得为通过验证而虚构 requirement。

### 5.4 `learning.md`

`learning.md` 同时承担学习契约、实践任务、反思和验证记录：

```markdown
## 本次学习契约

- 主要学习目标：
- 辅助知识：
- 本次明确不学习：
- 完成证据：

## 开始前

- 我认为：
- 我预测最容易出错的是：
- 我准备先从哪里开始：

## 实践任务

- [ ] 1.1 一个可以独立完成和验证的任务
- [ ] 1.2 对应的测试或手动验证

## 卡住时的记录

- 尝试过的方法：
- 使用的提示等级：
- 错误现象：
- 定位过程：

## 完成后

- 新理解：
- 原有理解哪里不准确：
- 最终如何定位错误：
- 目前仍不理解：
- 不看代码能否重新实现：
- 下一次应复习什么：

## AI 验证记录

- 行为验证：
- 测试证据：
- 学习目标达成情况：
- 建议的下一学习目标：
```

内容所有权：

- AI 起草学习目标、完成证据和实践任务。
- 人类填写“开始前”“卡住时”“完成后”，并自行勾选完成的任务。
- verify 在审查后写入“AI 验证记录”。
- AI 不得替用户编造个人反思。

文件存在只能证明 artifact 已生成，不能证明学习已经完成。因此 MVP 的 verify 和 archive workflow 必须检查人类填写区是否仍为空或保留占位内容。未来可以再考虑为 artifact schema 增加结构化 `completionPolicy`。

## 6. Change 尺寸策略

`humanspec-propose` 和 `humanspec-next` 应使用同一套尺寸规则。默认 change 应满足：

- 一个主要学习目标，最多两个辅助知识点。
- 一个可以独立运行或观察的行为切片。
- 两到五个实践任务。
- 每个任务都具有明确的完成证据。
- 预计能在学习者配置的一个学习时段内完成。
- 不同时引入多个框架、基础设施组件或相互独立的业务能力。

以下情况应要求继续拆分：

- 同时涉及多个互不依赖的用户行为。
- 需要学习多个陌生的核心概念才能开始编码。
- 任务只能写成“完成整个模块”“实现整个系统”等不可验证描述。
- 无法为 change 写出单一、清晰的完成证据。
- 需要大量架构设计才能解释如何开始。

尺寸规则是指导和警告，不应成为基于行数或文件数的机械限制。AI 应结合学习者经验、技术栈和单次时间预算判断认知负荷。

## 7. HumanSpec workflows

### 7.1 核心 workflows

| Workflow | 职责 | 是否可修改实现代码 |
|---|---|---|
| `humanspec-init` | 与用户讨论项目目标、技术栈、学习目标并生成项目级文档 | 否 |
| `humanspec-next` | 根据当前状态选择并执行下一项工作流动作 | 否 |
| `humanspec-propose` | 从用户输入或路线图创建一个小型 change 及其 artifacts | 仅规划文件 |
| `humanspec-coach` | 展示当前任务、解释概念并提供渐进提示 | 否 |
| `humanspec-verify` | 审查实现、测试、规格、任务和学习反思 | 仅允许更新 `learning.md` 验证区 |
| `humanspec-archive` | 同步 specs、归档 change、更新 roadmap 和 learner | 仅规划与归档文件 |
| `humanspec-explore` | 在不实现的前提下讨论问题、方案和知识点 | 否 |

### 7.2 不安装的 workflows

默认 HumanSpec profile 不安装：

- `openspec-apply-change`
- `opsx-apply`
- 能够自动完成整组实现任务的等价 workflow

独立 sync、bulk archive 和完整 OpenSpec artifact authoring 可以作为高级或兼容 profile 保留，但不出现在初学者默认入口中。

### 7.3 已落地的命名 profile（`add-humanspec-workflow-profile`）

`openspec init --profile humanspec` / `openspec config profile humanspec` 安装
七个 `humanspec-<action>` workflow（init、next、propose、coach、verify、
archive、explore），生成身份固定：

- skill：`humanspec-<action>/SKILL.md`
- 命令：`/humanspec:<action>`（目录命名空间适配器）、`/humanspec-<action>`
  （平铺适配器）、`@humanspec-<action>`（Amazon Q）

项目可以在 `openspec/config.yaml` 声明 `profile: humanspec`（及自定义时的
`workflows:`），有效 profile 按 CLI 覆盖 → 项目配置 → 全局配置 → `core`
兜底的顺序解析。切换 profile 时只按显式注册路径增删托管 artifacts，用户文件
不受影响。`openspec instructions apply --change <name> --json` 作为内部协议
始终可用（coach/verify/archive 复用其结构化上下文与任务进度），但 HumanSpec
项目不获得任何用户可调用的 apply workflow。

当前注册点（profiles、skill/command 模板表、`SKILL_NAMES`、
`MANAGED_COMMANDS`、检测、onboarding、drift、cleanup）由严格 parity 测试
保持同步；`unify-template-generation-pipeline` 落地后这些条目迁入统一
manifest，生成路径与 profile 成员关系不变。

### 7.4 Coach 的提示等级

coach 应优先帮助用户继续思考，而不是快速给出答案：

1. 一级提示：解释相关概念、提出检查问题，不指出具体代码位置。
2. 二级提示：指出相关模块、符号或数据流，仍不提供实现。
3. 三级提示：给出伪代码、API 形状或局部示例，但不提供可直接应用的完整 patch。

每次提示应说明当前等级，并提醒用户把提示使用情况记录到 `learning.md`。是否允许进一步揭示由用户决定。

## 8. `humanspec-next` 状态机

```text
未初始化
  └─ humanspec-init

无活动 change
  └─ 从 roadmap 选择最小切片并 propose

有 change，artifacts 未完成
  └─ 继续生成下一个 artifact

artifacts 完成，任务未完成
  └─ 展示下一个人工任务或进入 coach

任务完成，反思未完成
  └─ 引导用户填写“完成后”

反思完成，尚未验证
  └─ verify

verify 未通过
  └─ 返回人工实践或更新 change artifacts

verify 通过
  └─ archive（内联 sync）并更新项目路线图
```

状态判断应优先使用 CLI 的结构化输出，不依赖对目录的猜测：

- `openspec list --json`
- `openspec status --change <name> --json`
- `openspec instructions <artifact> --change <name> --json`
- `openspec instructions apply --change <name> --json`

若存在多个活动 change，`next` 不应猜测。它应展示最近活动的 change，并让用户选择继续、暂停或回到路线图。

## 9. 分阶段实现计划

每个阶段都应形成独立 change，完成验证和归档后再进入下一阶段。

### 阶段 0：建立行为基线

目标：在修改 workflow 之前明确哪些 OpenSpec 能力将被复用和保护。

工作范围：

- 为自定义 schema、`apply.tracks`、status、instructions、task progress 和 archive 建立集成测试基线。
- 记录现有 workflow 注册点和生成产物。
- 确认 `learning.md` 作为 tracks 文件时，list/status/archive 能正确统计任务。
- 明确 HumanSpec workflow 允许写入的目录边界。

完成标准：

- 基线测试能覆盖计划依赖的 OpenSpec 核心行为。
- 后续移除用户可见 apply 时，测试仍能证明内部进度协议未被破坏。

### 阶段 1：实现 `human-learning` schema

目标：先跑通不依赖 `next` 的最小人工学习 change。

工作范围：

- 新增内置 `human-learning` schema。
- 新增精简 proposal、delta spec 和 learning 模板。
- 将 `apply.requires` 与 `apply.tracks` 配置为 `learning.md`。
- 增加 schema 解析、artifact 顺序、skip specs、任务统计和跨平台路径测试。

完成标准：

- 可以创建使用 `human-learning` schema 的 change。
- artifact 顺序为 proposal → specs → learning。
- `learning.md` 中的复选框会出现在任务进度中。
- 没有 delta spec 时，合法的 `skip_specs` change 可以继续。

### 阶段 2：建立 HumanSpec workflow 集合

目标：生成 HumanSpec 命名的 skills/commands，并移除默认 AI apply 入口。

工作范围：

- 新增 HumanSpec workflow 模板和生成条目。
- 调整默认安装集合，不生成 apply skill/command。
- 暂时按当前架构维护 workflow、skill 名称、command ID 和清理列表。
- 增加生成产物 parity 测试，防止手工列表之间发生漂移。
- 保留 OpenSpec 原工作流作为兼容或高级 profile，避免一次性删除底层能力。

完成标准：

- 项目初始化后可以调用 HumanSpec workflows。
- 默认安装结果中不存在用户可调用的 apply workflow。
- update 可以清理旧的托管 apply 产物，但不删除用户文件。
- `openspec instructions apply` 仍可作为内部接口工作。

说明：本阶段不等待 `unify-template-generation-pipeline`。主分支统一生成管线可用后，再把临时注册迁移到统一 manifest，并用 parity 测试保证产物不变。

### 阶段 3：实现项目初始化对话

目标：在空项目中形成可供后续 change 使用的稳定上下文。

工作范围：

- 通过项目级 CLI init 安装本地 HumanSpec skills。
- 实现 `humanspec-init` 对话，收集项目目标、技术栈、约束、学习者经验、学习目标、单次时间预算和提示偏好。
- 生成 `project.md`、`roadmap.md` 和 `learner.md`。
- 为重复运行定义合并策略：保留用户内容、展示差异、禁止静默覆盖。
- 让 artifact instructions 或 HumanSpec skills 能读取这些项目级文档。

完成标准：

- 新项目可以通过“CLI bootstrap → AI 初始化对话”进入 ready 状态。
- 三个项目级文档都具有明确模板和所有权。
- 第二次运行 init 不会丢失用户已经填写的内容。

MVP 不解决真正的全局 `/humanspec-init`。在完全空的工作空间中，用户必须先运行 CLI init；global install 可在未来按实际需求增加。

### 阶段 4：实现人工 propose 与尺寸控制

目标：从用户输入或路线图生成第一个适合人工完成的 change。

工作范围：

- 实现 `humanspec-propose`。
- 读取项目、路线图和学习者上下文。
- 应用统一的 change 尺寸策略。
- 生成 proposal、必要的 delta specs 和 learning。
- 要求用户亲自填写“开始前”部分后再进入实践。
- 支持用户直接提出路线图之外的新功能，并明确它对当前学习路径的影响。

完成标准：

- 生成的 change 只有一个主要学习目标。
- 实践任务数量和粒度符合配置的学习时段。
- AI 不会在 propose 阶段创建实现代码。
- 过大的请求会被拆成多个候选 change，并只启动其中一个。

### 阶段 5：实现 Coach 模式

目标：让用户在不交出实现权的情况下获得有效帮助。

工作范围：

- 实现 `humanspec-coach`。
- 从 apply instructions 读取当前任务与 change 上下文。
- 支持三级渐进提示。
- 允许只读代码调查、解释错误和建议诊断步骤。
- 明确禁止直接修改应用代码和测试代码。
- 引导用户在 `learning.md` 中记录尝试、错误和提示等级。

完成标准：

- 默认响应不会输出完整可应用 patch。
- 用户可以逐级请求更多帮助。
- coach 能把解释关联到当前任务、spec 和实际代码结构。
- 中断和恢复不会丢失当前任务上下文。

### 阶段 6：实现学习导向的 Verify

目标：同时验证软件是否完成，以及学习过程是否形成证据。

工作范围：

- 检查 `learning.md` 中所有实践任务是否完成。
- 检查“开始前”和“完成后”是否仍为空或保留模板占位符。
- 将 requirements/scenarios 映射到实现和测试证据。
- 检查实现是否偏离 proposal 中的范围和技术约束。
- 运行项目已有的相关测试、类型检查或 lint 命令。
- 将验证结果写入 `learning.md` 的 AI 验证区。
- 将问题分为阻塞项、建议项和后续学习项。

完成标准：

- 未完成任务或缺少关键学习反思时不能报告通过。
- 每个阻塞项都有具体证据和下一步建议。
- verify 可以失败后重新运行，并安全更新自己的验证区。
- verify 不修改实现代码来使检查通过。

### 阶段 7：实现 `humanspec-next`

目标：提供一个日常使用的单一入口，自动选择下一项合理动作。

工作范围：

- 实现状态机和结构化状态判断。
- 无活动 change 时，从 roadmap 选择候选切片。
- artifacts 不完整时继续规划。
- 实践中展示下一任务或进入 coach。
- 任务完成后引导反思和 verify。
- 对多个活动 change、手工修改 artifact、失败验证和中途暂停定义恢复行为。

完成标准：

- 用户可以主要依赖一个 `next` workflow 推进完整项目。
- `next` 不会在实践阶段代替用户写代码。
- 状态不明确时显式询问，不静默选择错误 change。
- 连续运行 `next` 不会重复创建相同 artifact 或 change。

### 阶段 8：归档与自适应路线图

目标：关闭学习反馈循环，让一次 change 的结果影响后续计划。

工作范围：

- 实现 HumanSpec archive workflow。
- 在 archive 内联执行 delta spec sync 和一致性检查。
- 要求 verify 已通过且学习反思完整；除非用户明确选择强制归档。
- 归档后更新 roadmap 的里程碑状态。
- 根据验证记录更新 learner 的已掌握内容、知识缺口和建议复习项。
- 记录下一 change 的候选方向，但不自动创建。

完成标准：

- 归档目录保存 proposal、specs、完整 learning 和验证记录。
- 主 specs 与已归档 delta 保持一致。
- roadmap 和 learner 的更新可解释、可审查、可手工修改。
- 下一次 `humanspec-next` 会使用新的学习状态，而不是重复原计划。

### 阶段 9：产品化与上游同步

目标：在学习闭环稳定后降低维护成本并统一品牌体验。

候选工作：

- 同步主分支完成的 `unify-template-generation-pipeline`。
- 把 HumanSpec workflows 迁移到统一 manifest，删除临时硬编码注册。
- 评估是否增加 `humanspec` CLI binary 别名或完整重命名。
- 评估是否把内部 `openspec/` 迁移为 `humanspec/`，并提供可回滚迁移工具。
- 根据真实用户需求重新评估 global install。
- 完善多工具规则文件，让“人类实现、AI 辅导”在普通对话中也更一致。
- 增加端到端示例项目和学习体验测试。

该阶段不应阻塞前八个阶段。

## 10. 测试策略

### 10.1 核心自动化测试

- Schema 解析与 artifact DAG。
- `skip_specs` 与 learning 解锁行为。
- `learning.md` 任务统计。
- HumanSpec workflow 生成、更新和安全清理。
- 不同 AI tool adapter 下的 skill/command 内容。
- `next` 状态转移和幂等性。
- verify 对空反思、未完成任务、缺失测试和实现偏差的判断。
- archive 的 sync、移动、roadmap/learner 更新和失败恢复。
- Windows、macOS 和 Linux 路径行为。

### 10.2 教学行为测试

使用固定对话场景验证：

- 过大的功能请求是否会被拆分。
- 初学者和有经验用户是否得到不同粒度的任务。
- coach 是否遵守提示等级。
- AI 是否会在未获授权时输出完整实现或写入源代码。
- verify 是否区分“代码能运行”和“学习证据完整”。
- 失败后是否给出可操作、但不过度泄露答案的反馈。

### 10.3 最小端到端场景

至少维护一个小型示例项目，验证：

1. 初始化项目。
2. 生成第一条路线图。
3. propose 一个 change。
4. 人工完成任务并记录过程。
5. coach 提供一次一级提示和一次二级提示。
6. verify 首次失败。
7. 用户修复后 verify 通过。
8. archive 同步 specs 并更新路线图。
9. next 选择合理的后续 change。

## 11. 风险与应对

| 风险 | 应对 |
|---|---|
| 删除 apply skill 后，用户仍可在普通对话中要求 AI 实现 | 在 HumanSpec skills 中建立明确边界；后续按工具生成项目规则文件。承认无法对所有外部工具做绝对技术强制。 |
| `learning.md` 文件存在但反思未完成 | verify/archive 做内容级 gate；后续再考虑 schema completion policy。 |
| AI 把 change 拆得过大或过碎 | 使用统一尺寸规则、学习时间预算和端到端案例校准。 |
| roadmap 过早失真 | 只规划里程碑和候选切片；每次归档后根据真实结果调整。 |
| 当前多处硬编码 workflow 注册产生漂移 | 添加 parity 测试；主分支统一生成管线成熟后集中迁移。 |
| HumanSpec 与上游 OpenSpec 快速分叉 | 保持核心 schema/status/instructions/archive 接口稳定，把教学行为尽量放在 schema 和 workflow 层。 |
| 规格验证通过但实现理解不足 | verify 同时检查软件证据和学习反思，不把测试通过等同于学习完成。 |

## 12. 推荐的首批 changes

为保持每个 change 足够专注，建议按以下顺序启动：

1. `add-human-learning-schema`
2. `track-practice-tasks-in-learning-artifact`
3. `add-humanspec-workflow-profile`
4. `add-humanspec-project-context-docs`
5. `add-humanspec-init-workflow`
6. `add-human-sized-propose-workflow`
7. `add-progressive-coach-workflow`
8. `add-learning-aware-verify-workflow`
9. `add-humanspec-next-router`
10. `add-learning-aware-archive-feedback`

前两个 change 可以根据实际代码耦合程度合并，但不应在第一个 change 中同时实现 init、next、verify 和 archive。第一个可演示里程碑是：能够创建 `human-learning` change，生成人工任务并正确统计进度；第一个完整产品里程碑则是：完成 init → propose → 人工实践 → verify → archive 的单次闭环。

## 13. 路线图完成定义

当以下条件全部成立时，可以认为 HumanSpec 的第一版学习工作流完成：

- 新用户能在一个空项目中完成项目级初始化。
- 路线图能生成一个适合当前水平和时间预算的小 change。
- 默认工作流中不存在 AI apply 命令。
- 人类可以在 coach 帮助下亲手完成实现。
- verify 同时给出软件正确性和学习完成度判断。
- archive 保存完整学习记录并同步主规格。
- 已归档结果会影响下一个 change 的选择。
- 整个闭环在 Windows、macOS 和 Linux 上具有一致行为。

