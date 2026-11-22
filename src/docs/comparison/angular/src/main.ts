import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { EmployeesPage } from './app/employees-page';

bootstrapApplication(EmployeesPage, { providers: [provideZonelessChangeDetection()] });
