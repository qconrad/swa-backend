// We need this stuff
const functions = require('firebase-functions');
const admin = require("firebase-admin");
const request = require('request');
const serviceAccount = require("./serviceAccountKey.json");
const inside = require('point-in-polygon');

// Init this stuff
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://severe-weather-alerts.firebaseio.com"
});

// Let NWS know who's making all these requests
const USER_AGENT = '(Severe Weather Alerts, https://github.com/qconrad/severe-weather-alerts)';

// Keep track of these things
var lastSent;     // ID of last sent alert
var lastModified; // Time and date of newest data
var users;        // Users pulled from database

// Fetch and parse alerts every minute
exports.alertsupdate = functions.pubsub.schedule('* * * * *')
  .onRun(() => {
    pull_database();
    return null;
});

// This function request the entirety of the database (we need it all)
// and then begins the entire fetch and parse process
function pull_database() {
  var db = admin.database();
  var ref = db.ref("/");
  ref.once("value", function(data) {
    lastSent = data.val().lastSent;
    lastModified = data.val().lastModified;
    users = data.val().users;
    fetch_alert_data();
  });
}

// Request all alerts from NWS servers and send them to users
function fetch_alert_data() {
  let requestOptions = {
    url: 'https://api.weather.gov/alerts?status=actual',
    headers: { 'User-Agent': USER_AGENT, "If-Modified-Since": lastModified }
  };
  request(requestOptions, function (error, response, body) {
    if (!error && response.statusCode === 200) { // Successful response
      // Absolutely make sure the data is newer. Sometimes the
      // "If-Modified-Since" header doesn't work (returns older data) and this
      // parses all alerts, sends duplicates, and sometimes locks out the api
      // because of too many requests
      if (Date.parse(response.headers['last-modified']) < Date.parse(lastModified)) {
        console.log("Data not newer");
        return;
      }

      // Parse alerts to json object and update last sent variables
      var alerts;
      try { alerts = JSON.parse(body).features; }
      catch (e) { console.log("Parse error"); return; }
      console.log("Last modified: " + response.headers['last-modified']);
      console.log("xserverid: " + response.headers['x-server-id']);
      set_last_sent(response.headers['last-modified'], alerts[0].properties.id);

      // Loop through only new alerts, breaking when we get to lastSent id
      // Look for users within the zones and notify them
      for (var i = 0; i < alerts.length; i++) {
        const curAlert = alerts[i];
        const curAlProp = alerts[i].properties;
        if (curAlProp.id === lastSent)
          break;
        if (alerts[i].geometry) { // Current alert uses polygon
          for (var key in users) { // Loop through users
            if (affects_user(users[key], alerts[i].geometry)) { // Check if zay in da box
              console.log("Polygon match");
              send_alert(curAlert, key); // Yay! day in da box, send it
            }
          }
        }
        else { // Current alert uses zones (usually counties) that have to be requested
          for (var x = 0; x < curAlProp.affectedZones.length; x++) {
            let zoneRequestOptions = {
              url: curAlProp.affectedZones[x],
              headers: { 'User-Agent': USER_AGENT }
            };
            request(zoneRequestOptions, function (error, response, body) { // Get the zone
              if (!error && response.statusCode === 200) {
                var zone;
                try { zone = JSON.parse(body).geometry; } // Parse the zone
                catch (e) { console.log("Geometry parse error"); return; }
                for (var key in users) { // Loop through users
                  if (affects_user(users[key], zone)) { // Check if they're in the zone
                    console.log("Zone match");
                    send_alert(curAlert, key); // Send
                  }
                }
              } else { console.log("Zone request error: " + error); }
            })
          }
        }
      }
      console.log("Parsed " + i + " alerts");
    }
    else if (response.statusCode === 304) { console.log("Data not modified"); }
    else { console.log("Request failed: ", error); }
  })
}

// Helper to update the last sent and modified variables so that
// we only parse and send new data
function set_last_sent(lastModified, id) {
  var db = admin.database();
  db.ref("/lastSent").set(id);
  db.ref("/lastModified").set(lastModified);
}

// Helper that returns true if given user is within given zone
function affects_user(user, zone) {
  // Geojson uses an array of shapes where the first polygon is the actual
  // shape of the polygon and the rest are negative areas to subtract out. I
  // have yet to find a weather zone that includes the negative area. So for
  // now, I'm leaving it out of the calculation
  var usrLocation = user.locations;
  for (var i = 0; i < usrLocation.length; i++) {
    if (zone.type === "MultiPolygon") {
      for (var curPlygon = 0; curPlygon < zone.coordinates.length; curPlygon++) {
        for (var curInner = 0; curInner < zone.coordinates[curPlygon].length; curInner++) {
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

// Take alert and firebase token, pretty it up, and send it to user
function send_alert(alert, regToken) {
  const alProp = alert.properties;
  console.log(alert.properties.headline);

  // Description
  var description = parse_text(alProp.description);

  // Headline
  var headline = "null";
  var descHeadline = alProp.description.match(/^\.\.\.[^.]*\.\.\./);
  if (descHeadline) {
    headline = descHeadline[0]; // TODO: replace 3 dots with nothing
    description.replace(/^\.\.\.[^.]*\.\.\.\n+/, "");
  }
  if (alProp.parameters.NWSheadline) {
    if (headline === "null") {
      headline = alProp.parameters.NWSheadline[0].replace(/\n/g, " ")
                                                 .replace(/\.\.\. /g, "\n")
                                                 .replace(/\.\.\./g, ", ")
                                                 .replace(/\n, /g, "\n");
    } else {
      description = headline + "\n\n" + description;
    }
  }

  // Instruction (Recommended Actions)
  var instruction = "null";
  if (alProp.instruction)
    instruction = parse_text(alProp.instruction);

  // Geometry
  var polygon = zones = "null";
  if (alert.geometry) {
    polygon = JSON.stringify(alert.geometry.coordinates[0]);
  } else {
    zones = JSON.stringify(alProp.affectedZones);
  }

  // Notification Body
  var notificationBody = "";
  if (headline !== "null")
    notificationBody += headline + "\n\n";

  notificationBody += description;

  if (instruction !== "null")
    notificationBody += "\n\n" + instruction;

  // Construct firebase message payload
  var message = {
    notification: {
      title: alProp.event + ((alProp.messageType === "Alert") ? "" : " Update"),
      body: notificationBody,
    },
    android: {
      notification: {
        color: ((alProp.messageType === "Cancel") ? "#868e96" : alertStyle[alProp.event].color),
        icon: alertStyle[alProp.event].icon,
        'channel_id': alProp.messageType,
        'click_action': 'alertviewer',
        // Notifications with the same tag will override any previous ones with
        // the same tag. Use root post id as tag so subsequent updates will
        // replace the previous one.
        tag: (alProp.references.length > 0) ? alProp.references[alProp.references.length-1].identifier : alProp.id,
      },
      priority: "high"
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
      sent: new Date(alProp.sent).getTime().toString(),
      onset: new Date(alProp.onset).getTime().toString(),
      ends: new Date(((alProp.ends) ? alProp.ends : alProp.expires)).getTime().toString(),
      senderName: alProp.senderName,
      senderCode: alProp.parameters.PIL[0].slice(0,3),
    },
    token: regToken
  };
  send_message(message)
}

// Send message payload to device
// Deletes user from database if token is invalid
function send_message(message) {
  admin.messaging().send(message)
    .then((response) => {
      // Response is a message ID string.
      console.log('Successfully sent message:', response);
      console.log('token:', message.token);
      return;
    })
    .catch((error) => {
      if (error.errorInfo.code === "messaging/registration-token-not-registered")
        delete_token_from_database(message.token);
      else
        console.log('Unkown error sending message:', error);
  });
}

// Helper function to delete user given their token
function delete_token_from_database(token) {
  console.log("Deleting token: " + token);
  var db = admin.database();
  db.ref("/users/" + token).remove();
}

// Called when user makes request to update their location or register
// Validates request and updates database accordingly
exports.userupdate = functions.https.onRequest((req, res) => {
  var reqBod = req.body;
  var keys = Object.keys(reqBod);
  // TODO: make this regex and do more robust validation
  var validReq = keys.length === 1 && reqBod[keys[0]].locations && reqBod[keys[0]].locations.length <= 5 && reqBod[keys[0]].locations.length > 0;
  if (validReq) {
    var db = admin.database();
    var userRef = db.ref("/users");
    userRef.child(keys[0]).set(reqBod[keys[0]]);
    console.log("User sync. Token: " + keys[0]);
    res.status(200).send();
  } else {
    console.log("invalid request");
    res.status(400).send();
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
