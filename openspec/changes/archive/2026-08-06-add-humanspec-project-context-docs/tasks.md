## 1. 常量与登记

- [x] 1.1 新增项目文档登记常量（如 `PROJECT_DOC_TEMPLATES`），按名字登记三份模板的 id、相对路径与 frontmatter `type` 标记值（`humanspec-project` / `humanspec-roadmap` / `humanspec-learner`），遵循"若生成则按名字维护常量列表"规则
- [x] 1.2 新增 frontmatter 检测辅助函数：只读取文件开头到闭合 `---` 的 frontmatter 块，显式查找 `type:` 行与常量匹配，不做整文件正则扫描

## 2. 模板文件

- [x] 2.1 创建 `src/core/templates/project-docs/project.md`：frontmatter（`type: humanspec-project`、`version: 1`）+ 固定标题小节（产品目标、目标用户、技术栈、约束、完成标准），正文为散文
- [x] 2.2 创建 `src/core/templates/project-docs/roadmap.md`：frontmatter（`type: humanspec-roadmap`、`version: 1`）+ 里程碑小节 + 候选切片清单（`- [ ] slice: <name> — <学习重点>` 可解析条目）
- [x] 2.3 创建 `src/core/templates/project-docs/learner.md`：frontmatter（`type: humanspec-learner`、`version: 1`）+ 经验/学习目标/时间预算/提示偏好小节 + 知识缺口、已掌握、复习项的可解析列表条目
- [x] 2.4 三个模板的 frontmatter 标记值与 1.1 的常量完全一致（由 5.3 的 parity 测试保证）

## 3. 共享读取约定

- [x] 3.1 在 `src/core/templates/workflows/humanspec-shared.ts` 新增共享常量（如 `HUMANSPEC_PROJECT_DOCS`）：三个文档路径（`openspec/project.md`、`openspec/roadmap.md`、`openspec/learner.md`）与各自读取用途
- [x] 3.2 七个 humanspec workflow 模板（init、next、propose、coach、verify、archive、explore）的 skill 与 command 内容引用该共享常量，不各自硬编码路径

## 4. legacy-cleanup 豁免

- [x] 4.1 `detectLegacyStructureFiles` 增加标记检测：`openspec/project.md` 存在时读取其 frontmatter 块，与 `type: humanspec-project` 常量比对，标记命中则不计入 legacy artifacts（`hasProjectMd` 报告区分标记/未标记）
- [x] 4.2 迁移提示与 cleanup 汇总输出只在未标记时显示 `project.md` 迁移小节；标记文件的场景不出现该提示（保持现有提示文案不变）

## 5. 测试与验证

- [x] 5.1 legacy-cleanup 测试：带标记的 `project.md` 不被报告、不显示迁移提示；未标记的 `project.md` 保持原有提示行为（现有用例不回归）
- [x] 5.2 parity 测试：扩展现有 humanspec profile 测试，断言每个生成的 humanspec skill/command 表面都包含共享读取约定
- [x] 5.3 模板注册测试：三个模板文件存在、路径由常量解析、frontmatter 标记与常量一致
- [x] 5.4 跨平台路径测试：模板路径与注册文档目标路径断言使用 `path.join`，覆盖 Windows 路径语义（config 规则）
- [x] 5.5 确认现有 Windows CI 矩阵在 Windows 上运行完整测试套件，覆盖本 change 的路径与检测逻辑

## 6. 收尾

- [x] 6.1 运行完整测试套件与 `openspec validate --strict`，确认本 change 无失败
- [x] 6.2 确认本 change 无任何代码路径写入三份项目文档（No-silent-overwrite 交互由 init change 实施）

## 7. 验证修复

- [x] 7.1 收紧 frontmatter 标记识别，只接受顶层、精确的 `type:` 行，并添加嵌套字段回归测试
- [x] 7.2 新增注册文档目标路径解析器，在 legacy-cleanup 中复用，并测试三份文档的跨平台 `path.join` 结果
- [x] 7.3 将 delta spec、proposal 和 design 与当前“模板/约定基础层”范围对齐，明确生命周期写入与合并交互属于后续 workflow change
- [x] 7.4 运行相关测试、完整测试套件、lint、build 与严格 OpenSpec 验证
