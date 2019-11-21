#include <ArduinoBLE.h>

#define THRESHOLD 100
#define SLEEPTIME 1000

// constants
const char Name[] = "Nano33BLE_ctr";
String locName = String("Nano33BLE_ctr");
String prflocName = String("Nano33BLE_prf");
String srvID = String("0a1f");
String chrID = String("0a2c");
const char srvIDarr[] = "0a1f";
const char chrIDarr[] = "0a2c";
byte value_0 = 0;
const int sleeptime = 5000;

void setup() {

  // start serial interface
  Serial.begin(9600);
  while (!Serial);

  // initialize BLE
  if (!BLE.begin()) {
    Serial.println("starting BLE failed!");
    while (1);
  }

  // set name
  BLE.setLocalName(Name);
  BLE.setDeviceName(Name);

  // set target peripheral name
  BLE.scanForName(prflocName);

  // start scanning
  Serial.println();
  Serial.println("CENTRAL: STARTED SCANNING");
  Serial.println();

}

void loop() {

  // label for goto statement
start_loop:

  // check if a peripheral has been discovered
  BLEDevice peripheral = BLE.available();

  // if peripheral has been found
  if (peripheral) {

    // stop scanning
    BLE.stopScan();

    // Connect to peripheral
    if (peripheral.connect()) { // connect
      Serial.print("--> Connected peripheral: ");
      Serial.println(peripheral.localName());
    } else {
      Serial.println("Failed to connect!");
      BLE.scanForName(prflocName);
      goto start_loop;
    }

    // discover peripheral attributes
    if (peripheral.discoverService(srvIDarr)) {
      Serial.print("Service discovered: ");
      Serial.println(srvID);
    } else {
      Serial.println("Attribute discovery failed.");
      peripheral.disconnect();
      BLE.scanForName(prflocName);
      goto start_loop;
    }

    // retrieve the simple key characteristic
    BLECharacteristic characteristic_0 = peripheral.characteristic(chrIDarr);

    // subscribe to the characteristic
    if (!characteristic_0) {
      Serial.println("no characteristic found!");
      peripheral.disconnect();
      BLE.scanForName(prflocName);
      goto start_loop;
    } else if (!characteristic_0.canSubscribe()) {
      Serial.println("characteristic is not subscribable!");
      peripheral.disconnect();
      BLE.scanForName(prflocName);
      goto start_loop;
    } else if (!characteristic_0.subscribe()) {
      Serial.println("subscription failed!");
      peripheral.disconnect();
      BLE.scanForName(prflocName);
      goto start_loop;
    } else {
      Serial.print("Subscribed to characteristic: ");
      Serial.println(chrID);
    }

    // while the peripheral is connected
    while (peripheral.connected()) {

      // check if the value of the characteristic has been updated
      if (characteristic_0.valueUpdated()) {

        // read RSSI
        Serial.print("==>RSSI: ");
        Serial.println(peripheral.rssi());

        // read value
        characteristic_0.readValue(value_0);
        Serial.print("Read value: ");
        Serial.println(value_0);

        // Check threshold
        if (value_0 <= THRESHOLD) {

          // increment value
          value_0++;

          // sleep for a while
          delay(SLEEPTIME);

          // write value
          characteristic_0.writeValue((byte)value_0);
          Serial.print("Written value: ");
          Serial.println(value_0);

        }

      }

    }

    Serial.print("<-- Disconnected peripheral: ");
    Serial.println(peripheral.localName());
    Serial.println();
    BLE.scanForName(prflocName);
    goto start_loop;

  }

  // restart scanning
  BLE.stopScan();
  BLE.scanForName(prflocName);

}
