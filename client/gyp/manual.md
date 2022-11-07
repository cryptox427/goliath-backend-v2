# Proteus TLS

## 1 Introduction

### 1.1 About

The proteusTLS client is a high configurable HTTP(S) client with bindings for multiple programming languages.
The name is derived from the ancient greek god "Proteus" known for being "versatile", "mutable", or "capable of assuming many forms".
This also applies to this client since its main raison d'être is the need of many developers to create highly efficient http requesting applications that need to mimic modern web browsers.

### 1.2 Features

**General Features:**

- windows, macos and linux support
- very efficient, useable for high scale services
- direct implementation, no sockets or apis used
- flate(defalte), brotli(br) and gzip(gzip) content encoding
- authenticated and non authenticated proxies in http: //user:password@ip:port format
- accepts form and json data
- includes custom made RFC8879 tls certificate compression (required for cloudflare)
- doesn't use GPL licensed packages
- request canceling, timeouts, automatic redirects(if wanted)

**Mimicking features:**

- HTTP 1.1 and HTTP 2 support
- highly configurable headers
  - supports custom header order for both HTTP 1.1 and HTTP 2
  - custom pseudo header order
- highly configurable tls settings
  - pre-configured tls settings from several common browsers
  - custom tls settings in JA3 format
  - custom tls client hello can be set as raw bytes
  - ssl certificate pinning
  - ssl key logging
  - ssl certificate checking can be turned off for testing
- highly configurable HTTP2 implementation
  - ordered configuration of the settings frame
  - custom window size increment
  - custom priority frame settings (soon)

**Node.js exclusive features:**

- support for tough-cookie jars
- comes with simplified cookie jar, that doesn't care about different domains
- familiar usage as the now deprecated request and request-promise package
- faster then the popular npm package got
- custom built binding for highest efficiency using up to 1024 threads

**Possible fields of use:**

- Cloudflare
- Akamai
- Footsites
- Yeezysupply
- Off-White

### 1.3 License

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

Furthermore:
Buying this software DOES grant you the following rights:

- use it in its distributed form in private projects
- use it in its distributed form for evaluation and development
- use it in its distributed form to build end user applications
- make adjustments to the javascript source files (client.js, headers.js, middleware.js)

Buying this software DOES NOT grant you the following rights:

- decompile or reverse engineer it in any way
- distributing it or any altered version of it as well as reverse engineered portions of it
- use it for projects that you don't own
- using information gained by reading the source code outside your own projects or distributing this information to others
- using this project to create products that are meant to replace this library

If you have this software and didn't pay for it please leave me a message:
Discord: @franz#0666

## 2 Usage 

### 2.1 Node.js

For node.js there is an pre-made library that makes accessing the client way easier. It's only npm dependency is tough-cookie.

```js
const Client = require("./proteusTLS/client.js")

async function main(){
  let client = new Client()

  await client.init({
    type:"preset",
    preset:"chrome83"
  })

  let res = await client.request({
    url:"https://ja3er.com/json"
  });

  console.log(res)
}

main();
```
**IMPORTANT:** It's recommended to set the environment variable *UV_THREADPOOL_SIZE* to a high value (the maximum is 1024) in order to allow fast synchronized operation

for testing around on windows you can simply use the following command

```bat
set UV_THREADPOOL_SIZE=1024 && myamazingtestingscript.js 
```

if using electron is necessary to set this before the start of the app otherwise you can simply do

```
process.env["UV_THREADPOOL_SIZE"] = 1024;
```

For more information see: [libuv documentation](http://docs.libuv.org/en/v1.x/threadpool.html)

### 2.2 Other languages

Please see the examples in the folders

## 3 Working principle

The supplied dynamic linked libraries include the actual http client. Upon loading they give access to an **initClient** as well to a **request** method. Both take a \*char that points to the string that is a serialized JSON configuration. After execution they return a different \*char pointing to a deserialized JSON response object. 
This way we can pass configurations and responses of functions very easily and not care about version specific differences in function parameters and returns.

The following description does not include the additional features implemented for the node.js library. These additional configurations are listed below in 3.3 and 3.4.

### 3.1 initClient

This function initializes a new client based on an given id, if the id already exists the old client is replaced by the new one. The json thats passed into the function looks like that:

```json
{
  "id":"b869a59f-0d27-4eb8-b1df-cf300797439c",
  "type":"customJa3",
  "ja3:":"772,4865-4866-4867-49195-49199-49196-49200-52393-52392-49171-49172-156-157-47-53,0-23-65281-10-11-35-16-5-13-18-51-45-43-27-21,29-23-24,0",
  "HTTP2Config":{
    "http2Settings":[
        {"ID":"HEADER_TABLE_SIZE", "Value":1}
    ],
    "windowSizeIncrement": 1073741824
  },
  "sslKeyLogFile":"C:/Users/Customer/sslkeylog.log"
}
```

the client would then just return

```json
{
  "Success":true
}
```

Parameters are:

- *string* "id" (required) - the id that's used to access the client
- *string* "type" (required) - The type of the client. different types:
  - "customJa3"
    - creates a client with an tls configuration based on a ja3 fingerprint
    - parameters:
      - *string* "ja3" (required) - the wanted ja3 fingerprint 
  - "customBytes"
    - creates a client with an tls configuration based on a captured client hello as an byte array
    - parameters
      - *byte\[\]* "clientHello" (required) an array of bytes representing the clientHello message
  - "preset"
    - creates an tls client based on a pre-set tls configuration included with the client
    - parameters
      - *string* "preset" (required) - the wanted preset, included presets:
        - "chrome62"
        - "chrome70"
        - "chrome72"
        - "chrome83"
        - "firefox55"
        - "firefox56"
        - "firefox63"
        - "firefox65"
        - "ios111"
        - "ios121"
        - "golang"
- *string* "proxy" (optional) - a http proxy that will be used to execute the request format http://user:pass@ip:port
- *bool* "followRedirects" (optional; default: true) - if set true the client will follow requests indicated by an 3XX status code
- *int* "timeout" (optional) - timeout for the requests in ms
- *string* "sslKeyLogFile" (optional) - a optional sslKeyLog file e.g. for debugging with wireshark (DON'T USE IN PRODUCTION)
- *HTTP2Config* "http2Config" (optional) - optionally configuring the htt2 settings used for the requests
  - *http2Setting\[\]* "http2Settings" (optional) - setting the entries of the http2 settings frame
    - entries:
      - defined as { *string* "ID" (required), *int* "Value" (required)}
      - *string* "ID" (required) - the name of the http2 settings. list of allowed names:
        - "HEADER_TABLE_SIZE"
        - "ENABLE_PUSH"
        - "MAX_CONCURRENT_STREAMS"
        - "INITIAL_WINDOW_SIZE"
        - "MAX_FRAME_SIZE"
        - "MAX_HEADER_LIST_SIZE"
      - *int* "Value" (required) the value of the http2 setting
  - *string[]* "pinnedCertificates" (optional) - a list of the fingerprints of the certificates you want to be allowed
  - *bool* ignoreSSLErrors (optional, default: false) - ignore invalid ssl certificates, should not be used in production

The response contains the following fields:

- *bool* "Success" (always) - if the initialization was successful
- *string* "Error" (on error) - the error message if the initialization was not successful

### 3.2 request

This function executes a request with a specific client that is identified by its id.

```json
{
  "id":"b869a59f-0d27-4eb8-b1df-cf300797439c",
  "method":"POST",
  "url":"https://somepage.com",
  "pseudoHeaderOrder":["method", "authority", "scheme", "path"],
  "headers":[
    ["cache-control", "max-age=0"],
    ["upgrade-insecure-requests", "1"],
    ["user-agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.150 Safari/537.36"],
    ["accept","text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"],
    ["sec-fetch-site", "none"],
    ["sec-fetch-mode", "navigate"],
    ["sec-fetch-user", "?1"],
    ["sec-fetch-dest", "document"],
    ["accept-encoding","gzip, deflate, br"],
    ["accept-language","de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"]
  ],
  "body":"username=user%26password=12345678",
}
```

the client would then return the response of the server as below:

```json
{
  "Status": 200,
  "Body": "...",
  "Headers": {
    "Cache-Control": ["private, max-age=0, no-store, no-cache, must-revalidate, post-check=0, pre-check=0"],
    "Content-Encoding": ["br"],
    "Content-Type": ["text/html; charset=UTF-8"],
    "Date": ["Tue, 16 Feb 2021 16:54:35 GMT"],
    "Vary": ["Accept-Encoding"],
    "X-Frame-Options": ["SAMEORIGIN"]
  }
}
```

Parameters are:

- *string* "id" (required) -  the id of the client that executes the request
- *string* "url" (required)
- *string* "method" (required) - the method of the request (e.g. "GET", "POST, "PUT", ...)
- *string\[4\]* "pseudoHeaderOrder" (optional) - the correct order 
  - you need to set all 4 headers, in your desired order e.g. :
  - ["method", "authority", "scheme", "path"]
- *string[][2]* "headers" (required) - the headers of the request
  - the outer array contains only arrays with a length of 2
  - the first entry represents the key, the second entry represents the value
  - e.g. "headers": \[\["user-agent", "my-user-agent"\], \["accept-encoding", "gzip, deflate, br"\]\]
- *string* "body" (optional) - the body of the request
- *byte[]* "rawBody" (optional) - the byte representation of the body. Has to be used when body is not utf-8 encoded. When both body and rawBody are set, rawBody will be used.
- *string* "host" (optional) - has to be used for custom host
- *bool* "followRedirects" (optional; default: true) - if set true the client will follow requests indicated by an 3XX status code
- *int* "timeout" (optional) - timeout for the request in ms

The response contains the following fields:

- *int* "Status" (on success) - the status code of the http response
- *string* "Error" (on error) - the error message if the request was not successfully (status codes smaller than 200 and or greater than 299 won't cause an error)
- *string* "Body" (on success) - the body of the http response
- *{"Key"\[string\]: "Value"\[string\]}[]* "Headers" - The headers of the http response

### 3.3 cancelRequests

This function takes in an id of a given client as a string parameter and will cancel all the currently executed requests for that given client.

### 3.4 initClient differences for node.js

When using the node.js implementation you don't have to set the Id, it is automatically generated and set for you when creating a instance of the Client class.

### 3.5 request differences for node.js

The node.js library includes additional support for a few features that can be set as the following parameters:

- *{\[string\]: \[string\], ...}* "form" (optional) - the form data as first order json map of strings that will be serialized into the body
- *{...}* "json" (optional) - a json object that will be serialized into the body
- *tough-cookie.CookieJar or Jar* "jar" (optional) - a cookie jar to store the cookies in
  - tough-cookie.CookieJar
    - the jar from https://www.npmjs.com/package/tough-cookie can be used as storage
  - the integrated Jar
    - can be used by importing jar.js
    - does not sort cookies by their domain
    - easier to access and to modify
  - *bool* "resolveWithFullResponse" (optional; default: true)
    - if set true, the response of the request function will be a json object consisting of body, headers and status code
    - if set false, the request will just return the body as a string
  - *bool* "simple" (optional; default: false)
    - if set true, the request call will throw an error if the status code is below 200 or greater than 299
    - if set false, the request call will only throw an error if there are errors composing the requests or connecting

The response will be either an json object or a sting depending on the "resolveWithFullResponse" setting.


(c)2021 @franz#0666