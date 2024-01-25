import { Component, OnInit } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { Hub, HubCapsule } from 'aws-amplify/utils';
import { AuthHubEventData } from '@aws-amplify/core/dist/esm/Hub/types';
import awsExports from '../../aws-exports';
import { IdentityProvider } from '../models/idp.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  hubListenerCancelToken: any = null;

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

  constructor(
    public authenticator: AuthenticatorService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.hubListenerCancelToken = Hub.listen('auth', (data) => {
      this.authEventListener(data);
    });
  }

  private authEventListener(data: HubCapsule<'auth', AuthHubEventData>) {
    switch (data.payload.event) {
      case 'signedIn':
        this.handleAwsCognitoSignedInFlow();
        break;
    }
  }

  /**
   * Only for AWS Cognito
   */
  handleAwsCognitoSignedInFlow() {
    // navigate to home page post signedIn
    this.router.navigate(['home']);
  }

  redirectToOktaSSO() {
    const oAuthAuthorizeEndpoint = new URL(
      `https://${awsExports.oauth.domain}/oauth2/authorize`
    );
    oAuthAuthorizeEndpoint.searchParams.append(
      'identity_provider',
      IdentityProvider.Okta
    );
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
