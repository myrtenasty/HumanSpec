/**
 * Crush Command Adapter
 *
 * Formats commands for Crush following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue, formatTagsArray } from '../yaml.js';

/**
 * Crush adapter for command generation.
 * File path: .crush/commands/<namespace>/<id>.md
 * Frontmatter: name, description, category, tags
 */
export const crushAdapter: ToolCommandAdapter = {
  toolId: 'crush',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.crush', 'commands', identity.namespace, `${identity.id}.md`);
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
