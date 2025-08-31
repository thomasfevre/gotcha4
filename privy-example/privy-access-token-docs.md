# Access tokens

When a user logs in to your app and becomes **authenticated**, Privy issues the user an app **access token**. This token is signed by Privy and cannot be spoofed.

When your frontend makes a request to your backend, you should include the current user's access token in the request. This allows your server to determine whether the requesting user is truly authenticated or not.

<Note>
  Looking to access user data? Check out our [Identity
  tokens](/user-management/users/identity-tokens#identity-tokens).
</Note>

***

## Access token format

Privy access tokens are [JSON Web Tokens (JWT)](https://jwt.io/introduction), signed with the ES256 algorithm. These JWTs include certain information about the user in their claims, namely:

<Expandable title="properties">
  <ResponseField name="sid" type="string">
    The user's current session ID
  </ResponseField>

  <ResponseField name="sub" type="string">
    The user's Privy DID
  </ResponseField>

  <ResponseField name="iss" type="string">
    The token issuer, which should always be [privy.io](https://privy.io)
  </ResponseField>

  <ResponseField name="aud" type="string">
    Your Privy app ID
  </ResponseField>

  <ResponseField name="iat" type="number">
    The timestamp of when the JWT was issued
  </ResponseField>

  <ResponseField name="exp" type="number">
    The timestamp of when the JWT will expire and is no longer valid. This is generally 1 hour after
    the JWT was issued.
  </ResponseField>
</Expandable>

<Info>
  Read more about Privy's tokens and their security in our [security
  guide](/security/authentication/user-authentication).
</Info>

***

## Sending the access token

### Accessing the token from your client

To include the current user's access token in requests from your frontend to your backend, you'll first need to retrieve it, then send it appropriately.

<Tabs>
  <Tab title="React">
    You can get the current user's Privy token as a string using the **`getAccessToken`** method from the **`usePrivy`** hook. This method will also automatically refresh the user's access token if it is nearing expiration or has expired.

    ```tsx
    const { getAccessToken } = usePrivy();
    const accessToken = await getAccessToken();
    ```

    If you need to get a user's Privy token *outside* of Privy's React context, you can directly import the **`getAccessToken`** method:

    ```tsx
    import { getAccessToken } from '@privy-io/react-auth';

    const authToken = await getAccessToken();
    ```

    <Warning>
      When using direct imports, you must ensure **`PrivyProvider`** has rendered before invoking the method.
      Whenever possible, you should retrieve **`getAccessToken`** from the **`usePrivy`** hook.
    </Warning>
  </Tab>

  <Tab title="React Native">
    In React Native, you can use the `getAccessToken` method from the `PrivyClient` instance to retrieve the user's access token.

    ```tsx
    const privy = createPrivyClient({
      appId: '<your-privy-app-id>',
      clientId: '<your-privy-app-client-id>'
    });
    const accessToken = await privy.getAccessToken();
    ```
  </Tab>

  <Tab title="Swift">
    In Swift, you can use the `getAccessToken` method on the PrivyUser object to retrieve the user's access token.

    ```swift
    // Check if user is authenticated
    guard let user = privy.user else {
      // If user is nil, user is not authenticated
      return
    }

    // Get the access token
    do {
      let accessToken = try await user.getAccessToken()
      print("Access token: \(accessToken)")
    } catch {
      // Handle error appropriately
    }
    ```
  </Tab>

  <Tab title="Android">
    In Android, you can use the `getAccessToken` method on the PrivyUser object to retrieve the user's access token.

    ```kotlin
    // Check if user is authenticated
    val user = privy.user
    if (user != null) {

      // Get the access token
      val result: Result<String> = user.getAccessToken()

      // Handle the result with fold method
      result.fold(
          onSuccess = { accessToken ->
              println("Access token: $accessToken")
          },
          onFailure = { error ->
              // Handle error appropriately
          },
      )
    }
    ```
  </Tab>

  <Tab title="Flutter">
    In Flutter, you can use the `getAccessToken` method on the PrivyUser object to retrieve the user's access token.

    ```dart
    // Check if user is authenticated
    final user = privy.user;
    if (user != null) {

      // Get the access token
      final result = await privy.user.getAccessToken();

      // Handle the result with fold method
      result.fold(
        onSuccess: (accessToken) {
          print('Access token: $accessToken');
        },
        onError: (error) {
          // Handle error appropriately
        },
      );
    }
    ```
  </Tab>

  <Tab title="Unity">
    In Unity, you can use the `GetAccessToken` method on the `PrivyUser` instance to retrieve the user's access token.

    ```csharp
    // User will be null if no user is authenticated
    PrivyUser user = PrivyManager.Instance.User;
    if (user != null) {
      string accessToken = await user.GetAccessToken();
      Debug.Log(accessToken);
    }
    ```
  </Tab>
</Tabs>

<Info>
  If your app is configured to use HTTP-only cookies (instead of the default local storage), the
  access token will automatically be included in the cookies for requests to the same domain. In
  this case, you don't need to manually include the token in the request headers.
</Info>

### Using the access token with popular libraries

When sending requests to your backend, here's how you can include the access token with different HTTP client libraries:

<Tabs>
  <Tab title="fetch">
    ```tsx
    // For bearer token approach (when using local storage)
    const accessToken = await getAccessToken();
    const response = await fetch('<your-api-endpoint>', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    // For HTTP-only cookies approach
    const response = await fetch('<your-api-endpoint>', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // This includes cookies automatically
      body: JSON.stringify(data)
    });
    ```
  </Tab>

  <Tab title="axios">
    ```tsx
    import axios from 'axios';

    // For bearer token approach (when using local storage)
    const accessToken = await getAccessToken();
    const response = await axios({
      method: 'post',
      url: '<your-api-endpoint>',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      data: data
    });

    // For HTTP-only cookies approach
    const response = await axios({
      method: 'post',
      url: '<your-api-endpoint>',
      withCredentials: true, // This includes cookies automatically
      data: data
    });
    ```
  </Tab>

  <Tab title="ofetch">
    ```tsx
    import { ofetch } from 'ofetch';

    // For bearer token approach (when using local storage)
    const accessToken = await getAccessToken();
    const response = await ofetch('<your-api-endpoint>', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      },
      body: data
    });

    // For HTTP-only cookies approach
    const response = await ofetch('<your-api-endpoint>', {
      method: 'POST',
      credentials: 'include', // This includes cookies automatically
      body: data
    });
    ```
  </Tab>
</Tabs>

***

## Getting the access token

### Accessing the token from your server

When your server receives a request, the location of the user's access token depends on whether your app uses **local storage** (the default) or **cookies** to manage user sessions.

<Expandable title="local storage setup">
  If you're using local storage for session management, the access token will be passed in the `Authorization` header of the request with the `Bearer` prefix. You can extract it like this:

  <Tabs>
    <Tab title="NodeJS">
      ```tsx
      // Example for Express.js
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      // Example for Next.js API route
      const accessToken = req.headers.authorization?.replace('Bearer ', '');

      // Example for Next.js App Router
      const accessToken = headers().get('authorization')?.replace('Bearer ', '');
      ```
    </Tab>

    <Tab title="Go">
      ```go
      // Example for Go
      accessToken := r.Header.Get("Authorization")
      accessToken = strings.Replace(accessToken, "Bearer ", "", 1)
      ```
    </Tab>

    <Tab title="Python">
      ```python
      # Example for Python
      accessToken = request.headers.get("Authorization")
      accessToken = accessToken.replace("Bearer ", "")
      ```
    </Tab>
  </Tabs>
</Expandable>

<Expandable title="cookie setup">
  If you're using HTTP-only cookies for session management, the access token will be automatically included in the `privy-token` cookie. You can extract it like this:

  <Tabs>
    <Tab title="NodeJS">
      ```tsx
      // Example for Express.js
      const accessToken = req.cookies['privy-token'];

      // Example for Next.js API route
      const accessToken = req.cookies['privy-token'];

      // Example for Next.js App Router
      const cookieStore = cookies();
      const accessToken = cookieStore.get('privy-token')?.value;
      ```
    </Tab>

    <Tab title="Go">
      ```go
      // Example for Go
      accessToken := r.Cookies["privy-token"]
      ```
    </Tab>

    <Tab title="Python">
      ```python
      # Example for Python
      accessToken = request.cookies.get("privy-token")
      ```
    </Tab>
  </Tabs>
</Expandable>

## Verifying the access token

Once you've obtained the user's access token from a request, you should verify the token against Privy's **verification key** for your app to confirm that the token was issued by Privy and the user referenced by the DID in the token is truly authenticated.

The access token is a standard [ES256](https://datatracker.ietf.org/doc/html/rfc7518#section-3.1) [JWT](https://jwt.io) and the verification key is a standard [Ed25519](https://en.wikipedia.org/wiki/EdDSA#Ed25519) public key. You can verify the access token against the public key using the **`@privy-io/server-auth`** library or using a third-party library for managing tokens.

<Tabs>
  <Tab title="NodeJS">
    ### Using Privy SDK

    Pass the user's access token as a `string` to the **`PrivyClient`**'s **`verifyAuthToken`** method:

    ```tsx
    // `privy` refers to an instance of the `PrivyClient`
    try {
      const verifiedClaims = await privy.verifyAuthToken(authToken);
    } catch (error) {
      console.log(`Token verification failed with error ${error}.`);
    }
    ```

    If the token is valid, **`verifyAuthToken`** will return an **`AuthTokenClaims`** object with additional information about the request, with the fields below:

    | Parameter    | Type     | Description                                                                   |
    | ------------ | -------- | ----------------------------------------------------------------------------- |
    | `appId`      | `string` | Your Privy app ID.                                                            |
    | `userId`     | `string` | The authenticated user's Privy DID. Use this to identify the requesting user. |
    | `issuer`     | `string` | This will always be `'privy.io'`.                                             |
    | `issuedAt`   | `string` | Timestamp for when the access token was signed by Privy.                      |
    | `expiration` | `string` | Timestamp for when the access token will expire.                              |
    | `sessionId`  | `string` | Unique identifier for the user's session.                                     |

    If the token is invalid, **`verifyAuthToken`** will throw an error and you should **not** consider the requesting user authorized. This generally occurs if the token has expired or is invalid (e.g. corresponds to a different app ID).

    <Tip>
      The Privy Client's `verifyAuthToken` method will make a request to Privy's API to fetch the verification key for your app. You can avoid this API request by copying your verification key from the **Configuration > App settings** page of the [**Dashboard**](https://dashboard.privy.io) and passing it as a second parameter to `verifyAuthToken`:

      ```ts
      const verifiedClaims = await privy.verifyAuthToken(
        authToken,
        'paste-your-verification-key-from-the-dashboard'
      );
      ```
    </Tip>

    ### Using JavaScript libraries

    You can also use common JavaScript libraries to verify tokens:

    <Tabs>
      <Tab title="jose">
        To start, install `jose`:

        ```sh
        npm i jose
        ```

        Then, load your Privy public key using [`jose.importSPKI`](https://github.com/panva/jose/blob/main/docs/functions/key_import.importSPKI.md):

        ```tsx
        const verificationKey = await jose.importSPKI(
          "insert-your-privy-verification-key",
          "ES256"
        );
        ```

        Lastly, using [`jose.jwtVerify`](https://github.com/panva/jose/blob/main/docs/functions/jwt_verify.jwtVerify.md), verify that the JWT is valid and was issued by Privy!

        ```tsx
        const accessToken = "insert-the-users-access-token";
        try {
          const payload = await jose.jwtVerify(accessToken, verificationKey, {
            issuer: "privy.io",
            audience: "insert-your-privy-app-id",
          });
          console.log(payload);
        } catch (error) {
          console.error(error);
        }
        ```

        If the JWT is valid, you can extract the JWT's claims from the [`payload`](https://github.com/panva/jose/blob/main/docs/interfaces/types.JWTPayload.md). For example, you can use `payload.sub` to get the user's Privy DID.

        If the JWT is invalid, this method will throw an error.
      </Tab>

      <Tab title="jsonwebtoken">
        To start, install `jsonwebtoken`:

        ```sh
        npm i jsonwebtoken
        ```

        Then, load your Privy public key as a string.

        ```tsx
        const verificationKey = "insert-your-privy-verification-key".replace(
          /\\n/g,
          "\n"
        );
        ```

        The `replace` operation above ensures that any instances of `'\n'` in the stringified public key are replaced with actual newlines, per the PEM-encoded format.

        Lastly, verify the JWT using [`jwt.verify`](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback):

        ```tsx
        const accessToken = 'insert-the-user-access-token-from-request';
        try {
          const decoded = jwt.verify(accessToken, verificationKey, {
            issuer: 'privy.io',
            audience: /* your Privy App ID */
          });
          console.log(decoded);
        } catch (error) {
          console.error(error);
        }
        ```

        If the JWT is valid, you can extract the JWT's claims from `decoded`. For example, you can use `decoded.sub` to get the user's Privy DID.

        If the JWT is invalid, this method will throw an error.
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Go">
    For Go, the [`golang-jwt`](https://github.com/golang-jwt/jwt) library is a popular choice for token verification. To start, install the library:

    ```sh
    go get -u github.com/golang-jwt/jwt/v5
    ```

    Next, load your Privy verification key and app ID as strings:

    ```go
    verificationKey := "insert-your-privy-verification-key"
    appId := "insert-your-privy-app-id"
    ```

    Then, parse the claims from the JWT and verify that they are valid:

    ```go
    accessToken := "insert-the-users-access-token"

    // Defining a Go type for Privy JWTs
    type PrivyClaims struct {
      AppId      string `json:"aud,omitempty"`
      Expiration uint64 `json:"exp,omitempty"`
      Issuer     string `json:"iss,omitempty"`
      UserId     string `json:"sub,omitempty"`
    }

    // This method will be used to check the token's claims later
    func (c *PrivyClaims) Valid() error {
      if c.AppId != appId {
        return errors.New("aud claim must be your Privy App ID.")
      }
      if c.Issuer != "privy.io" {
        return errors.New("iss claim must be 'privy.io'")
      }
      if c.Expiration < uint64(time.Now().Unix()) {
        return errors.New("Token is expired.");
      }

      return nil
    }

    // This method will be used to load the verification key in the required format later
    func keyFunc(token *jwt.Token) (interface{}, error) {
      if token.Method.Alg() != "ES256" {
        return nil, fmt.Errorf("Unexpected JWT signing method=%v", token.Header["alg"])
      }
        // https://pkg.go.dev/github.com/dgrijalva/jwt-go#ParseECPublicKeyFromPEM
      return jwt.ParseECPublicKeyFromPEM([]byte(verificationKey)), nil
    }

    // Check the JWT signature and decode claims
    // https://pkg.go.dev/github.com/dgrijalva/jwt-go#ParseWithClaims
    token, err := jwt.ParseWithClaims(accessToken, &PrivyClaims{}, keyFunc)
    if err != nil {
        fmt.Println("JWT signature is invalid.")
    }

    // Parse the JWT claims into your custom struct
    privyClaim, ok := token.Claims.(*PrivyClaims)
    if !ok {
        fmt.Println("JWT does not have all the necessary claims.")
    }

    // Check the JWT claims
    err = Valid(privyClaim);
    if err {
        fmt.Printf("JWT claims are invalid, with error=%v.", err);
        fmt.Println();
    } else {
        fmt.Println("JWT is valid.")
        fmt.Printf("%v", privyClaim)
    }
    ```

    If the JWT is valid, you can access its claims, including the user's DID, from the `privyClaim` struct above.

    If the JWT is invalid, an error will be thrown.
  </Tab>

  <Tab title="Python">
    For Python, use the `verify_access_token` method to verify the access token and get the user's claims.

    ```python
    from privy import PrivyAPI

    client = PrivyAPI(app_id="your-privy-app-id", app_secret="your-privy-api-key")
    try:
        user = client.users.verify_access_token(access_token)
        print(user)
    except Exception as e:
        print(e)
    ```

    If the token is valid, **`verify_access_token`** will return an **`AccessTokenClaims`** object with additional information about the request, with the fields below:

    | Parameter    | Type     | Description                                                                   |
    | ------------ | -------- | ----------------------------------------------------------------------------- |
    | `app_id`     | `string` | Your Privy app ID.                                                            |
    | `user_id`    | `string` | The authenticated user's Privy DID. Use this to identify the requesting user. |
    | `issuer`     | `string` | This will always be `'privy.io'`.                                             |
    | `issued_at`  | `string` | Timestamp for when the access token was signed by Privy.                      |
    | `expiration` | `string` | Timestamp for when the access token will expire.                              |
    | `session_id` | `string` | Unique identifier for the user's session.                                     |

    If the token is invalid, **`verify_access_token`** will throw an exception and you should **not** consider the requesting user authorized. This generally occurs if the token has expired or is invalid (e.g. corresponds to a different app ID).

    <Tip>
      The Privy Client's `verify_access_token` method will make a request to Privy's API to fetch the verification key for your app. You can avoid this API request by copying your verification key from the **Configuration > App settings** page of the [**Dashboard**](https://dashboard.privy.io) and passing it as a second parameter to `verify_access_token`:

      ```python
      user = client.users.verify_access_token(
        access_token,
        'paste-your-verification-key-from-the-dashboard'
      )
      ```
    </Tip>
  </Tab>
</Tabs>

## Managing expired access tokens

A user's access token might expire while they are actively using your app. For example, if a user does not take action on an application for an extended period of time, the access token can become expired.

* **Handle invalid token errors**: In these scenarios, if a method returns with an **`'invalid auth token'`** error, we recommend calling the **`getAccessToken`** method with a time-based backoff until the user's access token is refreshed with an updated expiration time.
* **Return errors from backend**: If you receive an expired access token in your backend, return an error to your client, and as above, trigger **`getAccessToken`** in your client.
* **Handle failed refreshes**: If the user's access token cannot be refreshed, the user will be logged out.
