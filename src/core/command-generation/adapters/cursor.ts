/**
 * Cursor Command Adapter
 *
 * Formats commands for Cursor following its frontmatter specification.
 * Cursor uses a different frontmatter format and file naming convention.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { DEFAULT_COMMAND_NAMESPACE } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Cursor adapter for command generation.
 * File path: .cursor/commands/<namespace>-<id>.md
 * Frontmatter: name (as /<namespace>-<id>), id, category, description
 */
export const cursorAdapter: ToolCommandAdapter = {
  toolId: 'cursor',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.cursor', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    const namespace = content.namespace ?? DEFAULT_COMMAND_NAMESPACE;
    return `---
name: ${escapeYamlValue(`/${namespace}-${content.id}`)}
id: ${escapeYamlValue(`${namespace}-${content.id}`)}
category: ${escapeYamlValue(content.category)}
description: ${escapeYamlValue(content.description)}
---

${content.body}
`;
  },
};
