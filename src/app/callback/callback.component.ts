import { Component } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import awsExports from '../../aws-exports';
import { OAuthTokenInfo } from '../models/token.model';

@Component({
  selector: 'app-callback',
  templateUrl: './callback.component.html',
  styleUrls: ['./callback.component.scss'],
})
export class CallbackComponent {
  private usedCodeGrandFlowUrls: { [key: string]: boolean } = {};

  constructor(private httpClient: HttpClient) {}

  private handleAwsCognitoCodeGrandFlow(): void {
    if (window.location) {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (this.usedCodeGrandFlowUrls[url.toString()]) {
        return;
      }

      if (code) {
        this.usedCodeGrandFlowUrls[url.toString()] = true;
        this.fetchAwsCognitoOAuthToken(code);
      } else {
        // const userInfo = this.getStoredUserInfo();
      }
    }
  }

  private fetchAwsCognitoOAuthToken(code: string): void {
    const tokenApi = new URL(`https://${awsExports.oauth.domain}/oauth2/token`);
    const authHeaderEncoded = btoa(
      `${awsExports.aws_user_pools_web_client_id}:`
    );
    const httHeaders = new HttpHeaders()
      .set('Authorization', `Basic ${authHeaderEncoded}`)
      .set('Content-Type', 'application/x-www-form-urlencoded');

    const httpParams = new HttpParams()
      .set('code', code)
      .set('grant_type', 'authorization_code')
      .set('client_id', awsExports.aws_user_pools_web_client_id)
      .set('redirect_uri', awsExports.oauth.redirectSignIn);

    this.httpClient
      .post<OAuthTokenInfo>(tokenApi.toString(), httpParams.toString(), {
        headers: httHeaders,
      })
      .subscribe((data) => {
        // this.saveAwsCognitoOAuthTokensToLocalStorage(data);
      });

    // if (window.history) {
    //   window.history.replaceState(
    //     {},
    //     null,
    //     environment.awsCognitoConfigs.redirectUri
    //   );
    // }
  }
}
