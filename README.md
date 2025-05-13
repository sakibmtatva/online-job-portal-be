---

# Project API Documentation

## Authentication

### User Registration
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "User registered successfully",
    "user": {
      "email": "user@example.com",
      "name": "John Doe"
    }
  }
  ```

---

### User Login

- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "User logged in successfully",
    "token": "jwt-token-here"
  }
  ```

---

## Job Endpoints

### Fetch All Jobs

- **Method**: `GET`
- **URL**: `/api/jobs`
- **Request Parameters**:
  - `page`: Page number (optional)
  - `limit`: Limit of results per page (optional)
  - `jobTitle`: Filter by job title (optional)
- **Response Body**:
  ```json
  {
    "message": "Jobs fetched successfully",
    "data": [
      {
        "jobId": "1",
        "jobTitle": "Software Engineer",
        "location": "New York",
        "salary": 80000
      },
      {
        "jobId": "2",
        "jobTitle": "Product Manager",
        "location": "San Francisco",
        "salary": 90000
      }
    ],
    "pagination": {
      "total": 100,
      "page": 1,
      "limit": 10,
      "totalPages": 10
    }
  }
  ```

---

### Create Job

- **Method**: `POST`
- **URL**: `/api/jobs`
- **Request Body**:
  ```json
  {
    "jobTitle": "Backend Developer",
    "location": "Berlin",
    "salary": 85000,
    "description": "Backend development responsibilities"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Job created successfully",
    "job": {
      "jobId": "3",
      "jobTitle": "Backend Developer",
      "location": "Berlin",
      "salary": 85000
    }
  }
  ```

---

## Job Bookmarking

### Bookmark Job

- **Method**: `POST`
- **URL**: `/api/job/bookmark`
- **Request Body**:
  ```json
  {
    "jobId": "3"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Job bookmarked successfully",
    "bookmarkId": "5"
  }
  ```

---

### Remove Job Bookmark

- **Method**: `DELETE`
- **URL**: `/api/job/bookmark/{bookmarkId}`
- **Response Body**:
  ```json
  {
    "message": "Bookmark removed successfully"
  }
  ```

---

## User Profile

### Get User Profile

- **Method**: `GET`
- **URL**: `/api/user/profile`
- **Response Body**:
  ```json
  {
    "message": "User profile fetched successfully",
    "data": {
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01"
    }
  }
  ```

---

### Update User Profile

- **Method**: `PUT`
- **URL**: `/api/user/profile`
- **Request Body**:
  ```json
  {
    "name": "John Updated"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "User profile updated successfully",
    "data": {
      "email": "user@example.com",
      "name": "John Updated",
      "createdAt": "2025-01-01"
    }
  }
  ```

---

## Skills

### Get All Skills

- **Method**: `GET`
- **URL**: `/api/skills`
- **Response Body**:
  ```json
  {
    "message": "Skills fetched successfully",
    "data": [
      { "id": "1", "name": "JavaScript" },
      { "id": "2", "name": "Node.js" }
    ]
  }
  ```

---

## Job Categories

### Create Job Category

- **Method**: `POST`
- **URL**: `/api/job-categories`
- **Request Body**:
  ```json
  {
    "name": "Software"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "Category added successfully",
    "category": {
      "id": "1",
      "name": "Software"
    }
  }
  ```

---

### Get Job Categories

- **Method**: `GET`
- **URL**: `/api/job-categories`
- **Response Body**:
  ```json
  {
    "message": "Categories fetched successfully",
    "data": [
      { "id": "1", "name": "Software" },
      { "id": "2", "name": "Marketing" }
    ]
  }
  ```

---

## Cities

### Get All Cities

- **Method**: `GET`
- **URL**: `/api/cities`
- **Response Body**:
  ```json
  {
    "message": "Cities fetched successfully",
    "data": [
      { "id": "1", "name": "New York" },
      { "id": "2", "name": "San Francisco" }
    ]
  }
  ```

---

## OTP Verification

### Verify OTP

- **Method**: `POST`
- **URL**: `/api/auth/verify-otp`
- **Request Body**:
  ```json
  {
    "email": "user@example.com",
    "otp": "123456"
  }
  ```
- **Response Body**:
  ```json
  {
    "message": "OTP verified successfully"
  }
  ```

---

## User Management

### Get All Users

- **Method**: `GET`
- **URL**: `/api/users`
- **Response Body**:
  ```json
  {
    "message": "Users fetched successfully",
    "data": [
      {
        "id": "1",
        "email": "user@example.com",
        "name": "John Doe",
        "createdAt": "2025-01-01"
      },
      {
        "id": "2",
        "email": "admin@example.com",
        "name": "Admin User",
        "createdAt": "2025-01-01"
      }
    ]
  }
  ```

---

### Get User by ID

- **Method**: `GET`
- **URL**: `/api/users/{id}`
- **Response Body**:
  ```json
  {
    "message": "User details fetched successfully",
    "data": {
      "id": "1",
      "email": "user@example.com",
      "name": "John Doe",
      "createdAt": "2025-01-01"
    }
  }
  ```

---

This is a single markdown file containing all the necessary information about the API endpoints, their request bodies, response bodies, and methods.

You can save this file as `README.md` or any name you prefer for documentation purposes. Let me know if you need anything else!
