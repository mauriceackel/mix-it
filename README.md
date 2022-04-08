# web-app-boilerplate

This boilerplate contains everything and a bit beyond what you need to get started with a Firebase-Powered React web app. 

## Structure
### Firebase
The firebase folder holds everything related to the firebase project

### Frontend
The frontend folder contains the web app's source code

### CMS
The cms folder consists of a project that includes `firecms`, a standalone CMS system for firebase. It gets deployed to firebase hosting for easy content management.

## Setup
It is advised to first perform all the relevant steps in the "External Setup" section before processing with the instructions in this category.

### Templating
This project boilerplate supports a custom templating mechanism. To use this to scaffold a new project, install the cli tool via npm: `npm i -g @option26/scaffold`.
Afterwards, run `scaffold [source] [target]`. Where source could either be the location of this template in your file system or alternatively the git URL.

### Project setup
After you initialized the template, you can run some CLI commands in order to link everything up:
1. Install dependencies
   1. Run `npm i` inside all top-level folders
   2. Run `npm i` inside the `firebase/functions` folder
2. Init firebase CLI
   1. Navigate to the `firebase` folder
   2. Run `npx firebase login` and follow the instructions
   3. Run `npx firebase use staging` if you enabled staging during project scaffolding or `npx firebase use production` otherwise
3. Prepare your first firebase deployment
   1. After you set up all the firebase config and developed your functions, you want to deploy your project to firebase
   2. The deployment is pretty straight forward except for the firebase functions config
   3. Before you trigger your deploy. Make sure the files `firebase/functions/.env.production` and `firebase/functions/.env.staging` exist. Those files contain the firebase functions config values you are about to deploy.
   4. Make sure to set your respective firebase function environment variables in this file.
   5. IMPORTANT: You can only use the values you specify inside your firebase function handler (i.e. not for something like the firebase function region as this is parsed at deploy time)
   6. Afterwards, you can deploy the whole project via `npx firebase deploy`

### Git setup
To set up git for the scaffolded project:
1. Setup an empty github project and note the project URL (i.e. `https://github.com/option26/<projectId>.git`) 
2. Run `git init -b main` inside the project root folder
3. Add the github project as remove: `git remote add origin https://github.com/option26/<projectId>.git`
4. Perform the initial commit
   1. Run `git add .`
   2. Run `git commit -m "Initial commit"`
   3. Run `git push`

## External Setup

### Firebase
In order to use firebase with this project, you have to create a new firebase project. It is advised to create two projects, one for production and one for staging.

The steps below give an idea about the necessary steps to setup the firebase project:
1. Go to the firebase console and create a new project
   1. Enter a project id. **BE AWARE** Firebase often adds a random suffix if the name is too short or not unique. In this case, try to add a custom suffix like '-production' or '-staging'
   2. Enable google analytics if desired
2. Finalize project setup
   1. Navigate to the project settings
   2. Update the display name of the project
   3. Change the project support email to team@option26.org (you need to be the google group administrator for this)
3. Add team members
   1. Navigate to the project settings
   2. In the "users and permission" tab, add all required team members with an appropriate role
4. Add a web app
   1. Navigate to the project settings
   2. In the "general" tab, scroll down and add a new web app
   3. Enter a custom name (recommendation: "<DisplayName> Web")
   4. If you want to use firebase hosting, select the checkbox to enable firebase hosting
      1. Enter "<firebaseProjectId>" as site id
   5. Once the app is added, copy the firebase config. You will need this later for the project setup.
5. Add a CMS web app
   1. Follow the same procedure as in the last step
   2. Make sure to enable firebase hosting again but this time, use "<firebaseProjectId>-cms" as site id
6. Add CMS authentication providers
   1. If you enabled CMS for this project you need to enable the google auth provider
   2. Navigate to the "Authentication" page from the side menu.
   3. Go to the "sign-in method" tab
   4. Select the google auth provider
   5. Enter the project display name
   6. Set the support email to team@option26.org (you need to be the google group administrator for this)
7. Add additional auth providers
   1. In the authentication section add all the auth providers you want to enable for your project
   2. It is advised to use Single Sign On providers in order to keep the development effort simple

### Apple (iOS)

First, we will need to create an App ID for the new application
1. Sign in to `developer.apple.com`
2. Navigate to `Certificates, Identifiers & Profiles`
3. Navigate to `Identifiers`
4. Click the add button
5. From the list select `App IDs`
6. Click on continue
7. Select `App` as type
8. Click on continue
9. Enter a description (Use the display name for this)
10. Select `Explicit App ID`
11. Enter the app id in the format `org.option26.<projectId>`
12. In the `Capabilites` section, select
    - Associated Domains
    - Push Notification
    - SignIn with Apple
13. Click on continue
14. You have successfully created an App ID

Now, we need to generate a key, so that Firebase can send push notifications
1. Sign in to `developer.apple.com`
2. Navigate to `Certificates, Identifiers & Profiles`
3. Navigate to `Keys`
4. Click the add button
5. Enter key name (use display name for this)
6. Select APNs
7. Click on continue
8. Confirm by clicking on register
9. You have now created the push notification key
10. On the following page, select to download the key and make sure to save it in a secure location (You will not be able to download the key again!)

Finally, you have to configure SignIn with Apple
1. Sign in to `developer.apple.com`
2. Navigate to `Certificates, Identifiers & Profiles`
3. Navigate to `More`
4. Select configure for `Sign in with Apple for Email Communication`
5. Click on the add button
6. In the text field `Domains and Subdomains`, enter `<projectId>.firebaseapp.com`
7. In the text field `Email Addresses`, enter `noreply@aid-mate.firebaseapp.com`
8. Click on continue and confirm
9. You now have added email support for SignIn with Apple

Next up, you have to configure an iOS native application in the firebase console.
1. Open your project in the firebase console
2. Add a new iOS app
3. Enter the App ID and a description (leave AppStore ID clear for now)
4. Click on continue.
5. Download the `.plist` configuration file
6. Place the file inside the `frontend/ios/App` folder

Now, we can configure push notifications.
1. Open the project settings
2. Navigate to `Cloud Messaging`
3. Select the created native app
4. Click on `Upload` in the `APNs Authentication Key` section
5. Select the key file you have downloaded previously
6. Enter the Key ID (you can find it on the page you have created the key on)
7. Enter the Team ID (you can find it in brackets below your username in the developer apple portal)

Finally, we can setup SignIn with Apple
1. Open the authentication settings of your firebase project
2. Navigate to `SignIn Method`
3. Click on `Add new provider` and select `Apple` from the list
4. Toggle the switch to enable the provider and click on `Save`

### Google (android)

First, we will need to create an app in the Google Play Console
1. Open the Google Play Console `https://play.google.com/console`
2. Click on `Create App`
3. Enter the app display name and fill in the rest of the information
4. You have successfully created the app

Next, we need to create a signing key for the application
1. Open android studio by running `npm run android`
2. From the menu bar, select `Build > Generate Signed Bundle/APK`
3. In the dialog, select `Android App Bundle` and continue
4. In the next dialog, select `Create new...` below the `keystore path` input field
   1. Select a path for your keystore. This should not be inside the source control. As name, use `<projectId>.jks`
   2. Choose a secure password for the keystore
   3. Enter an alias for the upload key in the form `<projectId>-upload`
   4. Choose a secure password for the keystore
   5. Enter `Option 26 e.V.` as Organization
   6. Enter `Mosbach` as City
   7. Enter `Baden-Wuertemberg` as State
   8. Enter `DE` as Country Code
   9. Leave the other fields empty
   10. Click on `OK`
5. Click on `Next`
6. Select `release` in the next dialog
7. Click on `Finish`
