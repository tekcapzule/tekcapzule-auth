import { Component } from '@angular/core';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import awsExports from '../../aws-exports';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent {
  constructor(public authenticator: AuthenticatorService) {}

  signOutUser() {
    this.authenticator.signOut();
    this.deleteUserInfoFromLocalStorage();
  }

  private deleteUserInfoFromLocalStorage() {
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.LastAuthUser`;
    const lastAuthUser = window.localStorage.getItem(lastAuthUserKey);

    if (lastAuthUser) {
      const lastAuthUserInfoKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${lastAuthUser}.LastAuthUserInfo`;
      window.localStorage.removeItem(lastAuthUserInfoKey);
    }
  }
}
