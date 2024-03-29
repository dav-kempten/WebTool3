import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterModule, Routes} from '@angular/router';
import {InstructionListComponent} from './instruction-list/instruction-list.component';
import {InstructionDetailComponent} from './instruction-detail/instruction-detail.component';
import {CoreModule} from '../core/core.module';
import {ReactiveFormsModule} from '@angular/forms';

import {TableModule} from 'primeng/table';
import {TabMenuModule} from 'primeng/tabmenu';
import {DropdownModule} from 'primeng/dropdown';
import {TooltipModule} from 'primeng/primeng';

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
    TableModule,
    TabMenuModule,
    DropdownModule,
    TooltipModule,
  ]
})
export class InstructionModule {
}
