# MSA Bulletin Board Project

This is a bulletin board project based on a Microservice Architecture (MSA).

## Overview

- **Authentication Service (`auth-service`):** Handles user registration, login, and session management.
- **Posts Service (`posts-service`):** Manages the CRUD operations for posts.

## Tech Stack

- **Framework:** Node.js, Express.js
- **Database:** MongoDB
- **Session Store:** Redis
- **Authentication:** Session-based authentication
- **Environment:** Docker Compose for MongoDB and Redis

## Getting Started

### Prerequisites

- Node.js
- Docker
- Docker Compose

### Installation & Setup

1.  **Start Databases:**
    Launch MongoDB and Redis containers using Docker Compose.
    ```bash
    docker-compose up -d
    ```

2.  **Install Dependencies for Each Service:**
    Navigate to each service directory and install the required npm packages.
    ```bash
    cd auth-service
    npm install
    ```
    ```bash
    cd ../posts-service
    npm install
    ```

### Running the Services

1.  **Start the Authentication Service:**
    ```bash
    cd auth-service
    node server.js
    ```
    The service will be running on `http://localhost:3001`.

2.  **Start the Posts Service:**
    ```bash
    cd posts-service
    node server.js
    ```
    The service will be running on `http://localhost:3002`.