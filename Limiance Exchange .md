---
title: Limiance Gateway
language_tabs:
  - shell: Shell
  - http: HTTP
  - javascript: JavaScript
  - ruby: Ruby
  - python: Python
  - php: PHP
  - java: Java
  - go: Go
toc_footers: []
includes: []
search: true
code_clipboard: true
highlight_theme: darkula
headingLevel: 2
generator: "@tarslib/widdershins v4.0.30"

---

# Limiance Gateway

All REST/HTTP endpoints for Limiance Backend Gateway.

Base URLs:

# Authentication

- HTTP Authentication, scheme: bearer

- HTTP Authentication, scheme: bearer

# KYC

## GET Get KYC status

GET /api/v1/users/kyc_status

Returns the current KYC verification status, tier, and a human-readable tier name/description for the authenticated user.

> Response Examples

> 200 Response

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string",
  "kycStatus": "APPROVED",
  "rejectionReason": "string",
  "submittedAt": "string",
  "tier": 0,
  "tierName": "Tier 1 — Basic",
  "tierDescription": "Identity verified (face match + government ID)."
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» error|string|false|none||none|
|» kycStatus|string|false|none||none|
|» rejectionReason|string|false|none||none|
|» submittedAt|string|false|none||none|
|» tier|integer|false|none||none|
|» tierName|string|false|none||none|
|» tierDescription|string|false|none||none|

#### Enum

|Name|Value|
|---|---|
|tier|0|
|tier|1|
|tier|2|

## POST Start KYC

POST /api/v1/users/kyc_start

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Auth

## POST Register

POST /api/v1/users/register

> Body Parameters

```json
{
    "email": "ayoseunsolomon@gmail.com",
    "phone": "09078097974",
    "password": "Lim!@nce2024xchnge",
    "confirmPassword": "Lim!@nce2024xchnge",
    "firstName": "Limnce",
    "lastName": "Limnce",
    "country": "Nigeria"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» firstName|body|string| yes |none|
|» lastName|body|string| yes |none|
|» email|body|string| yes |none|
|» password|body|string| yes |none|
|» referralCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Login

POST /api/v1/users/login

> Body Parameters

```json
{
    "emailOrPhone": "ayoseunsolomon@gmail.com",
    "password": "Lim!@nce2024xchnge",
    "rememberMe": false,
    "userAgent": "Mozilla/5.0 ...",
    "lotNumber": "b413bb1b85b646f9889b04a84ddbce68",
    "captchaOutput": "ymQJ7n7OdCWVEBuMCBZ7FqnQNMru6O1VCJ3pjw4Izl1n1ng2s1weAQ6kOjabH6nnrKPTsXKwruYUFMYnFrJ5z592-dCbqywTvhB42XRi2e8QlmCsiao_MijANQ2lotjKgUWVO3PPdNOGRw04ENEhIRbvirT8ydmwtvJhYUb9ap4OnZs3-SrQwTOWwkxplFnz_7EJP9uBW-lufwRo8hJLJchS8PSkVdebFtb0eY25zDp4xGpZDZ_RxkFhRjlzfea2t_MX4KR7Ad3zDIsUOZG6y2ONA7C0n4AE6Smf45_FOvIxK_Ycac34RKuQUwDGWjXLpttPLfqYdix_-ZmUOLGeWxe13g1CmtyaZkXZC6aUTKHB_Dw6YwVmjZjbpZ3sDwGGvm7GAqBk96DL9Q9mth4VbEbEGirwgis3sf9YdGjwfRYfAnGyO6xA6GAZN5H9XTtB",
    "passToken": "1d4e173686daa8271cb06d123852cea19e1a7b4f782b764e55cd2b27ad45525f",
    "genTime": "1790032855"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» emailOrPhone|body|string| yes |none|
|» password|body|string| yes |none|
|» rememberMe|body|boolean| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Social login

POST /users/login_socials

Authenticate user via social account (Google, Apple, etc.)

> Body Parameters

```json
{
  "id": "string",
  "rememberMe": true,
  "token": "string",
  "userAgent": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.SocialLoginRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.socialloginrequest)| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## POST Forgot password

POST /api/v1/users/forgot_password

> Body Parameters

```json
{
    "email": "ayoseunsolomon@gmail.com"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» email|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Refresh token

POST /api/v1/users/refresh_token

> Body Parameters

```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySUQiOiIzZGZjYWY0OSIsImVtYWlsIjoiYWRlZ29rZWFkZW5pcmFuOTY2QGdtYWlsLmNvbSIsImV4cCI6MTc3OTkyNzgzNywiaWF0IjoxNzc5ODg0NjM3fQ.W6QuVZqR69LhR6irM574FpMM-R8DZ8-DKSAlm3EZCcA"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» refreshToken|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Verify email

POST /api/v1/users/verify_email

> Body Parameters

```json
{
    "email": "ayoseunsolomon@gmail.com",
    "otp": "876380"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» otp|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Reset password

POST /api/v1/users/reset_password

> Body Parameters

```json
{
    "code": "343967",
    "email": "ayoseunsolomon@gmail.com",
    "confirmPassword": "new_Password1234!",
    "newPassword": "new_Password1234!"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» otp|body|string| yes |none|
|» newPassword|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Update user profile

POST /api/v1/users/update_user

> Body Parameters

```json
{
    "firstName": "Jane",
    "lastName": "Doe",
    "phone": "+2348000000000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» firstName|body|string| yes |none|
|» lastName|body|string| yes |none|
|» phone|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Change password

POST /api/v1/users/change_password

> Body Parameters

```json
{
    "oldPassword": "SecurePass123!",
    "newPassword": "NewSecurePass456!"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» oldPassword|body|string| yes |none|
|» newPassword|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Complete second-factor login

POST /api/v1/users/login/verify-second-factor

Completes a login that was parked pending a second factor. When BOTH email OTP and TOTP are enabled for the account, they must be cleared sequentially in two separate calls, not one combined request: (1) call this endpoint with `loginChallengeToken` + `emailOtpCode` only — the response comes back with `requiresSecondFactor: true` and `totpRequired: true` (same `loginChallengeToken`), meaning the OTP step is done and only TOTP remains; (2) call this endpoint again with the same `loginChallengeToken` + `totpCode` to complete the login and receive tokens. If only one factor is enabled for the account, a single call with that factor's code completes the login directly. All failure responses return a generic "Invalid or expired login session" error so a caller cannot distinguish which factor was wrong.

> Body Parameters

```json
{
    "loginChallengeToken": "9a1f9557-cc0a-464b-b229-e5bdd636887d",
    "emailOtpCode": "434959",
    "totpCode": "516913",
    "rememberMe": true
}
```

```json
{
    "loginChallengeToken": "b3f1...-uuid",
    "totpCode": "123456",
    "rememberMe": false
}
```

```json
{
    "loginChallengeToken": "b3f1...-uuid",
    "totpCode": "123456",
    "rememberMe": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» loginChallengeToken|body|string| yes |Token returned by POST /users/login when a second factor is required|
|» totpCode|body|string| no |6-digit authenticator app code. Only accepted once the email OTP step (if required) has already been cleared.|
|» emailOtpCode|body|string| no |6-digit code emailed to the user. Required first if the account has email OTP enabled.|
|» rememberMe|body|boolean| no |none|

> Response Examples

> Login complete, or intermediate step\-up response if another factor is still pending

```json
{
    "statusCode": 200,
    "success": false,
    "message": "second factor required",
    "requiresSecondFactor": true,
    "totpRequired": true,
    "emailOtpRequired": false,
    "loginChallengeToken": "b3f1...-uuid"
}
```

```json
{
    "statusCode": 200,
    "success": true,
    "message": "Login successful",
    "accessToken": "...",
    "refreshToken": "..."
}
```

> 400 Response

```json
{
  "statusCode": 0,
  "success": true,
  "error": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Login complete, or intermediate step-up response if another factor is still pending|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Invalid/expired challenge token, or wrong code|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|none|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» error|string|false|none||none|
|» accessToken|string|false|none||none|
|» refreshToken|string|false|none||none|
|» data|object|false|none||none|
|» requiresSecondFactor|boolean|false|none||true when another factor is still needed (see totpRequired/emailOtpRequired)|
|» totpRequired|boolean|false|none||none|
|» emailOtpRequired|boolean|false|none||none|
|» loginChallengeToken|string|false|none||Reuse this same token for the next step|

HTTP Status Code **400**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» error|string|false|none||none|

HTTP Status Code **500**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|string|false|none||none|
|» error|string|false|none||none|

## GET Logout

GET /api/v1/auth/logout

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Logout (POST)

POST /api/v1/users/logout

Revokes the caller's access/refresh tokens and clears HttpOnly session cookies.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST Verify second factor (2FA / email OTP) for login

POST /api/v1/users/login/verify_second_factor

Completes a 2FA or email-OTP gated login using the challenge token returned by `/api/v1/users/login`.

> Body Parameters

```json
{
    "challenge_token": "eyJhbGciOi...",
    "code": "123456"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» challenge_token|body|string| yes |none|
|» code|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Auth/2FA

## POST Enable 2FA

POST /api/v1/users/enable_2fa

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Disable two-factor authentication

POST /users/disable_2fa

Disables 2FA after verifying the current TOTP code

> Body Parameters

```json
{
  "code": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[Body](#schemabody)| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## POST Verify 2FA

POST /api/v1/users/verify_2fa

> Body Parameters

```json
{
    "code": "222405"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» code|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet

## GET Get wallet by ID

GET /api/v1/wallet/76d56437-d346-4609-99a5-67db1924ea73

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all wallets

GET /api/v1/wallet/all_wallets

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Suspend wallet

POST /wallet/wallets/<wallet-id>/suspend

> Body Parameters

```json
{
    "reason": "Suspicious activity"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» reason|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete a wallet

DELETE /api/v1/wallet/wallets/{walletId}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|walletId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's fiat transaction history

GET /api/v1/trading/fiat/history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Wallet/Withdrawal

## POST Initiate withdrawal

POST /api/v1/wallet/initiate_withdrawal

> Body Parameters

```json
{
  "walletId": "6b67827e-554c-460a-854a-fec6d85d9be1", //wallet address of that chain
  "asset": "SOL", //coin or token
  "chain": "SOLANA", //chain or network name
  "amount": "0.01", //amount
  "destinationAddress": "7DbPvPYKaRAx5daqYsUVGPusTnYeojr9xNw7iQQ4rB6r", //receipent
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» walletId|body|string| yes |none|
|» asset|body|string| yes |none|
|» network|body|string| yes |none|
|» amount|body|string| yes |none|
|» destinationAddress|body|string| yes |none|
|» idempotencyKey|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Withdrawal

POST /api/v1/wallet/confirm_withdrawal

> Body Parameters

```json
{
    "otpCode": "466006"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|X-2FA-Code|header|string| no |none|
|body|body|object| no |none|
|» walletId|body|string| yes |none|
|» asset|body|string| yes |none|
|» network|body|string| yes |none|
|» amount|body|string| yes |none|
|» destinationAddress|body|string| yes |none|
|» idempotencyKey|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get network withdrawal/transfer fees

GET /api/v1/wallet/fees

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the minimum withdrawal amount per asset

GET /api/v1/wallet/minimum_withdrawal

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|query|query|string| no |none|
|is_tradable|query|boolean| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Wallet/Transactions

## GET Get User Transaction History

GET /api/v1/wallet/user/transactions_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|transaction_type|query|string| no |none|
|status|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Wallet Transaction History

GET /api/v1/wallet/6b67827e-554c-460a-854a-fec6d85d9be1/transaction_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|transaction_type|query|string| no |none|
|status|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get single wallet transaction history

GET /api/v1/wallet/{wallet_id}/transactions_history

Retrieves paginated transaction history for a specific wallet ID.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|wallet_id|path|string| yes |Wallet ID|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|
|start_date|query|string| no |Start date|
|end_date|query|string| no |End date|
|type|query|string| no |Transaction type filter|
|status|query|string| no |Status filter|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Wallet/Balance

## GET Get Balance

GET /api/v1/wallet/balance

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|account|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get balance allocations

GET /api/v1/wallet/balance_allocations

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get user portfolio

GET /api/v1/wallet/portfolio

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|query|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get spot wallet balance

GET /api/v1/wallet/balance/spot

Returns total Spot account valuation in USD, NGN, and BTC.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get margin wallet balance

GET /api/v1/wallet/balance/margin

Returns total Margin account valuation in USD, NGN, and BTC.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get futures wallet balance

GET /api/v1/wallet/balance/futures

Returns total Futures account valuation in USD, NGN, and BTC.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get total portfolio balance

GET /api/v1/wallet/balance/total

Returns combined portfolio valuation across Spot, Margin, Futures, and Funding accounts in USD, NGN, and BTC.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Wallet/Transfer

## POST Internal transfer (intra-wallet)

POST /api/v1/wallet/internal_transfer

> Body Parameters

```json
{
    "symbol": "USDT",
    "fromBalance": "funding_balance",
    "toBalance": "margin_balance",
    "amount": 2000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» fromBalance|body|string| yes |none|
|» toBalance|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get external transfer code

GET /api/v1/wallet/get_external_transfer_code/ETH

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST External transfer (inter-wallet)

POST /api/v1/wallet/external_transfer

> Body Parameters

```json
{
    "symbol": "btc",
    "amount": "0.05",
    "sourceWallet": "funding_balance",
    "destinationWallet": "funding_balance",
    "recipientAccount": "083d5a2b",
    "releaseCode": "473496"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» toUserId|body|string| yes |none|
|» symbol|body|string| yes |none|
|» fromBalance|body|string| yes |none|
|» toBalance|body|string| yes |none|
|» amount|body|string| yes |none|
|» releaseCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Wallet/Whitelist

## POST Add Whitelisted Wallet

POST /api/v1/wallet/whitelist

> Body Parameters

```json
{
    "chain": "solana",
    "address": "",
    "alias": "niyi-sol"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete Whitelisted Wallet

DELETE /api/v1/wallet/whitelist

> Body Parameters

```json
{
    "chain": "",
    "address": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Whitelisted Wallets

GET /api/v1/wallet/whitelist

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|chain|query|string| no |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Suspend one of the authenticated user's own wallets

POST /api/v1/wallet/wallets/{walletId}/suspend

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|walletId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## PUT Update whitelisted address alias (PUT)

PUT /api/v1/wallet/whitelist/alias

Updates the human-readable label/alias for a whitelisted withdrawal address.

> Body Parameters

```json
{
    "id": "wl-12345",
    "alias": "My Ledger Cold Wallet"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» id|body|string| yes |Whitelist entry ID|
|» alias|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## PATCH Update whitelisted address alias (PATCH)

PATCH /api/v1/wallet/whitelist/alias

Updates the human-readable label/alias for a whitelisted withdrawal address.

> Body Parameters

```json
{
    "id": "wl-12345",
    "alias": "My Ledger Cold Wallet"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» id|body|string| yes |Whitelist entry ID|
|» alias|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Wallet/Deposit

## GET Get the minimum deposit amount per asset

GET /api/v1/wallet/minimum_deposit

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|asset|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Generate Wallet

POST /api/v1/wallet/generate

> Body Parameters

```json
{
    "chain": "base"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{
    "error": "Authorization token not provided",
    "message": "",
    "statusCode": 400
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get deposit vault address

GET /api/v1/wallet/deposit/address

Returns the user's on-chain deposit address for the specified chain/network (deploys vault on first request if needed).

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|chain|query|string| no |Blockchain network (e.g. ETH, BSC, TRON, SOL)|
|symbol|query|string| no |Token symbol (e.g. USDT, ETH, SOL)|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Wallet/Fiat

## POST Get a fiat conversion quote

POST /api/v1/wallet/fiat/quote

> Body Parameters

```json
{
    "depositAmount": "500",
    "symbol": "btc",
    "currency": "ngn"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Create a one-time NGN deposit account

POST /api/v1/wallet/fiat/deposit/account

Provisions a Monnify virtual account for a bank-transfer deposit, to be credited as symbol once settled. Requires deposits enabled on the account.

> Body Parameters

```json
{
    "symbol": "SOL",
    "bankCode": "required",
    "amount": "5000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[TemporaryDepositAccountRequest](#schematemporarydepositaccountrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "success": true,
  "error": "string",
  "accountNumber": "string",
  "accountName": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountDurationSeconds": 0,
  "ussdPayment": "string",
  "requestTime": "string",
  "expiresOn": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amount": "string",
  "fee": "string",
  "totalPayable": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[TemporaryDepositAccountResponse](#schematemporarydepositaccountresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[TemporaryDepositAccountResponse](#schematemporarydepositaccountresponse)|

## POST Confirm a fiat deposit settled

POST /api/v1/wallet/fiat/deposit/{transaction_reference}/confirm

Verifies the bank transfer for transaction_reference actually settled with Monnify and credits the user. Requires deposits enabled on the account.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|transaction_reference|path|string| yes |Transaction reference from POST /wallet/fiat/deposit/account|

> Response Examples

> 200 Response

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[DefaultResponse](#schemadefaultresponse)|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|[DefaultResponse](#schemadefaultresponse)|

## GET List supported banks

GET /api/v1/wallet/fiat/banks

Banks Monnify supports as virtual-account/withdrawal destinations

> Response Examples

> 200 Response

```json
{
  "banks": [
    {
      "baseUssdCode": "string",
      "code": "string",
      "name": "string",
      "ussdTemplate": "string"
    }
  ],
  "error": "string",
  "success": true
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.BanksListResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bankslistresponse)|

## POST Pay by card

POST /api/v1/wallet/fiat/card/pay

Charges a card directly, to be credited as symbol once settled. May require a CompleteCardOTP/CompleteCard3DS follow-up — see response.

> Body Parameters

```json
{
  "amount": "string",
  "cardCvv": "string",
  "cardExpiryMonth": "string",
  "cardExpiryYear": "string",
  "cardNumber": "string",
  "cardPin": "string",
  "symbol": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "amountPaid": "string",
  "currencyPaid": "string",
  "error": "string",
  "paymentReference": "string",
  "paymentStatus": "string",
  "responseMessage": "string",
  "success": true,
  "transactionReference": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardresponse)|

## POST Complete a card payment with OTP

POST /api/v1/wallet/fiat/card/otp

> Body Parameters

```json
{
  "otp": "string",
  "tokenId": "string",
  "transactionReference": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCardOTPRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecardotprequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "authorizedAmount": "string",
  "error": "string",
  "message": "string",
  "paymentReference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CardAuthResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.cardauthresponse)|

## POST Complete a card payment with 3-D Secure

POST /api/v1/wallet/fiat/card/3ds

> Body Parameters

```json
{
  "apiKey": "string",
  "cardCvv": 0,
  "cardExpiryMonth": 0,
  "cardExpiryYear": 0,
  "cardNumber": "string",
  "cardPin": 0,
  "transactionReference": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCard3DSRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecard3dsrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "authorizedAmount": "string",
  "error": "string",
  "message": "string",
  "paymentReference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CardAuthResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.cardauthresponse)|

## POST Withdraw to a bank account

POST /api/v1/wallet/fiat/withdraw

Deducts amount of symbol from the caller's balance and starts a bank payout. May require CompleteFiatWithdrawal if 2FA disbursement is enabled — see response Status.

> Body Parameters

```json
{
  "accountName": "string",
  "accountNumber": "string",
  "amount": "string",
  "bankCode": "string",
  "symbol": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.InitiateFiatWithdrawalRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.initiatefiatwithdrawalrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "amount": "string",
  "currency": "string",
  "dateCreated": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "error": "string",
  "narration": "string",
  "reference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.FiatWithdrawalResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.fiatwithdrawalresponse)|

## POST Authorize a pending bank withdrawal

POST /api/v1/wallet/fiat/withdraw/authorize

Submits the authorization code Monnify sent to complete a withdrawal left in PENDING_AUTHORIZATION

> Body Parameters

```json
{
  "authorizationCode": "string",
  "reference": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteFiatWithdrawalRequest](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completefiatwithdrawalrequest)| yes |none|

> Response Examples

> 200 Response

```json
{
  "amount": "string",
  "currency": "string",
  "dateCreated": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "error": "string",
  "narration": "string",
  "reference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.FiatWithdrawalResponse](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.fiatwithdrawalresponse)|

## GET Get fiat transaction history

GET /api/v1/wallet/fiat/history

Retrieves paginated fiat deposits, card payments, and bank withdrawals

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Get fiat transaction history|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

# Wallet/Fiat/cNGN

## GET List supported cNGN banks

GET /api/v1/wallet/fiat/cngn/banks

Returns Nigerian commercial banks supported by cNGN rails for redemptions/withdrawals.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET List supported cNGN blockchain networks

GET /api/v1/wallet/fiat/cngn/networks

Returns blockchain networks supported for cNGN on-chain mint/redemption.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get cNGN float balance

GET /api/v1/wallet/fiat/cngn/balance

Returns current cNGN balance across supported chains.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST Verify recipient bank account (cNGN)

POST /api/v1/wallet/fiat/cngn/account/verify

Resolves and verifies a Nigerian bank account number and bank code prior to cNGN withdrawal.

> Body Parameters

```json
{
    "bank_code": "058",
    "account_number": "0123456789"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» bank_code|body|string| yes |none|
|» account_number|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST Create temporary cNGN deposit virtual account

POST /api/v1/wallet/fiat/cngn/deposit/account

Generates a virtual bank account for NGN deposit via cNGN liquidity rails.

> Body Parameters

```json
{
    "amount": 50000,
    "symbol": "CNGN"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» amount|body|number| yes |none|
|» symbol|body|string| no |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST Initiate cNGN fiat bank withdrawal

POST /api/v1/wallet/fiat/cngn/withdraw

Redeems user balance and initiates a bank payout via cNGN rails (requires KYC Tier 1+ and 2FA if enabled).

> Body Parameters

```json
{
    "amount": 25000,
    "symbol": "CNGN",
    "bank_code": "058",
    "account_number": "0123456789",
    "account_name": "JOHN DOE"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» amount|body|number| yes |none|
|» symbol|body|string| no |none|
|» bank_code|body|string| yes |none|
|» account_number|body|string| yes |none|
|» account_name|body|string| yes |none|
|» narration|body|string| no |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Wallet/Conversion

## POST Convert asset

POST /api/v1/wallet/convert_asset

> Body Parameters

```json
{
    "fromSymbol": "BTC",
    "toSymbol": "USDT",
    "amount": "0.05"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» fromAsset|body|string| yes |none|
|» toAsset|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Get Token Conversion Rate

POST /api/v1/trading/conversion_rate

> Body Parameters

```json
{
    "fromAsset": "BTC",
    "toAsset": "USDT",
    "quantity": "1"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» fromAsset|body|string| yes |none|
|» toAsset|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Get token conversion rate (Wallet Service)

POST /api/v1/wallet/conversion_rate

Quotes real-time conversion rate between two assets via Wallet Service using unified freshness invariants.

> Body Parameters

```json
{
    "fromAsset": "BTC",
    "toAsset": "USDT",
    "quantity": "1"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» fromAsset|body|string| yes |none|
|» toAsset|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get token conversion history

GET /api/v1/trading/convert/history

Retrieves paginated history of instant asset conversions for the authenticated user.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|
|start_date|query|string| no |Start date filter (YYYY-MM-DD)|
|end_date|query|string| no |End date filter (YYYY-MM-DD)|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# P2P/Payment Methods

## GET Get payment methods

GET /api/v1/trading/p2p/payment_methods

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get specific payment method

GET /trading/p2p/get_payment_by_method_by_id/<payment-method-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Save bank payment method

POST /api/v1/trading/p2p/payment_methods/bank

> Body Parameters

```json
{
    "bankName": "First Bank",
    "accountNumber": "0123456789",
    "accountName": "John Doe"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» bankName|body|string| yes |none|
|» accountNumber|body|string| yes |none|
|» accountName|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete payment method

DELETE /trading/p2p/payment_methods/<payment-method-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Advertiser

## GET Become advertiser

GET /api/v1/trading/p2p/become_an_advertiser

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get advertiser info

GET /api/v1/trading/p2p/advertiser_info

Get a P2P advertiser's public profile (name, rating, completed orders, verified/active status). Pass advertiser_id to view another user's profile — e.g. before trading with them; omit it to view your own.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|advertiser_id|query|string| no |Advertiser's user ID — defaults to the authenticated user if omitted|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get Advertiser Reviews

GET /api/v1/trading/p2p/advertiser/0e7bc6a8/reviews

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Orders

## GET Get all P2P orders

GET /api/v1/trading/p2p/all_orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|type|query|string| yes |BUY | SELL|
|asset|query|string| yes |none|
|currency|query|string| no |none|
|payment_method|query|string| no |none|
|status|query|string| no |none|
|country|query|string| no |none|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Sell- Create P2P order

POST /api/v1/trading/p2p/create_order

> Body Parameters

```json
{
    "type": "SELL",
    "asset": "BTC",
    "fiat": "NGN",
    "fixedPrice": 95000000,
    "floatingPrice": false,
    "assetLogo": "https://coin-images.coingecko.com/coins/images/1/large/bitcoin.png?1704266489",
    "quantity": 0.01,
    "minQuantity": 0.001,
    "maxQuantity": 0.01,
    "paymentDuration": "15",
    "paymentMethod": [
        "00c491a-8938-48e3-9690-827deb688a38"
    ],
    "remark": "Fast trade, verified only",
    "selectedCountry": "NG"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» type|body|string| yes |none|
|» asset|body|string| yes |none|
|» fiat|body|string| yes |none|
|» fixedPrice|body|integer| yes |none|
|» floatingPrice|body|boolean| yes |none|
|» assetLogo|body|string| yes |none|
|» quantity|body|number| yes |none|
|» minQuantity|body|number| yes |none|
|» maxQuantity|body|number| yes |none|
|» paymentDuration|body|string| yes |none|
|» paymentMethod|body|[string]| yes |none|
|» remark|body|string| yes |none|
|» selectedCountry|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get P2P order by ID

GET /trading/p2p/get_order_by_id/<order-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Deactivate all P2P advertisements

GET /trading/p2p/deactivate_orders

Pauses all active advertisement orders for the authenticated merchant

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Deactivate all P2P advertisements|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## GET Reactivate all P2P advertisements

GET /trading/p2p/reactivate_orders

Restores all paused advertisement orders for the authenticated merchant

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|Reactivate all P2P advertisements|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## GET Deactivate single order

GET /api/v1/trading/p2p/deactivate_single_order/d7d8b5ff-f4f3-4728-b383-8b6ff417876f

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Reactivate single order

GET /api/v1/trading/p2p/reactivate_single_order/ed124046-1f22-4454-9a71-ca4d2ac760ea

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching

## GET View all advertiser reviews 

GET /api/v1/trading/p2p/advertiser_reviews

> Response Examples

> 200 Response

```json
{"statusCode":500,"success":false,"message":"Failed to fetch advertiser reviews","reviews":[],"totalPages":0,"currentPage":0,"totalRecords":0,"positiveCount":0,"negativeCount":0,"averageRating":0,"error":"internal error"}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Release order match

POST /api/v1/trading/p2p/release_order/5954e73c-756e-48fb-b37d-396274e56b99

> Body Parameters

```json
{
    "releaseCode": "123456"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|X-2FA-Code|header|string| no |none|
|body|body|object| no |none|
|» releaseCode|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all matched orders

GET /api/v1/trading/p2p/all_matched_orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get matched order by ID

GET /trading/p2p/matched_order/<order-match-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Add review

POST /api/v1/trading/p2p/add_review

> Body Parameters

```json
{
    "orderMatchId": "ff0bce52-de58-4b4f-8fc1-ce58357ad2f2",
    "rating": 5,
    "review": "Fast and trustworthy trader!"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» orderMatchId|body|string| yes |none|
|» rating|body|integer| yes |none|
|» review|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching/Buy Order

## GET Get matcher release code (OTP)

GET /api/v1/trading/p2p/get_release_order_code/b4a2991e-ad7a-45ce-b861-c909acadc272

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Order Matching/Sell Order

## POST Match order

POST /api/v1/trading/p2p/match_order

> Body Parameters

```json
{
    "orderId": "312d8ef1-c76c-4ada-a5ad-0a8d91f64472",
    "quantity": 0.005
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» orderId|body|string| yes |none|
|» quantity|body|string| yes |none|
|» paymentMethodId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get advertiser release code (OTP)

GET /api/v1/trading/p2p/get_release_order_code/5954e73c-756e-48fb-b37d-396274e56b99

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Chat

## GET List user chats

GET /api/v1/trading/p2p/chats

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get chats by order ID

GET /api/v1/trading/p2p/chats/a38dcc80-0847-4aff-83e0-8335dd5d3185

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get chat messages

GET /api/v1/trading/p2p/chats/messages/ffdf7d41-9f1e-415a-baff-bade38d2bf6a

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Send chat message

POST /api/v1/trading/p2p/chats/send/ffdf7d41-9f1e-415a-baff-bade38d2bf6a

> Body Parameters

```json
{
    "message": "I have made the payment, please check.",
    "attachmentUrl": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» message|body|string| yes |none|
|» attachmentUrl|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# P2P/Dispute

## PATCH Dispute Matched Order

PATCH /api/v1/trading/p2p/update_matched_order

> Body Parameters

```json
{
    "orderMatchId": "1ec7c0ab-f666-493b-86b7-7c1b44aa5f05",
    "status": "DISPUTED"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Disputed Orders

GET /api/v1/trading/p2p/advertiser_disputed_orders

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading

## GET Get user VIP fee tier & LIM discount

GET /api/v1/trading/user_fee_tier

Returns the user's 30-day trading volume, VIP fee tier, maker/taker bps, and LIM token discount status.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get unified trade history

GET /api/v1/trading/history

Returns trade execution history across Spot, Margin, and Futures markets.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|market_type|query|string| no |spot | margin | futures | all|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|
|start_date|query|string| no |Start date|
|end_date|query|string| no |End date|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get unified trade execution history (alias)

GET /api/v1/trading/trades/history

Returns trade execution history across Spot, Margin, and Futures markets.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|market_type|query|string| no |spot | margin | futures | all|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get unified order history

GET /api/v1/trading/order_history

Returns order history across Spot, Margin, and Futures markets.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|market_type|query|string| no |spot | margin | futures | all|
|status|query|string| no |open | closed | cancelled | all|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Market Data

## GET Listed trading pairs

GET /api/v1/trading/listed_pairs

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|query|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed networks

GET /api/v1/trading/listed_networks

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed currencies

GET /api/v1/trading/listed_currencies

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Listed tokens

GET /api/v1/trading/listed_tokens

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|
|isTradable|query|string| yes |none|
|blockchain|query|string| yes |none|
|Accept|header|string| no |none|
|Authorization|header|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Platform fees

GET /api/v1/trading/platform_fees

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Historical OHLC candles

GET /api/v1/trading/kline/historical

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| yes |none|
|interval|query|string| yes |none|
|limit|query|string| yes |none|
|startTime|query|string| no |none|
|endTime|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET 24hrsMovers

GET /api/v1/trading/24_hours_movers

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get newly listed pairs (alias)

GET /api/v1/trading/new_listings

Returns recently listed trading pairs with 24h metrics.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get latest spot price

GET /api/v1/trading/spot/price

Returns the latest spot price for a trading pair.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| yes |Trading pair symbol (e.g. BTCUSDT)|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Spot

## GET order history

GET /api/v1/trading/spot/order_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET order Margin history

GET /api/v1/trading/margin/order_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Spot cancel all

POST /api/v1/trading/spot/cancel_all

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Spot/Execution

## POST Place market buy

POST /api/v1/trading/spot/buy

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 0.001,
    "price": 63622.9307
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place market sell

POST /api/v1/trading/spot/sell

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "type": "MARKET",
    "quantity": 0.001,
    "price": 63622.9307
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place limit buy

POST /api/v1/trading/spot/buy_limit

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "type": "LIMIT",
    "price": 63169.986,
    "quantity": 0.0001
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place limit sell

POST /api/v1/trading/spot/sell_limit

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "type": "LIMIT",
    "price": 62815.2947,
    "quantity": 0.0022
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place stop buy

POST /api/v1/trading/spot/buy_stop

> Body Parameters

```json
{
    "symbol": "BTCUSDT",
    "side": "BUY",
    "type": "STOP",
    "quantity": 0.001,
    "stopPrice": 65000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place stop sell

POST /api/v1/trading/spot/sell_stop

> Body Parameters

```json
{
    "symbol": "BTCUSDT",
    "side": "SELL",
    "type": "STOP",
    "quantity": 0.001,
    "stopPrice": 58000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET OrderBook

GET /api/v1/trading/spot/orderbook

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get My Orders

GET /api/v1/trading/spot/orders

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|limit|query|string| no |none|
|page|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Close Order

POST /api/v1/trading/spot/close_order

> Body Parameters

```json
{
    "orderId": "e2a6e75c-3289-4266-8962-ce32f5a09a1a",
    "symbol": "BTC/USDT"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Spot/Orders

## GET Get Orders By ID

GET /api/v1/trading/transactions/spot/17861ed4-7d90-4f12-ba19-688be90224e8

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Spot/Trades

## GET Recent Trades

GET /api/v1/trading/spot/recent_trades

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get recent spot trades by pair

GET /api/v1/trading/spot/trades/{pair}

Returns recent public trades for the specified spot pair.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|pair|path|string| yes |Trading pair (e.g. BTCUSDT)|
|limit|query|string| no |Max trades to return|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Futures

## GET Get User Futures Order History

GET /api/v1/trading/futures/order_history

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|
|start_date|query|string| no |none|
|end_date|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Futures Funding Rate

GET /api/v1/trading/futures/funding_rate

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|pair|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Set Futures Leverage

POST /api/v1/trading/futures/set_leverage

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "leverage": 10
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get User Futures Mode

GET /api/v1/trading/futures/get_margin_mode

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Set Futures Mode

POST /api/v1/trading/futures/set_margin_mode

> Body Parameters

```json
{
    "mode": "cross"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get User Futures PNL History

GET /api/v1/trading/futures/pnl_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get all futures perpetual markets

GET /api/v1/trading/futures/markets

Retrieves all active futures perpetual contracts with mark price, index price, 24h change, open interest, and max leverage.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get recent futures trades

GET /api/v1/trading/futures/recent_trades

Returns recent public trades for a futures perpetual contract.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| yes |Contract symbol (e.g. BTCUSDT)|
|limit|query|string| no |Max trades|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get recent futures trades by pair

GET /api/v1/trading/futures/trades/{pair}

Returns recent public trades for a futures perpetual contract.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|pair|path|string| yes |Contract symbol (e.g. BTCUSDT)|
|limit|query|string| no |Max trades|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Futures/Position

## GET Get User Positions

GET /api/v1/trading/futures/positions

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Close futures Position

POST /api/v1/trading/futures/close_position/yuwdywdiywg

> Body Parameters

```json
{
  "symbol": "string",
  "side": "string",
  "type": "string",
  "quantity": "string",
  "leverage": 0
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Partial. Close Position

POST /api/v1/trading/futures/partial_close/{position_id}

> Body Parameters

```json
{
    "close_quantity": "0.05"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|position_id|path|string| yes |none|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH Update TP/SL on open position

PATCH /api/v1/trading/futures/position/{position_id}/tpsl

> Body Parameters

```json
{
    "take_profit_price": "70000",
    "stop_loss_price": "62000"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|position_id|path|string| yes |none|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Close futures position (by body)

POST /api/v1/trading/futures/close_position

Closes an open futures position at market price.

> Body Parameters

```json
{
    "position_id": "pos-12345"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» position_id|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Futures/Place Orders

## POST Limit Long

POST /api/v1/trading/futures/place_order

> Body Parameters

```json
{
    "pair": "BTC/USDT",
    "side": "long",
    "type": "limit",
    "price": 65000,
    "quantity": 0.1,
    "leverage": 10,
    "takeProfit": 70000,
    "stopLoss": 62000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin

## GET Get All Conditional Orders

GET /api/v1/trading/margin/conditional

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Borrow History

GET /api/v1/trading/margin/borrow_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Liquidation History

GET /api/v1/trading/margin/liquidation_history

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Conditional Order By ID

GET /api/v1/trading/margin/conditional/qwdefefefefe

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get a margin order's transaction record

GET /api/v1/trading/transactions/margin/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get user margin orders

GET /api/v1/trading/margin/orders

Returns the authenticated user's margin orders filtered by status (`open`, `closed`, `all`).

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| no |Trading pair filter|
|status|query|string| no |open | closed | all|
|page|query|string| no |Page number|
|limit|query|string| no |Items per page|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get recent margin trades

GET /api/v1/trading/margin/recent_trades

Returns recent public trades on margin pairs.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|query|string| yes |Trading pair (e.g. BTCUSDT)|
|limit|query|string| no |Max trades|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get recent margin trades by pair

GET /api/v1/trading/margin/trades/{pair}

Returns recent public trades for the specified margin pair.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|pair|path|string| yes |Trading pair (e.g. BTCUSDT)|
|limit|query|string| no |Max trades|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Margin/Account

## GET Get Margin Account

GET /api/v1/trading/margin/account

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Create Account

POST /api/v1/trading/margin/account

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Margin Borrow And Repay Config

PUT /api/v1/trading/margin/settings

> Body Parameters

```json
{
    "auto_borrow_enabled": true,
    "auto_repay_enabled": false
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get Margin Leverages

GET /api/v1/trading/margin/leverage

> Body Parameters

```json

```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Set Margin Leverage

PUT /api/v1/trading/margin/leverage

> Body Parameters

```json
{
    "max_leverage": 1
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Repay Margin

POST /api/v1/trading/margin/repay

> Body Parameters

```json
{
    "asset": "USDT",
    "amount": 500
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Borrow Margin

POST /api/v1/trading/margin/borrow

> Body Parameters

```json
{
    "asset": "USDT",
    "amount": 500
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PUT Set Margin Mode

PUT /api/v1/trading/margin/mode

> Body Parameters

```json
{
    "mode": "cross"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
404 page not found
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin/Execution

## POST Place margin market buy

POST /api/v1/trading/margin/buy

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "type": "MARKET",
    "quantity": 0.01
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin market sell

POST /api/v1/trading/margin/sell

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "type": "MARKET",
    "quantity": 0.01
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Cancel a margin conditional order (TP/SL/OCO)

DELETE /api/v1/trading/margin/conditional/{order_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|order_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST One-Cancels-Other Order

POST /api/v1/trading/margin/oco

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "order_side": "SELL",
    "tp_trigger_price": "70000",
    "sl_trigger_price": "58000",
    "quantity": "0.1",
    "tp_limit_price": "69900",
    "sl_limit_price": "57900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin limit buy

POST /api/v1/trading/margin/buy_limit

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "type": "LIMIT",
    "quantity": 0.01,
    "price": 60000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin limit sell

POST /api/v1/trading/margin/sell_limit

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "type": "LIMIT",
    "quantity": 0.01,
    "price": 70000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» price|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin stop sell

POST /api/v1/trading/margin/sell_stop

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "SELL",
    "type": "STOP",
    "quantity": 0.01,
    "stopPrice": 58000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Place margin stop buy

POST /api/v1/trading/margin/buy_stop

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "side": "BUY",
    "type": "STOP",
    "quantity": 0.01,
    "stopPrice": 65000
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|Content-Type|header|string| yes |none|
|body|body|object| no |none|
|» symbol|body|string| yes |none|
|» side|body|string| yes |none|
|» type|body|string| yes |none|
|» quantity|body|string| yes |none|
|» stopPrice|body|string| yes |none|
|» leverage|body|integer| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin/Execution/TP

## POST Take Profit

POST /api/v1/trading/margin/tp

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "order_side": "SELL",
    "order_type": "MARKET",
    "trigger_price": "65000",
    "quantity": "0.1",
    "limit_price": "64900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Margin/Execution/SL

## POST Stop Loss

POST /api/v1/trading/margin/sl

> Body Parameters

```json
{
    "symbol": "BTC/USDT",
    "order_side": "SELL",
    "order_type": "MARKET",
    "trigger_price": "65000",
    "quantity": "0.1",
    "limit_price": "64900"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Trading/Bot

## POST Create a trading bot

POST /api/v1/trading/bot/create

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Stop a trading bot

POST /api/v1/trading/bot/stop

> Body Parameters

```json
{
  "botId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» botId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Get a trading bot's trade history

POST /api/v1/trading/bot/trading_history

> Body Parameters

```json
{
  "botId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» botId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List trading bots

GET /api/v1/trading/bot/list

Returns all grid/automated trading bots created by the authenticated user.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Trading/Favourites

## GET List the authenticated user's favorite trading pairs

GET /api/v1/trading/favorites

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Add a trading pair to favorites

POST /api/v1/trading/favorites/{symbol}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Remove a trading pair from favorites

DELETE /api/v1/trading/favorites/{symbol}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|symbol|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# User

## POST Enable Futures

POST /api/v1/users/accept_futures

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get user settings

GET /api/v1/users/settings

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Get login logs

GET /

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| yes |none|
|limit|query|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## PATCH Update app settings

PATCH /users/app_settings

Update app-level settings for the authenticated user

> Body Parameters

```json
{
  "antiPhishingCode": "string",
  "chartColor": true,
  "language": "string",
  "notificationPreference": {
    "activities": true,
    "news": true,
    "systemMessages": true,
    "tradeNotification": true
  },
  "priceAlerts": {
    "notificationOn": true,
    "priceOn": true
  },
  "timezone": "string",
  "tradeFeeDeductions": {
    "useBNBToPayFees": true,
    "useBNBToPayFuturesFees": true,
    "useBNBToPayMarginFees": true
  },
  "tradeOrdersNotificationReminder": {
    "autoBorrowRepayMargin": true,
    "limitOrder": true,
    "marketOrder": true,
    "stopOrder": true
  },
  "transactionNotifications": {
    "futuresNotificationSound": true,
    "futuresTradingNotification": true,
    "spotNotificationSound": true,
    "spotTradingNotification": true
  },
  "withdrawalWhitelist": true
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.UserSettings](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.usersettings)| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## GET Get user deails

GET /api/v1/user_details

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|id|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Add Notification token

POST /api/v1/notifications/device-token

> Body Parameters

```json
{
    "deviceToken": "3333-333-333-33",
    "platform": "ios"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## DELETE Delete Notification Token

DELETE /api/v1/notifications/device-token

> Body Parameters

```json
{
    "deviceToken": ""
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## GET Enable Email Login

GET /api/v1/users/enable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Disable Email Login

POST /users/disenable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# User/Sessions

## GET Get active sessions

GET /api/v1/users/active_sessions

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

## POST Revoke session

POST /users/revoke_session

Invalidates a specific login session by session ID

> Body Parameters

```json
{
  "sessionId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» sessionId|body|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

# User/Api

## GET List API keys

GET /users/api_keys

Returns all API keys created by the authenticated user

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## POST Create API key

POST /users/api_keys

Generates a new API key with specified permissions and coverage for programmatic access

> Body Parameters

```json
{
  "coverage": "string",
  "expires_at": "string",
  "name": "string",
  "permissions": [
    "string"
  ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» coverage|body|string| no |none|
|» expires_at|body|string| no |none|
|» name|body|string| no |none|
|» permissions|body|[string]| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|400|[Bad Request](https://tools.ietf.org/html/rfc7231#section-6.5.1)|Bad Request|Inline|
|401|[Unauthorized](https://tools.ietf.org/html/rfc7235#section-3.1)|Unauthorized|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|Internal Server Error|Inline|

### Responses Data Schema

## DELETE Delete API key

DELETE /users/api_keys/<key-id>

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|none|Inline|

### Responses Data Schema

# Health

## GET Liveness probe

GET /health/live

Returns 200 when the process is alive (used by Docker / K8s liveness probe).

> Response Examples

> 200 Response

```json
{
  "property1": "string",
  "property2": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» **additionalProperties**|string|false|none||none|

## GET Readiness probe

GET /health/ready

Returns 200 when all upstream dependencies are reachable, 503 otherwise.

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|503|[Service Unavailable](https://tools.ietf.org/html/rfc7231#section-6.6.4)|Service Unavailable|Inline|

### Responses Data Schema

# Misc

## GET List supported system languages

GET /api/v1/languages

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List supported system timezones

GET /api/v1/timezones

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Ping the gateway

GET /api/v1/ping

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Users

## POST Enable email-OTP login

POST /api/v1/users/enable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Start Tier 1 → Tier 2 KYC upgrade (proof of address); requires Tier 1+

POST /api/v1/users/kyc_upgrade

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Log in via a social/OAuth provider

POST /api/v1/users/login_socials

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Disable 2FA on the authenticated account

POST /api/v1/users/disable_2fa

> Body Parameters

```json
{
  "code": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» code|body|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Disable email-OTP login

POST /api/v1/users/disable_email_otp_login

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Revoke an active session

POST /api/v1/users/revoke_session

> Body Parameters

```json
{
  "sessionId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» sessionId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get the authenticated user's login history

GET /api/v1/users/login_logs

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's API keys

GET /api/v1/users/api_keys

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Create a new API key

POST /api/v1/users/api_keys

> Body Parameters

```json
{
  "label": "string",
  "permissions": [
    "string"
  ]
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» label|body|string| yes |none|
|» permissions|body|[string]| no |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## DELETE Delete an API key

DELETE /api/v1/users/api_keys/{keyId}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|keyId|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## PATCH Update in-app UI settings

PATCH /api/v1/users/app_settings

> Body Parameters

```json
{}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Earn

## GET List Earn products

GET /api/v1/earn/products

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's Earn positions

GET /api/v1/earn/positions

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Subscribe to an Earn product

POST /api/v1/earn/subscribe

> Body Parameters

```json
{
  "productId": "string",
  "amount": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» productId|body|string| yes |none|
|» amount|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Unstake/redeem an Earn position

POST /api/v1/earn/unstake

> Body Parameters

```json
{
  "positionId": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» positionId|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Support

## POST Open a support ticket

POST /api/v1/trading/support/tickets

> Body Parameters

```json
{
  "subject": "string",
  "message": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» subject|body|string| yes |none|
|» message|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET List the authenticated user's support tickets

GET /api/v1/trading/support/tickets

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## GET Get a support ticket's detail/thread

GET /api/v1/trading/support/tickets/{ticket_id}

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|ticket_id|path|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

## POST Reply to a support ticket

POST /api/v1/trading/support/tickets/{ticket_id}/messages

> Body Parameters

```json
{
  "message": "string"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|ticket_id|path|string| yes |none|
|body|body|object| yes |none|
|» message|body|string| yes |none|

> Response Examples

> 200 Response

```json
{}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

# Notifications

## GET Get notification history

GET /api/v1/notifications/history

Returns the authenticated user's own past notifications (email/SMS/push), newest first. Currently only covers trading-alert notifications that carry a user_id (order placed/cancelled, TP/SL triggered, margin call, position liquidated) — withdrawal/P2P/spot-order/OTP notifications are not yet included since they're keyed by email/phone at the notification service layer.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|page|query|string| no |none|
|limit|query|string| no |Max 100|

> Response Examples

> 200 Response

```json
{
  "notifications": [
    {
      "id": "string",
      "user_id": "string",
      "channel": "string",
      "type": "string",
      "title": "string",
      "body": "string",
      "status": "string",
      "created_at": "2019-08-24T14:15:22Z"
    }
  ],
  "currentPage": "string",
  "totalPages": "string",
  "totalRecords": "string"
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|
|500|[Internal Server Error](https://tools.ietf.org/html/rfc7231#section-6.6.1)|data-manager call failed|None|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» notifications|[object]|false|none||none|
|»» id|string|false|none||none|
|»» user_id|string|false|none||none|
|»» channel|string|false|none||email | sms | push|
|»» type|string|false|none||e.g. order_placed, margin_call, position_liquidated|
|»» title|string|false|none||none|
|»» body|string|false|none||none|
|»» status|string|false|none||sent | failed|
|»» created_at|string(date-time)|false|none||none|
|» currentPage|string|false|none||none|
|» totalPages|string|false|none||none|
|» totalRecords|string|false|none||none|

## POST Register device token

POST /api/v1/notifications/device_token

Registers an FCM/APNs push notification device token for the authenticated user.

> Body Parameters

```json
{
    "deviceToken": "fcm_token_example_123",
    "platform": "ios"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» deviceToken|body|string| yes |none|
|» platform|body|string| yes |none|

#### Enum

|Name|Value|
|---|---|
|» platform|ios|
|» platform|android|
|» platform|web|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## DELETE Unregister device token

DELETE /api/v1/notifications/device_token

Removes a registered push notification device token.

> Body Parameters

```json
{
    "deviceToken": "fcm_token_example_123"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» deviceToken|body|string| yes |none|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## PATCH Mark all notifications as read

PATCH /api/v1/notifications/read_all

Marks all unread notifications for the authenticated user as read.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## GET Get notification by ID

GET /api/v1/notifications/{id}

Fetches a single notification by its ID.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|id|path|string| yes |Notification ID|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## PATCH Mark notification as read

PATCH /api/v1/notifications/{id}/read

Marks a specific notification as read.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|id|path|string| yes |Notification ID|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# WebSocket

## GET WebSocket Upgrade & Connection (/api/v1/ws)

GET /api/v1/ws

Upgrades the HTTP connection to a persistent bi-directional WebSocket connection (`wss://<host>/api/v1/ws` or `wss://<host>/ws`).

### Authentication (provide one):
1. **Query Parameter:** `?auth-token=<jwt>`
2. **Header:** `X-User-AccessToken: <jwt>`
3. **Cookie:** `limiance_session` (HttpOnly browser session)

*(Unauthenticated connections are accepted as read-only guest viewers `viewer-*` for public market data streams.)*

### Client Frame Envelope:
```json
{
  "type": "<message_type>",
  "request_id": "optional-correlation-id",
  "data": { ... }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|auth-token|query|string| no |JWT access token (for browser/mobile WebSocket clients)|
|X-User-AccessToken|header|string| no |JWT access token (alternative to query param)|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# WebSocket/Portfolio & Balances

## POST [WS] Subscribe Portfolio Balance (by account) (get_portfolio_balance)

POST /api/v1/ws/get_portfolio_balance

**WebSocket Message (`get_portfolio_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Streams real-time portfolio balance in USD, NGN, and BTC.

`account` accepts `"spot"`, `"margin"`, `"futures"`, `"funding"`, `"total"`, or `""` (overall).
Pushes an immediate snapshot, instant updates on balance change events, and 30s reconciliation frames.
When `account` is set, emits both `portfolio_balance` and `<account>_portfolio_balance`.

- **Client Frame Type:** `get_portfolio_balance`
- **Server Push Frame Type:** `portfolio_balance`

> Body Parameters

```json
{
    "type": "get_portfolio_balance",
    "data": {
        "account": "spot"
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_portfolio_balance'|
|» data|body|object| no |none|
|»» account|body|string| no |none|

#### Enum

|Name|Value|
|---|---|
|»» account|spot|
|»» account|margin|
|»» account|futures|
|»» account|funding|
|»» account|total|

> Response Examples

> 200 Response

```json
{
    "type": "portfolio_balance",
    "data": {
        "account": "spot",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "1005.42",
            "inNgn": "1658943.00",
            "inBtc": "0.01490000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Spot Balance (shorthand) (get_spot_balance)

POST /api/v1/ws/get_spot_balance

**WebSocket Message (`get_spot_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Shorthand for `get_portfolio_balance` with `account: "spot"` (also accepts `get_spot_portfolio_balance`). Emits `portfolio_balance` and `spot_portfolio_balance`.

- **Client Frame Type:** `get_spot_balance`
- **Server Push Frame Type:** `spot_portfolio_balance`

> Body Parameters

```json
{
    "type": "get_spot_balance",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_spot_balance'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "spot_portfolio_balance",
    "data": {
        "account": "spot",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "1005.42",
            "inNgn": "1658943.00",
            "inBtc": "0.01490000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Margin Balance (shorthand) (get_margin_balance)

POST /api/v1/ws/get_margin_balance

**WebSocket Message (`get_margin_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Shorthand for `get_portfolio_balance` with `account: "margin"` (also accepts `get_margin_portfolio_balance`). Emits `portfolio_balance` and `margin_portfolio_balance`.

- **Client Frame Type:** `get_margin_balance`
- **Server Push Frame Type:** `margin_portfolio_balance`

> Body Parameters

```json
{
    "type": "get_margin_balance",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_margin_balance'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "margin_portfolio_balance",
    "data": {
        "account": "margin",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "500.00",
            "inNgn": "825000.00",
            "inBtc": "0.00740000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Futures Balance (shorthand) (get_futures_balance)

POST /api/v1/ws/get_futures_balance

**WebSocket Message (`get_futures_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Shorthand for `get_portfolio_balance` with `account: "futures"` (also accepts `get_futures_portfolio_balance`). Emits `portfolio_balance` and `futures_portfolio_balance`.

- **Client Frame Type:** `get_futures_balance`
- **Server Push Frame Type:** `futures_portfolio_balance`

> Body Parameters

```json
{
    "type": "get_futures_balance",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_futures_balance'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "futures_portfolio_balance",
    "data": {
        "account": "futures",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "250.00",
            "inNgn": "412500.00",
            "inBtc": "0.00370000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Total Portfolio Balance (shorthand) (get_total_balance)

POST /api/v1/ws/get_total_balance

**WebSocket Message (`get_total_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Shorthand for `get_portfolio_balance` with `account: "total"` (also accepts `get_total_portfolio_balance`). Emits `portfolio_balance` and `total_portfolio_balance`.

- **Client Frame Type:** `get_total_balance`
- **Server Push Frame Type:** `total_portfolio_balance`

> Body Parameters

```json
{
    "type": "get_total_balance",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_total_balance'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "total_portfolio_balance",
    "data": {
        "account": "total",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "1755.42",
            "inNgn": "2896443.00",
            "inBtc": "0.02600000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Portfolio Asset Allocations (get_portfolio_balance_allocations)

POST /api/v1/ws/get_portfolio_balance_allocations

**WebSocket Message (`get_portfolio_balance_allocations`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Streams percentage and NGN value breakdown of each asset in the user's portfolio.

- **Client Frame Type:** `get_portfolio_balance_allocations`
- **Server Push Frame Type:** `portfolio_balance_allocations`

> Body Parameters

```json
{
    "type": "get_portfolio_balance_allocations",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_portfolio_balance_allocations'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "portfolio_balance_allocations",
    "data": {
        "totalValueNGN": "1658943.00",
        "allocations": [
            {
                "symbol": "USDT",
                "name": "Tether",
                "balance": "1000.00",
                "percentage": "99.46",
                "ngnValue": "1650000.00"
            }
        ]
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Paginated Portfolio Holdings (get_portfolio)

POST /api/v1/ws/get_portfolio

**WebSocket Message (`get_portfolio`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Streams paginated asset holdings with balances, USD/NGN valuations, and 24h changes.

- **Client Frame Type:** `get_portfolio`
- **Server Push Frame Type:** `portfolio`

> Body Parameters

```json
{
    "type": "get_portfolio",
    "data": {
        "page": "1",
        "limit": "10",
        "query": ""
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_portfolio'|
|» data|body|object| no |none|
|»» page|body|string| no |none|
|»» limit|body|string| no |none|
|»» query|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "portfolio",
    "data": {
        "success": true,
        "statusCode": 200,
        "data": [],
        "totalPages": 1,
        "currentPage": 1,
        "totalRecords": 5
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Active Futures Positions (get_futures_positions)

POST /api/v1/ws/get_futures_positions

**WebSocket Message (`get_futures_positions`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Streams the user's open futures positions (entry price, mark price, liquidation price, unrealized PnL). Also accepts singular alias `get_futures_position`.

- **Client Frame Type:** `get_futures_positions`
- **Server Push Frame Type:** `futures_positions`

> Body Parameters

```json
{
    "type": "get_futures_positions",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_futures_positions'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "futures_positions",
    "data": {
        "success": true,
        "statusCode": 200,
        "data": []
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Fetch Futures Order History (get_futures_order_history)

POST /api/v1/ws/get_futures_order_history

**WebSocket Message (`get_futures_order_history`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

One-shot WebSocket request returning paginated futures order history.

- **Client Frame Type:** `get_futures_order_history`
- **Server Push Frame Type:** `futures_order_history`

> Body Parameters

```json
{
    "type": "get_futures_order_history",
    "data": {
        "page": "1",
        "limit": "50"
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_futures_order_history'|
|» data|body|object| no |none|
|»» page|body|string| no |none|
|»» limit|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "futures_order_history",
    "data": {
        "success": true,
        "statusCode": 200,
        "data": [],
        "totalPages": 1,
        "currentPage": 1
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Funding Balance (shorthand) (get_funding_balance)

POST /api/v1/ws/get_funding_balance

**WebSocket Message (`get_funding_balance`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Shorthand for `get_portfolio_balance` with `account: "funding"` (also accepts `get_funding_portfolio_balance`). Emits `portfolio_balance` and `funding_portfolio_balance`.

- **Client Frame Type:** `get_funding_balance`
- **Server Push Frame Type:** `funding_portfolio_balance`

> Body Parameters

```json
{
    "type": "get_funding_balance",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_funding_balance'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "funding_portfolio_balance",
    "data": {
        "account": "funding",
        "success": true,
        "statusCode": 200,
        "data": {
            "inUsd": "300.00",
            "inNgn": "495000.00",
            "inBtc": "0.00440000"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Cross-Margin Account Snapshot & PnL (get_margin_account)

POST /api/v1/ws/get_margin_account

**WebSocket Message (`get_margin_account`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Subscribes to cross-margin account snapshots (`margin_account`), including account-level `equity_usd`, `margin_level`, `total_assets_usd`, `total_liability_usd`, and per-asset `free`, `locked`, `borrowed`, `interest`, `net_balance`, `total_liability`.

Note: Live changes are also pushed automatically via `RunMarginAccountEventStream` (`type: "margin_account"`).

- **Client Frame Type:** `get_margin_account`
- **Server Push Frame Type:** `margin_account`

> Body Parameters

```json
{
    "type": "get_margin_account",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_margin_account'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "margin_account",
    "data": {
        "success": true,
        "updatedAt": "2026-10-16T10:00:00Z",
        "data": {
            "equity_usd": "1500.00",
            "margin_level": "2.50",
            "total_assets_usd": "2500.00",
            "total_liability_usd": "1000.00",
            "assets": []
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Subscribe Active Futures Positions (alias get_futures_position) (get_futures_position)

POST /api/v1/ws/get_futures_position

**WebSocket Message (`get_futures_position`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Singular alias for `get_futures_positions`. Streams the user's open futures positions.

- **Client Frame Type:** `get_futures_position`
- **Server Push Frame Type:** `futures_positions`

> Body Parameters

```json
{
    "type": "get_futures_position",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_futures_position'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "futures_positions",
    "data": {
        "success": true,
        "statusCode": 200,
        "data": []
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

# WebSocket/Order Execution

## POST [WS] Subscribe Live User Order Updates (get_user_order_updates)

POST /api/v1/ws/get_user_order_updates

**WebSocket Message (`get_user_order_updates`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Streams real-time order fill, partial fill, and cancellation events (`user_order_update`) for the authenticated user.

- **Client Frame Type:** `get_user_order_updates`
- **Server Push Frame Type:** `user_order_update`

> Body Parameters

```json
{
    "type": "get_user_order_updates",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_user_order_updates'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "user_order_update",
    "data": {
        "order": {
            "id": "ord-123",
            "symbol": "BTCUSDT",
            "status": "FILLED"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Place Spot Order via WebSocket (place_spot_order)

POST /api/v1/ws/place_spot_order

**WebSocket Message (`place_spot_order`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Submits a spot market or limit order directly over WebSocket with low latency (also accepts alias `place_order`). Echoes `request_id` in `order_placed` / `order_rejected`.

- **Client Frame Type:** `place_spot_order`
- **Server Push Frame Type:** `order_placed`

> Body Parameters

```json
{
    "type": "place_spot_order",
    "data": {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "type": "limit",
        "price": 67000,
        "quantity": 0.01,
        "timeInForce": "GTC"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'place_spot_order'|
|» data|body|object| no |none|
|»» symbol|body|string| no |none|
|»» side|body|string| no |none|
|»» type|body|string| no |none|
|»» price|body|number| no |none|
|»» quantity|body|number| no |none|
|»» takeProfit|body|number| no |none|
|»» stopLoss|body|number| no |none|
|»» timeInForce|body|string| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

#### Enum

|Name|Value|
|---|---|
|»» side|BUY|
|»» side|SELL|
|»» type|market|
|»» type|limit|
|»» type|stop_limit|

> Response Examples

> 200 Response

```json
{
    "type": "order_placed",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "symbol": "BTCUSDT",
        "side": "BUY",
        "price": 67000,
        "quantity": 0.01
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Cancel Spot Order via WebSocket (cancel_spot_order)

POST /api/v1/ws/cancel_spot_order

**WebSocket Message (`cancel_spot_order`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Cancels an open spot order over WebSocket (also accepts alias `cancel_order`). Replies with `order_cancelled` or `cancel_rejected`.

- **Client Frame Type:** `cancel_spot_order`
- **Server Push Frame Type:** `order_cancelled`

> Body Parameters

```json
{
    "type": "cancel_spot_order",
    "data": {
        "orderId": "ord-12345"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'cancel_spot_order'|
|» data|body|object| no |none|
|»» orderId|body|string| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

> Response Examples

> 200 Response

```json
{
    "type": "order_cancelled",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "orderId": "ord-12345"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Place Futures Order via WebSocket (place_futures_order)

POST /api/v1/ws/place_futures_order

**WebSocket Message (`place_futures_order`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Submits a futures perpetual order over WebSocket. Replies with `futures_order_placed` or `futures_order_rejected`.

- **Client Frame Type:** `place_futures_order`
- **Server Push Frame Type:** `futures_order_placed`

> Body Parameters

```json
{
    "type": "place_futures_order",
    "data": {
        "pair": "BTCUSDT",
        "side": "BUY",
        "type": "limit",
        "price": 67000,
        "quantity": 0.1,
        "leverage": 10,
        "marginMode": "ISOLATED"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'place_futures_order'|
|» data|body|object| no |none|
|»» pair|body|string| no |none|
|»» side|body|string| no |none|
|»» type|body|string| no |none|
|»» price|body|number| no |none|
|»» quantity|body|number| no |none|
|»» leverage|body|number| no |none|
|»» marginMode|body|string| no |none|
|»» takeProfit|body|number| no |none|
|»» stopLoss|body|number| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

#### Enum

|Name|Value|
|---|---|
|»» side|BUY|
|»» side|SELL|
|»» type|market|
|»» type|limit|
|»» marginMode|ISOLATED|
|»» marginMode|CROSS|

> Response Examples

> 200 Response

```json
{
    "type": "futures_order_placed",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "pair": "BTCUSDT"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Close Futures Position via WebSocket (close_futures_position)

POST /api/v1/ws/close_futures_position

**WebSocket Message (`close_futures_position`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Closes an active futures position at market over WebSocket (also accepts alias `close_position`). Replies with `position_closed` or `close_position_rejected`.

- **Client Frame Type:** `close_futures_position`
- **Server Push Frame Type:** `position_closed`

> Body Parameters

```json
{
    "type": "close_futures_position",
    "data": {
        "positionId": "pos-12345"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'close_futures_position'|
|» data|body|object| no |none|
|»» positionId|body|string| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

> Response Examples

> 200 Response

```json
{
    "type": "position_closed",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "positionId": "pos-12345"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Place Spot Order via WebSocket (alias place_order) (place_order)

POST /api/v1/ws/place_order

**WebSocket Message (`place_order`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Alias for `place_spot_order`. Submits a spot order over WebSocket and replies with `order_placed` or `order_rejected`.

- **Client Frame Type:** `place_order`
- **Server Push Frame Type:** `order_placed`

> Body Parameters

```json
{
    "type": "place_order",
    "data": {
        "symbol": "BTCUSDT",
        "side": "BUY",
        "type": "limit",
        "price": 67000,
        "quantity": 0.01
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'place_order'|
|» data|body|object| no |none|
|»» symbol|body|string| no |none|
|»» side|body|string| no |none|
|»» type|body|string| no |none|
|»» price|body|number| no |none|
|»» quantity|body|number| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

#### Enum

|Name|Value|
|---|---|
|»» side|BUY|
|»» side|SELL|
|»» type|market|
|»» type|limit|
|»» type|stop_limit|

> Response Examples

> 200 Response

```json
{
    "type": "order_placed",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "symbol": "BTCUSDT",
        "side": "BUY",
        "price": 67000,
        "quantity": 0.01
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Cancel Spot Order via WebSocket (alias cancel_order) (cancel_order)

POST /api/v1/ws/cancel_order

**WebSocket Message (`cancel_order`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Alias for `cancel_spot_order`. Cancels an open spot order over WebSocket (`order_cancelled` / `cancel_rejected`).

- **Client Frame Type:** `cancel_order`
- **Server Push Frame Type:** `order_cancelled`

> Body Parameters

```json
{
    "type": "cancel_order",
    "data": {
        "orderId": "ord-12345"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'cancel_order'|
|» data|body|object| no |none|
|»» orderId|body|string| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

> Response Examples

> 200 Response

```json
{
    "type": "order_cancelled",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "orderId": "ord-12345"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Close Futures Position via WebSocket (alias close_position) (close_position)

POST /api/v1/ws/close_position

**WebSocket Message (`close_position`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Alias for `close_futures_position`. Closes an active futures position at market (`position_closed` / `close_position_rejected`).

- **Client Frame Type:** `close_position`
- **Server Push Frame Type:** `position_closed`

> Body Parameters

```json
{
    "type": "close_position",
    "data": {
        "positionId": "pos-12345"
    },
    "request_id": "req-001"
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'close_position'|
|» data|body|object| no |none|
|»» positionId|body|string| no |none|
|» request_id|body|string| no |Optional client correlation ID echoed in the response|

> Response Examples

> 200 Response

```json
{
    "type": "position_closed",
    "request_id": "req-001",
    "data": {
        "success": true,
        "statusCode": 200,
        "positionId": "pos-12345"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

# WebSocket/P2P Chat

## POST [WS] Send P2P Chat Message (chat_message)

POST /api/v1/ws/chat_message

**WebSocket Message (`chat_message`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Saves and broadcasts a chat message to all participants in a P2P order chat.

- **Client Frame Type:** `chat_message`
- **Server Push Frame Type:** `new_message`

> Body Parameters

```json
{
    "type": "chat_message",
    "data": {
        "chat_id": "chat-12345",
        "message": "Payment transferred, please check."
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'chat_message'|
|» data|body|object| no |none|
|»» chat_id|body|string| no |none|
|»» message|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "new_message",
    "data": {
        "chatId": "chat-12345",
        "senderId": "usr-1",
        "content": "Payment transferred, please check."
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Get User P2P Chats (get_chats)

POST /api/v1/ws/get_chats

**WebSocket Message (`get_chats`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Fetches active P2P chats for the authenticated user (optionally filtered by `order_id`).

- **Client Frame Type:** `get_chats`
- **Server Push Frame Type:** `user_chats`

> Body Parameters

```json
{
    "type": "get_chats",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_chats'|
|» data|body|object| no |none|
|»» order_id|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "user_chats",
    "data": {
        "chats": []
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Get P2P Chat Message History (get_chat_messages)

POST /api/v1/ws/get_chat_messages

**WebSocket Message (`get_chat_messages`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Fetches message history for a specific P2P `chat_id`.

- **Client Frame Type:** `get_chat_messages`
- **Server Push Frame Type:** `chat_messages`

> Body Parameters

```json
{
    "type": "get_chat_messages",
    "data": {
        "chat_id": "chat-12345"
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'get_chat_messages'|
|» data|body|object| no |none|
|»» chat_id|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "chat_messages",
    "data": {
        "chatId": "chat-12345",
        "messages": []
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Send P2P Chat Typing Indicator (typing_response)

POST /api/v1/ws/typing_response

**WebSocket Message (`typing_response`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Broadcasts typing status (`is_typing: true|false`) to the counterparty in a P2P chat.

- **Client Frame Type:** `typing_response`
- **Server Push Frame Type:** `user_typing`

> Body Parameters

```json
{
    "type": "typing_response",
    "data": {
        "chat_id": "chat-12345",
        "is_typing": true
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'typing_response'|
|» data|body|object| no |none|
|»» chat_id|body|string| no |none|
|»» is_typing|body|boolean| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "user_typing",
    "data": {
        "chatId": "chat-12345",
        "userId": "usr-1",
        "isTyping": true
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

# WebSocket/Subscriptions

## POST [WS] Unsubscribe From Stream Topic (unsubscribe)

POST /api/v1/ws/unsubscribe

**WebSocket Message (`unsubscribe`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Stops an active stream/poller slot on this connection (also accepts `unSubscribe`).

**Supported `topic` values:**
- `order_book`, `futures_order_book`, `market_data`, `futures_markets`, `trades`, `user_order_updates`
- `candles`, `candles_live` (pass `pair` and `interval`)
- `portfolio`, `portfolio_balance` (optional `account`), `portfolio_balance_allocations`, `margin_account`, `futures_positions`, `funding_rate` (pass `pair`)

- **Client Frame Type:** `unsubscribe`
- **Server Push Frame Type:** `unsubscribed`

> Body Parameters

```json
{
    "type": "unsubscribe",
    "data": {
        "topic": "order_book"
    }
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'unsubscribe'|
|» data|body|object| no |none|
|»» topic|body|string| no |none|
|»» pair|body|string| no |none|
|»» interval|body|string| no |none|
|»» account|body|string| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "unsubscribed",
    "data": {
        "topic": "order_book"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] Unsubscribe From All Active Streams (unsubscribe_all)

POST /api/v1/ws/unsubscribe_all

**WebSocket Message (`unsubscribe_all`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Cancels all active subscriptions and pollers on the current WebSocket connection (also accepts `unsubscribeAll`, `unSubscribeAll`, `unsubscribe-all`).

- **Client Frame Type:** `unsubscribe_all`
- **Server Push Frame Type:** `unsubscribed_all`

> Body Parameters

```json
{
    "type": "unsubscribe_all",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'unsubscribe_all'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "unsubscribed_all",
    "data": {
        "status": "success"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

# WebSocket/Server Push Events

## POST [WS] [Server Push] Order Filled / Execution Event (order_filled)

POST /api/v1/ws/events/order_filled

**WebSocket Message (`order_filled`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Automatically pushed by the server (`RunOrderEventStream`) to all active WebSocket connections of an authenticated user whenever one of their orders is filled or partially filled.

No explicit subscription message is required — authenticating on `/api/v1/ws` automatically routes these events to the user.

- **Client Frame Type:** `order_filled`
- **Server Push Frame Type:** `order_filled`

> Body Parameters

```json
{
    "type": "order_filled",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'order_filled'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "order_filled",
    "data": {
        "order_id": "ord-98765",
        "trade_id": "trd-54321",
        "symbol": "BTCUSDT",
        "side": "BUY",
        "fill_qty": "0.01000000",
        "fill_price": "67450.00",
        "status": "FILLED",
        "role": "TAKER",
        "fee": "0.06745",
        "fee_currency": "USDT",
        "fee_rate": "0.001",
        "timestamp": "2026-10-16T10:15:00Z"
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] [Server Push] Instant Balance Mutation Event (balance_update)

POST /api/v1/ws/events/balance_update

**WebSocket Message (`balance_update`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Automatically pushed by the server (`RunBalanceEventStream` from DataManager) to all active WebSocket connections of an authenticated user whenever any wallet/trading balance changes.

No explicit subscription is required beyond connecting with a valid JWT.

- **Client Frame Type:** `balance_update`
- **Server Push Frame Type:** `balance_update`

> Body Parameters

```json
{
    "type": "balance_update",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'balance_update'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "balance_update",
    "data": {
        "symbol": "USDT",
        "balance_type": "spot",
        "new_balance": "1050.25",
        "delta": "50.25",
        "reason": "trade_settlement",
        "timestamp": 1729073700
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

## POST [WS] [Server Push] Cross-Margin Account & PnL Event (margin_account)

POST /api/v1/ws/events/margin_account

**WebSocket Message (`margin_account`)**

Send this JSON frame over an active `/api/v1/ws` WebSocket connection.

Automatically pushed by the server (`RunMarginAccountEventStream`) to the authenticated user's WebSocket sessions whenever their cross-margin equity, margin level, or liabilities change.

- **Client Frame Type:** `margin_account`
- **Server Push Frame Type:** `margin_account`

> Body Parameters

```json
{
    "type": "margin_account",
    "data": {}
}
```

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|body|body|object| yes |none|
|» type|body|string| yes |Must be 'margin_account'|
|» data|body|object| no |none|

> Response Examples

> 200 Response

```json
{
    "type": "margin_account",
    "data": {
        "success": true,
        "updatedAt": "2026-10-16T10:15:00Z",
        "timestamp": 1729073700,
        "data": {
            "user_id": "usr-123",
            "equity_usd": "1500.00",
            "margin_level": "2.50",
            "total_assets_usd": "2500.00",
            "total_liability_usd": "1000.00"
        }
    }
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» type|string|false|none||none|
|» data|object|false|none||none|

# Webhooks

## POST Sumsub KYC webhook

POST /api/v1/webhooks/sumsub

Receives applicant verification status callbacks from Sumsub.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|x-payload-digest|header|string| yes |Sumsub HMAC signature|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST Monnify payment webhook

POST /api/v1/webhooks/monnify

Receives NGN deposit and disbursement settlement callbacks from Monnify.

### Params

|Name|Location|Type|Required|Description|
|---|---|---|---|---|
|monnify-signature|header|string| yes |Monnify HMAC-SHA512 signature|

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

## POST cNGN stablecoin webhook

POST /api/v1/webhooks/cngn

Receives mint and redemption status callbacks from cNGN rails.

> Response Examples

> 200 Response

```json
{
  "statusCode": 200,
  "success": true,
  "message": "string",
  "data": {}
}
```

### Responses

|HTTP Status Code |Meaning|Description|Data schema|
|---|---|---|---|
|200|[OK](https://tools.ietf.org/html/rfc7231#section-6.3.1)|OK|Inline|

### Responses Data Schema

HTTP Status Code **200**

|Name|Type|Required|Restrictions|Title|description|
|---|---|---|---|---|---|
|» statusCode|integer|false|none||none|
|» success|boolean|false|none||none|
|» message|string|false|none||none|
|» data|object|false|none||none|

# Data Schema

<h2 id="tocS_Body">Body</h2>

<a id="schemabody"></a>
<a id="schema_Body"></a>
<a id="tocSbody"></a>
<a id="tocsbody"></a>

```json
{
  "code": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|code|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.Bank">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.Bank</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bank"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.Bank"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bank"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bank"></a>

```json
{
  "baseUssdCode": "string",
  "code": "string",
  "name": "string",
  "ussdTemplate": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|baseUssdCode|string|false|none||none|
|code|string|false|none||none|
|name|string|false|none||none|
|ussdTemplate|string|false|none||none|

<h2 id="tocS_TemporaryDepositAccountRequest">TemporaryDepositAccountRequest</h2>

<a id="schematemporarydepositaccountrequest"></a>
<a id="schema_TemporaryDepositAccountRequest"></a>
<a id="tocStemporarydepositaccountrequest"></a>
<a id="tocstemporarydepositaccountrequest"></a>

```json
{
  "symbol": "string",
  "bankCode": "string",
  "amount": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|symbol|string|true|none||Asset to credit once the transfer settles (e.g. "NGN", "USDT", "BTC")|
|bankCode|string|true|none||Destination bank code, from GET /wallet/fiat/banks|
|amount|string|true|none||NGN amount to transfer into the virtual account|

<h2 id="tocS_TemporaryDepositAccountResponse">TemporaryDepositAccountResponse</h2>

<a id="schematemporarydepositaccountresponse"></a>
<a id="schema_TemporaryDepositAccountResponse"></a>
<a id="tocStemporarydepositaccountresponse"></a>
<a id="tocstemporarydepositaccountresponse"></a>

```json
{
  "success": true,
  "error": "string",
  "accountNumber": "string",
  "accountName": "string",
  "bankName": "string",
  "bankCode": "string",
  "accountDurationSeconds": 0,
  "ussdPayment": "string",
  "requestTime": "string",
  "expiresOn": "string",
  "transactionReference": "string",
  "paymentReference": "string",
  "amount": "string",
  "fee": "string",
  "totalPayable": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|success|boolean|false|none||none|
|error|string|false|none||none|
|accountNumber|string|false|none||none|
|accountName|string|false|none||none|
|bankName|string|false|none||none|
|bankCode|string|false|none||none|
|accountDurationSeconds|integer|false|none||none|
|ussdPayment|string|false|none||none|
|requestTime|string|false|none||none|
|expiresOn|string|false|none||none|
|transactionReference|string|false|none||none|
|paymentReference|string|false|none||none|
|amount|string|false|none||none|
|fee|string|false|none||none|
|totalPayable|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.BanksListResponse">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.BanksListResponse</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bankslistresponse"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.BanksListResponse"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bankslistresponse"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bankslistresponse"></a>

```json
{
  "banks": [
    {
      "baseUssdCode": "string",
      "code": "string",
      "name": "string",
      "ussdTemplate": "string"
    }
  ],
  "error": "string",
  "success": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|banks|[[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.Bank](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.bank)]|false|none||none|
|error|string|false|none||none|
|success|boolean|false|none||none|

<h2 id="tocS_DefaultResponse">DefaultResponse</h2>

<a id="schemadefaultresponse"></a>
<a id="schema_DefaultResponse"></a>
<a id="tocSdefaultresponse"></a>
<a id="tocsdefaultresponse"></a>

```json
{
  "statusCode": 0,
  "success": true,
  "message": "string",
  "error": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|statusCode|integer|false|none||none|
|success|boolean|false|none||none|
|message|string|false|none||none|
|error|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CardAuthResponse">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CardAuthResponse</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.cardauthresponse"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CardAuthResponse"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.cardauthresponse"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.cardauthresponse"></a>

```json
{
  "authorizedAmount": "string",
  "error": "string",
  "message": "string",
  "paymentReference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|authorizedAmount|string|false|none||none|
|error|string|false|none||none|
|message|string|false|none||none|
|paymentReference|string|false|none||none|
|status|string|false|none||none|
|success|boolean|false|none||none|
|transactionReference|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCard3DSRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCard3DSRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecard3dsrequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCard3DSRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecard3dsrequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecard3dsrequest"></a>

```json
{
  "apiKey": "string",
  "cardCvv": 0,
  "cardExpiryMonth": 0,
  "cardExpiryYear": 0,
  "cardNumber": "string",
  "cardPin": 0,
  "transactionReference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|apiKey|string|false|none||none|
|cardCvv|integer|true|none||none|
|cardExpiryMonth|integer|true|none||none|
|cardExpiryYear|integer|true|none||none|
|cardNumber|string|true|none||none|
|cardPin|integer|false|none||none|
|transactionReference|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCardOTPRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCardOTPRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecardotprequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteCardOTPRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecardotprequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completecardotprequest"></a>

```json
{
  "otp": "string",
  "tokenId": "string",
  "transactionReference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|otp|string|true|none||none|
|tokenId|string|true|none||none|
|transactionReference|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteFiatWithdrawalRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteFiatWithdrawalRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completefiatwithdrawalrequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.CompleteFiatWithdrawalRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completefiatwithdrawalrequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.completefiatwithdrawalrequest"></a>

```json
{
  "authorizationCode": "string",
  "reference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|authorizationCode|string|true|none||none|
|reference|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.FiatWithdrawalResponse">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.FiatWithdrawalResponse</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.fiatwithdrawalresponse"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.FiatWithdrawalResponse"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.fiatwithdrawalresponse"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.fiatwithdrawalresponse"></a>

```json
{
  "amount": "string",
  "currency": "string",
  "dateCreated": "string",
  "destinationAccountName": "string",
  "destinationAccountNumber": "string",
  "destinationBankCode": "string",
  "destinationBankName": "string",
  "error": "string",
  "narration": "string",
  "reference": "string",
  "status": "string",
  "success": true,
  "transactionReference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|amount|string|false|none||none|
|currency|string|false|none||none|
|dateCreated|string|false|none||none|
|destinationAccountName|string|false|none||none|
|destinationAccountNumber|string|false|none||none|
|destinationBankCode|string|false|none||none|
|destinationBankName|string|false|none||none|
|error|string|false|none||none|
|narration|string|false|none||none|
|reference|string|false|none||none|
|status|string|false|none||none|
|success|boolean|false|none||none|
|transactionReference|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.InitiateFiatWithdrawalRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.InitiateFiatWithdrawalRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.initiatefiatwithdrawalrequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.InitiateFiatWithdrawalRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.initiatefiatwithdrawalrequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.initiatefiatwithdrawalrequest"></a>

```json
{
  "accountName": "string",
  "accountNumber": "string",
  "amount": "string",
  "bankCode": "string",
  "symbol": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|accountName|string|true|none||none|
|accountNumber|string|true|none||none|
|amount|string|true|none||none|
|bankCode|string|true|none||none|
|symbol|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.NotificationPreferences">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.NotificationPreferences</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.notificationpreferences"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.NotificationPreferences"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.notificationpreferences"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.notificationpreferences"></a>

```json
{
  "activities": true,
  "news": true,
  "systemMessages": true,
  "tradeNotification": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|activities|boolean|false|none||none|
|news|boolean|false|none||none|
|systemMessages|boolean|false|none||none|
|tradeNotification|boolean|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardrequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardrequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardrequest"></a>

```json
{
  "amount": "string",
  "cardCvv": "string",
  "cardExpiryMonth": "string",
  "cardExpiryYear": "string",
  "cardNumber": "string",
  "cardPin": "string",
  "symbol": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|amount|string|true|none||none|
|cardCvv|string|true|none||none|
|cardExpiryMonth|string|true|none||none|
|cardExpiryYear|string|true|none||none|
|cardNumber|string|true|none||none|
|cardPin|string|false|none||none|
|symbol|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardResponse">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardResponse</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardresponse"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PayWithCardResponse"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardresponse"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.paywithcardresponse"></a>

```json
{
  "amountPaid": "string",
  "currencyPaid": "string",
  "error": "string",
  "paymentReference": "string",
  "paymentStatus": "string",
  "responseMessage": "string",
  "success": true,
  "transactionReference": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|amountPaid|string|false|none||none|
|currencyPaid|string|false|none||none|
|error|string|false|none||none|
|paymentReference|string|false|none||none|
|paymentStatus|string|false|none||none|
|responseMessage|string|false|none||none|
|success|boolean|false|none||none|
|transactionReference|string|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PriceAlerts">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PriceAlerts</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.pricealerts"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PriceAlerts"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.pricealerts"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.pricealerts"></a>

```json
{
  "notificationOn": true,
  "priceOn": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|notificationOn|boolean|false|none||none|
|priceOn|boolean|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.SocialLoginRequest">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.SocialLoginRequest</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.socialloginrequest"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.SocialLoginRequest"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.socialloginrequest"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.socialloginrequest"></a>

```json
{
  "id": "string",
  "rememberMe": true,
  "token": "string",
  "userAgent": "string"
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|id|string|true|none||none|
|rememberMe|boolean|false|none||none|
|token|string|true|none||none|
|userAgent|string|true|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeFeeDeductions">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeFeeDeductions</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradefeedeductions"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeFeeDeductions"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradefeedeductions"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradefeedeductions"></a>

```json
{
  "useBNBToPayFees": true,
  "useBNBToPayFuturesFees": true,
  "useBNBToPayMarginFees": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|useBNBToPayFees|boolean|false|none||none|
|useBNBToPayFuturesFees|boolean|false|none||none|
|useBNBToPayMarginFees|boolean|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeOrderNotifications">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeOrderNotifications</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradeordernotifications"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeOrderNotifications"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradeordernotifications"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradeordernotifications"></a>

```json
{
  "autoBorrowRepayMargin": true,
  "limitOrder": true,
  "marketOrder": true,
  "stopOrder": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|autoBorrowRepayMargin|boolean|false|none||none|
|limitOrder|boolean|false|none||none|
|marketOrder|boolean|false|none||none|
|stopOrder|boolean|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TransactionNotifications">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TransactionNotifications</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.transactionnotifications"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TransactionNotifications"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.transactionnotifications"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.transactionnotifications"></a>

```json
{
  "futuresNotificationSound": true,
  "futuresTradingNotification": true,
  "spotNotificationSound": true,
  "spotTradingNotification": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|futuresNotificationSound|boolean|false|none||none|
|futuresTradingNotification|boolean|false|none||none|
|spotNotificationSound|boolean|false|none||none|
|spotTradingNotification|boolean|false|none||none|

<h2 id="tocS_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.UserSettings">gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.UserSettings</h2>

<a id="schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.usersettings"></a>
<a id="schema_gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.UserSettings"></a>
<a id="tocSgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.usersettings"></a>
<a id="tocsgitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.usersettings"></a>

```json
{
  "antiPhishingCode": "string",
  "chartColor": true,
  "language": "string",
  "notificationPreference": {
    "activities": true,
    "news": true,
    "systemMessages": true,
    "tradeNotification": true
  },
  "priceAlerts": {
    "notificationOn": true,
    "priceOn": true
  },
  "timezone": "string",
  "tradeFeeDeductions": {
    "useBNBToPayFees": true,
    "useBNBToPayFuturesFees": true,
    "useBNBToPayMarginFees": true
  },
  "tradeOrdersNotificationReminder": {
    "autoBorrowRepayMargin": true,
    "limitOrder": true,
    "marketOrder": true,
    "stopOrder": true
  },
  "transactionNotifications": {
    "futuresNotificationSound": true,
    "futuresTradingNotification": true,
    "spotNotificationSound": true,
    "spotTradingNotification": true
  },
  "withdrawalWhitelist": true
}

```

### Attribute

|Name|Type|Required|Restrictions|Title|Description|
|---|---|---|---|---|---|
|antiPhishingCode|string|false|none||none|
|chartColor|boolean|false|none||none|
|language|string|false|none||none|
|notificationPreference|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.NotificationPreferences](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.notificationpreferences)|false|none||none|
|priceAlerts|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.PriceAlerts](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.pricealerts)|false|none||none|
|timezone|string|false|none||none|
|tradeFeeDeductions|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeFeeDeductions](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradefeedeductions)|false|none||none|
|tradeOrdersNotificationReminder|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TradeOrderNotifications](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.tradeordernotifications)|false|none||none|
|transactionNotifications|[gitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.TransactionNotifications](#schemagitlab_com_limiancetech1_limiance-backend_gateway_internal_core_domain.transactionnotifications)|false|none||none|
|withdrawalWhitelist|boolean|false|none||none|

