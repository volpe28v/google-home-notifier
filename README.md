# google-home-podcast
Play rebuild.fm and backspace.fm on Google Home.

<img width="939" alt="2018-01-06 0 42 44" src="https://user-images.githubusercontent.com/754962/34616170-b401d0fa-f27a-11e7-8ffd-fcdeb6e57e6e.png">


## Installation
```
$ npm install
$ SPREAD_KEY=<SpreadSheetKey> GOOGLEHOME_IP=<GoogleHomeIP> node example.js
```

## Progress page
access to http://localhost:8091/

<img width="1213" alt="2018-02-01 0 54 29" src="https://user-images.githubusercontent.com/754962/35632648-8dda7a74-06ea-11e8-9859-8352371879ba.png">

## 参考
* [Google Home で Rebuild.fm や Backspace.fm を流す方法](https://qiita.com/volpe28v/items/f2e4a88c66e6af1009a2)

---
# google-home-notifier
Send notifications to Google Home

#### Installation
```sh
$ npm install google-home-notifier
```

#### Usage
```javascript
var googlehome = require('google-home-notifier');
var language = 'pl'; // if not set 'us' language will be used

googlehome.device('Google Home', language); // Change to your Google Home name
// or if you know your Google Home IP
// googlehome.ip('192.168.1.20', language);

googlehome.notify('Hey Foo', function(res) {
  console.log(res);
});
```

#### Listener
If you want to run a listener, take a look at the example.js file. You can run this from a Raspberry Pi, pc or mac. 
The example uses ngrok so the server can be reached from outside your network. 
I tested with ifttt.com Maker channel and it worked like a charm.

```sh
$ git clone https://github.com/noelportugal/google-home-notifier
$ cd google-home-notifier
$ npm install
$ node example.js
Endpoints:
    http://192.168.1.20:8091/google-home-notifier
    https://xxxxx.ngrok.io/google-home-notifier
GET example:
curl -X GET https://xxxxx.ngrok.io/google-home-notifier?text=Hello+Google+Home  - to play given text
curl -X GET https://xxxxx.ngrok.io/google-home-notifier?text=http%3A%2F%2Fdomain%2Ffile.mp3 - to play from given url
POST example:
curl -X POST -d "text=Hello Google Home" https://xxxxx.ngrok.io/google-home-notifier - to play given text
curl -X POST -d "http://domain/file.mp3" https://xxxxx.ngrok.io/google-home-notifier - to play from given url

```
#### Raspberry Pi
If you are running from Raspberry Pi make sure you have the following before nunning "npm install":
Use the latest nodejs dist.
```sh
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install nodejs
```
Also install these packages:
```sh
sudo apt-get install git-core libnss-mdns libavahi-compat-libdnssd-dev
```

## After "npm install"

Modify the following file "node_modules/mdns/lib/browser.js"
```sh
vi node_modules/mdns/lib/browser.js
```
Find this line:
```javascript
Browser.defaultResolverSequence = [
  rst.DNSServiceResolve(), 'DNSServiceGetAddrInfo' in dns_sd ? rst.DNSServiceGetAddrInfo() : rst.getaddrinfo()
, rst.makeAddressesUnique()
];
```
And change to:
```javascript
Browser.defaultResolverSequence = [
  rst.DNSServiceResolve(), 'DNSServiceGetAddrInfo' in dns_sd ? rst.DNSServiceGetAddrInfo() : rst.getaddrinfo({families:[4]})
, rst.makeAddressesUnique()
];
```
