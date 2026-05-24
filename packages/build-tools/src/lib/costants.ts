/** 
 * Extension of the Xaendar DSL template files. 
 */
export const TEMPLATE_EXTENSION = '.xd.component.html';

/** 
 * Extension of the Xaendar DSL style files. 
 */
export const STYLE_EXTENSION = (extension = 'css') => `.xd.component.${extension}`;

/** 
 * Matches any TypeScript file that follows the Xaendar component convention. 
 */
export const COMPONENT_FILE_RE = /\.xd\.component\.ts$/;