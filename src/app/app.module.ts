import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';
import { Amplify } from 'aws-amplify';

import awsExports from '../aws-exports';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { AuthComponent } from './auth/auth.component';
import { HomeComponent } from './home/home.component';
import { CallbackComponent } from './callback/callback.component';

Amplify.configure(awsExports);

@NgModule({
  declarations: [AppComponent, AuthComponent, HomeComponent, CallbackComponent],
  imports: [
    BrowserModule,
    AmplifyAuthenticatorModule,
    BrowserAnimationsModule,
    AppRoutingModule,
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
