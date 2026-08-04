/**
 * Trae Command Adapter
 *
 * Formats commands for Trae IDE following its command specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Trae adapter for command generation.
 * File path: .trae/commands/<namespace>-<id>.md
 * Frontmatter: name, description
 */
export const traeAdapter: ToolCommandAdapter = {
  toolId: 'trae',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.trae', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
