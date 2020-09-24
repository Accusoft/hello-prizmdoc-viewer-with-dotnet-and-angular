import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { PrizmDocViewerWrapperComponent } from './prizmdoc-viewer-wrapper/prizmdoc-viewer-wrapper.component';
import { DocumentListComponent } from './document-list/document-list.component';
import { DocumentDetailComponent } from './document-detail/document-detail.component';
import { NavMenuComponent } from './nav-menu/nav-menu.component';
import { HomeComponent } from './home/home.component';
import { WhatJustHappenedComponent } from './what-just-happened/what-just-happened.component';

@NgModule({
  declarations: [
    AppComponent,
    NavMenuComponent,
    PrizmDocViewerWrapperComponent,
    DocumentListComponent,
    DocumentDetailComponent,
    HomeComponent,
    WhatJustHappenedComponent
  ],
  imports: [
    BrowserModule.withServerTransition({ appId: 'ng-cli-universal' }),
    HttpClientModule,
    FormsModule,
    RouterModule.forRoot([
      { path: 'documents/:filename', component: DocumentDetailComponent },
      { path: '', component: HomeComponent, pathMatch: 'full' }
    ])
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
