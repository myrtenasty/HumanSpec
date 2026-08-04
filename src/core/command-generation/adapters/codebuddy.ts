/**
 * CodeBuddy Command Adapter
 *
 * Formats commands for CodeBuddy following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * CodeBuddy adapter for command generation.
 * File path: .codebuddy/commands/<namespace>/<id>.md
 * Frontmatter: name, description, argument-hint
 */
export const codebuddyAdapter: ToolCommandAdapter = {
  toolId: 'codebuddy',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.codebuddy', 'commands', identity.namespace, `${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `---
name: ${escapeYamlValue(content.name)}
description: ${escapeYamlValue(content.description)}
argument-hint: "[command arguments]"
---

${content.body}
`;
  },
};
