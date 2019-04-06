import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TalkListComponent} from './talk-list/talk-list.component';
import {TalkDetailComponent} from './talk-detail/talk-detail.component';
import {RouterModule, Routes} from '@angular/router';
import {CoreModule} from '../core/core.module';

const routes: Routes = [
  {path: ':id', component: TalkDetailComponent},
  {path: '', component: TalkListComponent, pathMatch: 'full'}
];

@NgModule({
  declarations: [TalkListComponent, TalkDetailComponent],
  imports: [
    CommonModule,
    CoreModule,
    RouterModule.forChild(routes),
  ],
})
export class TalkModule { }
