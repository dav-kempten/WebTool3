import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {StoreModule} from '@ngrx/store';
import {StoreDevtoolsModule} from '@ngrx/store-devtools';
import {environment} from '../environments/environment';
import {PageNotFoundComponent} from './page-not-found/page-not-found.component';
import {DashboardComponent} from './dashboard/dashboard.component';
import {RouterModule, Routes} from '@angular/router';
import {HttpClientModule} from '@angular/common/http';
import {NavigationActionTiming, routerReducer, StoreRouterConnectingModule} from '@ngrx/router-store';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {EffectsModule} from '@ngrx/effects';
import {CoreModule} from './core/core.module';
import {CustomSerializer, initialAppState} from './app.state';
import {routes} from './app.routing';
import {ReactiveFormsModule} from '@angular/forms';

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    PageNotFoundComponent,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes, {enableTracing: false && !environment.production}),
    StoreModule.forRoot({router: routerReducer}, {initialState: initialAppState}),
    StoreRouterConnectingModule.forRoot({
      serializer: CustomSerializer,
      navigationActionTiming: NavigationActionTiming.PostActivation
    }),
    StoreDevtoolsModule.instrument({maxAge: 25, logOnly: environment.production}),
    !environment.production ? StoreDevtoolsModule.instrument() : [],
    EffectsModule.forRoot([]),
    CoreModule,
    ReactiveFormsModule
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
