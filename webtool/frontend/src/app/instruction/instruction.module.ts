import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {InstructionListComponent} from './instruction-list/instruction-list.component';
import {InstructionDetailComponent} from './instruction-detail/instruction-detail.component';
import {CoreModule} from '../core/core.module';
import {ReactiveFormsModule} from '@angular/forms';

import {InputTextareaModule} from 'primeng/inputtextarea';
import {DropdownModule, InputTextModule} from "primeng/primeng";
import {ListboxModule} from "primeng/listbox";
import {MultiSelectModule} from 'primeng/multiselect';

const routes: Routes = [
  {path: ':id', component: InstructionDetailComponent},
  {path: '', component: InstructionListComponent, pathMatch: 'full'}
];

@NgModule({
  declarations: [InstructionListComponent, InstructionDetailComponent],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule.forChild(routes),
    ReactiveFormsModule,
    InputTextareaModule,
    InputTextModule,
    DropdownModule,
    ListboxModule,
    MultiSelectModule,
  ]
})
export class InstructionModule {
}
