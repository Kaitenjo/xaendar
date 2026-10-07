import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The "Installation" page, in English.
 */
@WebComponent({
  selector: 'page-installation-en',
  templateUrl: './installation.en.xd.component.html',
  styleUrl: '../page.css'
})
export class InstallationPageEn extends CustomElement {}

/**
 * The "Installation" page, in Italian.
 */
@WebComponent({
  selector: 'page-installation-it',
  templateUrl: './installation.it.xd.component.html',
  styleUrl: '../page.css'
})
export class InstallationPageIt extends CustomElement {}
