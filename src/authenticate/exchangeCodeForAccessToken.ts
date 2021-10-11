import fetch from "isomorphic-unfetch";
import urlcat, { query } from "urlcat";

import type { AccessTokenResponse } from "@/models";

import { AUTH_BASE_URL } from "./AUTH_BASE_URL";

/**
 * @param accessCode Your access code, typically retrieved by using `exchangeNpssoForCode()`.
 * @returns An object containing an access token, refresh token, and expiry times for both.
 */
export const exchangeCodeForAccessToken = async (
  accessCode: string
): Promise<AccessTokenResponse> => {
  const requestUrl = urlcat(AUTH_BASE_URL, "/token");

  const res = await fetch(requestUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic YWM4ZDE2MWEtZDk2Ni00NzI4LWIwZWEtZmZlYzIyZjY5ZWRjOkRFaXhFcVhYQ2RYZHdqMHY="
    },
    body: query({
      code: `${accessCode}`,
      redirect_uri: "com.playstation.PlayStationApp://redirect",
      grant_type: "authorization_code",
      token_format: "jwt"
    })
  });

  const raw = await res.json();

  return {
    accessToken: raw.access_token,
    expiresIn: raw.expires_in,
    idToken: raw.id_token,
    refreshToken: raw.refresh_token,
    refreshTokenExpiresIn: raw.refresh_token_expires_in,
    scope: raw.scope,
    tokenType: raw.token_type
  };
};
