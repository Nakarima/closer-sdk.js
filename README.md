![SDK](./sdk.png)

# Ratel JavaScript SDK
Building:

```
npm install
npm run build
```

Running:

```
npm start
```

Test environment:

```
npm test
npm run test-dev
```

## 307 response:
When run locally, SDK will connect with ratel & artichoke via `http` protocol.
 This causes HSTS problem. 
 To hack this in Chrome (http://stackoverflow.com/questions/34108241/non-authoritative-reason-header-field-http):
 - open chrome://net-internals/#hsts
 - delete domains: 'api.dev.ratel.io' and 'artichoke.ratel.io'
 - enjoy


# Changelog
The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)

## 0.4.12
### Changed
- `RoomCreated` event has now rich Room object
