# Authentication API

## `POST /auth/login`

로그인 요청을 처리하는 엔드포인트입니다. Body에 username과 password를 포함해야 합니다.

```json
{
    "username": "your_username",
    "password": "your_password"
}
```

성공 시 200 OK 응답과 함께 JWT 엑세스 토큰과 아이디 토큰을 반환하며, 응답 헤더에 `Set-Cookie`를 통해 JWT 리프레시 토큰을 포함합니다.

```json
{
    "accessToken": "...",
    "idToken": "..."
}
```

```
Set-Cookie: refreshToken=...; HttpOnly; Secure; SameSite=None
```

다음과 같은 에러가 발생할 수 있습니다:

-   `400 Bad Request: ERR_LOGIN_INVALID_CREDENTIALS`: 잘못된 아이디 또는 비밀번호입니다.
-   `400 Bad Request: ERR_LOGIN_USER_NOT_CONFIRMED`: 계정을 생성 후 이메일 인증을 완료하지 않았습니다.
-   `400 Bad Request: ERR_LOGIN_PASSWORD_RESET_REQUIRED`: 비밀번호 재설정이 필요합니다.
-   `400 Bad Request: ERR_LOGIN_USER_NOT_FOUND`: 해당 아이디를 가진 사용자가 없습니다.

## `POST /auth/signup`

회원가입 요청을 처리하는 엔드포인트입니다. Body에 username, password, email을 포함해야 합니다.

```json
{
    "username": "your_username",
    "password": "your_password",
    "email": "your_email"
}
```

성공 시 200 OK 응답과 함께 가입 정보에 기입된 이메일로 인증 메일이 발송됩니다.

다음과 같은 에러가 발생할 수 있습니다:

-   `400 Bad Request: ERR_SIGNUP_USERNAME_EXISTS`: 이미 사용 중인 아이디입니다.
-   `400 Bad Request: ERR_SIGNUP_INVALID_PASSWORD`: 비밀번호 조건을 만족하지 않습니다.
-   `400 Bad Request: ERR_SIGNUP_INVALID_PARAMETER`: 잘못된 요청 파라미터입니다.
-   `400 Bad Request: ERR_SIGNUP_LIMIT_EXCEEDED`: 회원가입 요청이 너무 많습니다.

## `POST /auth/confirmEmail`

이메일 인증 요청을 처리하는 엔드포인트입니다. Body에 username과 code를 포함해야 합니다. code는 이메일로 발송된 인증 코드를 입력해야 합니다.

```json
{
    "username": "your_username",
    "code": "000000"
}
```

성공 시 200 OK 응답과 함께 인증이 완료되었다는 메시지를 반환합니다.

다음과 같은 에러가 발생할 수 있습니다:

-   `400 Bad Request: ERR_CONFIRM_EMAIL_CODE_MISMATCH`: 잘못된 인증 코드입니다.
-   `400 Bad Request: ERR_CONFIRM_EMAIL_EXPIRED_CODE`: 인증 코드가 만료되었습니다.
-   `400 Bad Request: ERR_CONFIRM_EMAIL_USER_NOT_FOUND`: 해당 아이디를 가진 사용자가 없습니다.
-   `400 Bad Request: ERR_CONFIRM_EMAIL_ALREADY_CONFIRMED`: 이미 인증된 계정입니다.
-   `400 Bad Request: ERR_CONFIRM_EMAIL_TOO_MANY_ATTEMPTS`: 인증 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.

## `POST /auth/resendEmail`

회원가입 시 이메일 인증을 다시 요청하는 엔드포인트입니다. Body에 username을 포함해야 합니다.

```json
{
    "username": "your_username"
}
```

성공 시 200 OK 응답과 함께 인증 코드가 포함된 이메일이 다시 발송됩니다.

다음과 같은 에러가 발생할 수 있습니다:

-   `400 Bad Request: ERR_RESEND_EMAIL_USER_NOT_FOUND`: 해당 아이디를 가진 사용자가 없습니다.
-   `400 Bad Request: ERR_RESEND_EMAIL_INVALID_PARAMETER`: 잘못된 요청 파라미터입니다.
-   `400 Bad Request: ERR_RESEND_EMAIL_LIMIT_EXCEEDED`: 인증 요청이 너무 많습니다.
-   `400 Bad Request: ERR_RESEND_EMAIL_ALREADY_CONFIRMED`: 이미 인증된 계정입니다.

## `POST /auth/logout`

로그아웃 요청을 처리하는 엔드포인트입니다. Authorization 헤더에 JWT Bearer 토큰을 포함해야 합니다.

성공 시 200 OK 응답과 함께 쿠키를 통해 리프레시 토큰을 삭제합니다.

다음과 같은 에러가 발생할 수 있습니다:
-   `401 Unauthorized: ERR_LOGOUT_UNAUTHORIZED`: 인증되지 않은 요청입니다.

## `POST /auth/refresh`

JWT 리프레시 토큰을 사용하여 새로운 엑세스 토큰과 아이디 토큰을 발급받는 엔드포인트입니다. 요청 헤더에 `Cookie`를 통해 리프레시 토큰을 포함해야 합니다. (`refreshToken`=...)

다음과 같은 에러가 발생할 수 있습니다:
-   `401 Unauthorized: ERR_REFRESH_UNAUTHORIZED`: 인증되지 않은 요청입니다.
-   `401 Unauthorized: ERR_REFRESH_INVALID_TOKEN`: 잘못된 리프레시 토큰입니다.
-   `401 Unauthorized: ERR_REFRESH_INVALID_PARAMETER`: 잘못된 요청 파라미터입니다.
-   `401 Unauthorized: ERR_REFRESH_USER_NOT_FOUND`: 해당 리프레시 토큰을 가진 사용자가 없습니다.

# Post CRUD API

## `GET /posts`

모든 게시글을 조회하는 엔드포인트입니다. 인증이 필요하지 않습니다.
성공 시 200 OK 응답과 함께 게시글 목록을 반환합니다.

```json
[
    {
        "userName": "...",
        "content": "...",
        "createdAt": "...",
        "id": "...",
        "userId": "...",
        "title": "..."
    },
    ...
]
```


## `GET /posts/{postId}`

특정 게시글을 조회하는 엔드포인트입니다. `postId`는 게시글의 고유 ID입니다. 인증이 필요하지 않습니다.

성공 시 200 OK 응답과 함께 게시글 정보를 반환합니다.

```json
{
    "userName": "...",
    "content": "...",
    "createdAt": "...",
    "id": "...",
    "userId": "...",
    "title": "..."
}
```

다음과 같은 에러가 발생할 수 있습니다:
-   `400 Bad Request: ERR_GET_POST_BAD_REQUEST_MISSING_ID`: 
    요청 파라미터에 게시글 ID가 없습니다.
-   `404 Not Found: ERR_GET_POST_NOT_FOUND`: 해당 ID를 가진 게시글이 없습니다.

## `POST /posts`

새로운 게시글을 작성하는 엔드포인트입니다. 요청 헤더에 JWT Bearer 토큰을 포함해야 하며, Body에 게시글 정보를 포함해야 합니다.

```json
{
    "title": "게시글 제목",
    "content": "게시글 내용"
}
```

성공 시 201 Created 응답과 함께 작성된 게시글 정보를 반환합니다.
(`GET /posts/{postId}`와 동일한 응답 형식)

다음과 같은 에러가 발생할 수 있습니다:
-   `400 Bad Request: ERR_CREATE_POST_BAD_REQUEST`: 요청 파라미터가 잘못되었습니다.
-   `401 Unauthorized: ERR_CREATE_POST_UNAUTHORIZED`: 인증되지 않은 요청입니다.

## `PUT /posts/{postId}`

게시글을 수정하는 엔드포인트입니다. `postId`는 수정할 게시글의 고유 ID이며, 요청 헤더에 JWT Bearer 토큰을 포함해야 합니다. Body에 수정할 게시글 정보를 포함해야 합니다.

```json
{
    "title": "수정된 게시글 제목",
    "content": "수정된 게시글 내용"
}
```

성공 시 200 OK 응답과 함께 수정된 게시글 정보를 반환합니다.
(`GET /posts/{postId}`와 동일한 응답 형식)

다음과 같은 에러가 발생할 수 있습니다:
-   `400 Bad Request: ERR_UPDATE_POST_BAD_REQUEST`: 요청 파라미터가 잘못되었습니다.
-   `400 Bad Request: ERR_UPDATE_POST_BAD_REQUEST_MISSING_ID`:
    요청 파라미터에 게시글 ID가 없습니다.
-   `401 Unauthorized: ERR_UPDATE_POST_UNAUTHORIZED`: 인증되지 않은 요청입니다.
-   `403 Forbidden: ERR_UPDATE_POST_FORBIDDEN`: 해당 게시글을 수정할 권한이 없습니다.
-   `404 Not Found: ERR_UPDATE_POST_NOT_FOUND`: 해당 ID를 가진 게시글이 없습니다.

## `DELETE /posts/{postId}`

게시글을 삭제하는 엔드포인트입니다. `postId`는 삭제할 게시글의 고유 ID이며, 요청 헤더에 JWT Bearer 토큰을 포함해야 합니다.

성공 시 200 OK 응답을 반환합니다.

다음과 같은 에러가 발생할 수 있습니다:
-   `400 Bad Request: ERR_DELETE_POST_BAD_REQUEST_MISSING_ID`:
    요청 파라미터에 게시글 ID가 없습니다.
-   `401 Unauthorized: ERR_DELETE_POST_UNAUTHORIZED`: 인증되지 않은 요청입니다.
-   `403 Forbidden: ERR_DELETE_POST_FORBIDDEN`: 해당 게시글을 삭제할 권한이 없습니다.
-   `404 Not Found: ERR_DELETE_POST_NOT_FOUND`: 해당 ID를 가진 게시글이 없습니다.

# User CRUD API

## `GET /myinfo`

현재 사용자 정보를 조회하는 엔드포인트입니다. 요청 헤더에 JWT Bearer 토큰을 포함해야 합니다.
성공 시 200 OK 응답과 함께 사용자 정보를 반환합니다.

```json
{
    "username": "..",
    "email": "..",
    "email_verified": "..",
    "sub": "..."
}
```

다음과 같은 에러가 발생할 수 있습니다:
-   `401 Unauthorized: ERR_GET_USER_NO_AUTH_HEADER`: Authorization 헤더가 없습니다.
-   `401 Unauthorized: ERR_GET_USER_UNAUTHORIZED`: 인증되지 않은 요청입니다.
