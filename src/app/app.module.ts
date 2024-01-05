import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Amplify } from 'aws-amplify';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import amplifyconfig from '../aws-exports';

Amplify.configure(amplifyconfig);

@NgModule({
  declarations: [AppComponent, AuthComponent],
  imports: [BrowserModule, AmplifyAuthenticatorModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
