import { CustomElement, WebComponent } from '@xaendar/core';
import { signal } from '@xaendar/core/signals';

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
}

@WebComponent({
  selector: 'app-form',
  styleUrl: './form.component.css',
  templateUrl: './form.xd.component.html',
})
export class FormComponent extends CustomElement {

  public readonly items = signal<UserRow[]>([
    { id: 1, name: 'Mario Rossi', email: 'mario.rossi@example.com', role: 'Admin' },
    { id: 2, name: 'Laura Bianchi', email: 'laura.bianchi@example.com', role: 'Editor' },
    { id: 3, name: 'Giuseppe Verdi', email: 'giuseppe.verdi@example.com', role: 'Viewer' },
    { id: 4, name: 'Anna Neri', email: 'anna.neri@example.com', role: 'Editor' }
  ]);

  private nextId = 5;

  // Pool di dati fittizi da cui pescare quando si aggiunge una nuova riga
  private samplePool = [
    { name: 'Francesca Gialli', role: 'Viewer' },
    { name: 'Luca Blu', role: 'Admin' },
    { name: 'Sara Marrone', role: 'Editor' },
    { name: 'Paolo Grigi', role: 'Viewer' },
    { name: 'Elena Viola', role: 'Admin' }
  ];

  private createRandomRow(): UserRow {
    const sample = this.samplePool[Math.floor(Math.random() * this.samplePool.length)]!;
    const id = this.nextId++;
    const emailName = sample.name.toLowerCase().replace(/\s+/g, '.');
    return {
      id,
      name: sample.name,
      email: `${emailName}@example.com`,
      role: sample.role
    };
  }

  /** Aggiunge una nuova riga in una posizione casuale della tabella */
  addRandomRow(): void {
    const newRow = this.createRandomRow();
    const randomIndex = Math.floor(Math.random() * (this.items().length + 1));
    this.items.update(items => {
      const newItems = [...items];
      newItems.splice(randomIndex, 0, newRow);
      return newItems;
    }); 
  }

  /** Aggiunge una nuova riga in coda alla tabella */
  addRowAtEnd(): void {
    const newRow = this.createRandomRow();
    this.items.update(items => [...items, newRow]);
  }

  /** Cancella la riga corrispondente all'id passato */
  deleteRow(id: number): void {
    this.items.update(items => items.filter(row => row.id !== id));
  }
}
