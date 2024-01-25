import { Component } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import awsExports from '../../aws-exports';
import { IdentityProvider } from '../models/idp.model';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent {
  readonly formFields = {
    signUp: {
      email: {
        order: 1,
      },
      given_name: {
        order: 2,
        label: 'First Name',
        placeholder: 'Enter your First Name',
      },
      family_name: {
        order: 3,
        label: 'Last Name',
        placeholder: 'Enter your Last Name',
      },
      password: {
        order: 4,
      },
      confirm_password: {
        order: 5,
      },
    },
    forgotPassword: {
      username: {
        label: 'Email',
        placeholder: 'Enter your Email',
      },
    },
  };

  constructor(public authenticator: AuthenticatorService) {}

  redirectToOktaSSO() {
    const oAuthAuthorizeEndpoint = new URL(
      `https://${awsExports.oauth.domain}/oauth2/authorize`
    );
    oAuthAuthorizeEndpoint.searchParams.append('identity_provider', 'Okta');
    oAuthAuthorizeEndpoint.searchParams.append(
      'redirect_uri',
      awsExports.oauth.redirectSignIn
    );
    oAuthAuthorizeEndpoint.searchParams.append('response_type', 'CODE');
    oAuthAuthorizeEndpoint.searchParams.append(
      'client_id',
      awsExports.aws_user_pools_web_client_id
    );
    oAuthAuthorizeEndpoint.searchParams.append(
      'scope',
      'aws.cognito.signin.user.admin email openid profile'
    );
    oAuthAuthorizeEndpoint.searchParams.append(
      'state',
      btoa(
        `identity_provider=${IdentityProvider.Okta};random_nonce=${Math.floor(
          Math.random() * 100000000
        )}`
      )
    );
    window.location.assign(oAuthAuthorizeEndpoint);
  }
}
