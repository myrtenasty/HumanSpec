/**
 * OpenCode Command Adapter
 *
 * Formats commands for OpenCode following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * OpenCode adapter for command generation.
 * File path: .opencode/commands/<namespace>-<id>.md
 * Frontmatter: description
 */
export const opencodeAdapter: ToolCommandAdapter = {
  toolId: 'opencode',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.opencode', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
