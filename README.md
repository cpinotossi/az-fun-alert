# Azure Fun Alert

Demo of how to secure Azure Functions to only be triggered via an Azure Alert.

## Use Case

- We run an Azure Container Instances Service called "funalert-aci".
- Whenever the Azure Container Instances "funalert-aci" goes down and does restart successfully we like to tigger an Azure Alert.
- The Azure Alert does trigger an Azure Function App called "funalert-func".
- The Azure Function App "funalert-func" does something else which is not relavent here.

IMPORTANT
: We like to restrict access to the Azure Function App "funalert-func" only to the Azure Container Instances "funalert-aci".

![Use Case](/images/overview.01.png "Use Case")

We will need to create the following three components inside Azure:

- Azure Container Instances
- ![Azure Container Instances](/images/aci.png "Azure Container Instances")
- Azure Function App
- ![Azure Function App](/images/afa.png "Azure Function App")
- Azure Alert
- ![Azure Alert](/images/alert.png "Azure Alert")

## Azure Function App Authorization & Authentication

To restrict access to our Azure Funcation App "funalert-func" we will use the concept of an Identity Provider, in our case we will make use of Azure Active Directory [AAD].
Therefore we need to turn on Authorization and Authentication at our Azure Function App "funalert-func".

- Go to the Azure Function App overview page.
- Select "Authentication / Authorization".
- Turn on "App Service Authentication".
- Make sure to select "Log in with Azure Active Directory" at "Action to take when request is not authenticated".
- Select "Azure Active Directory" from "Authentication Provider".

![Overview](/images/afa.auth.01.png "Overview")

Inside the "Authentication Provider" dialog:

- Select "Express".
- Let the wizard create an "Azure AD App" or select an existing Azure AD App.
- Select "OK" to confirm your settings.

![Overview](/images/afa.auth.02.png "Overview")

Back on the initial "Authentication / Authorizaton" Screen confirm your settings by clicking on "Save":

![Overview](/images/afa.auth.03.png "Overview")

### "AAD App" & AAD

Next we need to setup the "App Role" inside the new "AAD App". Therefore we need to find our "AAD App":

- Go into the Azure Active Directy View and select "App registration".
- Here you will find your "AAD App", in our case it has been named "funalert-func-app". Click on it to call the detail view of our "AAD App" funalert-func-app:

![Overview](/images/afa.auth.05.png "Overview")

Inside the Detail view of our "AAD App" we will also be able to see the "Object Id" of "funalert-func-app" which is unique inside the AAD Tenant:

![Overview](/images/afa.auth.06.png "Overview")

### Support App Role based access

Inside "AAD App" "funalert-func-app" we can use the concept of an "App Role". "App Role" is something we can assign other "AAD Identities" like User, Group, Service Principal, Managed Identity, Enterprise Applications. In our case we like to assign this to our Azure Container Instance. But first we need to define the "App Role" inside our "AAD App":

- Select the "App Role" from the left hand menue bar inside the "ADD App" view of "funalert-func-app".
- Select "Create app role"

![Overview](/images/afa.auth.07.png "Overview")

- Inside the new Dialog define a name for your App Role ("funalert-func-sp-approle").
- Select which type of AAD member should be able to get assigned this role (AAD Groups, Applications (= ADD App, Service Principal, Managed Identitys)).
- Value, in our case it will not be relevant, so you are free to add whatever you like.
- Give it a nice description.
- Check the box to enable the "App Role".
- Confirm by clicking the "apply" button.

![Overview](/images/afa.auth.08.png "Overview")

We will need the "Id" or our new created "App Role":

- Select "Manifest" from the left hand menue bar.
- Find the "id" of our new "App Role" (Id ="ce2") inside the JSON file.

![Overview](/images/afa.auth.09.png "Overview")

### AAD Enterprise Application

"AAD App" (aka App Registration) does not represent an Service Principal inside an AAD. But to be able to define Access rights we will need to represent our Azure Function App as an Service Principal inside our AAD.
Therefore, during the creation of the "AAD App" "funalert-func-app", AAD created an "Service Principal" of the type "Enterprise Application" with a seperate "Object Id" in parallel. In the next step we need to retrieve the corresponding Object Id of the "Enterprise Application" Service Principal:

- Select "Enterprise Application" from the AAD Menue:

![Overview](/images/afa.auth.10.png "Overview")

- Make sure you select "All Application" in the "Application Type" search filter.
- Press the "Apply" button.
- Type the name of the "AAD App" into the text field. In our case "funalert-func-app".
- Copy the Object Id of the "Enterprise Application" ("51c").

IMPORTANT
: The "Enterprise Applciation" Object Id ("51c") is different to the "AAD App" Object Id ("f38") even if both use the same name "funalert-func-app".

![Overview](/images/afa.auth.11.png "Overview")

Status of our setup:
- "App Role" "funalert-func-sp-approle" (Id "ce2"),
- "Enterprise Application" "funalert-func-app" (Object Id "51c")

![Overview](/images/afa.auth.12.png "Overview")


## Azure Container Instance Managed Identity

The Azure Container Instances [ACI] "funalert-aci" needs also to become visible to our AAD via an "Managed Identity".

- Select "Identity" from inside the ACI "funalert-aci" view.
- Select "On" from Status.
- Click "Save", afterwards you will see the Object Id ("4f9.."). We will need this later on.

![Overview](/images/aci.auth.01.png "Overview")

Out of all the objects we generated so far this are the once which will become relevant for the next step:

- Azure Container "Managed Id" (Object Id = "4f9..")
- AAD App "App Role" (Id = "ce2..")
- AAD Enterprise Application (Object Id = "51c")

![Overview](/images/overview.02.png "Overview")

## Assignment

We need to assign the "App Role" ("ce2..") to our ACI "Managed Id" ("4f9.."). Use the powershell cmdlt "New-AzureADServiceAppRoleAssignment" which is part of the "AzureAD" module.

NOTE
: Follow this instruction to install AzureAD module: https://docs.microsoft.com/en-us/powershell/azure/authenticate-azureps?view=azps-5.1.0

Powershell command:

~~~~pwsh
New-AzureADServiceAppRoleAssignment -ObjectId <ACI Managed Id> -PrincipalId <ACI Managed Id> -Id <App Role> -ResourceId <Enterprise Application>
~~~~

Adding corresponding "Object Id`s" and "Id":

~~~~pwsh
New-AzureADServiceAppRoleAssignment -ObjectId 4f9.. -PrincipalId 4f9.. -Id ce2.. -ResourceId 51c..
~~~~

The output will be a new AAD "Assignment" Object with a new Object Id ("gvS"):

~~~~pwsh
ObjectId  ResourceDisplayName  PrincipalDisplayName
--------  -------------------  --------------------
gvST..    funalert-func-app    funalert-aci
~~~~

In case we like to verify that our Azure Container Instance Managed Id has been assigned to the AAD App "App Role" we can verify this inside the AAD as follow:

- Select "All Application" in the "Application Type" search filter.
- Press "Apply" button.
- Type the name of your Azure Container Instance "Managed Id" into the text field. The Name is equal to the name of your ACI, in our case "funalert-aci".
- Verify the "Object Id" does match with yours ("4f9..").
- Click on the entry.

![Overview](/images/overview.03.png "Overview")

- Select "Permission".
- Click on the "Permission" entry "funalert-func-app".
- "Service Principle" does refer to the "Enterprise Application" "Object Id" ("51c").
- "Perminsion display name" does refer to the "App Role" "funalert-func-sp-approle" ("ce2..").

![Overview](/images/overview.04.png "Overview")

## Setup Alert

I will not go into detail how to setup an Azure alert but I will highlight the two important settings:

- Alert Signal logic
- Alert Action

### Alert Signal logic

In our case we would like to receive an alert whenever the Azure Container Instance has been restarted successfully.

- Selected Status "Succeeded".
- Click "Done".

![Overview](/images/alert.setup.04.png "Overview")

### Alert Action Setup

Use "Action Type" "Secure Webhook", it does support AAD:

- Select the Azure Function App "AAD App" (Object Id = "f38..").
- Enter the Azure Function App URL you like to call. In our case we use ´https://funalert-func.azurewebsites.net/api/httptrigger?name=huhu´.

![Overview](/images/alert.setup.08.png "Overview")

IMPORTANT
: Query Parameter "name=huhu" has been added to indentify the Webhook Request from Azure Alert.

## Test (Showtime)

### Test on my local Machine

We expect to receive an HTTP Response Code 200 OK:

~~~~bash
$ curl "http://localhost:7071/api/HttpTrigger?name=christian" -v
*   Trying 127.0.0.1...
* TCP_NODELAY set
* Connected to localhost (127.0.0.1) port 7071 (#0)
> GET /api/HttpTrigger?name=christian HTTP/1.1
> Host: localhost:7071
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 200 OK
< Date: Fri, 19 Mar 2021 19:02:15 GMT
< Content-Type: text/plain; charset=utf-8
< Server: Kestrel
< Transfer-Encoding: chunked
< Request-Context: appId=
<
{
    "method": "GET",
    "url": "http://localhost:7071/api/HttpTrigger?name=christian",
    "originalUrl": "http://localhost:7071/api/HttpTrigger?name=christian",
    "headers": {
        "accept": "*/*",
        "host": "localhost:7071",
        "user-agent": "curl/7.58.0"
    },
    "query": {
        "name": "christian"
    },
    "params": {}
~~~~

Corresponding local Azure Function App logs:

~~~~bash
2021-03-19T19:01:52.292Z] Worker process started and initialized.
[2021-03-19T19:02:16.081Z] Executing 'Functions.HttpTrigger' (Reason='This function was programmatically called via the host APIs.', Id=fc52a922)
[2021-03-19T19:02:16.129Z] {
[2021-03-19T19:02:16.133Z]     "method": "GET",
[2021-03-19T19:02:16.135Z]     "url": "http://localhost:7071/api/HttpTrigger?name=christian",
[2021-03-19T19:02:16.137Z] JavaScript HTTP trigger function processed a request.
[2021-03-19T19:02:16.138Z]     "originalUrl": "http://localhost:7071/api/HttpTrigger?name=christian",
[2021-03-19T19:02:16.143Z]     "headers": {
[2021-03-19T19:02:16.144Z]         "accept": "*/*",
[2021-03-19T19:02:16.146Z]         "host": "localhost:7071",
[2021-03-19T19:02:16.148Z]         "user-agent": "curl/7.58.0"
[2021-03-19T19:02:16.150Z]     },
[2021-03-19T19:02:16.152Z]     "query": {
[2021-03-19T19:02:16.154Z]         "name": "christian"
[2021-03-19T19:02:16.156Z]     },
[2021-03-19T19:02:16.158Z]     "params": {}
[2021-03-19T19:02:16.160Z] }
[2021-03-19T19:02:16.213Z] Executed 'Functions.HttpTrigger' (Succeeded, Id=fc52a922-, Duration=165ms)
~~~~

### Request direct against Azure Function App

We expect to receive an 401 Unauthorized response code:

~~~~bash
$ curl "https://funalert-func.azurewebsites.net/api/httptrigger" -v
> GET /api/httptrigger HTTP/1.1
> Host: funalert-func.azurewebsites.net
> User-Agent: curl/7.58.0
> Accept: */*
>
< HTTP/1.1 401 Unauthorized
< Content-Length: 58
< Content-Type: text/html
< WWW-Authenticate: Bearer realm="funalert-func.azurewebsites.net" authorization_uri="https://login.windows.net/0ba83d3d-0644-4916-98c0-d513e10dc917/oauth2/authorize" resource_id="bab9d3b0-16ae-450b-aa4a-f2fdba022a56"
< Date: Fri, 19 Mar 2021 14:49:35 GMT
<
~~~~

### Restart Azure Container instance to trigger alert

~~~~pwsh
PS C:\> func azure functionapp publish funalert-func
~~~~

Retrieve logs via Azure ApplicationInsight which has been setup togther with the Azure Function App.

The Kusto query does look for the Query Parameter "name=huhu":

~~~~kusto
traces
| where timestamp > ago(30m) and message == "\"url\": \"https://funalert-func.azurewebsites.net/api/httptrigger?name=huhu\","
~~~~

![Overview](/images/test.01.png "Overview")

You can also make use of the Azure CLI to get the logs:

~~~~pwsh
az monitor app-insights query --apps funalert-func -g funalert-rg --analytics-query 'traces | where timestamp > ago(10m) and message has \"huhu\"'
~~~~

## Watch Out

#### Get Logs via the Azure Function CLI

I have not been able to retrieve the corresponding logs via the Azure Function CLI. Therefore I did end up using ApplicationInsights.

~~~~pwsh
PS :\> func azure functionapp logstream funalert-func
~~~~

## Thanks

This Blog is based on another one written by John Friesen:

https://dev.to/superjohn140/azure-alerts-secure-webhook-azure-functions-with-authentication-364

## Usefull links

Automation with powershell:

https://docs.microsoft.com/en-us/azure/azure-monitor/alerts/action-groups#secure-webhook-powershell-script