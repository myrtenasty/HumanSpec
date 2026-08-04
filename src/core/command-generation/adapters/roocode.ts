/**
 * Zoo Code Command Adapter
 *
 * Formats commands for Zoo Code following its workflow specification.
 * Zoo Code uses markdown headers instead of YAML frontmatter.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';

/**
 * Zoo Code adapter for command generation.
 * File path: .roo/commands/<namespace>-<id>.md
 * Format: Markdown header with description
 */
export const roocodeAdapter: ToolCommandAdapter = {
  toolId: 'roocode',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.roo', 'commands', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `# ${content.name}

${content.description}

${content.body}
`;
  },
};
