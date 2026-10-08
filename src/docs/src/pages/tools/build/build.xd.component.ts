import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Build and Vite plugin" page, in English.
 */
@WebComponent({
  selector: 'page-tools-build-en',
  templateUrl: './build.en.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsBuildPageEn extends CustomElement {}

/**
 * The "Build and Vite plugin" page, in Italian.
 */
@WebComponent({
  selector: 'page-tools-build-it',
  templateUrl: './build.it.xd.component.html',
  styleUrl: '../../page.css'
})
export class ToolsBuildPageIt extends CustomElement {}
