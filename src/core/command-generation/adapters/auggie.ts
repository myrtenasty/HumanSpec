/**
 * Auggie (Augment CLI) Command Adapter
 *
 * Formats commands for Auggie following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Auggie adapter for command generation.
 * File path: .augment/commands/<namespace>-<id>.md
 * Frontmatter: description, argument-hint
 */
export const auggieAdapter: ToolCommandAdapter = {
  toolId: 'auggie',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.augment', 'commands', `${identity.namespace}-${identity.id}.md`);
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
