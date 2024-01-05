import { Component, OnDestroy, OnInit } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { fetchUserAttributes, signInWithRedirect } from 'aws-amplify/auth';
import { Hub } from 'aws-amplify/utils';
import amplifyconfig from '../../aws-exports';

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
export class AuthComponent implements OnInit, OnDestroy {
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

  constructor(private authenticator: AuthenticatorService) {}

  ngOnInit(): void {
    this.hubListenerCancelToken = Hub.listen('auth', (data) => {
      this.authEventListener(data);
    });

    this.checkIfUserAlreadySignedIn();
  }

  ngOnDestroy(): void {
    if (this.hubListenerCancelToken) {
      this.hubListenerCancelToken();
    }
  }

  public signOutUser() {
    this.authenticator.signOut();
    this.deleteUserInfoFromLocalStorage();
  }

  private authEventListener(data: any) {
    switch (data?.payload?.event) {
      case 'signedIn':
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
    window.localStorage.setItem(
      `Tekcapzule.CognitoIdentityServiceProvider.${amplifyconfig.aws_user_pools_web_client_id}.${userInfo.sub}.LastAuthUserInfo`,
      JSON.stringify(userInfo)
    );
  }

  private deleteUserInfoFromLocalStorage() {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${amplifyconfig.aws_user_pools_web_client_id}.LastAuthUser`;
    const userSub = window.localStorage.getItem(lastAuthUserKey);
    const lastAuthUserInfoKey = `Tekcapzule.CognitoIdentityServiceProvider.${amplifyconfig.aws_user_pools_web_client_id}.${userSub}.LastAuthUserInfo`;
    window.localStorage.removeItem(lastAuthUserInfoKey);
  }

  checkIfUserAlreadySignedIn() {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${amplifyconfig.aws_user_pools_web_client_id}.LastAuthUser`;
    const userSub = window.localStorage.getItem(lastAuthUserKey);

    if (userSub) {
      const lastAuthUserInfoKey = `Tekcapzule.CognitoIdentityServiceProvider.${amplifyconfig.aws_user_pools_web_client_id}.${userSub}.LastAuthUserInfo`;
      const lastAuthUserInfo = window.localStorage.getItem(lastAuthUserInfoKey);
      this.userInfo = lastAuthUserInfo ? JSON.parse(lastAuthUserInfo) : null;
    }
  }
}
