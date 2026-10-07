import { MyAppRootComponent } from './my-app-root/my-app-root.xd.component';

// Importing the class evaluates its @WebComponent decorator, which defines the custom element.
// Logging it keeps the import from being removed as unused.
console.log(MyAppRootComponent);
