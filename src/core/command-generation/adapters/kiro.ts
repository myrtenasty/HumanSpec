/**
 * Kiro Command Adapter
 *
 * Formats commands for Kiro following its .prompt.md specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Kiro adapter for command generation.
 * File path: .kiro/prompts/<namespace>-<id>.prompt.md
 * Frontmatter: description
 */
export const kiroAdapter: ToolCommandAdapter = {
  toolId: 'kiro',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.kiro', 'prompts', `${identity.namespace}-${identity.id}.prompt.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
