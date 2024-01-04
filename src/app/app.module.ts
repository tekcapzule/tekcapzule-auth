import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { Amplify } from 'aws-amplify';
import { AmplifyAuthenticatorModule } from '@aws-amplify/ui-angular';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { environment } from '../environments/environment';
import { AuthComponent } from './auth/auth.component';

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: environment.AwsCognitoConfigs.UserPoolId,
      userPoolClientId: environment.AwsCognitoConfigs.UserPoolClientId,
      identityPoolId: environment.AwsCognitoConfigs.IdentityPoolId,
      userAttributes: {
        given_name: {
          required: true,
        },
        family_name: {
          required: true,
        },
      },
    },
  },
});

@NgModule({
  declarations: [AppComponent, AuthComponent],
  imports: [BrowserModule, AmplifyAuthenticatorModule, AppRoutingModule],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
