import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import awsconfigs from '../../aws-exports';

export type AwsCognitoUserInfo = {
  email?: string;
  family_name?: string;
  given_name?: string;
  sub?: string;
  email_verified?: string;
};

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit, OnDestroy, AfterViewInit {
  hubListenerCancelToken: any = null;
  userInfo: AwsCognitoUserInfo | null = null;

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

  ngOnInit(): void {
    this.hubListenerCancelToken = Hub.listen('auth', (data) => {
      this.authEventListener(data);
    });
  }

  ngOnDestroy(): void {
    if (this.hubListenerCancelToken) {
      this.hubListenerCancelToken();
    }
  }

  ngAfterViewInit(): void {
    this.checkIfUserAlreadySignedIn();
  }

  signOutUser() {
    this.authenticator.signOut();
    this.deleteUserInfoFromLocalStorage();
  }

  private authEventListener(data: any) {
    switch (data?.payload?.event) {
      case 'signedIn':
      case 'signInWithRedirect':
        this.handleFetchUserAttributes();
        break;
    }
  }

  private async handleFetchUserAttributes() {
    try {
      const userAttributes = await fetchUserAttributes();
      this.userInfo = {
        ...userAttributes,
      };
      this.saveUserInfoToLocalStorage(this.userInfo);
    } catch (error) {
      console.log(error);
    }
  }

  private saveUserInfoToLocalStorage(userInfo: AwsCognitoUserInfo) {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.LastAuthUser`;
    const lastAuthUser = window.localStorage.getItem(lastAuthUserKey);

    if (lastAuthUser) {
      window.localStorage.setItem(
        `Tekcapzule.CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.${lastAuthUser}.LastAuthUserInfo`,
        JSON.stringify(userInfo)
      );
    }
  }

  private deleteUserInfoFromLocalStorage() {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.LastAuthUser`;
    const lastAuthUser = window.localStorage.getItem(lastAuthUserKey);

    if (lastAuthUser) {
      const lastAuthUserInfoKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.${lastAuthUser}.LastAuthUserInfo`;
      window.localStorage.removeItem(lastAuthUserInfoKey);
    }
  }

  checkIfUserAlreadySignedIn() {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.LastAuthUser`;
    const lastAuthUser = window.localStorage.getItem(lastAuthUserKey);

    if (lastAuthUser) {
      const lastAuthUserInfoKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsconfigs.aws_user_pools_web_client_id}.${lastAuthUser}.LastAuthUserInfo`;
      const lastAuthUserInfo = window.localStorage.getItem(lastAuthUserInfoKey);
      this.userInfo = lastAuthUserInfo ? JSON.parse(lastAuthUserInfo) : null;
    }
  }

  redirectToOktaSSO() {
    const oktaUrl = new URL(
      `https://${awsconfigs.oauth.domain}/oauth2/authorize`
    );
    oktaUrl.searchParams.append('identity_provider', 'Okta');
    oktaUrl.searchParams.append(
      'redirect_uri',
      awsconfigs.oauth.redirectSignIn
    );
    oktaUrl.searchParams.append('response_type', 'CODE');
    oktaUrl.searchParams.append(
      'client_id',
      awsconfigs.aws_user_pools_web_client_id
    );
    oktaUrl.searchParams.append(
      'scope',
      'aws.cognito.signin.user.admin email openid profile'
    );
    window.location.assign(oktaUrl);
  }
}
