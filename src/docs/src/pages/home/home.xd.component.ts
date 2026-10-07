import { CustomElement, WebComponent } from '@xaendar/core';

/**
 * The home page, in English.
 */
@WebComponent({
  selector: 'page-home-en',
  templateUrl: './home.en.xd.component.html',
  styleUrl: '../page.css'
})
export class HomePageEn extends CustomElement {}

/**
 * The home page, in Italian.
 */
@WebComponent({
  selector: 'page-home-it',
  templateUrl: './home.it.xd.component.html',
  styleUrl: '../page.css'
})
export class HomePageIt extends CustomElement {}
