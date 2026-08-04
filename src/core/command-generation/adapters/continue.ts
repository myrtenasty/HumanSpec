/**
 * Continue Command Adapter
 *
 * Formats commands for Continue following its .prompt specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { DEFAULT_COMMAND_NAMESPACE } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * Continue adapter for command generation.
 * File path: .continue/prompts/<namespace>-<id>.prompt
 * Frontmatter: name, description, invokable
 */
export const continueAdapter: ToolCommandAdapter = {
  toolId: 'continue',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.continue', 'prompts', `${identity.namespace}-${identity.id}.prompt`);
  },

  formatFile(content: CommandContent): string {
    const namespace = content.namespace ?? DEFAULT_COMMAND_NAMESPACE;
    return `---
name: ${escapeYamlValue(`${namespace}-${content.id}`)}
description: ${escapeYamlValue(content.description)}
invokable: true
---

${content.body}
`;
  },
};
