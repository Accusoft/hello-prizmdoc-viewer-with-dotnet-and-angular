# Hello PrizmDoc Viewer with .NET and Angular

A small ASP.NET Core and Angular application, based on the official .NET Core
Angular template (`dotnet new angular`), which shows how to use PrizmDoc Viewer
in an Angular context.

More specifically, this sample includes a special `prizmdoc-viewer-wrapper` component which encapsulates the work of injecting the non-Angular PrizmDoc Viewer into an Angular application.

- The component itself can be found in `MyWebApplication/ClientApp/src/app/prizmdoc-viewer-wrapper`
- An example usage can be found in `MyWebApplication/ClientApp/src/app/document-detail`

The `prizmdoc-viewer-wrapper` component is designed for you to easily customize and copy into an existing Angular application.

## Pre-Requisites

### For the Command Line

- [.NET Core SDK 3.1](https://dotnet.microsoft.com/download/dotnet-core/3.1)

### For Visual Studio

- [Visual Studio 2019](https://visualstudio.microsoft.com/downloads/)

### For Visual Studio Code

- [.NET Core SDK 3.1](https://dotnet.microsoft.com/download/dotnet-core/3.1)
- [Visual Studio Code](https://code.visualstudio.com/download)
- [C# for Visual Studio Code extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.csharp) (if you don't have this extension installed, running the sample will fail with an error dialog that says "Configured type 'coreclr' is not supported.")

### General

- [Node.js and npm](https://nodejs.org/) are required to build the Angular client app.

## Setup

### Configure the Application to Connect to PAS

Configure how to connect to PAS (PrizmDoc Application Services) by editing `MyWebApplication/appsettings.json` (or via any of the other ways that ASP.NET Core allows you to provide configuration).

#### Use PrizmDoc Cloud (Easiest)

If you're just getting started, the easiest thing to do is to use [PrizmDoc Cloud](https://cloud.accusoft.com). We host PAS for you and all you need is your [PrizmDoc Cloud](https://cloud.accusoft.com) API key. If you don't have an API key, you can get one for free at https://cloud.accusoft.com.

For [PrizmDoc Cloud](https://cloud.accusoft.com), your `appsettings.json` will need to contain a section like this:

```json
  "PrizmDoc": {
    "PasBaseUrl": "https://api.accusoft.com/prizmdoc/",
    "CloudApiKey": "YOUR_API_KEY"
  }
```

Where `YOUR_API_KEY` is your [PrizmDoc Cloud](https://cloud.accusoft.com) API key.

> Note: If you'd rather not store your API key within `appsettings.json`, the `MyWebApplication` project has been pre-configured for use with the `dotnet user-secrets` command-line tool. You can use this tool to configure a `"PrizmDoc:CloudApiKey"` value for just your dev machine like so:

```
dotnet user-secrets set "PrizmDoc:CloudApiKey" "YOUR_API_KEY" --project MyWebApplication
```

#### Host PAS Yourself (Advanced)

If you are self-hosting your own PAS instance, your `appsettings.json` will be configured slightly differently:

```json
  "PrizmDoc": {
    "PasBaseUrl": "YOUR_PAS_BASE_URL",
    "PasSecretKey": "YOUR_PAS_SECRET_KEY"
  }
```

The `PasBaseUrl` should be the base URL for requests to your PAS instance (like `"http://localhost:3000/"`).

The `PasSecretKey` must match the `secretKey` value specified in your PAS config file.

> Note: If you'd rather not store your secret key within `appsettings.json`, the `MyWebApplication` project has been pre-configured for use with the `dotnet user-secrets` command-line tool. You can use this tool to configure a `"PrizmDoc:PasSecretKey"` value for just your dev machine like so:

```
dotnet user-secrets set "PrizmDoc:PasSecretKey" "YOUR_PAS_SECRET_KEY" --project MyWebApplication
```

## Running the Sample

To start the application from the command line:

```
dotnet run --project MyWebApplication
```

This will:

- Launch a small web application on `https://localhost:5001` (and on
  `http://localhost:5000`, which simply redirects to the https port).
- Launch an Angular CLI server for the Angular application, and proxy
  appropriate traffic to it (if you would prefer to launch the Angular CLI
  server manually during development, you can adjust `Startup.cs`; see the
  comments at the end of the `Startup.cs` file).

If you have configured your connection to PAS correctly, you should see output like this:

```
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
info: Microsoft.Hosting.Lifetime[0]
      Content root path: ...\hello-prizmdoc-viewer-with-dotnet-and-angular\MyWebApplication
```

When you visit `http://localhost:5000` or `https://localhost:5001` (after
dismissing any browser warnings about an unrecognized security certificate), you
should see a home page with a list of example documents. Click on a document
name to navigate to another page which displays the document using PrizmDoc
Viewer.
