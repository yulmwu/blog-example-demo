# API Documentation

This document provides instructions on how to use the APIs for the authentication and posts services.

**Base URLs:**
- Authentication Service: `http://localhost:3001`
- Posts Service: `http://localhost:3002`

---

## Authentication Service (`auth-service`)

Handles user registration, login, logout, and session management.

### 1. Register a new user

- **Endpoint:** `POST /auth/register`
- **Description:** Creates a new user account.
- **Request Body:**
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
- **Success Response:**
  - **Code:** `201 Created`
  - **Body:** `"User registered"`
- **Error Response:**
  - **Code:** `400 Bad Request` (e.g., if username already exists)

### 2. Log in

- **Endpoint:** `POST /auth/login`
- **Description:** Authenticates a user and creates a session. A session cookie (`connect.sid`) is returned upon success, which must be included in subsequent requests to authenticated endpoints.
- **Request Body:**
  ```json
  {
    "username": "testuser",
    "password": "password123"
  }
  ```
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** `"Logged in"`
- **Error Response:**
  - **Code:** `401 Unauthorized` (Invalid credentials)

### 3. Log out

- **Endpoint:** `POST /auth/logout`
- **Description:** Destroys the current user's session.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** `"Logged out"`

### 4. Get current user information

- **Endpoint:** `GET /auth/me`
- **Description:** Retrieves the profile of the currently logged-in user.
- **Authentication:** Requires a valid session cookie.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:**
    ```json
    {
      "_id": "60c72b2f9b1d8c001f8e4d2a",
      "username": "testuser"
    }
    ```
- **Error Response:**
  - **Code:** `401 Unauthorized` (If not authenticated)

---

## Posts Service (`posts-service`)

Manages CRUD operations for posts. Requires authentication for creating, updating, and deleting posts.

### 1. Create a new post

- **Endpoint:** `POST /posts`
- **Description:** Creates a new post. The author ID is automatically taken from the session.
- **Authentication:** Requires a valid session cookie.
- **Request Body:**
  ```json
  {
    "title": "My First Post",
    "content": "This is the content of my first post."
  }
  ```
- **Success Response:**
  - **Code:** `201 Created`
  - **Body:** The created post object.
- **Error Response:**
  - **Code:** `401 Unauthorized`

### 2. Get all posts

- **Endpoint:** `GET /posts`
- **Description:** Retrieves a list of all posts.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** An array of post objects.

### 3. Get a specific post

- **Endpoint:** `GET /posts/:id`
- **Description:** Retrieves a single post by its ID.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** The requested post object.
- **Error Response:**
  - **Code:** `44 Not Found`

### 4. Update a post

- **Endpoint:** `PUT /posts/:id`
- **Description:** Updates an existing post. Only the author of the post can perform this action.
- **Authentication:** Requires a valid session cookie.
- **Request Body:**
  ```json
  {
    "title": "Updated Title",
    "content": "Updated content."
  }
  ```
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** The updated post object.
- **Error Response:**
  - **Code:** `401 Unauthorized` (Not logged in)
  - **Code:** `403 Forbidden` (User is not the author)
  - **Code:** `404 Not Found`

### 5. Delete a post

- **Endpoint:** `DELETE /posts/:id`
- **Description:** Deletes a post. Only the author of the post can perform this action.
- **Authentication:** Requires a valid session cookie.
- **Success Response:**
  - **Code:** `200 OK`
  - **Body:** `"Post deleted"`
- **Error Response:**
  - **Code:** `401 Unauthorized` (Not logged in)
  - **Code:** `403 Forbidden` (User is not the author)
  - **Code:** `404 Not Found`
