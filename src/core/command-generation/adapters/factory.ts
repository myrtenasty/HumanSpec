/**
 * Factory Droid Command Adapter
 *
 * Formats commands for Factory Droid following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Factory adapter for command generation.
 * File path: .factory/commands/<namespace>-<id>.md
 * Frontmatter: description, argument-hint
 */
export const factoryAdapter: ToolCommandAdapter = {
  toolId: 'factory',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.factory', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
description: ${escapeYamlValue(content.description)}
argument-hint: command arguments
---

${content.body}
`;
  },
};
