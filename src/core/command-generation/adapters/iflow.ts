/**
 * iFlow Command Adapter
 *
 * Formats commands for iFlow following its frontmatter specification.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';
import { DEFAULT_COMMAND_NAMESPACE } from '../identity.js';
import { escapeYamlValue } from '../yaml.js';

/**
 * iFlow adapter for command generation.
 * File path: .iflow/commands/<namespace>-<id>.md
 * Frontmatter: name, id, category, description
 */
export const iflowAdapter: ToolCommandAdapter = {
  toolId: 'iflow',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.iflow', 'commands', `${identity.namespace}-${identity.id}.md`);
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
