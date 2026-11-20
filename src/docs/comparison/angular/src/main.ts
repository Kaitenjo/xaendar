import { provideZonelessChangeDetection } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { mountTelemetry } from '../../shared/telemetry';
import { EmployeesPage } from './app/employees-page';

mountTelemetry('Angular');
bootstrapApplication(EmployeesPage, { providers: [provideZonelessChangeDetection()] });
