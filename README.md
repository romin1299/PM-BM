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

Replace `<repository-url>` with the URL of this Git repository. This combined installation guide will help users set up both the client and server environments with all the required dependencies specified in their respective `package.json` files.

For the `Usage` section in your README.md file, you can provide instructions on how to run the client and server applications. Here's how you can structure it:

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

2. Start the server:

   ```bash
   nodemon app
   ```

This will start the server application. It will listen for incoming requests on the specified `port 9099` .

## Contributions

### Mihir Patel

- [Export PPTX](client/src/BM/Utils/ExportPPTX/ExportPPTX.README.md)
- [BM Routing](client/src/Common/CommonRoutes/BM_Routes.README.md)
