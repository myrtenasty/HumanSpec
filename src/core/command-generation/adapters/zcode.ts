/**
 * ZCode Command Adapter
 *
 * Formats commands for ZCode following its frontmatter specification.
 * ZCode shares Claude Code's command format conventions.
 * File path: .zcode/commands/opsx/<id>.md
 * Frontmatter: name, description, category, tags
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue, formatTagsArray } from '../yaml.js';

/**
 * ZCode adapter for command generation.
 * File path: .zcode/commands/<namespace>/<id>.md
 * Frontmatter: name, description, category, tags
 */
export const zcodeAdapter: ToolCommandAdapter = {
  toolId: 'zcode',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.zcode', 'commands', identity.namespace, `${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
category: ${escapeYamlValue(content.category)}
tags: ${formatTagsArray(content.tags)}
---

${content.body}
`;
  },
};
