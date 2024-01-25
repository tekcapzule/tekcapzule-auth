import { ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthHubEventData } from '@aws-amplify/core/dist/esm/Hub/types';
import { AuthenticatorService } from '@aws-amplify/ui-angular';
import { Hub, HubCapsule } from 'aws-amplify/utils';
import awsExports from '../../aws-exports';
import { IdentityProvider } from '../models/idp.model';
import { UserAttributeInfo } from '../models/userAttrs.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, OnDestroy {
  private usedAuthCodeFlowUrls: { [key: string]: boolean } = {};
  userAttrsInfo: UserAttributeInfo | null = null;
  identityProvider: IdentityProvider = IdentityProvider.Cognito;
  hubListenerCancelToken: any = null;

  constructor(
    public authenticator: AuthenticatorService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.hubListenerCancelToken = Hub.listen('auth', (data) => {
      this.authEventListener(data);
    });

    this.handleAuthCodeFlow();
  }

  ngOnDestroy(): void {
    if (this.hubListenerCancelToken) {
      this.hubListenerCancelToken();
    }
  }

  private authEventListener(data: HubCapsule<'auth', AuthHubEventData>) {
    switch (data.payload.event) {
      case 'signedIn':
        this.storeUserInfo();
        break;
    }
  }

  signOutUser() {
    this.deleteTokensAndUserAttributesFromStorage();
    this.authenticator.signOut();

    if (
      this.identityProvider === IdentityProvider.Okta ||
      this.identityProvider === IdentityProvider.Cognito
    ) {
      this.signOutOAuthUser();
    }
  }

  private async handleAuthCodeFlow() {
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code') || '';
    const encodedState = url.searchParams.get('state') || '';

    if (this.usedAuthCodeFlowUrls[url.toString()]) {
      return;
    }

    if (code) {
      this.usedAuthCodeFlowUrls[url.toString()] = true;
      const decodedState = atob(decodeURIComponent(encodedState));
      const isProviderOkta = decodedState.includes('Okta');

      if (isProviderOkta) {
        this.identityProvider = IdentityProvider.Okta;

        const { access_token, refresh_token, id_token } =
          await this.fetchOAuthTokens(code);

        this.storeOAuthTokens(access_token, refresh_token, id_token);
      }
    } else {
      this.storeUserInfo();
    }
  }

  private storeOAuthTokens(
    access_token: string,
    refresh_token: string,
    id_token: string
  ) {
    const storage = window.localStorage;
    const providerName = this.extractIdentityProviderName(id_token);
    const userAttrs = this.extractUserAttributes(access_token, id_token);
    this.userAttrsInfo = { ...userAttrs };

    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.LastAuthUser`;
    const accessTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${userAttrs.username}.accessToken`;
    const idTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${userAttrs.username}.idToken`;
    const refreshTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${userAttrs.username}.refreshToken`;
    const userAttrsKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${userAttrs.username}.userAttributes`;
    const providerNameKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.providerName`;

    storage.setItem(lastAuthUserKey, userAttrs.username);
    storage.setItem(accessTokenKey, access_token);
    storage.setItem(idTokenKey, id_token);
    storage.setItem(refreshTokenKey, refresh_token);
    storage.setItem(userAttrsKey, JSON.stringify(userAttrs));
    storage.setItem(providerNameKey, providerName);

    window.history.replaceState({}, '', window.location.origin + '/home');
    this.changeDetectorRef.detectChanges();
  }

  private extractUserAttributes(access_token: string, id_token: string) {
    const accessTokenPayload = JSON.parse(atob(access_token.split('.')[1]));
    const idTokenPayload = JSON.parse(atob(id_token.split('.')[1]));
    const username = accessTokenPayload['username'] as string;

    const userAttrs = {
      username,
      sub: idTokenPayload['sub'] as string,
      email: idTokenPayload['email'] as string,
      firstName: idTokenPayload['given_name'] as string,
      lastName: idTokenPayload['family_name'] as string,
    };

    return userAttrs;
  }

  private extractIdentityProviderName(id_token: string) {
    const idTokenPayload = JSON.parse(atob(id_token.split('.')[1]));
    let providerName: string =
      idTokenPayload?.['identities']?.[0]?.['providerName'];

    if (providerName) {
      switch (providerName.toLowerCase()) {
        case IdentityProvider.Okta.toLowerCase():
          return IdentityProvider.Okta;
        case IdentityProvider.Google.toLowerCase():
          return IdentityProvider.Google;
        case IdentityProvider.Facebook.toLowerCase():
          return IdentityProvider.Facebook;
        case IdentityProvider.Cognito.toLowerCase():
          return IdentityProvider.Cognito;
        default:
          return IdentityProvider.Other;
      }
    } else {
      return IdentityProvider.Cognito;
    }
  }

  private storeUserInfo() {
    const storage = window.localStorage;
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.LastAuthUser`;

    if (storage.getItem(lastAuthUserKey)) {
      const username = storage.getItem(lastAuthUserKey)!;
      const accessTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${username}.accessToken`;
      const idTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${username}.idToken`;
      const userAttrsKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${username}.userAttributes`;
      const providerNameKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.providerName`;

      const accesToken = storage.getItem(accessTokenKey)!;
      const idToken = storage.getItem(idTokenKey)!;
      const userAttrs = this.extractUserAttributes(accesToken, idToken);
      this.userAttrsInfo = { ...userAttrs };

      if (!storage.getItem(userAttrsKey)) {
        storage.setItem(userAttrsKey, JSON.stringify(userAttrs));
      }

      if (storage.getItem(providerNameKey)) {
        this.identityProvider = storage.getItem(
          providerNameKey
        ) as IdentityProvider;
      } else {
        const providerName = this.extractIdentityProviderName(idToken);
        storage.setItem(providerNameKey, providerName);
        this.identityProvider = storage.getItem(
          providerNameKey
        ) as IdentityProvider;
      }

      this.changeDetectorRef.detectChanges();
    }
  }

  private async fetchOAuthTokens(code: string) {
    const oAuthTokenEndpoint = new URL(
      `https://${awsExports.oauth.domain}/oauth2/token`
    );

    const oAuthTokenBody = {
      code,
      grant_type: 'authorization_code',
      client_id: awsExports.aws_user_pools_web_client_id,
      redirect_uri: awsExports.oauth.redirectSignIn,
    };

    const body = Object.entries(oAuthTokenBody)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const { access_token, refresh_token, id_token, error } = await (
      await fetch(oAuthTokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body,
      })
    ).json();

    if (error) {
      throw new Error(error);
    }

    return {
      access_token,
      refresh_token,
      id_token,
    };
  }

  private signOutOAuthUser() {
    const oAuthLogoutEndpoint = new URL(
      `https://${awsExports.oauth.domain}/logout`
    );
    oAuthLogoutEndpoint.searchParams.append(
      'client_id',
      awsExports.aws_user_pools_web_client_id
    );
    oAuthLogoutEndpoint.searchParams.append(
      'logout_uri',
      awsExports.oauth.redirectSignOut
    );

    window.open(oAuthLogoutEndpoint, '_self');
  }

  private deleteTokensAndUserAttributesFromStorage() {
    const storage = window.localStorage;
    const lastAuthUserKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.LastAuthUser`;
    const lastAuthUser = window.localStorage.getItem(lastAuthUserKey);

    if (lastAuthUser) {
      const accessTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${lastAuthUser}.accessToken`;
      const idTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${lastAuthUser}.idToken`;
      const refreshTokenKey = `CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${lastAuthUser}.refreshToken`;
      const userAttrsKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.${lastAuthUser}.userAttributes`;
      const providerNameKey = `Tekcapzule.CognitoIdentityServiceProvider.${awsExports.aws_user_pools_web_client_id}.providerName`;

      storage.removeItem(accessTokenKey);
      storage.removeItem(idTokenKey);
      storage.removeItem(refreshTokenKey);
      storage.removeItem(userAttrsKey);
      storage.removeItem(lastAuthUser);
      storage.removeItem(providerNameKey);
    }
  }
}
