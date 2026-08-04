/**
 * Antigravity Command Adapter
 *
 * Formats commands for Antigravity following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Antigravity adapter for command generation.
 * File path: .agent/workflows/<namespace>-<id>.md
 * Frontmatter: description
 */
export const antigravityAdapter: ToolCommandAdapter = {
  toolId: 'antigravity',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.agent', 'workflows', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
