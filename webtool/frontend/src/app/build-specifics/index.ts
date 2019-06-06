import { StoreDevtoolsModule } from '@ngrx/store-devtools';
export const buildSpecificModules = [StoreDevtoolsModule.instrument({maxAge: 25})];
