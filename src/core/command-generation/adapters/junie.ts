/**
 * Junie Command Adapter
 *
 * Formats commands for Junie following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Junie adapter for command generation.
 * File path: .junie/commands/<namespace>-<id>.md
 * Frontmatter: description
 */
export const junieAdapter: ToolCommandAdapter = {
  toolId: 'junie',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.junie', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
