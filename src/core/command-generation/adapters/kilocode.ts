/**
 * Kilo Code Command Adapter
 *
 * Formats commands for Kilo Code following its workflow specification.
 * Kilo Code workflows don't use frontmatter.
 */

import path from 'path';
import type { CommandContent, ToolCommandAdapter } from '../types.js';
import type { CommandIdentity } from '../identity.js';

/**
 * Kilo Code adapter for command generation.
 * File path: .kilocode/workflows/<namespace>-<id>.md
 * Format: Plain markdown without frontmatter
 */
export const kilocodeAdapter: ToolCommandAdapter = {
  toolId: 'kilocode',

  getFilePath(identity: CommandIdentity): string {
    return path.join('.kilocode', 'workflows', `${identity.namespace}-${identity.id}.md`);
  },

  formatFile(content: CommandContent): string {
    return `${content.body}
`;
  },
};
