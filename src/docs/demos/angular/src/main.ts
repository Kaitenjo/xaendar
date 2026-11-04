import { bootstrapApplication } from '@angular/platform-browser';
import { defineQtyPicker } from '@xaendar-demo/qty-picker';
import { provideZonelessChangeDetection } from '@angular/core';
import { App } from './app/app';

/*
  The element is defined before Angular bootstraps: Angular creates <ex-qty-picker> itself, and a tag whose
  definition has not arrived yet stays an empty unknown element. The application is zoneless, so only the
  signal the template reads tells Angular that the quantity changed.
*/
defineQtyPicker().then(() => bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] }));
