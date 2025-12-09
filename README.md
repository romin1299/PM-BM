# Denso - PM BM

## Table of Contents

2. [Installation](#installation)
3. [Usage](#usage)
4. [Contributions](#contributions)
   - [Mihir Patel](#mihir-patel)

## Installation

### Client Installation

To install the client-side dependencies, follow these steps:

1. Ensure that you have Node.js and npm installed on your system. You can download and install them from [here](https://nodejs.org/).

2. Clone the repository to your local machine:

   ```bash
   git clone <repository-url>
   ```

3. Navigate to the `client` directory:

   ```bash
   cd client
   ```

4. Install the dependencies listed in the `package.json` file using npm:

   ```bash
   npm install
   ```

This will install all the necessary packages and dependencies required for the client-side of the project to run successfully.

### Server Installation

To set up the server-side for this project, follow these steps:

1. Ensure that you have Node.js and npm installed on your system. You can download and install them from [here](https://nodejs.org/).

2. Clone the repository to your local machine:

   ```bash
   git clone <repository-url>
   ```

3. Navigate to the `server` directory:

   ```bash
   cd server
   ```

4. Install the dependencies listed in the `package.json` file using npm:

   ```bash
   npm install
   ```

This will install all the necessary packages and dependencies required for the server-side of the project to run successfully.

Important: create directories used for file uploads before running the server so multer can write files:

```bash
mkdir -p server/images server/PMimages server/data_sheets server/data_sheets
```

(Adjust the paths if you run the server from a different working directory.)

### Environment / Configuration

The server expects a MongoDB connection and other configuration via environment variables. Create a `.env` (or otherwise ensure env vars are set) in the `server` directory with at minimum:

- MONGODB_URI (or the DB connection string used by `server/db/conn`)
- COMMON_PASSWORD (default/operator password used for new users)

Optional / mail-related (used by email/send modules referenced by the server):

- SERVER_IP (SMTP host or mail server IP)
- EMAIL_PORT
- FROM_EMAIL (email used as sender)
- EMAIL_FOR_SPARE_REQUEST (recipient / CC for spare requests)

Make sure your process has write permissions for the image and data_sheets folders used by the server.

Replace `<repository-url>` with the URL of this Git repository. This combined installation guide will help users set up both the client and server environments with all the required dependencies specified in their respective `package.json` files.

## Usage

### Running the Client

To run the client-side of the project, follow these steps:

1. Navigate to the `client` directory:

   ```bash
   cd client
   ```

2. Start the development server:

   ```bash
   npm start
   ```

This will start the development server for the client application. You can access the client application in your web browser at `http://localhost:3000`.

### Running the Server

To run the server-side of the project, follow these steps:

1. Navigate to the `server` directory:

   ```bash
   cd server
   ```

2. Start the server. Common options are:

   - Using nodemon (if installed globally or as dev dependency):

     ```bash
     nodemon app
     ```

   - Or using npm script (if defined):

     ```bash
     npm start
     ```

The server will read the configuration/environment variables you set (DB connection, common password, email configuration, etc.). The server includes endpoints that handle file uploads (profile images, PM images, data sheets) and expects the folders listed above to exist.

Note: the server code uses multer to store uploaded files under `./images/`, `./PMimages/`, and `./data_sheets/` relative to the server working directory.

## Contributions

### Mihir Patel

- [Export PPTX](client/src/BM/Utils/ExportPPTX/ExportPPTX.README.md)
- [BM Routing](client/src/Common/CommonRoutes/BM_Routes.README.md)
