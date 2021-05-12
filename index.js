const functions = require('firebase-functions')
const admin = require("firebase-admin")
const request = require('request')
const serviceAccount = require("./serviceAccountKey.json")
const inside = require('point-in-polygon')
const UserDao = require('./user-dao')
const StatusDao = require('./status-dao')
const AlertFetcher = require('./alert-fetcher')
const AlertParser = require('./alert-parser');
const AlertLogger = require('./alert-logger');
const MessageGenerator = require('./message-generator')
const NestedCancelRemover = require('./nested-cancellation-remover')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://severe-weather-alerts.firebaseio.com"
});

// In the process of switching to firestore, realtime database will be removed later
const rtDb = admin.database();

let rtLastModified;// Time and date of newest data
let parsed = [];   // IDs of alerts that have already been parsed and sent
let users;         // Users pulled from database
let messages = []; // List of messages to send

// Fetch, parse, and send alerts every minute
exports.alertsupdate = functions.pubsub.schedule('* * * * *')
  .onRun(() => {
    return new Promise(async(resolve) => {
      if (!rtLastModified) await get_last_parse();
      fetch_data().then(async data => {
        messages = []; // Global variables cached by firebase, clear this out
        await get_users();
        await parse(data);
        let finishPromises = []; // Send and set last parse asynchronously
        if (messages.length > 0) finishPromises.push(send_messages());
        finishPromises.push(set_last_parse());
        await Promise.all(finishPromises);
        console.log("Finished up successfully");
        resolve();
        return null;
      }).catch(err => {
        console.log(err.message);
        resolve();
      })
    });
});

// Get last parse information from database, store in global variables
function get_last_parse() {
  return Promise.all([
    rtDb.ref("/parsed").once("value", (data) => { parsed = data.val(); }),
    rtDb.ref("/lastModified").once("value", (data) => { rtLastModified = data.val(); })
  ]);
}

// Update the last parse and modified variables
function set_last_parse() {
  if (parsed.length > 3500) // If the list gets too big, chop off old alerts
    parsed = parsed.slice(parsed.length - 1000, parsed.length);
  return Promise.all([
    rtDb.ref("/parsed").set(parsed),
    rtDb.ref("/lastModified").set(rtLastModified)
  ]);
}

// Gets all users from database, store in users variable
// Downloads a decent amount of data so only use when new data is available
function get_users() { return rtDb.ref("/users").once("value", (data) => { users = data.val(); }); }

// Requests alerts from api.weather.gov
// Returns promise that resolves to returned data
// Rejects with message if no new data is available
function fetch_data() {
  return new Promise((resolve, reject) => {
    let requestOptions = {
      url: 'https://api.weather.gov/alerts?status=actual',
      headers: { 'User-Agent': USER_AGENT, "If-Modified-Since": rtLastModified }
   };
    request(requestOptions, (error, response, body) => {
      if (!error && response.statusCode === 200) { // Successful response
        // Absolutely make sure the data is newer. Sometimes the
        // "If-Modified-Since" header doesn't work (returns older data)
        if (Date.parse(response.headers['last-modified']) < Date.parse(rtLastModified)) {
          reject(new Error("Data not newer")); return;
        }
        rtLastModified = response.headers['last-modified'];
        resolve(body);
      }
      else if (!error && response.statusCode === 304) { reject(new Error("Data not modified (HTTP 304)")); }
      else if (response.statusCode === 503) { reject(new Error("Service unavaliable (HTTP 503)")); }
      else if (response.statusCode === 502) { reject(new Error("Bad gateway (HTTP 502)")); }
      else { reject(new Error("Request failed: " + error)); }
    })
  });
}

// Parse input data and send alerts to users
async function parse(data) {
  let promises = [];
  let parseCount = 0;
  let alerts;
  try { alerts = JSON.parse(data).features; }
  catch (e) { return Promise.reject(new Error("Parse error")); }
  //addAlert(alerts[0], "ejjg0DWnSpOYzUF8mCXvDI:APA91bEqC4es93HIoX03AQ_kGOnnnDHiH6psJMpFgueML6wGgeJeh--WptdiI5RQ0IUxvG0dK_G37UFDw9RRN-D0CaT1VAimjgmnBw0Lqz_Yl_-eKHrQ4lKAWDK2QWItEl_g2t6Xi0UB")

  // Loop through alerts
  // Look for users within the zones and notify them
  for (let i = 0; i < 150; i++) {
    const curAlert = alerts[i];
    const curAlProp = alerts[i].properties;
    if (parsed.includes(curAlProp.id)) continue;
    parseCount++;
    parsed.push(curAlProp.id);
    if (alerts[i].geometry) { // Current alert uses polygon
      for (let token in users) { // Loop through users
        if (affects_user(users[token], alerts[i].geometry)) {
          // Bit of a convoluted statement but cancellation polygons are
          // sometimes put out for entire area including the continued area.
          // This check solves that and only sends the cancellation to the people
          // who are not in the new one
          let alertContinued = curAlProp.messageType === "Cancel" && ((alerts[i+1] && JSON.stringify(alerts[i+1].properties.references) === JSON.stringify(curAlProp.references) && affects_user(users[token], alerts[i+1].geometry)) || alerts[i-1] && (JSON.stringify(alerts[i-1].properties.references) === JSON.stringify(curAlProp.references) && affects_user(users[token], alerts[i-1].geometry)));
          if (alertContinued) { continue; }
          if (users[token].build) { // 2.0 and greater have build numbers
            console.log("2.0+ User");
            addAlert(curAlert, token);
          } else {
            add_alert(curAlert, token, users[token].settings);
          }
        }
      }
    }
    else { // Current alert uses zones (usually counties) that have to be requested
      for (let x = 0; x < curAlProp.affectedZones.length; x++) {
        let zoneRequestOptions = {
          url: curAlProp.affectedZones[x],
          headers: { 'User-Agent': USER_AGENT }
        };
        let reqPromise = new Promise((resolve, reject) => {
          request(zoneRequestOptions, (error, response, body) => { // Get the zone
            if (!error && response.statusCode === 200) {
              let zone;
              try { zone = JSON.parse(body).geometry; } // Parse the zone
              catch (e) { console.log("Geometry parse error"); reject(new Error("Geometry parse error")); return; }
              for (let token in users) { // Loop through users
                if (affects_user(users[token], zone)) { // Check if they're in the zone
                  if(users[token].build) { // 2.0 and greater have build numbers
                    console.log("2.0+ User");
                    addAlert(curAlert, token);
                  } else {
                    add_alert(curAlert, token, users[token].settings); // Send
                  }
                }
              }
            } else { console.log("Zone request error: " + error); }
            resolve();
          })
        });
        promises.push(reqPromise);
      }
    }
  }
  console.log("Parsed " + parseCount + " alerts");
  return Promise.all(promises);
}

function addAlert(alert, regToken) {
  const props = alert.properties;
  let polygon;
  let polygonType;
  let zones;
  if (alert.geometry) {
    polygonType = alert.geometry.type;
    polygon = JSON.stringify(alert.geometry.coordinates);
  } else {
    zones = [];
    let affectedZones = props.affectedZones.slice(0); // Copy array
    for (let i = 0; i < affectedZones.length; i++) {
      zones.push(affectedZones[i].substring(30));
    }
    zones = JSON.stringify(zones);
  }
  let message = { data: {}, token: regToken, android: {priority: "high"} };
  let payload = message.data;
  payload.name = props.event;
  payload.id = props.id;
  if (props.parameters.NWSheadline) payload.nwsHeadline = props.parameters.NWSheadline[0];
  payload.description = props.description;
  if (props.instruction) payload.instruction = props.instruction;
  payload.type = props.messageType;
  if (polygon) payload.polygon = polygon;
  if (polygonType) payload.polygonType = polygonType;
  if (zones) payload.zones = zones;
  payload.sent = props.sent.toString();
  if (props.onset) payload.onset = props.onset.toString();
  if (props.expires) payload.expires = props.expires.toString();
  if (props.ends) payload.ends = props.ends.toString();
  payload.senderName = props.senderName;
  payload.senderCode = props.parameters.PIL[0].slice(0,3);
  console.log(message);
  messages.push(message);
}

// Returns true if given user is within given zone
function affects_user(user, zone) {
  // Geojson uses an array of shapes where the first polygon is the actual
  // shape of the polygon and the rest are negative areas to subtract out. I
  // have yet to find a weather zone that includes the negative area. So for
  // now, I'm leaving it out of the calculation
  let usrLocation = user.locations;
  for (let i = 0; i < usrLocation.length; i++) {
    if (zone.type === "MultiPolygon") {
      for (let curPlygon = 0; curPlygon < zone.coordinates.length; curPlygon++) {
        for (let curInner = 0; curInner < zone.coordinates[curPlygon].length; curInner++) {
          if (inside(usrLocation[i], zone.coordinates[curPlygon][curInner]))
            return true;
        }
      }
    } else if (zone.type === "Polygon") {
      for (curInner = 0; curInner < zone.coordinates.length; curInner++) {
        if (inside(usrLocation[i], zone.coordinates[curInner]))
          return true;
      }
    }
  }
  return false;
}

// Use regular expressions and replacements in attempt to
// make garbage hard wrapped text readable
function parse_text(text) {
  return text.replace(/\n/g, "\\n")
             .replace(/\\n\\n/g, "\n\n")
             .replace(/\\n/g, " ")
             .replace(/\.\.\. /g, "...\n")
             .replace(/ \*/g, "\n\n*")
             .replace(/ +/g, " ")
             .replace(/\n +/g, "\n")
             .replace(/\n\n\n+/g, "\n\n")
             .replace(/\n\.+/g, "\n");
}

// Take alert and firebase token, pretty it up, and add it to send list
function add_alert(alert, regToken, settings) {
  const alProp = alert.properties;

  // Notification Channel
  let notificationChannel = alProp.messageType;
  if (settings) {
    if (alProp.messageType === "Cancel") notificationChannel = "low";
    else {
      let severityIndex = get_severity_index(alProp);
      let map = settings[((alProp.messageType === "Alert") ? "alertMap" : "updateMap")];
      if (severityIndex < map[0] || severityIndex > map[4] || map[0] === map[4]) {
        console.log("Out of preference range, not sending"); return; }
      notificationChannel = "low";
      if (severityIndex >= map[1] && (map[1] !== map[2])) notificationChannel = "med";
      if (severityIndex >= map[2] && (map[2] !== map[3])) notificationChannel = "high";
      if (severityIndex >= map[3] && (map[3] !== map[4])) notificationChannel = "ext";
    }
  }

  // Log alert and latency
  let latency = (new Date() - new Date(alProp.sent)) / 1000;
  let latencyMinutes = Math.floor(latency / 60);
  if (latencyMinutes >= 25) { // Don't even bother
    console.log(alProp.id + " ignored. Latency: " + latencyMinutes + " minutes");
    return;
  }
  let latencyString = "<" + latencyMinutes + " min" + ((latency > 300) ? " (ELEVATED)" : "");
  console.log(alProp.event + " " + alProp.messageType + " by " + alProp.senderName + " matched. Latency: " + latencyString + ". Channel: " + notificationChannel + ". Token: " + regToken);

  // Remap alert name. This is how it appears on weather.gov
  if (alProp.event === "Tropical Cyclone Statement")
    alProp.event = "Hurricane Local Statement"

  // Description
  let description = parse_text(alProp.description);

  // Headline
  let headline = "null";
  let descHeadline = alProp.description.match(/^\.\.\.[^.]*\.\.\./);
  if (descHeadline) {
    headline = descHeadline[0].replace(/\.\.\./g, "");
    headline = headline.replace(/\n/g, "");
    description = description.replace(/^\.\.\.[^.]*\.\.\.\n+/, "");
  }
  if (alProp.parameters.NWSheadline) {
    if (headline === "null") {
      headline = alProp.parameters.NWSheadline[0].replace(/\n/g, " ")
                                                 .replace(/\.\.\. /g, "\n")
                                                 .replace(/\.\.\./g, ", ")
                                                 .replace(/\n, /g, "\n");
    } else {
      description = alProp.parameters.NWSheadline[0] + "\n\n" + description;
    }
  }

  // Instruction (Recommended Actions)
  let instruction = "null";
  if (alProp.instruction)
    instruction = parse_text(alProp.instruction);

  // Geometry
  let polygon = zones = "null";
  if (alert.geometry) {
    polygon = JSON.stringify(alert.geometry.coordinates[0]);
  } else {
    var zones = alProp.affectedZones.slice(0); // Copy array
    for (let i = 0; i < zones.length; i++) {
      zones[i] = zones[i].substring(30);
    }
    zones = JSON.stringify(zones);
  }

  // Notification Body
  let notificationBody = "";
  if (headline !== "null")
    notificationBody += headline + "\n\n";

  notificationBody += description;

  if (instruction !== "null")
    notificationBody += "\n\n" + instruction;

  // Overwrite notifications with same event
  let tag = alProp.event;

  // Construct firebase message payload
  let message = {
    notification: {
      title: alProp.event + ((alProp.messageType === "Alert") ? "" : " Update"),
      body: notificationBody.substring(0, 600),
    },
    android: {
      notification: {
        color: ((alProp.messageType === "Cancel") ? "#868e96" : alertStyle[alProp.event].color),
        icon: alertStyle[alProp.event].icon,
        'channel_id': notificationChannel,
        'click_action': 'alertviewer',
        tag: tag,
      },
      priority: ((notificationChannel === "low" || notificationChannel === "med") ? "normal" : "high")
    },
    data: {
      name: alProp.event,
      id: alProp.id,
      headline: headline,
      description: description,
      instruction: instruction,
      type: alProp.messageType,
      polygon: polygon,
      zones: zones,
      tag: tag,
      sent: new Date(alProp.sent).getTime().toString(),
      onset: new Date(alProp.onset).getTime().toString(),
      ends: new Date(((alProp.ends) ? alProp.ends : alProp.expires)).getTime().toString(),
      senderName: alProp.senderName,
      senderCode: alProp.parameters.PIL[0].slice(0,3),
    },
    token: regToken
  };

  // Firebase messages can only by 4KB so remove the zones then the text if we
  // have to. The app will have to request that information if missing
  if (JSON.stringify(message).length > 4000) { // Too large, remove zones
    message.data.zones = "[]";
    message.data.polygon = "null";
    if (JSON.stringify(message).length > 4000) { // Still too large, remove text
      message.data.description = "null";
      message.data.instruction = "null";
    }
  }
  messages.push(message);
}

function get_severity_index(alProp) {
  let urgency = 0;
  let severity = 0;
  let certainty = 0;

  if (alProp.severity === "Minor") severity = 1;
  else if (alProp.severity === "Moderate") severity = 2;
  else if (alProp.severity === "Severe") severity = 3;
  else if (alProp.severity === "Extreme") severity = 4;

  if (alProp.messageType === "Cancel")
    return severity;

  if (alProp.urgency === "Past") urgency = 1;
  else if (alProp.urgency === "Future") urgency = 2;
  else if (alProp.urgency === "Expected") urgency = 3;
  else if (alProp.urgency === "Immediate") urgency = 4;

  if (alProp.certainty === "Unlikely") certainty = 1;
  else if (alProp.certainty === "Possible") certainty = 2;
  else if (alProp.certainty === "Likely") certainty = 3;
  else if (alProp.certainty === "Observed") certainty = 4;

  return urgency + (3 * severity) + certainty
}

// Sends all the messages in global variable, deletes invalid tokens from database
async function send_messages() {
  let promises = [];
  let sendPromise = new Promise((resolve, reject) => {
    admin.messaging().sendAll(messages).then((response) => {
      console.log(response.successCount + " message(s) sent. " + response.failureCount + " failed.");
      for (let i = 0; i < response.responses.length; i++) {
        if (!response.responses[i].success) {
          if (response.responses[i].error.code === "messaging/registration-token-not-registered") {
            promises.push(deleteTokenFromRealtimeDatabase(messages[i].token));
          } else { console.log(response.responses[i].error); }
        }
      }
      resolve();
      return null;
    }).catch(error => { reject(error); });
  });
  promises.push(sendPromise);
  // Wait for send request to complete before returning delete promises
  await Promise.all(promises);
  return Promise.all(promises);
}

// Helper function to delete user given their token
function deleteTokenFromRealtimeDatabase(token) {
  console.log("Deleting token:", token);
  return rtDb.ref("/users/" + token).remove();
}

// Called when user makes request to update their location or register
// Validates request and updates database accordingly
exports.userupdate = functions.https.onRequest((req, res) => {
  let reqBod = req.body;
  let keys = Object.keys(reqBod);
  // TODO: make this regex and do more robust validation
  let validReq = keys.length === 1 && reqBod[keys[0]].locations && reqBod[keys[0]].locations.length <= 5 && reqBod[keys[0]].locations.length > 0;
  if (validReq) {
    let userRef = rtDb.ref("/users/" + keys[0]);
    userRef.update(reqBod[keys[0]]).then(() => {
      console.log("User sync. Token: " + keys[0]);
      return res.status(200).send();
    }).catch(() => {
      console.log("Database error: HTTP 500 sent");
      return res.status(500).send();
    })
  } else {
    console.log("Invalid request: HTTP 400 sent");
    return res.status(400).send();
  }
});

// Lookup table for notification icon and color
const alertStyle = {
  "Administrative Message" : { icon: "hazard", color: "#C0C0C0" },
  "Air Quality Alert" : { icon: "airquality", color: "#808080" },
  "Air Stagnation Advisory": { icon: "airquality", color: "#808080" },
  "Ashfall Advisory": { icon: "volcano", color: "#696969" },
  "Ashfall Warning": { icon: "volcano", color: "#A9A9A9" },
  "Avalanche Advisory": { icon: "avalanche", color: "#CD853F" },
  "Avalanche Warning": { icon: "avalanche", color: "#1E90FF" },
  "Avalanche Watch": { icon: "avalanche", color: "#F4A460" },
  "Beach Hazards Statement": { icon: "wave", color: "#40E0D0" },
  "Blizzard Warning": { icon: "blizzard", color: "#FF4500" },
  "Blizzard Watch": { icon: "blizzard", color: "#89CC25" },
  "Blowing Dust Advisory": { icon: "wind", color: "#BDB76B" },
  "Blowing Dust Warning": { icon: "wind", color: "#ccb79d" },
  "Brisk Wind Advisory": { icon: "wind", color: "#D8BFD8" },
  "Child Abduction Emergency": { icon: "missing", color: "#ccad00" },
  "Civil Danger Warning": { icon: "hazard", color: "#cc919a" },
  "Civil Emergency Message": { icon: "hazard", color: "#cc919a" },
  "Coastal Flood Advisory": { icon: "flood", color: "#6cd900" },
  "Coastal Flood Statement": { icon: "flood", color: "#6B8E23" },
  "Coastal Flood Warning": { icon: "flood", color: "#228B22" },
  "Coastal Flood Watch": { icon: "flood", color: "#66CDAA" },
  "Dense Fog Advisory": { icon: "fog", color: "#708090" },
  "Dense Smoke Advisory": { icon: "fog", color: "#ccc376" },
  "Dust Advisory": { icon: "fog", color: "#BDB76B" },
  "Dust Storm Warning": { icon: "fog", color: "#ccb79d" },
  "Earthquake Warning": { icon: "earthquake", color: "#8B4513" },
  "Evacuation Immediate": { icon: "megaphone", color: "#66cc00" },
  "Excessive Heat Warning": { icon: "heat", color: "#C71585" },
  "Excessive Heat Watch": { icon: "heat", color: "#800000" },
  "Extreme Cold Warning": { icon: "cold", color: "#0000FF" },
  "Extreme Cold Watch": { icon: "cold", color: "#0000FF" },
  "Extreme Fire Danger": { icon: "fire", color: "#cc836a" },
  "Extreme Wind Warning": { icon: "wind", color: "#cc7000" },
  "Fire Warning": { icon: "fire", color: "#A0522D" },
  "Fire Weather Watch": { icon: "fire", color: "#E6C89C" },
  "Flash Flood Warning": { icon: "flood", color: "#8B0000" },
  "Flash Flood Watch": { icon: "flood", color: "#2E8B57" },
  "Flood Advisory": { icon: "flood", color: "#00D96C" },
  "Flood Statement": { icon: "flood", color: "#00cc00" },
  "Flood Warning": { icon: "flood", color: "#00cc00" },
  "Flood Watch": { icon: "flood", color: "#2E8B57" },
  "Freeze Warning": { icon: "freeze", color: "#483D8B" },
  "Freeze Watch": { icon: "freeze", color: "#00cccc" },
  "Freezing Fog Advisory": { icon: "fog", color: "#567fcc" },
  "Freezing Rain Advisory": { icon: "ice", color: "#da70d6" },
  "Freezing Spray Advisory": { icon: "ice", color: "#0099cc" },
  "Frost Advisory": { icon: "freeze", color: "#567fcc" },
  "Gale Warning": { icon: "gale", color: "#DDA0DD" },
  "Gale Watch": { icon: "gale", color: "#cc99a2" },
  "Hard Freeze Warning": { icon: "freeze", color: "#9400d3" },
  "Hard Freeze Watch": { icon: "freeze", color: "#4169e1" },
  "Hazardous Materials Warning": { icon: "hazard", color: "#4B0082" },
  "Hazardous Seas Warning": { icon: "marine", color: "#D8BFD8" },
  "Hazardous Seas Watch": { icon: "marine", color: "#483D8B" },
  "Hazardous Weather Outlook": { icon: "hazard", color: "#ccc791" },
  "Heat Advisory": { icon: "heat", color: "#FF7F50" },
  "Heavy Freezing Spray Warning": { icon: "ice", color: "#0099cc" },
  "Heavy Freezing Spray Watch": { icon: "ice", color: "#BC8F8F" },
  "High Surf Advisory": { icon: "wave", color: "#BA55D3" },
  "High Surf Warning": { icon: "wave", color: "#228B22" },
  "High Wind Warning": { icon: "wind", color: "#DAA520" },
  "High Wind Watch": { icon: "wind", color: "#B8860B" },
  "Hurricane Force Wind Warning": { icon: "hurricane", color: "#CD5C5C" },
  "Hurricane Force Wind Watch": { icon: "hurricane", color: "#9932CC" },
  "Hurricane Local Statement": { icon: "hurricane", color: "#CCB391" },
  "Hurricane Warning": { icon: "hurricane", color: "#DC143C" },
  "Hurricane Watch": { icon: "hurricane", color: "#cc00cc" },
  "Hydrologic Advisory": { icon: "flood", color: "#00D96C" },
  "Hydrologic Outlook": { icon: "flood", color: "#75bf75" },
  "Ice Storm Warning": { icon: "ice", color: "#8B008B" },
  "Lake Effect Snow Advisory": { icon: "snow", color: "#48D1CC" },
  "Lake Effect Snow Warning": { icon: "snow", color: "#008B8B" },
  "Lake Effect Snow Watch": { icon: "snow", color: "#86CEFA" },
  "Lakeshore Flood Advisory": { icon: "flood", color: "#6cd900" },
  "Lakeshore Flood Statement": { icon: "flood", color: "#6B8E23" },
  "Lakeshore Flood Warning": { icon: "flood", color: "#228B22" },
  "Lakeshore Flood Watch": { icon: "flood", color: "#66CDAA" },
  "Lake Wind Advisory": { icon: "wind", color: "#D2B48C" },
  "Law Enforcement Warning": { icon: "megaphone", color: "#66cc00" },
  "Local Area Emergency": { icon: "hazard", color: "#C0C0C0" },
  "Low Water Advisory": { icon: "hazard", color: "#A52A2A" },
  "Marine Weather Statement": { icon: "marine", color: "#ccaf95" },
  "Nuclear Power Plant Warning": { icon: "hazard", color: "#4B0082" },
  "Radiological Hazard Warning": { icon: "hazard", color: "#4B0082" },
  "Red Flag Warning": { icon: "fire", color: "#FF1493" },
  "Rip Current Statement": { icon: "wave", color: "#40E0D0" },
  "Severe Thunderstorm Warning": { icon: "thunderstorm", color: "#FFA500" },
  "Severe Thunderstorm Watch": { icon: "thunderstorm", color: "#DB7093" },
  "Shelter In Place Warning": { icon: "megaphone", color: "#CC695E" },
  "Short Term Forecast": { icon: "hazard", color: "#7CCC7C" },
  "Small Craft Advisory": { icon: "smallcraft", color: "#D8BFD8" },
  "Snow Squall Warning": { icon: "blizzard", color: "#C71585" },
  "Special Marine Warning": { icon: "marine", color: "#FFA500" },
  "Special Weather Statement": { icon: "hazard", color: "#CCB391" },
  "Storm Surge Warning": { icon: "wave", color: "#B524F7" },
  "Storm Surge Watch": { icon: "wave", color: "#A962BF" },
  "Storm Warning": { icon: "tropicalstorm", color: "#9400d3" },
  "Storm Watch": { icon: "tropicalstorm", color: "#CCB391" },
  "911 Telephone Outage": { icon: "phone", color: "#C0C0C0" },
  "Tornado Warning": { icon: "tornado", color: "#FF0000" },
  "Tornado Watch": { icon: "tornado", color: "#cccc00" },
  "Tropical Depression Local Statement": { icon: "tropicalstorm", color: "#CCB391" },
  "Tropical Storm Local Statement": { icon: "tropicalstorm", color: "#CCB391" },
  "Tropical Storm Warning": { icon: "tropicalstorm", color: "#B22222" },
  "Tropical Storm Watch": { icon: "tropicalstorm", color: "#f08080" },
  "Tsunami Advisory": { icon: "wave", color: "#D2691E" },
  "Tsunami Warning": { icon: "wave", color: "#FD6347" },
  "Tsunami Watch": { icon: "wave", color: "#cc00cc" },
  "Typhoon Local Statement": { icon: "hurricane", color: "#CCB391" },
  "Typhoon Warning": { icon: "hurricane", color: "#DC143C" },
  "Typhoon Watch": { icon: "hurricane", color: "#cc00cc" },
  "Volcano Warning": { icon: "volcano", color: "#2F4F4F" },
  "Wind Advisory": { icon: "wind", color: "#D2B48C" },
  "Wind Chill Advisory": { icon: "cold", color: "#97cccc" },
  "Wind Chill Warning": { icon: "cold", color: "#B0C4DE" },
  "Wind Chill Watch": { icon: "cold", color: "#5F9EA0" },
  "Winter Storm Warning": { icon: "snow", color: "#FF69B4" },
  "Winter Storm Watch": { icon: "snow", color: "#4682B4" },
  "Winter Weather Advisory": { icon: "snow", color: "#7B68EE" }
}

// Version 2.0 Stuff below this line
// Everything above will soon be deprecated and eventually removed completely
// -------------------------------------------------------------------------

const USER_AGENT = '(Severe Weather Alerts, https://github.com/qconrad/severe-weather-alerts)';
const db = admin.firestore();

// Called when user makes request to sync their location(s)
// Validates request and updates database
exports.usersync = functions.https.onRequest((req, res) => {
  if (validRequest(req.body)) {
    new UserDao(admin).addToDatabase(req.body)
      .then(() => { return res.status(200).send() })
      .catch(() => { return res.status(500).send() })
  }
  else return res.status(400).send()
})

exports.feedback = functions.https.onRequest((req, res) => {
  let data = req.body
  data.createdAt = admin.firestore.Timestamp.now()
  db.collection("feedback").add(data).then(() => { return res.status(200).send()})
  .catch(() => res.status(500).send() )
})

function validRequest(body) {
  return true // TODO
}

// Send new alerts to affected users every minute
exports.alertssync = functions.pubsub.schedule('* * * * *') .onRun(() => syncAlerts())

const statusDao = new StatusDao(db)
let lastModified
let sentAlertIDs

function statusInCache() { return lastModified }

async function sendAndLog(alert_user_map) {
  new AlertLogger(alert_user_map, new Date()).log()
  return sendMessages(new MessageGenerator(alert_user_map).getMessages())
}

async function syncAlerts() {
  if (!statusInCache()) await statusDao.getStatusFromDatabase().then(() => setGlobalVariables(statusDao))
  const alertFetcher = new AlertFetcher(lastModified, USER_AGENT)
  return alertFetcher.fetchAlerts()
    .then(alerts => new AlertParser(alerts, db, sentAlertIDs).parseAlerts())
    .then(alert_user_map => sendAndLog(new NestedCancelRemover(alert_user_map).get()))
    .then(() => lastModified = alertFetcher.getLastModified())
    .then(() => statusDao.saveStatusToDatabase(lastModified, sentAlertIDs))
    .catch(error => console.log(error.message))
    .finally(() => console.log("Alert Sync Complete"))
}

async function deleteTokens(failedTokens) {
  if (failedTokens.length <= 0) return
  let promises = []
  const userDao = new UserDao(admin)
  for (const token of failedTokens)
    promises.push(userDao.deleteToken(token))
  return Promise.all(promises)
}

async function sendMessages(messages) {
  if (messages.length <= 0) return
  return admin.messaging().sendAll(messages).then(response => parseResponse(messages, response)).then(invalidTokens => deleteTokens(invalidTokens))
}

function parseResponse(messages, messageSendResponse) {
  console.log('Send complete. Success:', messageSendResponse.successCount, 'Failures:', messageSendResponse.failureCount)
  let invalidTokens = []
  if (messageSendResponse.failureCount > 0) {
    messageSendResponse.responses.forEach(function (response, i) {
      if (response.error) {
        if (response.error.code === 'messaging/registration-token-not-registered'||
            response.error.code === 'messaing/invalid-argument') {
          invalidTokens.push(messages[i].token)
        }
        else console.log(response.error.message)
      }
    });
  }
  return invalidTokens
}

function setGlobalVariables(statusDao) {
  lastModified = statusDao.getLastModified()
  sentAlertIDs = statusDao.getSentAlertIDs()
}
