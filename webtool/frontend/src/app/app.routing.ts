import {Routes} from '@angular/router';
import {DashboardComponent} from './dashboard/dashboard.component';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';

export const routes: Routes = [
  {path: 'dashboard', component: DashboardComponent, data: {breadcrumb: 'Dashboard'}},
  {path: 'trainers', loadChildren: './guide/guide.module#GuideModule', data: {breadcrumb: 'Trainer'}},
  {path: 'tours', loadChildren: './tour/tour.module#TourModule', data: {breadcrumb: 'Touren'}},
  {path: 'instructions', loadChildren: './instruction/instruction.module#InstructionModule', data: {breadcrumb: 'Kurse'}},
  {path: 'sessions', loadChildren: './session/session.module#SessionModule', data: {breadcrumb: 'Gruppen'}},
  {path: 'talks', loadChildren: './talk/talk.module#TalkModule', data: {breadcrumb: 'Events'}},
  {path: '', redirectTo: '/dashboard', pathMatch: 'full'},
  {path: '**', component: PageNotFoundComponent}
];

